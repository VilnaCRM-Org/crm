import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import type { DocsScanPolicy } from './docs-policy';

export interface MarkdownLink {
  target: string;
  line: number;
}

export interface MarkdownHeading {
  text: string;
  level: number;
}

const MARKDOWN_EXTENSION = '.md';
const FENCE = /^\s{0,3}(`{3,}|~{3,})(.*)$/;
const INLINE_LINK = /(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const REFERENCE_DEFINITION = /^\s{0,3}\[[^\]]+\]:\s*(\S+)/;
const HEADING = /^(#{1,6})\s+(.+?)\s*$/;

export interface FenceScanLine {
  text: string;
  inFence: boolean;
  isFenceMarker: boolean;
}

/**
 * CommonMark fence scanning: a block opened with backticks closes only on backticks, and only
 * on a run at least as long as the opener. Treating ``` and ~~~ as interchangeable desynchronises
 * the scanner on any document that shows one fence style inside the other — which silently
 * disables every downstream check for the rest of the file.
 */
export const scanFences = (markdown: string): FenceScanLine[] => {
  let opener: string | null = null;

  return markdown.split('\n').map((text) => {
    const match = FENCE.exec(text);
    const marker = match?.[1];

    if (marker) {
      if (opener === null) {
        opener = marker;
        return { text, inFence: true, isFenceMarker: true };
      }

      const sameStyle = marker[0] === opener[0];
      const longEnough = marker.length >= opener.length;
      const isInfoString = (match[2] ?? '').trim() !== '';

      if (sameStyle && longEnough && !isInfoString) {
        opener = null;
        return { text, inFence: true, isFenceMarker: true };
      }
    }

    return { text, inFence: opener !== null, isFenceMarker: false };
  });
};

const isIgnored = (name: string, policy: DocsScanPolicy): boolean =>
  policy.ignoredPaths.includes(name);

const walk = (directory: string, policy: DocsScanPolicy, found: Set<string>): void => {
  let entries: string[];
  try {
    entries = readdirSync(directory);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (isIgnored(entry, policy) || entry.startsWith('.git')) {
      continue;
    }

    const absolute = join(directory, entry);
    let stats;
    try {
      stats = statSync(absolute);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      walk(absolute, policy, found);
    } else if (entry.endsWith(MARKDOWN_EXTENSION) && !policy.ignoredFiles.includes(entry)) {
      found.add(absolute);
    }
  }
};

const underRoot = (repoPath: string, scanRoot: string): boolean =>
  scanRoot === '.' ? !repoPath.includes('/') : repoPath.startsWith(`${scanRoot}/`);

const allowedByPolicy = (repoPath: string, policy: DocsScanPolicy): boolean => {
  const segments = repoPath.split('/');
  const name = segments[segments.length - 1] ?? '';

  if (!name.endsWith(MARKDOWN_EXTENSION) || policy.ignoredFiles.includes(name)) {
    return false;
  }
  if (segments.slice(0, -1).some((segment) => isIgnored(segment, policy))) {
    return false;
  }

  return policy.roots.some((scanRoot) => underRoot(repoPath, scanRoot));
};

/**
 * Every markdown file under the policy roots, ignored directories pruned, sorted for stability.
 * `tracked` (repository-relative paths, normally `git ls-files`) keeps the gate deterministic:
 * without it an untracked scratch file would fail a developer's `make lint` but never CI.
 */
export const listMarkdownFiles = (
  root: string,
  policy: DocsScanPolicy,
  tracked?: readonly string[]
): string[] => {
  if (tracked) {
    return tracked
      .filter((repoPath) => allowedByPolicy(repoPath, policy))
      .sort((a, b) => a.localeCompare(b))
      .map((repoPath) => join(root, repoPath));
  }

  const found = new Set<string>();

  for (const scanRoot of policy.roots) {
    const absolute = scanRoot === '.' ? root : join(root, scanRoot);
    if (scanRoot === '.') {
      for (const entry of readdirSync(absolute)) {
        if (isIgnored(entry, policy) || entry.startsWith('.git')) {
          continue;
        }
        if (!entry.endsWith(MARKDOWN_EXTENSION) || policy.ignoredFiles.includes(entry)) {
          continue;
        }

        const child = join(absolute, entry);
        try {
          if (statSync(child).isFile()) {
            found.add(child);
          }
        } catch {
          continue;
        }
      }
      continue;
    }
    walk(absolute, policy, found);
  }

  return [...found].sort((a, b) => a.localeCompare(b));
};

/** Strip fenced code blocks so links and headings inside samples are never treated as real. */
export const stripFencedBlocks = (markdown: string): string[] =>
  scanFences(markdown).map((line) => (line.inFence ? '' : line.text));

/** The complement: only the contents of fenced code blocks, one entry per block. */
export const fencedBlocks = (markdown: string): string[] => {
  const blocks: string[] = [];
  let current: string[] | null = null;

  for (const line of scanFences(markdown)) {
    if (line.isFenceMarker) {
      if (current === null) {
        current = [];
      } else {
        blocks.push(current.join('\n'));
        current = null;
      }
      continue;
    }
    current?.push(line.text);
  }

  if (current !== null) {
    blocks.push(current.join('\n'));
  }

  return blocks;
};

export const extractLinks = (markdown: string): MarkdownLink[] => {
  const links: MarkdownLink[] = [];

  stripFencedBlocks(markdown).forEach((line, index) => {
    for (const match of line.matchAll(INLINE_LINK)) {
      const [, target] = match;
      if (target) {
        links.push({ target, line: index + 1 });
      }
    }

    const definition = REFERENCE_DEFINITION.exec(line);
    if (definition?.[1]) {
      links.push({ target: definition[1], line: index + 1 });
    }
  });

  return links;
};

export const extractHeadings = (markdown: string): MarkdownHeading[] =>
  stripFencedBlocks(markdown).flatMap((line) => {
    const match = HEADING.exec(line);
    return match?.[1] && match[2] ? [{ level: match[1].length, text: match[2].trim() }] : [];
  });

/**
 * GitHub slug for a heading: lowercase, punctuation dropped, then every remaining whitespace
 * character becomes one hyphen. Runs are deliberately not collapsed — GitHub emits `a--b` for
 * a heading whose dropped punctuation sat between two spaces.
 */
export const slugify = (heading: string): string =>
  heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s/g, '-');

export const toRepoPath = (root: string, absolute: string): string =>
  relative(root, absolute).split(sep).join('/');
