#!/usr/bin/env node
/**
 * Bundle-size report + gzip budget gate (issue #117).
 *
 * Computes gzip transfer sizes for the built JS assets, compares a head build
 * against an optional base build, and enforces the gzip budgets declared in
 * config/performance-budget.json (the single source of truth). Emits a sticky
 * Markdown comment body and exits non-zero when a gzip budget is breached.
 *
 * Usage:
 *   node scripts/bundle-size-report.mjs --dir <headDist> [--base-dir <baseDist>] \
 *        [--out <markdownFile>] [--json <jsonFile>]
 *
 * "Initial entrypoint" = eager JS emitted directly under <dist>/static/js
 * (async route/vendor chunks live under <dist>/static/js/async and never count
 * toward the entrypoint budget). Chunk identity across builds is by content
 * hash-stripped name; numeric-only chunk ids are aggregated because Rspack may
 * renumber them, while named chunks (index, lib-*, and webpackChunkName routes)
 * are matched individually.
 */

import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STICKY_MARKER = '<!-- bundle-size-report -->';
const HASH_SEGMENT = /\.[0-9a-f]{8,}(?=\.[a-z0-9]+$)/i;
const NUMERIC_CHUNK = /^\d+\.js$/;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const budget = JSON.parse(
  readFileSync(resolve(scriptDir, '..', 'config', 'performance-budget.json'), 'utf8')
);

function parseArgs(argv) {
  const args = { dir: null, baseDir: null, out: null, json: null };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--dir') args.dir = argv[(i += 1)];
    else if (key === '--base-dir') args.baseDir = argv[(i += 1)];
    else if (key === '--out') args.out = argv[(i += 1)];
    else if (key === '--json') args.json = argv[(i += 1)];
  }
  if (!args.dir) throw new Error('bundle-size-report: --dir <distDir> is required');
  return args;
}

function walkJs(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkJs(full, acc);
    else if (entry.endsWith('.js')) acc.push(full);
  }
  return acc;
}

function normalizeName(file) {
  return basename(file).replace(HASH_SEGMENT, '');
}

/** Collect { name -> {gzip, raw, eager} } for every JS asset in a dist dir. */
function collectAssets(distDir) {
  const jsRoot = join(distDir, 'static', 'js');
  const asyncRoot = join(jsRoot, 'async');
  const assets = new Map();
  for (const file of walkJs(jsRoot)) {
    const buf = readFileSync(file);
    const name = normalizeName(file);
    const eager = !file.startsWith(asyncRoot + '/') && !file.includes(`${asyncRoot}/`);
    assets.set(name, { name, raw: buf.length, gzip: gzipSync(buf, { level: 9 }).length, eager });
  }
  return assets;
}

