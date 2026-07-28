import { execFileSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareSnapshots, isWaived, formatFindingsTable } from './gate-ratchet/compare.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXTRACT_CLI = path.join(HERE, 'gate-ratchet', 'extract-cli.mjs');
const MANIFEST_PATH = 'config/gate-thresholds.manifest.json';
const REPO = process.cwd();

// jest.config.ts is loaded directly, which needs unflagged TypeScript type stripping (Node 22.18+).
// Older runtimes throw a raw syntax error; fail with an actionable message instead.
const MIN_NODE = [22, 18];
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < MIN_NODE[0] || (major === MIN_NODE[0] && minor < MIN_NODE[1])) {
  process.stderr.write(
    `gate-ratchet: needs Node >= ${MIN_NODE.join('.')} to load jest.config.ts ` +
      `(running ${process.versions.node}).\n`
  );
  process.exit(2);
}

function git(args) {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function materialize(ref, label) {
  const dir = mkdtempSync(path.join(os.tmpdir(), `gate-ratchet-${label}-`));
  const archive = execFileSync('git', ['archive', ref], {
    cwd: REPO,
    maxBuffer: 512 * 1024 * 1024,
  });
  execFileSync('tar', ['-x', '-C', dir], { input: archive });
  return dir;
}

function snapshot(treeRoot, relativePath, extractName, env) {
  const outFile = path.join(os.tmpdir(), `gate-ratchet-${process.hrtime.bigint()}.json`);
  const argv = [
    '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
    EXTRACT_CLI,
    treeRoot,
    relativePath,
    extractName,
    outFile,
  ];
  execFileSync(process.execPath, argv, {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  const parsed = JSON.parse(readFileSync(outFile, 'utf8'));
  rmSync(outFile, { force: true });
  return parsed;
}

function readEventPayload() {
  const file = process.env.GITHUB_EVENT_PATH;
  if (!file || !existsSync(file)) return {};
  return JSON.parse(readFileSync(file, 'utf8'));
}

function report(body) {
  process.stdout.write(`${body}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${body}\n`);
  if (process.env.GATE_RATCHET_REPORT_FILE) {
    writeFileSync(process.env.GATE_RATCHET_REPORT_FILE, `${body}\n`);
  }
}

const baseSha = process.env.GATE_RATCHET_BASE_SHA || 'origin/main';
const headSha = process.env.GATE_RATCHET_HEAD_SHA || 'HEAD';
const mergeBase = git(['merge-base', baseSha, headSha]).trim();

const manifest = JSON.parse(readFileSync(path.join(REPO, MANIFEST_PATH), 'utf8'));
const changed = new Set(
  git(['diff', '--name-only', `${mergeBase}..${headSha}`])
    .split('\n')
    .filter(Boolean)
);
const watched = manifest.files.flatMap((entry) => [entry.path, ...(entry.dependsOn ?? [])]);

if (!watched.some((file) => changed.has(file))) {
  process.stdout.write(
    `✅ gate ratchet: no guarded config changed since ${mergeBase.slice(0, 8)}.\n`
  );
  process.exit(0);
}

const trees = {
  mergeBase: materialize(mergeBase, 'merge-base'),
  baseTip: materialize(baseSha, 'base-tip'),
  head: materialize(headSha, 'head'),
};

function findingsAgainst(referenceTree) {
  const found = [];
  for (const entry of manifest.files) {
    if (!existsSync(path.join(referenceTree, entry.path))) continue;
    if (!existsSync(path.join(trees.head, entry.path))) {
      found.push({
        file: entry.path,
        key: '(whole file)',
        base: 'present',
        head: 'deleted',
        rule: entry.extract,
        reason: 'guarded file removed',
      });
      continue;
    }
    for (const env of entry.envs ?? [{}]) {
      found.push(
        ...compareSnapshots(
          entry.path,
          snapshot(referenceTree, entry.path, entry.extract, env),
          snapshot(trees.head, entry.path, entry.extract, env)
        )
      );
    }
  }
  return found;
}

const identity = (finding) => JSON.stringify([finding.file, finding.key, finding.head]);

let findings = [];
let evaluationFailure = null;
try {
  const againstMergeBase = findingsAgainst(trees.mergeBase);
  const againstBaseTip = new Set(findingsAgainst(trees.baseTip).map(identity));
  findings = againstMergeBase.filter((finding) => againstBaseTip.has(identity(finding)));
} catch (failure) {
  // An extractor blew up (unparseable or newly-broken guarded config). That is NOT a weakening, and
  // reporting it as one would be an actively wrong diagnosis that the waiver label cannot clear.
  // Record it and let `finally` reclaim the materialized trees — `process.exit()` terminates
  // immediately and would skip that cleanup — then exit 2 so the workflow can name this case.
  evaluationFailure = failure;
} finally {
  for (const tree of Object.values(trees)) rmSync(tree, { recursive: true, force: true });
}

if (evaluationFailure) {
  report(
    `🛑 gate ratchet: could not evaluate the guarded configs — this is an evaluation failure, ` +
      `not a detected weakening, and the \`${manifest.waiverLabel}\` label will not clear it.\n\n` +
      `\`\`\`text\n${evaluationFailure?.message ?? evaluationFailure}\n\`\`\`\n\n` +
      `Fix the guarded config so it loads, then re-run.`
  );
  process.exit(2);
}

if (findings.length === 0) {
  report(
    `✅ gate ratchet: every guarded threshold held or strengthened against ${mergeBase.slice(0, 8)}.`
  );
  process.exit(0);
}

const waived = isWaived(readEventPayload(), manifest.waiverLabel);
const heading = waived
  ? `⚠️ gate ratchet: ${findings.length} binding threshold(s) weakened — WAIVED by the \`${manifest.waiverLabel}\` label.`
  : `❌ gate ratchet: ${findings.length} binding threshold(s) weakened against ${mergeBase.slice(0, 8)}.`;
const footer = waived
  ? 'The relaxation is recorded above as an explicit, reviewed decision.'
  : `Strengthen the value, or add the \`${manifest.waiverLabel}\` label to record a deliberate relaxation.`;

report(`${heading}\n\n\`\`\`text\n${formatFindingsTable(findings)}\n\`\`\`\n\n${footer}`);
process.exit(waived ? 0 : 1);
