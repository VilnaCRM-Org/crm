import type { DocsPolicy, DocsViolation } from './docs-policy';

export interface DriftContext {
  changedPaths: string[];
  pullRequestBody: string;
  labels: string[];
  readBaseFile: (path: string) => string | null;
  readHeadFile: (path: string) => string | null;
}

export interface DriftResult {
  violations: DocsViolation[];
  triggers: string[];
  waived: boolean;
}

const globToRegExp = (glob: string): RegExp => {
  const pattern = glob
    .split('**')
    .map((segment) =>
      segment
        .split('*')
        .map((literal) => literal.replace(/[.+^${}()|[\]\\]/g, '\\$&'))
        .join('[^/]*')
    )
    .join('.*');

  return new RegExp(`^${pattern}$`);
};

export const matchesAny = (path: string, globs: readonly string[]): boolean =>
  globs.some((glob) => globToRegExp(glob).test(path));

const dependencyMaps = (manifest: string | null, keys: readonly string[]): string => {
  if (manifest === null) {
    return '';
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(manifest) as Record<string, unknown>;
  } catch {
    return '';
  }

  return JSON.stringify(keys.map((key) => parsed[key] ?? null));
};

/**
 * A manifest edit only counts as architecturally significant when it moves a dependency map —
 * a version bump of a script or a metadata field is not an architecture decision.
 */
const manifestChangedDependencies = (policy: DocsPolicy, context: DriftContext): boolean => {
  const { significantManifest, manifestKeys } = policy.architectureDrift;
  if (!context.changedPaths.includes(significantManifest)) {
    return false;
  }

  const before = dependencyMaps(context.readBaseFile(significantManifest), manifestKeys);
  const after = dependencyMaps(context.readHeadFile(significantManifest), manifestKeys);
  return before !== after;
};

/**
 * Only a real ADR records a decision. Editing the index or the template lives under the same
 * prefix but decides nothing, so accepting either would let the gate be waived by a one-line
 * touch of `docs/adr/README.md`.
 */
const recordsDecision = (policy: DocsPolicy, path: string): boolean => {
  const { adrPathPrefix } = policy.architectureDrift;
  if (!path.startsWith(adrPathPrefix)) {
    return false;
  }

  const name = path.slice(adrPathPrefix.length);
  return !name.includes('/') && new RegExp(policy.adr.filePattern).test(name);
};

/** The marker must be the whole line, so a reviewer quoting it in prose cannot waive the gate. */
const hasWaiverMarker = (body: string, marker: string): boolean =>
  body.split('\n').some((line) => line.trim() === marker);

/**
 * Fail a pull request that moves an architecturally significant surface without recording the
 * decision, unless it carries the single documented waiver (issue #122).
 */
export const detectAdrDrift = (policy: DocsPolicy, context: DriftContext): DriftResult => {
  const drift = policy.architectureDrift;
  const triggers = context.changedPaths
    .filter((path) => matchesAny(path, drift.significantPaths))
    .sort((a, b) => a.localeCompare(b));

  if (manifestChangedDependencies(policy, context)) {
    triggers.push(drift.significantManifest);
  }

  if (triggers.length === 0) {
    return { violations: [], triggers, waived: false };
  }

  if (context.changedPaths.some((path) => recordsDecision(policy, path))) {
    return { violations: [], triggers, waived: false };
  }

  const waived =
    hasWaiverMarker(context.pullRequestBody, drift.escapeHatchMarker) ||
    context.labels.includes(drift.escapeHatchLabel);
  if (waived) {
    return { violations: [], triggers, waived: true };
  }

  return {
    triggers,
    waived: false,
    violations: [
      {
        rule: 'undocumented-architecture-change',
        subject: triggers.join(', '),
        message:
          'changed an architecturally significant surface without adding or updating an ADR in ' +
          `${drift.adrPathPrefix}. Record the decision from ${policy.adr.templateFile}, or ` +
          `waive it with the "${drift.escapeHatchLabel}" label or a line containing only ` +
          `"${drift.escapeHatchMarker}" in the pull-request body`,
      },
    ],
  };
};
