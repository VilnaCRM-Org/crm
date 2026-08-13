import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize, resolve, sep } from 'node:path';

import type { DocsScanPolicy, DocsViolation } from './docs-policy';
import { extractHeadings, extractLinks, listMarkdownFiles, slugify, toRepoPath } from './markdown';

const REMOTE_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const PROTOCOL_RELATIVE = /^\/\//;

export const isRemoteTarget = (target: string): boolean =>
  REMOTE_SCHEME.test(target) || PROTOCOL_RELATIVE.test(target);

const anchorsOf = (markdown: string): Set<string> => {
  const anchors = new Set<string>();
  const seen = new Map<string, number>();

  for (const heading of extractHeadings(markdown)) {
    const base = slugify(heading.text);
    const occurrence = seen.get(base) ?? 0;
    seen.set(base, occurrence + 1);
    anchors.add(occurrence === 0 ? base : `${base}-${occurrence}`);
  }

  for (const match of markdown.matchAll(/<a\s+[^>]*(?:name|id)="([^"]+)"/g)) {
    if (match[1]) {
      anchors.add(match[1]);
    }
  }

  return anchors;
};

const readAnchors = (path: string, cache: Map<string, Set<string>>): Set<string> => {
  const cached = cache.get(path);
  if (cached) {
    return cached;
  }
  const anchors = anchorsOf(readFileSync(path, 'utf8'));
  cache.set(path, anchors);
  return anchors;
};

/** Reject paths that escape the repository so a link can never smuggle a traversal. */
const containedPath = (root: string, candidate: string): string | null => {
  const absolute = resolve(candidate);
  const boundary = resolve(root) + sep;
  return absolute === resolve(root) || absolute.startsWith(boundary) ? absolute : null;
};

const checkFileLink = (
  root: string,
  file: string,
  target: string,
  cache: Map<string, Set<string>>
): string | null => {
  const [rawPath = '', rawAnchor] = target.split('#');
  const decoded = decodeURIComponent(rawPath);

  const base = decoded === '' ? file : normalize(join(dirname(file), decoded));
  const resolved = decoded.startsWith('/')
    ? containedPath(root, join(root, decoded))
    : containedPath(root, base);

  if (resolved === null) {
    return 'link escapes the repository root';
  }
  if (!existsSync(resolved)) {
    return 'target path does not exist';
  }
  if (rawAnchor === undefined || rawAnchor === '') {
    return null;
  }
  if (!resolved.endsWith('.md')) {
    return `anchor "#${rawAnchor}" points at a non-markdown target, which has no headings`;
  }

  const anchor = decodeURIComponent(rawAnchor).toLowerCase();
  return readAnchors(resolved, cache).has(anchor) ? null : `no heading anchors to "#${rawAnchor}"`;
};

/**
 * Offline half of the link gate: every relative path and in-document anchor must resolve on
 * disk. Deterministic by construction, so it is safe as a required pull-request check; remote
 * URLs are audited separately by the scheduled lychee run (issue #122).
 */
export const checkDocLinks = (
  root: string,
  scan: DocsScanPolicy,
  tracked?: readonly string[]
): DocsViolation[] => {
  const cache = new Map<string, Set<string>>();

  return listMarkdownFiles(root, scan, tracked).flatMap<DocsViolation>((file) => {
    const markdown = readFileSync(file, 'utf8');
    const subject = toRepoPath(root, file);

    return extractLinks(markdown).flatMap<DocsViolation>((link) => {
      if (isRemoteTarget(link.target) || link.target.startsWith('mailto:')) {
        return [];
      }

      const reason = checkFileLink(root, file, link.target, cache);
      return reason === null
        ? []
        : [
            {
              rule: 'broken-link',
              subject: `${subject}:${link.line}`,
              message: `${reason} — ${link.target}`,
            },
          ];
    });
  });
};
