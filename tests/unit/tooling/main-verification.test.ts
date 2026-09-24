/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';

import { parse } from 'yaml';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

type Step = {
  name?: string;
  id?: string;
  if?: string;
  uses?: string;
  run?: string;
  env?: Record<string, string>;
  with?: Record<string, string | boolean>;
};

type Job = {
  name?: string;
  needs?: string[] | string;
  if?: string;
  uses?: string;
  secrets?: Record<string, string> | string;
  'continue-on-error'?: boolean;
  'timeout-minutes'?: number;
  permissions?: Record<string, string>;
  outputs?: Record<string, string>;
  steps?: Step[];
};

type Workflow = {
  on: {
    push?: { branches?: string[]; 'paths-ignore'?: string[]; paths?: string[] };
    workflow_call?: { secrets?: Record<string, { required?: boolean }> };
  };
  concurrency?: { group: string; 'cancel-in-progress': boolean };
  permissions?: Record<string, string>;
  jobs: Record<string, Job>;
};

const readWorkflow = (file: string): { raw: string; parsed: Workflow } => {
  const raw = fs.readFileSync(path.join(projectRoot, '.github/workflows', file), 'utf8');
  return { raw, parsed: parse(raw) as Workflow };
};

const { parsed: workflow } = readWorkflow('main-verification.yml');
const { raw: releaseRaw, parsed: release } = readWorkflow('autorelease.yml');

const jobIn = (source: Workflow, file: string, name: string): Job => {
  const found = source.jobs[name];
  if (found === undefined) throw new Error(`${file} declares no "${name}" job`);
  return found;
};

const jobNamed = (name: string): Job => jobIn(workflow, 'main-verification.yml', name);

const stepNamed = (job: Job, name: string): Step => {
  const found = (job.steps ?? []).find((step) => step.name === name);
  if (found === undefined) throw new Error(`autorelease.yml declares no "${name}" step`);
  return found;
};

const ATTEST_PIN = /^actions\/attest-build-provenance@[0-9a-f]{40}$/;

const runCommands = (job: Job): string[] => (job.steps ?? []).flatMap((step) => step.run ?? []);

describe('post-merge main verification (issue #185)', () => {
  it('triggers on every push to main, unfiltered', () => {
    expect(workflow.on.push?.branches).toEqual(['main']);
    expect(workflow.on.push?.['paths-ignore']).toBeUndefined();
    expect(workflow.on.push?.paths).toBeUndefined();
  });

  it('verifies merges in order instead of cancelling superseded runs', () => {
    expect(workflow.concurrency?.group).toBe('main-verification');
    expect(workflow.concurrency?.['cancel-in-progress']).toBe(false);
  });

  it('re-runs the deterministic PR gates against the merged tree', () => {
    expect(runCommands(jobNamed('lint'))).toEqual(
      expect.arrayContaining(['make start', 'make lint', 'make codegen-check'])
    );
    expect(runCommands(jobNamed('unit'))).toEqual(
      expect.arrayContaining(['make start', 'make test-unit-all'])
    );
  });

  it('lets no verification job swallow its own failure', () => {
    for (const jobName of ['lint', 'unit'] as const) {
      expect(jobNamed(jobName)['continue-on-error']).toBeUndefined();
      expect(jobNamed(jobName).if).toBeUndefined();
    }
  });

  it('routes a red main to a single tracking issue', () => {
    const report = jobNamed('report');

    expect(report.needs).toEqual(expect.arrayContaining(['lint', 'unit']));
    expect(report.if).toContain('always()');
    expect(report.if).toContain("contains(needs.*.result, 'failure')");
    expect(report.permissions?.issues).toBe('write');
    expect(runCommands(report)).toContain('sh scripts/ci/report-main-verification-failure.sh');
  });

  it('clears the tracking issue once main recovers', () => {
    const resolve = jobNamed('resolve');

    expect(resolve.needs).toEqual(expect.arrayContaining(['lint', 'unit']));
    expect(resolve.if).toContain("needs.lint.result == 'success'");
    expect(resolve.if).toContain("needs.unit.result == 'success'");
    expect(resolve.permissions?.issues).toBe('write');
    expect(runCommands(resolve)).toContain(
      'sh scripts/ci/report-main-verification-failure.sh --resolve'
    );
  });
});

