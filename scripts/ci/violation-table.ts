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

  // Cells are joined by two spaces, so the rendered width is the sum of the columns plus two
  // per gap — one fewer gap than there are columns.
  const rendered = widths.reduce((sum, width) => sum + width, 0) + (widths.length - 1) * 2;
  const separator = '-'.repeat(Math.min(rendered, 120));

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
