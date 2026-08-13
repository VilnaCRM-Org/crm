import browserslist from 'browserslist';

export interface BrowserFamilyPolicy {
  label: string;
  floor?: string;
  trackLatest?: true;
}

export interface BrowserSupportPolicy {
  polyfill: 'off' | 'usage' | 'entry';
  baseline: string;
  queries: string[];
  families: Record<string, BrowserFamilyPolicy>;
  readmeSection: string;
}

export interface SupportViolation {
  rule:
    | 'query-drift'
    | 'missing-family'
    | 'unexpected-family'
    | 'floor-drift'
    | 'latest-only-drift'
    | 'readme-drift';
  subject: string;
  message: string;
}

export interface ResolvedFamily {
  floor: string;
  versions: number;
}

const VERSION_SEPARATOR = /[-–]/;

/**
 * Lower bound of a browserslist version token as a numeric tuple. Tokens are either a plain
 * version (`111`, `16.4`) or a caniuse range (`16.0-16.3`), whose lower bound is what a floor
 * has to be measured against.
 */
export const parseVersion = (token: string): number[] => {
  const [lowerBound = ''] = token.split(VERSION_SEPARATOR);
  return lowerBound
    .trim()
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isNaN(part) ? -1 : part));
};

export const compareVersions = (left: string, right: string): number => {
  const a = parseVersion(left);
  const b = parseVersion(right);
  const length = Math.max(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
};

/** Group a browserslist resolution into per-family lowest supported version and version count. */
export const resolveFamilies = (queries: string[]): Map<string, ResolvedFamily> => {
  const grouped = new Map<string, string[]>();

  for (const entry of browserslist(queries)) {
    const separator = entry.indexOf(' ');
    if (separator === -1) {
      continue;
    }
    const family = entry.slice(0, separator);
    const version = entry.slice(separator + 1);
    grouped.set(family, [...(grouped.get(family) ?? []), version]);
  }

  const resolved = new Map<string, ResolvedFamily>();
  for (const [family, versions] of grouped) {
    const sorted = [...versions].sort(compareVersions);
    resolved.set(family, { floor: sorted[0] ?? '', versions: versions.length });
  }

  return resolved;
};

const describeList = (values: readonly string[]): string => values.join(', ');

/** The declared production query list must be exactly the policy list — order included. */
export const checkQueries = (
  policy: BrowserSupportPolicy,
  declared: readonly string[]
): SupportViolation[] => {
  const matches =
    declared.length === policy.queries.length &&
    declared.every((query, index) => query === policy.queries[index]);

  if (matches) {
    return [];
  }

  return [
    {
      rule: 'query-drift',
      subject: 'package.json browserslist.production',
      message: `expected [${describeList(policy.queries)}], found [${describeList(declared)}]`,
    },
  ];
};

const checkFamily = (
  family: string,
  expected: BrowserFamilyPolicy,
  actual: ResolvedFamily | undefined
): SupportViolation[] => {
  if (!actual) {
    return [
      {
        rule: 'missing-family',
        subject: family,
        message: `${expected.label} is declared in the policy but absent from the resolution`,
      },
    ];
  }

  if (expected.trackLatest) {
    return actual.versions === 1
      ? []
      : [
          {
            rule: 'latest-only-drift',
            subject: family,
            message:
              `${expected.label} is declared latest-only but resolved to ${actual.versions} ` +
              'versions — re-decide the floor and pin it',
          },
        ];
  }

  const floor = expected.floor ?? '';
  return compareVersions(actual.floor, floor) === 0
    ? []
    : [
        {
          rule: 'floor-drift',
          subject: family,
          message: `${expected.label} floor is ${actual.floor}, policy pins ${floor}`,
        },
      ];
};

/** Reconcile a browserslist resolution against the policy in both directions. */
export const checkResolution = (
  policy: BrowserSupportPolicy,
  resolved: Map<string, ResolvedFamily>
): SupportViolation[] => {
  const violations = Object.entries(policy.families).flatMap(([family, expected]) =>
    checkFamily(family, expected, resolved.get(family))
  );

  const unexpected = [...resolved.keys()]
    .filter((family) => !(family in policy.families))
    .map<SupportViolation>((family) => ({
      rule: 'unexpected-family',
      subject: family,
      message: 'resolved by the query list but absent from the policy families',
    }));

  return [...violations, ...unexpected];
};

const sectionBody = (markdown: string, heading: string): string => {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => /^#{2,6}\s+/.test(line) && line.includes(heading));
  if (start === -1) {
    return '';
  }

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^#{1,6}\s+/.test(line));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n');
};

const TABLE_DIVIDER = /^[\s|:-]+$/;
const LATEST = 'latest';

/**
 * Row-wise, not substring: a whole-section `includes` would accept a Chrome row reading
 * "latest" purely because some other row happens to contain Chrome's floor, which is exactly
 * the mislabelled-matrix drift this gate exists to catch.
 */
export const parseMatrixRows = (body: string): Map<string, string> => {
  const rows = new Map<string, string>();

  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || TABLE_DIVIDER.test(trimmed)) {
      continue;
    }

    const cells = trimmed
      .slice(1, trimmed.endsWith('|') ? -1 : undefined)
      .split('|')
      .map((cell) => cell.trim());

    const [label, version] = cells;
    if (label !== undefined && label !== '' && version !== undefined) {
      rows.set(label, version);
    }
  }

  return rows;
};