describe('release sequenced behind main verification (issue #185)', () => {
  const tip = jobIn(release, 'autorelease.yml', 'tip');
  const build = jobIn(release, 'autorelease.yml', 'build');

  it('calls the release only after lint and unit succeed, passing the secrets by name', () => {
    const caller = jobNamed('release');

    expect(caller.needs).toEqual(['lint', 'unit']);
    expect(caller.if).toBeUndefined();
    expect(caller.uses).toBe('./.github/workflows/autorelease.yml');
    expect(caller.secrets).toEqual({
      VILNACRM_APP_ID: '${{ secrets.VILNACRM_APP_ID }}',
      VILNACRM_APP_PRIVATE_KEY: '${{ secrets.VILNACRM_APP_PRIVATE_KEY }}',
    });
    expect(caller.permissions).toEqual({
      contents: 'write',
      packages: 'write',
      'id-token': 'write',
      attestations: 'write',
    });
  });

  it('makes autorelease callable only, so no push can cut an unverified release', () => {
    expect(Object.keys(release.on)).toEqual(['workflow_call']);
    expect(release.on.workflow_call?.secrets).toEqual({
      VILNACRM_APP_ID: { required: true },
      VILNACRM_APP_PRIVATE_KEY: { required: true },
    });
    expect(release.permissions).toEqual({});
  });

  it('skips the release when main has moved past the verified commit', () => {
    expect(tip.permissions).toEqual({ contents: 'read' });
    expect(tip.outputs?.current).toBe('${{ steps.tip.outputs.current }}');
    expect(runCommands(tip)).toEqual(['sh scripts/ci/check-release-tip.sh']);
    expect(stepNamed(tip, 'Release only while main is still at the verified commit').env).toEqual(
      expect.objectContaining({ VERIFIED_SHA: '${{ github.sha }}' })
    );
    expect(build.needs).toBe('tip');
    expect(build.if).toBe("${{ needs.tip.outputs.current == 'true' }}");
  });

  it('keeps the changelog action on its [skip ci] default, so the release starts no run', () => {
    const changelog = stepNamed(build, 'Conventional Changelog Action');

    expect(changelog.with).not.toHaveProperty('skip-ci');
    expect(changelog.with).not.toHaveProperty('git-message');
  });
});

describe('release build provenance (issue #136)', () => {
  const build = jobIn(release, 'autorelease.yml', 'build');
  const tarball = stepNamed(build, 'Attest the release tarball');
  const image = stepNamed(build, 'Attest the production image');
  const names = (build.steps ?? []).map((step) => step.name);

  it('grants the attestation permissions to the build job and nowhere else', () => {
    expect(build.permissions).toEqual({
      contents: 'write',
      packages: 'write',
      'id-token': 'write',
      attestations: 'write',
    });
    expect(jobIn(release, 'autorelease.yml', 'tip').permissions).not.toHaveProperty('id-token');
  });

  it('pins the provenance action to a full commit SHA with its release tag', () => {
    for (const step of [tarball, image]) {
      expect(step.uses).toMatch(ATTEST_PIN);
    }
    expect(releaseRaw).toMatch(
      /uses: actions\/attest-build-provenance@[0-9a-f]{40} # v\d+\.\d+\.\d+\n/
    );
  });

  it('attests only after the release, the tarball and the image are all published', () => {
    const lastPublish = Math.max(
      names.indexOf('Pack the release tarball'),
      names.indexOf('Create Release'),
      names.indexOf('Publish the production image')
    );
    const firstAttest = Math.min(
      names.indexOf('Attest the release tarball'),
      names.indexOf('Attest the production image')
    );

    expect(names.indexOf('Create Release')).toBeGreaterThan(-1);
    expect(firstAttest).toBeGreaterThan(lastPublish);
  });

  it('attests the tarball after it is packed and the image digest after it is pushed', () => {
    expect(tarball.with).toEqual({ 'subject-path': 'release/crm-dist-*.tar.gz' });
    expect(image.with).toEqual({
      'subject-name': 'ghcr.io/vilnacrm-org/crm',
      'subject-digest': '${{ steps.publish_image.outputs.digest }}',
      'push-to-registry': true,
      'create-storage-record': false,
    });
    expect(stepNamed(build, 'Publish the production image').id).toBe('publish_image');
    expect(names.indexOf('Attest the production image')).toBe(
      names.indexOf('Publish the production image') + 1
    );
    expect(names.indexOf('Attest the release tarball')).toBe(
      names.indexOf('Attest the production image') + 1
    );
    for (const step of [tarball, image]) {
      expect(step.if).toBe("${{ steps.changelog.outputs.skipped == 'false' }}");
    }
  });
});