function sumGzip(assets, predicate) {
  let total = 0;
  for (const asset of assets.values()) if (predicate(asset)) total += asset.gzip;
  return total;
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function signedKb(delta) {
  if (delta === 0) return '—';
  const sign = delta > 0 ? '+' : '−';
  return `${sign}${(Math.abs(delta) / 1024).toFixed(1)} KB`;
}

/**
 * Build per-named-chunk rows and aggregate the unstable numeric-id chunks,
 * split by eager vs async so the entrypoint total reconciles with its rows and
 * a numeric *eager* vendor chunk is never mislabelled as async.
 */
function buildRows(head, base) {
  const names = new Set([...head.keys(), ...base.keys()]);
  const eagerNamed = [];
  const asyncNamed = [];
  const otherEager = { head: 0, base: 0, count: 0 };
  const otherAsync = { head: 0, base: 0, count: 0 };
  const bucketOf = (asset) => (asset.eager ? otherEager : otherAsync);

  for (const name of names) {
    const h = head.get(name);
    const b = base.get(name);

    if (NUMERIC_CHUNK.test(name)) {
      // Classify each side by its OWN eager/async location. A chunk can move between the
      // entrypoint and async between builds; reusing the head flag for the base value would
      // add that base size to the wrong bucket and corrupt the entrypoint delta.
      if (h) bucketOf(h).head += h.gzip;
      if (b) bucketOf(b).base += b.gzip;
      bucketOf(h ?? b).count += 1;
      continue;
    }

    const eager = h ? h.eager : b.eager;
    const row = {
      name,
      head: h ? h.gzip : 0,
      base: b ? b.gzip : 0,
      eager,
      status: !b ? 'new' : !h ? 'removed' : 'changed',
    };
    (eager ? eagerNamed : asyncNamed).push(row);
  }
  eagerNamed.sort((a, b) => b.head - a.head);
  asyncNamed.sort((a, b) => b.head - a.head);
  return { eagerNamed, asyncNamed, otherEager, otherAsync };
}

function evaluateBudgets(head) {
  const entryGzip = sumGzip(head, (a) => a.eager);
  const breaches = [];
  if (entryGzip > budget.gzip.maxInitialEntrypointBytes) {
    breaches.push(
      `Initial entrypoint ${kb(entryGzip)} gzip exceeds budget ` +
        `${kb(budget.gzip.maxInitialEntrypointBytes)}`
    );
  }
  for (const asset of head.values()) {
    if (asset.gzip > budget.gzip.maxAssetBytes) {
      breaches.push(
        `Chunk ${asset.name} ${kb(asset.gzip)} gzip exceeds per-asset budget ` +
          `${kb(budget.gzip.maxAssetBytes)}`
      );
    }
  }
  return { entryGzip, totalGzip: sumGzip(head, () => true), breaches };
}

function renderRow(label, head, base, extra = '') {
  return `| ${label} | ${kb(head)} | ${base ? kb(base) : '—'} | ${signedKb(head - base)}${extra} |`;
}

function renderMarkdown({ rows, head, base, budgets, hasBase }) {
  const lines = [
    STICKY_MARKER,
    '## 📦 Bundle size report',
    '',
    hasBase ? 'Gzip transfer sizes vs `main`.' : 'Gzip transfer sizes (no base build to diff).',
    '',
    '| Chunk | Head (gzip) | Base (gzip) | Δ |',
    '| :-- | --: | --: | --: |',
  ];
  const entryBudget = budgets.gzip.maxInitialEntrypointBytes;
  const entryFlag = head.entryGzip > entryBudget ? ' ❌' : ' ✅';
  lines.push(
    renderRow(
      `**Initial entrypoint** (budget ${kb(entryBudget)})`,
      head.entryGzip,
      base ? base.entryGzip : 0,
      entryFlag
    )
  );
  const assetBudget = budgets.gzip.maxAssetBytes;
  const renderNamed = (row) => {
    const flag = row.head > assetBudget ? ' ❌' : '';
    const tag = row.status === 'new' ? ' 🆕' : row.status === 'removed' ? ' 🗑️' : '';
    lines.push(renderRow(`&nbsp;&nbsp;\`${row.name}\`${tag}`, row.head, row.base, flag));
  };
  rows.eagerNamed.forEach(renderNamed);
  if (rows.otherEager.count > 0) {
    lines.push(
      renderRow(
        `&nbsp;&nbsp;_other eager chunks (${rows.otherEager.count})_`,
        rows.otherEager.head,
        rows.otherEager.base
      )
    );
  }
  if (rows.asyncNamed.length > 0 || rows.otherAsync.count > 0) {
    lines.push('| **Async chunks** (not in entrypoint) | | | |');
  }
  rows.asyncNamed.forEach(renderNamed);
  if (rows.otherAsync.count > 0) {
    lines.push(
      renderRow(
        `_other async chunks (${rows.otherAsync.count})_`,
        rows.otherAsync.head,
        rows.otherAsync.base
      )
    );
  }
  lines.push(renderRow('**Total JS**', head.totalGzip, base ? base.totalGzip : 0));
  lines.push('', `Per-asset gzip budget: **${kb(budgets.gzip.maxAssetBytes)}**.`, '');
  if (head.breaches.length > 0) {
    lines.push('> [!CAUTION]', '> Budget breached:');
    for (const breach of head.breaches) lines.push(`> - ${breach}`);
  } else {
    lines.push('> [!NOTE]', '> All gzip budgets satisfied.');
  }
  lines.push('', '<sub>Source of truth: `config/performance-budget.json` · issue #117</sub>');
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const headAssets = collectAssets(args.dir);
  if (headAssets.size === 0) {
    throw new Error(`bundle-size-report: no JS assets found under ${args.dir}/static/js`);
  }
  const baseAssets = args.baseDir ? collectAssets(args.baseDir) : new Map();
  const hasBase = baseAssets.size > 0;

  const head = evaluateBudgets(headAssets);
  const base = hasBase ? evaluateBudgets(baseAssets) : null;
  const rows = buildRows(headAssets, baseAssets);
  const markdown = renderMarkdown({ rows, head, base, budgets: budget, hasBase });

  if (args.out) writeFileSync(args.out, `${markdown}\n`);
  else process.stdout.write(`${markdown}\n`);
  if (args.json) {
    writeFileSync(
      args.json,
      `${JSON.stringify({ entryGzip: head.entryGzip, totalGzip: head.totalGzip, breaches: head.breaches }, null, 2)}\n`
    );
  }

  if (head.breaches.length > 0) {
    process.stderr.write(`bundle-size-report: ${head.breaches.length} budget breach(es)\n`);
    process.exitCode = 1;
  }
}

main();
