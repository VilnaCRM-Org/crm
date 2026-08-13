import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { reportViolations } from '../ci/violation-table';

import { detectAdrDrift } from './adr-drift';
import { lintAdrs } from './adr-linter';
import { checkDocCoverage } from './doc-coverage';
import { checkDocLinks } from './doc-links';
import { checkDocReferences } from './doc-references';
import { type DocsPolicy, type DocsViolation, loadDocsPolicy } from './docs-policy';

/** Fixed repository paths; never taken from argv so the gate stays path-injection safe. */
const ROOT = process.cwd();
const POLICY_PATH = resolve(ROOT, 'config', 'docs-policy.json');

const CHECKS = ['adr', 'coverage', 'references', 'links', 'drift'] as const;
type Check = (typeof CHECKS)[number];

const isCheck = (value: string): value is Check => (CHECKS as readonly string[]).includes(value);

/**
 * Throws when git fails. An empty diff and a failed diff are indistinguishable by output alone,
 * so swallowing errors here would let the gate pass vacuously on any git problem — use
 * `gitOrNull` only where a missing object is an expected answer.
 *
 * `safe.directory` is scoped to this checkout because the gate runs as root inside the dev
 * container against a bind-mounted worktree owned by the host user, which git otherwise
 * refuses as "dubious ownership".
 */
const git = (args: string[]): string =>
  execFileSync('git', ['-c', `safe.directory=${ROOT}`, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

/** For lookups where "no such object" is a legitimate result, such as `git show` of a new file. */
const gitOrNull = (args: string[]): string | null => {
  try {
    return git(args);
  } catch {
    return null;
  }
};

const baseRef = (): string => process.env.ADR_DRIFT_BASE_REF || 'origin/main';

const mergeBase = (): string => {
  const base = gitOrNull(['merge-base', 'HEAD', baseRef()])?.trim() ?? '';
  if (base === '') {
    throw new Error(
      `adr-drift: cannot resolve a merge base against "${baseRef()}". ` +
        'Fetch the base branch (or set ADR_DRIFT_BASE_REF) — refusing to pass vacuously.'
    );
  }
  return base;
};

/**
 * Pull-request context. CI writes it to files under the gitignored `reports/` directory rather
 * than exporting it: `docker compose exec` does not carry host environment across the container
 * boundary, and a body interpolated into a shell command would be an injection vector.
 */
const readContext = (variable: string, file: string): string => {
  const direct = process.env[variable];
  if (direct !== undefined && direct !== '') {
    return direct;
  }

  try {
    return readFileSync(resolve(ROOT, file), 'utf8');
  } catch {
    return '';
  }
};

/** CI writes a JSON array; a comma-separated fallback keeps a hand-set PR_LABELS usable. */
const parseLabels = (raw: string): string[] => {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return [];
  }

  if (trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((label): label is string => typeof label === 'string');
      }
    } catch {
      return [];
    }
  }

  return trimmed
    .split(',')
    .map((label) => label.trim())
    .filter((label) => label !== '');
};

const driftViolations = (policy: DocsPolicy): DocsViolation[] => {
  const base = mergeBase();
  const changedPaths = git(['diff', '--name-only', `${base}..HEAD`])
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  const result = detectAdrDrift(policy, {
    changedPaths,
    pullRequestBody: readContext('PR_BODY', 'reports/adr-drift/pr-body.txt'),
    labels: parseLabels(readContext('PR_LABELS', 'reports/adr-drift/pr-labels.txt')),
    readBaseFile: (path) => gitOrNull(['show', `${base}:${path}`]),
    readHeadFile: (path) => gitOrNull(['show', `HEAD:${path}`]),
  });

  if (result.triggers.length > 0 && result.violations.length === 0) {
    const reason = result.waived ? 'waived by the documented escape hatch' : 'recorded in docs/adr';
    process.stdout.write(
      `adr-drift: ${result.triggers.length} significant change(s), ${reason}.\n`
    );
  }

  return result.violations;
};

/**
 * Only tracked markdown is gated. An untracked scratch file must never fail a developer's
 * `make lint` when CI, which only ever sees committed files, would pass.
 */
const trackedMarkdown = (): string[] => {
  const listed = git(['ls-files', '-z', '*.md']);
  if (listed === '') {
    throw new Error(
      'lint-docs: `git ls-files` returned no markdown. Run the gate inside the repository — ' +
        'refusing to pass vacuously.'
    );
  }

  // A file deleted in the worktree but still in the index would otherwise ENOENT downstream.
  return listed
    .split('\0')
    .filter((path) => path !== '')
    .filter((path) => existsSync(resolve(ROOT, path)));
};

const run = (check: Check, policy: DocsPolicy): DocsViolation[] => {
  if (check === 'drift') {
    return driftViolations(policy);
  }

  const tracked = trackedMarkdown();
  switch (check) {
    case 'adr':
      return lintAdrs(ROOT, policy.adr, tracked);
    case 'coverage':
      return checkDocCoverage(ROOT, policy.moduleDocs);
    case 'references':
      return checkDocReferences(ROOT, policy.docs, policy.commandReferences, tracked);
    default:
      return checkDocLinks(ROOT, policy.docs, tracked);
  }
};

const PASS_MESSAGE: Record<Check, string> = {
  adr: 'lint-adr: every ADR matches the policy, the index is in sync, and the template agrees.',
  coverage: 'lint-doc-coverage: every module ships documentation.',
  references: 'lint-doc-references: every documented command exists.',
  links: 'lint-doc-links: every relative link and anchor resolves.',
  drift: 'check-adr-drift: no undocumented architecture change.',
};

const requested = process.argv[2] ?? '';
if (!isCheck(requested)) {
  process.stderr.write(`lint-docs: expected one of [${CHECKS.join(', ')}], got "${requested}"\n`);
  process.exit(2);
}

const docsPolicy = loadDocsPolicy(POLICY_PATH);
process.exitCode = reportViolations(requested, run(requested, docsPolicy), PASS_MESSAGE[requested]);