const COSIGN_INSTALLER_PIN = /^sigstore\/cosign-installer@[0-9a-f]{40}$/;
const COSIGN_RELEASE_PIN = /^v\d+\.\d+\.\d+$/;
const IMAGE_BY_DIGEST = 'cosign sign --yes "ghcr.io/vilnacrm-org/crm@${IMAGE_DIGEST}"';

const signsImageByDigest = (step: Step): boolean =>
  step.run === IMAGE_BY_DIGEST &&
  step.env?.IMAGE_DIGEST === '${{ steps.publish_image.outputs.digest }}';

const signsTarballWithBundle = (step: Step): boolean => {
  const run = step.run ?? '';
  const sign = run.indexOf('cosign sign-blob --yes --bundle "$bundle" "${tarballs[0]}"');
  const upload = run.indexOf('gh release upload "$RELEASE_TAG" "$bundle"');

  return (
    run.includes('bundle="${tarballs[0]}.sigstore.json"') &&
    sign > -1 &&
    upload > sign &&
    step.env?.GH_TOKEN === '${{ steps.generate_token.outputs.token }}'
  );
};

describe('release keyless cosign signatures (issue #136)', () => {
  const build = jobIn(release, 'autorelease.yml', 'build');
  const installer = stepNamed(build, 'Install cosign');
  const image = stepNamed(build, 'Sign the production image');
  const tarball = stepNamed(build, 'Sign the release tarball');
  const names = (build.steps ?? []).map((step) => step.name);

  it('installs cosign from a SHA-pinned installer at an exact cosign release', () => {
    expect(installer.uses).toMatch(COSIGN_INSTALLER_PIN);
    expect(releaseRaw).toMatch(/uses: sigstore\/cosign-installer@[0-9a-f]{40} # v\d+\.\d+\.\d+\n/);
    expect(installer.with?.['cosign-release']).toMatch(COSIGN_RELEASE_PIN);
    expect('sigstore/cosign-installer@v4').not.toMatch(COSIGN_INSTALLER_PIN);
    expect('v3').not.toMatch(COSIGN_RELEASE_PIN);
  });

  it('signs only after every artifact is published and attested', () => {
    const lastAttest = Math.max(
      names.indexOf('Attest the production image'),
      names.indexOf('Attest the release tarball')
    );

    expect(names.indexOf('Install cosign')).toBe(lastAttest + 1);
    expect(names.indexOf('Sign the production image')).toBe(names.indexOf('Install cosign') + 1);
    expect(names.indexOf('Sign the release tarball')).toBe(
      names.indexOf('Sign the production image') + 1
    );
    for (const step of [installer, image, tarball]) {
      expect(step.if).toBe("${{ steps.changelog.outputs.skipped == 'false' }}");
    }
  });

  it('signs the image by the digest docker push reported, never by a movable tag', () => {
    expect(signsImageByDigest(image)).toBe(true);
    expect(
      signsImageByDigest({
        ...image,
        run: 'cosign sign --yes "ghcr.io/vilnacrm-org/crm:${RELEASE_TAG}"',
      })
    ).toBe(false);
  });

  it('signs the tarball into a Sigstore bundle and uploads it beside the tarball', () => {
    expect(signsTarballWithBundle(tarball)).toBe(true);
    expect(
      signsTarballWithBundle({
        ...tarball,
        run: (tarball.run ?? '').replace('gh release upload "$RELEASE_TAG" "$bundle"', ''),
      })
    ).toBe(false);
  });

  it('signs keylessly with the workflow identity: no key, no signing secret', () => {
    expect(releaseRaw).not.toMatch(/cosign [a-z-]+ .*--key\b/);
    expect(releaseRaw).not.toMatch(/COSIGN_(PRIVATE_KEY|PASSWORD|KEY)/);
    expect(build.permissions?.['id-token']).toBe('write');
    expect(release.on.workflow_call?.secrets).not.toHaveProperty('COSIGN_PRIVATE_KEY');
  });
});
