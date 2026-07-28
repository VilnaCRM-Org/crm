// `subject` is the discriminator used to match a finding across the merge-base and base-tip
// comparisons. A key yields at most one numeric finding, so `null` is unambiguous there; membership
// findings need the item itself, because every removal otherwise shares `head: '(absent)'` and a
// whole set of removals would collapse to a single identity.
function numericFindings(file, base, head) {
  const findings = [];
  for (const [key, guard] of Object.entries(base.numeric ?? {})) {
    const current = (head.numeric ?? {})[key];
    if (!current) {
      findings.push({
        file,
        key,
        subject: null,
        base: guard.value,
        head: null,
        rule: guard.direction,
        reason: 'guard removed',
      });
      continue;
    }
    const weakened =
      guard.direction === 'min' ? current.value < guard.value : current.value > guard.value;
    if (weakened) {
      findings.push({
        file,
        key,
        subject: null,
        base: guard.value,
        head: current.value,
        rule: guard.direction,
        reason: 'threshold weakened',
      });
    }
  }
  return findings;
}

function membershipFindings(file, key, guard, current) {
  const baseItems = new Set(guard.items);
  const headItems = new Set(current.items);
  if (guard.rule === 'no-grow') {
    return [...headItems]
      .filter((item) => !baseItems.has(item))
      .map((item) => ({
        file,
        key,
        subject: item,
        base: '(absent)',
        head: item,
        rule: 'no-grow',
        reason: 'exclusion added',
      }));
  }
  return [...baseItems]
    .filter((item) => !headItems.has(item))
    .map((item) => ({
      file,
      key,
      subject: item,
      base: item,
      head: '(absent)',
      rule: 'no-shrink',
      reason: 'guarded entry removed',
    }));
}

function setFindings(file, base, head) {
  const findings = [];
  for (const [key, guard] of Object.entries(base.sets ?? {})) {
    const current = (head.sets ?? {})[key];
    if (!current) {
      findings.push({
        file,
        key,
        subject: null,
        base: `${guard.items.length} entries`,
        head: null,
        rule: guard.rule,
        reason: 'guard removed',
      });
      continue;
    }
    findings.push(...membershipFindings(file, key, guard, current));
  }
  return findings;
}

export function compareSnapshots(file, base, head) {
  return [...numericFindings(file, base, head), ...setFindings(file, base, head)];
}

export function isWaived(eventPayload, waiverLabel) {
  const labels = eventPayload?.pull_request?.labels ?? [];
  return labels.some((label) => label?.name === waiverLabel);
}

// Guard values come from PR-authored config files and are rendered into a fenced block in the job
// summary and a sticky PR comment. Collapse newlines and neutralise backticks so a crafted value
// cannot break out of the fence and inject Markdown into a comment posted with write scope.
function sanitizeCell(value) {
  return String(value)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/`/g, "'")
    .slice(0, 200);
}

export function formatFindingsTable(findings) {
  const header = ['FILE', 'KEY', 'BASE', 'HEAD', 'RULE', 'REASON'];
  const rows = findings.map((finding) =>
    [finding.file, finding.key, finding.base, finding.head, finding.rule, finding.reason].map(
      sanitizeCell
    )
  );
  const widths = header.map((cell, index) =>
    Math.max(cell.length, ...rows.map((row) => row[index].length), 0)
  );
  const line = (cells) =>
    cells
      .map((cell, index) => cell.padEnd(widths[index]))
      .join('  ')
      .trimEnd();
  return [
    line(header),
    widths.map((width) => '-'.repeat(width)).join('  '),
    ...rows.map(line),
  ].join('\n');
}
