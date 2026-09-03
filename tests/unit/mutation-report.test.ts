import {
  type MutationReport,
  mergeReportFiles,
  mutationScore,
  ownedShardReports,
  scoreReports,
  tallyMutants,
} from '../../scripts/ci/mutation-report';

function report(files: Record<string, string[]>): MutationReport {
  return {
    files: Object.fromEntries(
      Object.entries(files).map(([path, statuses]) => [
        path,
        { mutants: statuses.map((status) => ({ status })) },
      ])
    ),
  };
}

describe('mutation-report merge gate', () => {
  describe('mutationScore mirrors Stryker (detected / valid * 100)', () => {
    it('counts killed and timeout as detected', () => {
      const tally = tallyMutants(mergeReportFiles([report({ 'a.tsx': ['Killed', 'Timeout'] })]));
      expect(tally.detected).toBe(2);
      expect(tally.valid).toBe(2);
      expect(mutationScore(tally)).toBe(100);
    });

    it('counts survived and noCoverage against the score (undetected, still valid)', () => {
      const tally = tallyMutants(
        mergeReportFiles([report({ 'a.tsx': ['Killed', 'Killed', 'Survived', 'NoCoverage'] })])
      );
      expect(tally.detected).toBe(2);
      expect(tally.undetected).toBe(2);
      expect(tally.valid).toBe(4);
      expect(mutationScore(tally)).toBe(50);
    });

    it('excludes compile/runtime errors and ignored mutants from valid', () => {
      const tally = tallyMutants(
        mergeReportFiles([
          report({ 'a.tsx': ['Killed', 'CompileError', 'RuntimeError', 'Ignored'] }),
        ])
      );
      expect(tally.compileError).toBe(1);
      expect(tally.runtimeError).toBe(1);
      expect(tally.ignored).toBe(1);
      expect(tally.valid).toBe(1);
      expect(mutationScore(tally)).toBe(100);
    });

    it('treats Pending and unknown statuses as non-valid', () => {
      const tally = tallyMutants(
        mergeReportFiles([report({ 'a.tsx': ['Killed', 'Pending', 'Weird'] })])
      );
      expect(tally.pending).toBe(2);
      expect(tally.valid).toBe(1);
    });

    it('returns NaN when there are no valid mutants', () => {
      const tally = tallyMutants(mergeReportFiles([report({ 'a.tsx': ['Ignored'] })]));
      expect(tally.valid).toBe(0);
      expect(Number.isNaN(mutationScore(tally))).toBe(true);
    });
  });

  describe('the break boundary is exact', () => {
    it('scores 80% when 8 of 10 valid mutants are detected', () => {
      const statuses = [...Array(8).fill('Killed'), 'Survived', 'NoCoverage'];
      expect(scoreReports([report({ 'a.tsx': statuses })]).mutationScore).toBe(80);
    });

    it('scores below 80% when only 7 of 10 are detected', () => {
      const statuses = [...Array(7).fill('Killed'), ...Array(3).fill('Survived')];
      expect(scoreReports([report({ 'a.tsx': statuses })]).mutationScore).toBeCloseTo(70, 10);
    });
  });

  describe('merging shard reports', () => {
    it('unions disjoint files and sums their mutants', () => {
      const result = scoreReports([
        report({ 'a.tsx': ['Killed', 'Killed'] }),
        report({ 'b.tsx': ['Killed', 'Survived'] }),
      ]);
      expect(result.fileCount).toBe(2);
      expect(result.tally.detected).toBe(3);
      expect(result.tally.valid).toBe(4);
      expect(result.mutationScore).toBe(75);
    });

    it('does not double-count a file that appears in two shards', () => {
      const duplicate = report({ 'a.tsx': ['Killed', 'Survived'] });
      const result = scoreReports([duplicate, duplicate]);
      expect(result.fileCount).toBe(1);
      expect(result.tally.valid).toBe(2);
      expect(result.mutationScore).toBe(50);
    });

    it('tolerates reports with no files', () => {
      const result = scoreReports([{}, report({ 'a.tsx': ['Killed'] })]);
      expect(result.fileCount).toBe(1);
      expect(result.mutationScore).toBe(100);
    });
  });

  // Shard membership is packed by file size, so an edit can move a file to another shard while its
  // previous owner still carries the old result in its restored incremental report. Merging keeps
  // the first occurrence, so the stale copy would otherwise decide the gate.
  describe('results from a shard that no longer owns a file', () => {
    const OWNER: Record<string, number> = { 'a.tsx': 0, 'b.tsx': 1 };
    const ownerOf = (path: string): number | undefined => OWNER[path];

    it('keeps a file only from the shard that owns it', () => {
      const { reports, discarded } = ownedShardReports(
        [
          { index: 0, report: report({ 'a.tsx': ['Killed'], 'b.tsx': ['Survived'] }) },
          { index: 1, report: report({ 'b.tsx': ['Killed'] }) },
        ],
        ownerOf
      );

      expect(discarded).toBe(1);
      expect(scoreReports(reports).mutationScore).toBe(100);
    });

    it('lets the owning shard decide even when the stale copy is merged first', () => {
      const stale = { index: 0, report: report({ 'b.tsx': ['Survived'] }) };
      const owning = { index: 1, report: report({ 'b.tsx': ['Killed'] }) };

      expect(scoreReports([stale.report, owning.report]).mutationScore).toBe(50);
      expect(scoreReports(ownedShardReports([stale, owning], ownerOf).reports).mutationScore).toBe(
        100
      );
    });

    it('drops a file that no shard owns any more', () => {
      const { reports, discarded } = ownedShardReports(
        [{ index: 0, report: report({ 'a.tsx': ['Killed'], 'deleted.tsx': ['Survived'] }) }],
        ownerOf
      );

      expect(discarded).toBe(1);
      expect(scoreReports(reports).fileCount).toBe(1);
    });

    it('keeps every file when each shard reports only what it owns', () => {
      const { reports, discarded } = ownedShardReports(
        [
          { index: 0, report: report({ 'a.tsx': ['Killed'] }) },
          { index: 1, report: report({ 'b.tsx': ['Survived'] }) },
        ],
        ownerOf
      );

      expect(discarded).toBe(0);
      expect(scoreReports(reports).fileCount).toBe(2);
      expect(scoreReports(reports).mutationScore).toBe(50);
    });
  });
});
