import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, normalize, resolve, sep } from 'node:path';

import type { DocsScanPolicy, DocsViolation } from './docs-policy';
import {
  extractHeadings,
  extractLinks,
  listMarkdownFiles,
  slugify,
  stripFencedBlocks,
  toRepoPath,
} from './markdown';

const REMOTE_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const PROTOCOL_RELATIVE = /^\/\//;

export const isRemoteTarget = (target: string): boolean =>
  REMOTE_SCHEME.test(target) || PROTOCOL_RELATIVE.test(target);

const EXPLICIT_ANCHOR = /<a\s+[^>]*\b(?:name|id)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

export interface DocumentAnchors {
  /** Generated heading slugs: GitHub lowercases these, so the lookup is case-insensitive. */
  slugs: Set<string>;
  /** Author-written HTML ids: the DOM matches these exactly, so the lookup is case-sensitive. */
  ids: Set<string>;
}

const anchorsOf = (markdown: string): DocumentAnchors => {
  const slugs = new Set<string>();
  const ids = new Set<string>();
  const seen = new Map<string, number>();

  for (const heading of extractHeadings(markdown)) {
    const base = slugify(heading.text);
    const occurrence = seen.get(base) ?? 0;
    seen.set(base, occurrence + 1);
    slugs.add(occurrence === 0 ? base : `${base}-${occurrence}`);
  }

  // Scanned over the stripped source: an `<a id=…>` shown inside a fenced example is
  // illustration, and accepting it would let a link to a non-existent anchor pass.
  for (const match of stripFencedBlocks(markdown).join('\n').matchAll(EXPLICIT_ANCHOR)) {
    const id = match[1] ?? match[2];
    if (id !== undefined && id !== '') {
      ids.add(id);
    }
  }

  return { slugs, ids };
};

const readAnchors = (path: string, cache: Map<string, DocumentAnchors>): DocumentAnchors => {
  const cached = cache.get(path);
  if (cached) {
    return cached;
  }
  const anchors = anchorsOf(readFileSync(path, 'utf8'));
  cache.set(path, anchors);
  return anchors;
};

const hasAnchor = (anchors: DocumentAnchors, fragment: string): boolean =>
  anchors.ids.has(fragment) || anchors.slugs.has(fragment.toLowerCase());

const within = (root: string, absolute: string): boolean =>
  absolute === resolve(root) || absolute.startsWith(resolve(root) + sep);

/**
 * Reject paths that escape the repository so a link can never smuggle a traversal. The lexical
 * check is not sufficient on its own: an in-repository symlink can resolve outside the root, and
 * the anchor reader would follow it, so the real path is checked too when the target exists.
 */
const containedPath = (root: string, candidate: string): string | null => {
  const absolute = resolve(candidate);
  if (!within(root, absolute)) {
    return null;
  }

  try {
    // Both sides canonicalised: comparing a resolved target against a symlinked spelling of the
    // root would reject every in-repository link when the checkout itself is reached by a link.
    return within(realpathSync(root), realpathSync(absolute)) ? absolute : null;
  } catch {
    // Nonexistent target: the caller reports that separately.
    return absolute;
  }
};

/** A malformed percent-escape must be reported, not thrown out of the gate. */
const decode = (value: string): string | null => {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

const checkFileLink = (
  root: string,
  file: string,
  target: string,
  cache: Map<string, DocumentAnchors>
): string | null => {
  const [beforeAnchor = '', rawAnchor] = target.split('#');
  // A relative documentation path carries no query string; `?` is part of the file name only in
  // pathological cases, and treating it as a query keeps `./x.md?plain=1` resolvable.
  const [rawPath = ''] = beforeAnchor.split('?');
  const decoded = decode(rawPath);

  if (decoded === null) {
    return 'link contains a malformed percent-escape';
  }

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

  const anchor = decode(rawAnchor);
  if (anchor === null) {
    return 'link contains a malformed percent-escape';
  }

  return hasAnchor(readAnchors(resolved, cache), anchor)
    ? null
    : `no heading anchors to "#${rawAnchor}"`;
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
  const cache = new Map<string, DocumentAnchors>();

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
