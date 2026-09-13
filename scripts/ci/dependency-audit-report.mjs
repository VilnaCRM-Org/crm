import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

function parseArgs(argv) {
  const options = { input: '', body: '', runUrl: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1] ?? '';
    if (flag === '--input') options.input = value;
    if (flag === '--body') options.body = value;
    if (flag === '--run-url') options.runUrl = value;
    if (flag.startsWith('--')) index += 1;
  }
  if (!options.input || !options.body) {
    throw new Error(
      'usage: dependency-audit-report.mjs --input <trivy.json> --body <issue-body.md> [--run-url <url>]'
    );
  }
  return options;
}

function collectFindings(report) {
  const rows = new Map();
  for (const result of report.Results ?? []) {
    for (const vuln of result.Vulnerabilities ?? []) {
      const row = {
        id: vuln.VulnerabilityID ?? '',
        pkg: vuln.PkgName ?? '',
        installed: vuln.InstalledVersion ?? '',
        fixed: vuln.FixedVersion ?? '',
        severity: vuln.Severity ?? '',
        title: (vuln.Title ?? '').replace(/\\/g, '\\\\').replace(/\|/g, '\\|').trim(),
      };
      rows.set(`${row.id}|${row.pkg}|${row.installed}`, row);
    }
  }
  return [...rows.values()].sort((left, right) =>
    `${left.pkg}|${left.id}`.localeCompare(`${right.pkg}|${right.id}`)
  );
}

function markerOf(findings) {
  const digest = createHash('sha256')
    .update(
      findings
        .map((row) =>
          JSON.stringify([row.id, row.pkg, row.installed, row.fixed, row.severity, row.title])
        )
        .join('\n')
    )
    .digest('hex')
    .slice(0, 16);
  return `audit-state:${digest}`;
}

function renderBody(findings, marker, runUrl) {
  const lines = [
    '## Fixable HIGH/CRITICAL advisories across the full lockfile',
    '',
    'Dev tooling included. `make scan-dependencies` gates pull requests on the production',
    'closure only; this weekly audit keeps the rest of `bun.lock` visible. Remediate by',
    'updating the dependency that pins the vulnerable version (`bun update <package>` or the',
    'matching Dependabot pull request), never by ignoring the advisory.',
    '',
    '| Package | Installed | Fixed | Severity | Advisory | Title |',
    '| --- | --- | --- | --- | --- | --- |',
    ...findings.map(
      (row) =>
        `| ${row.pkg} | ${row.installed} | ${row.fixed} | ${row.severity} | ${row.id} | ${row.title} |`
    ),
    '',
    `Total: ${findings.length}`,
  ];
  if (runUrl) lines.push('', `Run: ${runUrl}`);
  lines.push('', `<!-- ${marker} -->`, '');
  return lines.join('\n');
}

const options = parseArgs(process.argv.slice(2));
const findings = collectFindings(JSON.parse(readFileSync(options.input, 'utf8')));

if (findings.length === 0) {
  process.stdout.write('clean\n');
} else {
  const marker = markerOf(findings);
  writeFileSync(options.body, renderBody(findings, marker, options.runUrl));
  process.stdout.write(`${marker}\n`);
}
