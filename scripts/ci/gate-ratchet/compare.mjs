export function compareSnapshots(file, base, head) {
  const findings = [];
  for (const [key, guard] of Object.entries(base.numeric ?? {})) {
    const current = (head.numeric ?? {})[key];
    if (!current) {
      findings.push({
        file,
        key,
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
        base: guard.value,
        head: current.value,
        rule: guard.direction,
        reason: 'threshold weakened',
      });
    }
  }
  for (const [key, guard] of Object.entries(base.sets ?? {})) {
    const current = (head.sets ?? {})[key];
    if (!current) {
      findings.push({
        file,
        key,
        base: `${guard.items.length} entries`,
        head: null,
        rule: guard.rule,
        reason: 'guard removed',
      });
      continue;
    }
    const baseItems = new Set(guard.items);
    const headItems = new Set(current.items);
    if (guard.rule === 'no-grow') {
      for (const item of headItems) {
        if (!baseItems.has(item)) {
          findings.push({
            file,
            key,
            base: '(absent)',
            head: item,
            rule: 'no-grow',
            reason: 'exclusion added',
          });
        }
      }
    } else {
      for (const item of baseItems) {
        if (!headItems.has(item)) {
          findings.push({
            file,
            key,
            base: item,
            head: '(absent)',
            rule: 'no-shrink',
            reason: 'guarded entry removed',
          });
        }
      }
    }
  }
  return findings;
}

export function isWaived(eventPayload, waiverLabel) {
  const labels = eventPayload?.pull_request?.labels ?? [];
  return labels.some((label) => label?.name === waiverLabel);
}

export function formatFindingsTable(findings) {
  const header = ['FILE', 'KEY', 'BASE', 'HEAD', 'RULE', 'REASON'];
  const rows = findings.map((finding) => [
    finding.file,
    finding.key,
    String(finding.base),
    String(finding.head),
    finding.rule,
    finding.reason,
  ]);
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
