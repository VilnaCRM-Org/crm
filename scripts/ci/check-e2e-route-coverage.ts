import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Route-coverage inventory gate (issue #169).
 *
 * The browser-level suites are hand-written and nothing verified they tracked the route
 * table, so a route could ship — and one had — with zero e2e or visual verification and no
 * signal. This gate reconciles `src/routes/route-paths.ts` (the single source of truth)
 * against an explicit manifest naming the covering spec per route.
 *
 * Route path *values* are deliberately never matched against spec text: `/` occurs in every
 * spec, so the `home` row could never fail, and `*` occurs in none, so the `notFound` row
 * could never pass. The manifest maps route *keys* and is validated in both directions.
 */

const MANIFEST_PATH = process.env.ROUTE_COVERAGE_MANIFEST ?? 'tests/e2e/route-coverage.tsv';
const ROUTE_PATHS_PATH = process.env.ROUTE_PATHS_FILE ?? 'src/routes/route-paths.ts';

const HEADER = ['route', 'suite', 'spec', 'details'].join('\t');
const ALLOWLISTED = 'allowlisted';
const SUITE_ROOTS: Record<string, string> = {
  e2e: 'tests/e2e/',
  visual: 'tests/visual/',
};

interface CoverageRow {
  route: string;
  suite: string;
  spec: string;
  details: string;
  line: number;
}

function fromRoot(relativePath: string): string {
  return resolve(process.cwd(), relativePath);
}

/**
 * Load the route keys from the real route table. A computed specifier keeps TypeScript from
 * resolving the `.ts` path at compile time (which would need `allowImportingTsExtensions`),
 * while Node's native type stripping loads it at runtime.
 */
async function loadRouteKeys(): Promise<string[]> {
  const file = fromRoot(ROUTE_PATHS_PATH);
  if (!existsSync(file)) {
    throw new Error(`Route source of truth "${ROUTE_PATHS_PATH}" not found; refusing to pass.`);
  }

  const loaded = (await import(pathToFileURL(file).href)) as { default?: unknown };
  const routePaths = loaded.default;
  if (typeof routePaths !== 'object' || routePaths === null) {
    throw new TypeError(`"${ROUTE_PATHS_PATH}" must default-export an object of route paths.`);
  }

  const keys = Object.keys(routePaths);
  if (keys.length === 0) {
    throw new Error(`"${ROUTE_PATHS_PATH}" declares no routes; refusing to pass vacuously.`);
  }
  return keys;
}

function readManifest(): CoverageRow[] {
  const file = fromRoot(MANIFEST_PATH);
  if (!existsSync(file)) {
    throw new Error(`Route coverage manifest "${MANIFEST_PATH}" not found.`);
  }

  const rows = readFileSync(file, 'utf8')
    .split('\n')
    .map((text, index) => ({ text, line: index + 1 }))
    .filter(({ text }) => text.trim() !== '' && !text.startsWith('#'));

  // Require the header explicitly rather than blind-dropping the first row: a manifest whose
  // header was deleted would otherwise silently lose its first route from the inventory.
  if (rows[0]?.text !== HEADER) {
    throw new Error(`"${MANIFEST_PATH}" must start with the tab-separated header "${HEADER}".`);
  }

  return rows.slice(1).map(({ text, line }) => {
    const [route = '', suite = '', spec = '', details = ''] = text.split('\t');
    return { route: route.trim(), suite: suite.trim(), spec: spec.trim(), details, line };
  });
}

function rowProblems(row: CoverageRow): string[] {
  const at = `${MANIFEST_PATH}:${row.line}`;
  if (row.suite === ALLOWLISTED) {
    return row.details.trim() === ''
      ? [`${at}: allowlisted route "${row.route}" must state why it is out of browser scope.`]
      : [];
  }

  const root = SUITE_ROOTS[row.suite];
  if (root === undefined) {
    const known = [...Object.keys(SUITE_ROOTS), ALLOWLISTED].join(', ');
    return [`${at}: unknown suite "${row.suite}" for route "${row.route}" (expected ${known}).`];
  }
  if (!row.spec.startsWith(root)) {
    return [`${at}: "${row.spec}" is not under "${root}" as its "${row.suite}" suite requires.`];
  }
  if (!existsSync(fromRoot(row.spec))) {
    return [`${at}: covering spec "${row.spec}" for route "${row.route}" does not exist.`];
  }
  return [];
}

function inventoryProblems(rows: CoverageRow[], routeKeys: string[]): string[] {
  const problems: string[] = [];
  const known = new Set(routeKeys);

  rows
    .filter((row) => !known.has(row.route))
    .forEach((row) => {
      problems.push(
        `${MANIFEST_PATH}:${row.line}: route "${row.route}" is not declared in ${ROUTE_PATHS_PATH}.`
      );
    });

  routeKeys.forEach((route) => {
    const forRoute = rows.filter((row) => row.route === route);
    const allowlisted = forRoute.filter((row) => row.suite === ALLOWLISTED);

    if (forRoute.length === 0) {
      problems.push(
        `route "${route}" has no row in ${MANIFEST_PATH}; add its covering spec or allowlist it.`
      );
      return;
    }
    if (allowlisted.length > 0 && allowlisted.length !== forRoute.length) {
      problems.push(
        `route "${route}" is both allowlisted and covered in ${MANIFEST_PATH}; drop the stale allowlist row.`
      );
    }
  });

  return problems;
}

async function main(): Promise<void> {
  const routeKeys = await loadRouteKeys();
  const rows = readManifest();
  const problems = [...rows.flatMap(rowProblems), ...inventoryProblems(rows, routeKeys)];

  if (problems.length > 0) {
    process.stderr.write(`Route coverage gate failed (${problems.length} problem(s)):\n`);
    problems.forEach((problem) => process.stderr.write(`  - ${problem}\n`));
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `route coverage: ${routeKeys.length} route(s) in ${ROUTE_PATHS_PATH}, ` +
      `${rows.length} manifest row(s), every route covered\n`
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
