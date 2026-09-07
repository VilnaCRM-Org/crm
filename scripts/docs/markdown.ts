import { lstatSync, readdirSync } from 'node:fs';
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
const INLINE_LINK = /(?<!!)\[[^\]]*\]\(\s*<?([^)>\s]+)>?(?:\s+"[^"]*")?\s*\)/g;
// `[^1]: …` is a GitHub footnote definition, not a link reference; matching it produced
// false broken-link failures for a target that is body text.
const REFERENCE_DEFINITION = /^\s{0,3}\[(?!\^)[^\]]+\]:\s*<?([^>\s]+)>?/;
// Four spaces of indent is an indented code block, not a heading; a trailing run of hashes is
// an optional ATX closing sequence and is not part of the heading text.
const HEADING = /^ {0,3}(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/;
// Delimiter-aware: a span opened with N backticks closes on a run of exactly N, so a single
// backtick inside a ``double-backtick`` span does not terminate it early and leave the rest of
// the line — including example links — exposed as real markdown. The lookarounds keep both runs
// maximal; without them a longer closing run would be matched N-at-a-time and expose the tail.
const INLINE_CODE_SPAN = /(?<!`)(`+)(?!`)(?:(?!\1)[^\n])*\1(?!`)/g;

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

const readEntries = (directory: string): string[] => {
  try {
    return readdirSync(directory);
  } catch {
    return [];
  }
};

/**
 * lstat, not stat: descending through a symlinked directory can leave the repository or loop
 * forever, and neither is acceptable in a gate.
 */
const isDirectory = (absolute: string): boolean => {
  try {
    return lstatSync(absolute).isDirectory();
  } catch {
    return false;
  }
};

const isRegularFile = (absolute: string): boolean => {
  try {
    return lstatSync(absolute).isFile();
  } catch {
    return false;
  }
};

const walk = (directory: string, policy: DocsScanPolicy, found: Set<string>): void => {
  for (const entry of readEntries(directory)) {
    if (isIgnored(entry, policy) || entry.startsWith('.git')) {
      continue;
    }

    const absolute = join(directory, entry);
    if (isDirectory(absolute)) {
      walk(absolute, policy, found);
    } else if (
      entry.endsWith(MARKDOWN_EXTENSION) &&
      !policy.ignoredFiles.includes(entry) &&
      // A symlinked `*.md` would otherwise pull an external document into the scan.
      isRegularFile(absolute)
    ) {
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
const isMarkdownEntry = (name: string, policy: DocsScanPolicy): boolean =>
  name.endsWith(MARKDOWN_EXTENSION) &&
  !policy.ignoredFiles.includes(name) &&
  !isIgnored(name, policy) &&
  !name.startsWith('.git');

/** Top-level markdown only; the repository root is not descended into as a whole. */
const rootMarkdown = (directory: string, policy: DocsScanPolicy, found: Set<string>): void => {
  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);
    if (isMarkdownEntry(entry, policy) && isRegularFile(absolute)) {
      found.add(absolute);
    }
  }
};

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
    if (scanRoot === '.') {
      rootMarkdown(root, policy, found);
    } else {
      walk(join(root, scanRoot), policy, found);
    }
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

  stripFencedBlocks(markdown).forEach((rawLine, index) => {
    // A link shown inside a code span is an example of syntax, not a link to resolve.
    const line = rawLine.replace(INLINE_CODE_SPAN, '');

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
