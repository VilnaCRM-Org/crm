import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { CommandReferencePolicy, DocsScanPolicy, DocsViolation } from './docs-policy';
import { fencedBlocks, listMarkdownFiles, stripFencedBlocks, toRepoPath } from './markdown';

// A rule may declare several targets before the colon (`a b c: deps`), and each is invocable.
// Anchored at column zero: recipe lines start with a tab, and matching them would register
// fragments of shell commands ("curl", "http") as callable targets.
const MAKE_TARGET_DEFINITION = /^([A-Za-z0-9_.-]+(?:[ \t]+[A-Za-z0-9_.-]+)*)[ \t]*:(?!=)/;
const INLINE_CODE = /`([^`\n]+)`/g;
// Options and variable assignments precede the target; skip them so `make -C dir lint` and
// `make ENV=dev test-e2e` resolve to `lint` and `test-e2e` rather than to `-C` and `ENV=dev`.
const MAKE_INVOCATION = /(?:^|[\s;&|(])make\s+(?:(?:-\S+|[A-Za-z0-9_]+=\S*)\s+)*([A-Za-z0-9_.-]+)/g;
const RUN_INVOCATION =
  /(?:^|[\s;&|(])(?:bun|npm|yarn|pnpm)\s+run\s+(?:-\S+\s+)*([A-Za-z0-9_.:-]+)/g;

export const parseMakeTargets = (makefile: string): Set<string> => {
  const targets = new Set<string>();

  for (const line of makefile.split('\n')) {
    const match = MAKE_TARGET_DEFINITION.exec(line);
    for (const name of match?.[1]?.split(/\s+/) ?? []) {
      if (name !== '' && !name.startsWith('.')) {
        targets.add(name);
      }
    }
  }

  return targets;
};

export const parsePackageScripts = (manifest: string): Set<string> => {
  const parsed = JSON.parse(manifest) as { scripts?: Record<string, unknown> };
  return new Set(Object.keys(parsed.scripts ?? {}));
};

/** Only code spans and fenced blocks are treated as commands, so prose ("make sure") is safe. */
export const extractCommandText = (markdown: string): string[] => {
  const segments = fencedBlocks(markdown);

  for (const line of stripFencedBlocks(markdown)) {
    for (const match of line.matchAll(INLINE_CODE)) {
      if (match[1]) {
        segments.push(match[1]);
      }
    }
  }

  return segments;
};

/**
 * `make ...` in a guide is a placeholder, not a target; a real name has an alphanumeric.
 * `make -C dir lint` and `make FOO=bar lint` name an option and a variable, neither of which is
 * a target, so treating them as one would report a documented command as broken.
 */
const isNamedCommand = (token: string): boolean =>
  /[A-Za-z0-9]/.test(token) && !token.startsWith('-') && !token.includes('=');

const collect = (segments: readonly string[], pattern: RegExp): Set<string> => {
  const found = new Set<string>();

  for (const segment of segments) {
    for (const match of ` ${segment}`.matchAll(new RegExp(pattern.source, pattern.flags))) {
      if (match[1] && isNamedCommand(match[1])) {
        found.add(match[1]);
      }
    }
  }

  return found;
};

/**
 * Documentation must not promise commands the repository does not have — the README's
 * `doc` / API-Extractor instruction was exactly this failure (issue #122).
 */
export const checkDocReferences = (
  root: string,
  scan: DocsScanPolicy,
  policy: CommandReferencePolicy,
  tracked?: readonly string[]
): DocsViolation[] => {
  const makefilePath = join(root, policy.makefile);
  const manifestPath = join(root, policy.packageJson);

  if (!existsSync(makefilePath) || !existsSync(manifestPath)) {
    throw new Error(
      `docs-policy commandReferences: "${policy.makefile}" and "${policy.packageJson}" must ` +
        'both exist. Refusing to run with an unenforced command-reference gate.'
    );
  }

  const targets = parseMakeTargets(readFileSync(makefilePath, 'utf8'));
  const scripts = parsePackageScripts(readFileSync(manifestPath, 'utf8'));

  return listMarkdownFiles(root, scan, tracked).flatMap<DocsViolation>((file) => {
    const segments = extractCommandText(readFileSync(file, 'utf8'));
    const subject = toRepoPath(root, file);

    const unknownTargets = [...collect(segments, MAKE_INVOCATION)]
      .filter((target) => !targets.has(target))
      .sort((a, b) => a.localeCompare(b))
      .map<DocsViolation>((target) => ({
        rule: 'unknown-make-target',
        subject,
        message: `references \`make ${target}\`, which is not a target in ${policy.makefile}`,
      }));

    const unknownScripts = [...collect(segments, RUN_INVOCATION)]
      .filter((script) => !scripts.has(script))
      .sort((a, b) => a.localeCompare(b))
      .map<DocsViolation>((script) => ({
        rule: 'unknown-package-script',
        subject,
        message: `references the \`${script}\` script, which ${policy.packageJson} does not define`,
      }));

    return [...unknownTargets, ...unknownScripts];
  });
};
