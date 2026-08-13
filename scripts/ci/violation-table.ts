export interface TableViolation {
  rule: string;
  subject: string;
  message: string;
}

const HEADERS = ['GATE', 'RULE', 'SUBJECT', 'MESSAGE'] as const;

const pad = (value: string, width: number): string => value.padEnd(width, ' ');

/**
 * Plain-text violation table mirroring `scripts/lint-metrics.sh` output so every repository
 * gate reports failures in the same shape.
 */
export const renderViolationTable = (
  gate: string,
  violations: readonly TableViolation[]
): string => {
  const rows = violations.map((violation) => [
    gate,
    violation.rule,
    violation.subject,
    violation.message,
  ]);

  const widths = HEADERS.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => (row[column] ?? '').length))
  );

  const renderRow = (cells: readonly string[]): string =>
    cells
      .map((cell, column) => pad(cell, widths[column] ?? 0))
      .join('  ')
      .trimEnd();

  const separator = '-'.repeat(
    Math.min(
      widths.reduce((sum, width) => sum + width + 2, 0),
      120
    )
  );

  return [renderRow(HEADERS), separator, ...rows.map(renderRow)].join('\n');
};

/** Report `violations` under `gate` and return the process exit code the gate should use. */
export const reportViolations = (
  gate: string,
  violations: readonly TableViolation[],
  passMessage: string
): number => {
  if (violations.length === 0) {
    process.stdout.write(`${passMessage}\n`);
    return 0;
  }

  process.stderr.write(`${renderViolationTable(gate, violations)}\n\n`);
  process.stderr.write(
    `${gate}: ${violations.length} violation(s). Fix the source of the drift — ` +
      'never widen the policy so the gate passes.\n'
  );
  return 1;
};
