export interface ReportMutant {
  status?: string;
}

export interface ReportFile {
  mutants?: ReportMutant[];
}

export interface MutationReport {
  files?: Record<string, ReportFile>;
}

export interface StatusTally {
  killed: number;
  timeout: number;
  survived: number;
  noCoverage: number;
  compileError: number;
  runtimeError: number;
  ignored: number;
  pending: number;
  detected: number;
  undetected: number;
  valid: number;
}

export interface ScoreResult {
  tally: StatusTally;
  fileCount: number;
  mutationScore: number;
}

export function mergeReportFiles(reports: readonly MutationReport[]): Map<string, ReportMutant[]> {
  const byFile = new Map<string, ReportMutant[]>();
  for (const report of reports) {
    for (const [path, file] of Object.entries(report.files ?? {})) {
      if (!byFile.has(path)) {
        byFile.set(path, file?.mutants ?? []);
      }
    }
  }
  return byFile;
}

const STATUS_TALLY_KEYS = new Map<string, keyof StatusTally>([
  ['Killed', 'killed'],
  ['Timeout', 'timeout'],
  ['Survived', 'survived'],
  ['NoCoverage', 'noCoverage'],
  ['CompileError', 'compileError'],
  ['RuntimeError', 'runtimeError'],
  ['Ignored', 'ignored'],
]);

export function tallyMutants(mutantsByFile: ReadonlyMap<string, ReportMutant[]>): StatusTally {
  const tally: StatusTally = {
    killed: 0,
    timeout: 0,
    survived: 0,
    noCoverage: 0,
    compileError: 0,
    runtimeError: 0,
    ignored: 0,
    pending: 0,
    detected: 0,
    undetected: 0,
    valid: 0,
  };

  for (const mutants of mutantsByFile.values()) {
    for (const mutant of mutants) {
      const key = mutant.status === undefined ? undefined : STATUS_TALLY_KEYS.get(mutant.status);
      if (key === undefined) {
        tally.pending += 1;
      } else {
        tally[key] += 1;
      }
    }
  }

  tally.detected = tally.killed + tally.timeout;
  tally.undetected = tally.survived + tally.noCoverage;
  tally.valid = tally.detected + tally.undetected;
  return tally;
}

export function mutationScore(tally: StatusTally): number {
  return tally.valid > 0 ? (tally.detected / tally.valid) * 100 : Number.NaN;
}

export function scoreReports(reports: readonly MutationReport[]): ScoreResult {
  const byFile = mergeReportFiles(reports);
  const tally = tallyMutants(byFile);
  return { tally, fileCount: byFile.size, mutationScore: mutationScore(tally) };
}