/** The README matrix is the published promise; every family must have its own correct row. */
export const checkReadme = (policy: BrowserSupportPolicy, readme: string): SupportViolation[] => {
  const body = sectionBody(readme, policy.readmeSection);

  if (body.trim() === '') {
    return [
      {
        rule: 'readme-drift',
        subject: policy.readmeSection,
        message: 'README has no such section — the supported matrix must be published',
      },
    ];
  }

  const rows = parseMatrixRows(body);

  return Object.entries(policy.families).flatMap<SupportViolation>(([family, expected]) => {
    const stated = rows.get(expected.label);

    if (stated === undefined) {
      return [
        {
          rule: 'readme-drift',
          subject: family,
          message: `README section "${policy.readmeSection}" has no row for ${expected.label}`,
        },
      ];
    }

    const wanted = expected.trackLatest ? LATEST : (expected.floor ?? '');
    const matches = expected.trackLatest
      ? stated.toLowerCase() === LATEST
      : compareVersions(stated, wanted) === 0;

    return matches
      ? []
      : [
          {
            rule: 'readme-drift',
            subject: family,
            message: `README states ${expected.label} "${stated}", policy pins "${wanted}"`,
          },
        ];
  });
};

const isFamilyPolicy = (value: unknown): value is BrowserFamilyPolicy => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const hasFloor = typeof candidate.floor === 'string' && candidate.floor.length > 0;
  const hasLatest = candidate.trackLatest === true;
  return typeof candidate.label === 'string' && hasFloor !== hasLatest;
};

/**
 * Fail fast rather than let a malformed policy silently disable the gate — an unreadable
 * matrix would leave the declared browser range unenforced (issue #153).
 */
export const parsePolicy = (raw: unknown, source: string): BrowserSupportPolicy => {
  const reject = (reason: string): never => {
    throw new Error(`${source}: ${reason}. Refusing to run with an unenforced browser matrix.`);
  };

  if (typeof raw !== 'object' || raw === null) {
    return reject('policy must be a JSON object');
  }

  const candidate = raw as Record<string, unknown>;
  const { polyfill, baseline, queries, families, readmeSection } = candidate;

  if (polyfill !== 'off' && polyfill !== 'usage' && polyfill !== 'entry') {
    return reject('"polyfill" must be one of "off", "usage", "entry"');
  }
  if (typeof baseline !== 'string' || baseline.length === 0) {
    return reject('"baseline" must be a non-empty string');
  }
  if (typeof readmeSection !== 'string' || readmeSection.length === 0) {
    return reject('"readmeSection" must be a non-empty string');
  }
  if (!Array.isArray(queries) || queries.length === 0) {
    return reject('"queries" must be a non-empty array');
  }
  if (!queries.every((query): query is string => typeof query === 'string' && query.length > 0)) {
    return reject('"queries" must contain only non-empty strings');
  }
  if (typeof families !== 'object' || families === null) {
    return reject('"families" must be an object');
  }

  const entries = Object.entries(families as Record<string, unknown>);
  if (entries.length === 0) {
    return reject('"families" must declare at least one browser');
  }
  const invalid = entries.filter(([, value]) => !isFamilyPolicy(value)).map(([family]) => family);
  if (invalid.length > 0) {
    return reject(
      `families [${describeList(invalid)}] must each declare a label and exactly one of ` +
        '"floor" or "trackLatest"'
    );
  }

  return {
    polyfill,
    baseline,
    queries,
    families: Object.fromEntries(entries) as Record<string, BrowserFamilyPolicy>,
    readmeSection,
  };
};
