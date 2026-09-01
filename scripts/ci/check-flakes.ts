import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Flake budget over a Playwright JSON report (issue #186).
 *
 * Playwright records a test that failed and then passed on retry as `status: 'flaky'`. With
 * only the html reporter configured that verdict is written nowhere machine-readable, so
 * accumulated nondeterminism has no point in the pipeline where it can turn red. This gate
 * reads the JSON report and keeps the two signals distinct: a retried pass is a budget
 * breach, while a hard failure on a scheduled run is a different and more urgent problem
 * that must never be reported as "just a flake".
 *
 * The exit code names which of the two happened, so the audit can escalate them differently
 * (scripts/ci/report-flake-audit.sh titles and labels a hard-failure audit distinctly):
 *   0 — within budget
 *   1 — flake budget breached
 *   2 — hard failures, or the report itself could not be trusted
 */

interface ReportTest {
  status?: string;
  projectName?: string;
}

interface ReportSpec {
  title?: string;
  file?: string;
  line?: number;
  tests?: ReportTest[];
}

interface ReportSuite {
  specs?: ReportSpec[];
  suites?: ReportSuite[];
}

interface PlaywrightReport {
  suites?: ReportSuite[];
}

interface FlakeEntry {
  id: string;
  status: string;
}

interface FlakeTally {
  flaky: FlakeEntry[];
  failed: FlakeEntry[];
  total: number;
}

const REPORT_PATH = process.env.PLAYWRIGHT_JSON_REPORT ?? 'reports/playwright/report.json';
const SUMMARY_PATH = process.env.FLAKE_SUMMARY_FILE ?? 'reports/playwright/flake-summary.md';
const RAW_BUDGET = process.env.FLAKE_BUDGET ?? '0';

const FLAKY_STATUS = 'flaky';
// Allowlisted rather than denylisted: a Playwright upgrade that renames or adds a failure
// status must not silently become a clean audit, so anything unrecognised counts against it.
const PASSING_STATUSES = ['expected', 'skipped'];

/** Depth-first walk of the suite tree, yielding every spec exactly once. */
function collectSpecs(suites: readonly ReportSuite[] | undefined): ReportSpec[] {
  return (suites ?? []).flatMap((suite) => [...(suite.specs ?? []), ...collectSpecs(suite.suites)]);
}

function entryId(spec: ReportSpec, test: ReportTest): string {
  const file = spec.file ?? '<unknown>';
  const location = spec.line === undefined ? file : `${file}:${spec.line}`;
  const project = test.projectName === undefined ? '' : ` [${test.projectName}]`;
  return `${location} > ${spec.title ?? '<untitled>'}${project}`;
}

function tallyFlakes(report: PlaywrightReport): FlakeTally {
  const tally: FlakeTally = { flaky: [], failed: [], total: 0 };

  collectSpecs(report.suites).forEach((spec) => {
    (spec.tests ?? []).forEach((test) => {
      tally.total += 1;
      const status = test.status ?? '<missing>';
      if (status === FLAKY_STATUS) {
        tally.flaky.push({ id: entryId(spec, test), status });
      } else if (!PASSING_STATUSES.includes(status)) {
        tally.failed.push({ id: entryId(spec, test), status });
      }
    });
  });

  return tally;
}

function parseReport(raw: string): PlaywrightReport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Playwright report is not valid JSON: ${String(error)}`);
  }
  if (typeof parsed !== 'object' || parsed === null || !('suites' in parsed)) {
    throw new TypeError('Playwright report has no "suites" key; refusing to gate vacuously.');
  }
  return parsed as PlaywrightReport;
}

function section(title: string, entries: readonly FlakeEntry[]): string[] {
  return entries.length === 0
    ? []
    : ['', `### ${title}`, '', ...entries.map((entry) => `- \`${entry.id}\` (${entry.status})`)];
}

/** Stable identity of one classified set, so the tracking issue only re-comments on a change. */
function idMarker(entries: readonly FlakeEntry[]): string {
  const ids = entries.map((entry) => entry.id).sort();
  return ids.length === 0 ? 'none' : ids.join(' | ');
}

function buildSummary(tally: FlakeTally, budget: number): string {
  return [
    '## Playwright flake audit',
    '',
    `- tests analysed: ${tally.total}`,
    `- flaky (passed on retry): ${tally.flaky.length} (budget ${budget})`,
    `- hard failures: ${tally.failed.length}`,
    ...section('Flaky tests', tally.flaky),
    ...section('Hard failures', tally.failed),
    '',
    `<!-- offenders: ${idMarker([...tally.flaky, ...tally.failed])} -->`,
    `<!-- hard-failures: ${idMarker(tally.failed)} -->`,
    '',
  ].join('\n');
}

function main(): void {
  // Number.parseInt('2abc') is 2, so a typo would silently raise the budget. Require the
  // whole value to be a non-negative integer and fail closed otherwise.
  const budget = /^\d+$/.test(RAW_BUDGET.trim()) ? Number(RAW_BUDGET.trim()) : Number.NaN;
  if (!Number.isSafeInteger(budget)) {
    throw new Error(`FLAKE_BUDGET must be a non-negative integer, got "${RAW_BUDGET}"`);
  }

  const reportFile = resolve(process.cwd(), REPORT_PATH);
  if (!existsSync(reportFile)) {
    throw new Error(
      `Playwright JSON report "${REPORT_PATH}" not found. The audit must run the suites with ` +
        'PLAYWRIGHT_JSON_REPORT set; a missing report is a broken audit, not a pass.'
    );
  }

  const tally = tallyFlakes(parseReport(readFileSync(reportFile, 'utf8')));
  if (tally.total === 0) {
    throw new Error(`"${REPORT_PATH}" describes no tests; refusing to report a vacuous pass.`);
  }

  const summary = buildSummary(tally, budget);
  const summaryFile = resolve(process.cwd(), SUMMARY_PATH);
  mkdirSync(dirname(summaryFile), { recursive: true });
  writeFileSync(summaryFile, summary, 'utf8');
  process.stdout.write(summary);

  const stepSummary = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummary !== undefined && stepSummary !== '') {
    writeFileSync(stepSummary, summary, { encoding: 'utf8', flag: 'a' });
  }

  if (tally.failed.length > 0) {
    process.stderr.write(`${tally.failed.length} hard failure(s) in the audited run\n`);
    process.exitCode = 2;
    return;
  }
  if (tally.flaky.length > budget) {
    process.stderr.write(`${tally.flaky.length} flaky test(s) exceed the budget of ${budget}\n`);
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error: unknown) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}
