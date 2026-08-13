import { renderViolationTable, reportViolations } from '../../../scripts/ci/violation-table';

const violation = { rule: 'floor-drift', subject: 'chrome', message: 'floor is 110, pins 111' };

describe('renderViolationTable', () => {
  it('renders the header, a separator, and one row per violation', () => {
    const lines = renderViolationTable('browser-support', [violation]).split('\n');

    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatch(/^GATE\s+RULE\s+SUBJECT\s+MESSAGE$/);
    expect(lines[2]).toContain('browser-support');
    expect(lines[2]).toContain('chrome');
  });

  it('sizes the separator to the rendered row width', () => {
    const lines = renderViolationTable('gate', [violation]).split('\n');
    const widest = Math.max(...lines.filter((_, index) => index !== 1).map((line) => line.length));

    expect(lines[1]).toMatch(/^-+$/);
    expect(lines[1]).toHaveLength(widest);
  });

  it('caps the separator so a long message cannot draw an unbounded rule', () => {
    const long = { ...violation, message: 'x'.repeat(500) };
    const lines = renderViolationTable('gate', [long]).split('\n');

    expect(lines[1]).toHaveLength(120);
  });

  it('pads every column to a common width across rows', () => {
    const rows = renderViolationTable('gate', [
      violation,
      { rule: 'readme-drift', subject: 'a-much-longer-subject', message: 'short' },
    ]).split('\n');

    expect(rows[2].indexOf('floor-drift')).toBe(rows[3].indexOf('readme-drift'));
  });
});

describe('reportViolations', () => {
  const writes: { out: string[]; err: string[] } = { out: [], err: [] };
  let outSpy: jest.SpyInstance;
  let errSpy: jest.SpyInstance;

  beforeEach(() => {
    writes.out = [];
    writes.err = [];
    outSpy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.out.push(String(chunk));
      return true;
    });
    errSpy = jest.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      writes.err.push(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    outSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('returns 0 and prints the pass message when there is nothing to report', () => {
    expect(reportViolations('gate', [], 'all good')).toBe(0);
    expect(writes.out.join('')).toBe('all good\n');
    expect(writes.err).toEqual([]);
  });

  it('returns 1 and writes the table to stderr when violations exist', () => {
    expect(reportViolations('gate', [violation], 'all good')).toBe(1);
    expect(writes.out).toEqual([]);

    const stderr = writes.err.join('');
    expect(stderr).toContain('floor-drift');
    expect(stderr).toContain('1 violation(s)');
  });

  it('never suggests widening the policy as a remedy', () => {
    reportViolations('gate', [violation], 'all good');

    expect(writes.err.join('')).toContain('never widen the policy');
  });
});
