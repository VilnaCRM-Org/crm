import { execFileSync } from 'child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

import { type DriftContext, detectAdrDrift, matchesAny } from '../../../scripts/docs/adr-drift';
import { lintAdrs } from '../../../scripts/docs/adr-linter';
import { checkDocCoverage } from '../../../scripts/docs/doc-coverage';
import { checkDocLinks, isRemoteTarget } from '../../../scripts/docs/doc-links';
import {
  checkDocReferences,
  extractCommandText,
  parseMakeTargets,
  parsePackageScripts,
} from '../../../scripts/docs/doc-references';
import {
  type DocsPolicy,
  type DocsScanPolicy,
  loadDocsPolicy,
  parseDocsPolicy,
} from '../../../scripts/docs/docs-policy';
import {
  extractHeadings,
  extractLinks,
  fencedBlocks,
  listMarkdownFiles,
  scanFences,
  slugify,
  stripFencedBlocks,
} from '../../../scripts/docs/markdown';

const repoRoot = path.resolve(__dirname, '../../..');
const docsPolicyPath = path.join(repoRoot, 'config/docs-policy.json');
const docsPolicy = loadDocsPolicy(docsPolicyPath);
const adrPolicy = docsPolicy.adr;

const fixtureScan: DocsScanPolicy = { roots: ['.', 'docs'], ignoredPaths: [], ignoredFiles: [] };

// `safe.directory` mirrors scripts/docs/lint-docs.ts: the suite runs as root inside the dev
// container against a bind-mounted worktree owned by the host user, which git otherwise refuses.
const trackedMarkdown = (): string[] =>
  execFileSync('git', ['-c', `safe.directory=${repoRoot}`, 'ls-files', '-z', '*.md'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
    .split('\0')
    .filter((entry) => entry !== '');

const tempRoots: string[] = [];

const makeRoot = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'docs-gates-'));
  tempRoots.push(root);
  return root;
};

const write = (root: string, relativePath: string, content: string): void => {
  const absolute = path.join(root, relativePath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
};

const rulesOf = (violations: readonly { rule: string }[]): string[] =>
  violations.map((violation) => violation.rule);

const rawDocsPolicy = (): Record<string, unknown> =>
  JSON.parse(readFileSync(docsPolicyPath, 'utf8')) as Record<string, unknown>;

const omit = (source: Record<string, unknown>, key: string): Record<string, unknown> =>
  Object.fromEntries(Object.entries(source).filter(([name]) => name !== key));

const withAdrField = (field: string, value: unknown): Record<string, unknown> => {
  const raw = rawDocsPolicy();
  return { ...raw, adr: { ...(raw.adr as Record<string, unknown>), [field]: value } };
};

const ADR_METADATA = ['- Status: Approved', '- Deciders: @vilna', '- Date: 2026-08-13'];

const adrDocument = (
  firstLine: string,
  metadata: readonly string[],
  sections: readonly string[]
): string =>
  [
    firstLine,
    '',
    ...metadata,
    '',
    ...sections.flatMap((section) => [`## ${section}`, '', 'Body text.', '']),
  ].join('\n');

const validAdr = (number: string): string =>
  adrDocument(`# ADR-${number}: A decision`, ADR_METADATA, adrPolicy.requiredSections);

interface AdrFixture {
  files?: Record<string, string>;
  index?: string;
  template?: string | null;
}

const scaffoldAdrs = (fixture: AdrFixture = {}): string => {
  const root = makeRoot();
  const files = fixture.files ?? { '001-a-decision.md': validAdr('001') };

  for (const [name, body] of Object.entries(files)) {
    write(root, `${adrPolicy.directory}/${name}`, body);
  }

  const links = Object.keys(files)
    .map((name) => `- [ADR entry](./${name})`)
    .join('\n');
  write(root, adrPolicy.indexFile, fixture.index ?? `# ADRs\n\n${links}\n`);

  if (fixture.template !== null) {
    write(root, adrPolicy.templateFile, fixture.template ?? validAdr('NNN'));
  }

  return root;
};

const referenceRoot = (doc: string): string => {
  const root = makeRoot();
  write(root, 'Makefile', 'lint:\n\techo lint\n\ntest-unit:\n\techo test\n\n.PHONY: lint\n');
  write(root, 'package.json', `${JSON.stringify({ scripts: { build: 'rsbuild build' } })}\n`);
  write(root, 'docs/guide.md', doc);
  return root;
};

const linkRoot = (doc: string): string => {
  const root = makeRoot();
  write(root, 'docs/target.md', '# Target\n');
  write(root, 'docs/guide.md', doc);
  return root;
};

const driftContext = (overrides: Partial<DriftContext>): DriftContext => ({
  changedPaths: [],
  pullRequestBody: '',
  labels: [],
  readBaseFile: () => null,
  readHeadFile: () => null,
  ...overrides,
});

const driftPolicy = (overrides: Partial<DocsPolicy['architectureDrift']> = {}): DocsPolicy =>
  parseDocsPolicy(
    {
      ...rawDocsPolicy(),
      architectureDrift: { ...docsPolicy.architectureDrift, ...overrides },
    },
    docsPolicyPath
  );

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('parseDocsPolicy', () => {
  it('accepts the committed documentation policy', () => {
    expect(docsPolicy.adr.directory).toBe('docs/adr');
    expect(docsPolicy.moduleDocs.requiredFile).toBe('README.md');
    expect(docsPolicy.architectureDrift.escapeHatchMarker).toBe('[no-adr]');
  });

  it('rejects a policy that is not a JSON object', () => {
    expect(() => parseDocsPolicy(null, docsPolicyPath)).toThrow(/policy must be a JSON object/);
    expect(() => parseDocsPolicy('nope', docsPolicyPath)).toThrow(
      /Refusing to run with unenforced documentation gates/
    );
  });

  it('rejects a policy whose section is missing', () => {
    expect(() => parseDocsPolicy(omit(rawDocsPolicy(), 'moduleDocs'), docsPolicyPath)).toThrow(
      /"moduleDocs" must be an object/
    );
  });

  it('rejects a required string field that is empty', () => {
    expect(() => parseDocsPolicy(withAdrField('directory', ''), docsPolicyPath)).toThrow(
      /"adr.directory" must be a non-empty string/
    );
  });

  it('rejects a required array field that is not an array of non-empty strings', () => {
    expect(() =>
      parseDocsPolicy(withAdrField('requiredSections', ['Links', '']), docsPolicyPath)
    ).toThrow(/"adr.requiredSections" must be a non-empty string array/);
    expect(() =>
      parseDocsPolicy(withAdrField('allowedStatuses', 'Approved'), docsPolicyPath)
    ).toThrow(/"adr.allowedStatuses" must be a non-empty string array/);
  });

  it('rejects a policy file that is not valid JSON', () => {
    const root = makeRoot();
    write(root, 'broken.json', '{ not json');

    expect(() => loadDocsPolicy(path.join(root, 'broken.json'))).toThrow(/is not valid JSON/);
  });

  it.each(['filePattern', 'titlePattern', 'datePattern'])(
    'rejects an uncompilable adr.%s with the policy refusal message',
    (field) => {
      const attempt = (): DocsPolicy => parseDocsPolicy(withAdrField(field, '(['), docsPolicyPath);

      expect(attempt).toThrow(/Refusing to run with unenforced documentation gates/);
      expect(attempt).toThrow(new RegExp(`"adr\\.${field}" is not a valid regular expression`));
    }
  );

  it('accepts the committed patterns as compilable regular expressions', () => {
    expect(() => parseDocsPolicy(rawDocsPolicy(), docsPolicyPath)).not.toThrow();
  });
});

describe('listMarkdownFiles', () => {
  it('lists markdown under every scan root, ignoring other files', () => {
    const root = makeRoot();
    write(root, 'README.md', '# R\n');
    write(root, 'notes.txt', 'x\n');
    write(root, 'docs/nested/deep/page.md', '# P\n');

    expect(listMarkdownFiles(root, fixtureScan).map((file) => path.relative(root, file))).toEqual([
      path.join('docs', 'nested', 'deep', 'page.md'),
      'README.md',
    ]);
  });

  it('skips a dangling symlink at the scan root rather than throwing', () => {
    const root = makeRoot();
    write(root, 'README.md', '# R\n');
    symlinkSync(path.join(root, 'gone.md'), path.join(root, 'dangling.md'));

    expect(listMarkdownFiles(root, fixtureScan).map((file) => path.basename(file))).toEqual([
      'README.md',
    ]);
  });

  it('honours ignoredPaths and ignoredFiles', () => {
    const root = makeRoot();
    const scan: DocsScanPolicy = {
      roots: ['.', 'docs'],
      ignoredPaths: ['vendor'],
      ignoredFiles: ['CHANGELOG.md'],
    };
    write(root, 'CHANGELOG.md', '# C\n');
    write(root, 'README.md', '# R\n');
    write(root, 'docs/vendor/third-party.md', '# V\n');
    write(root, 'docs/kept.md', '# K\n');

    expect(listMarkdownFiles(root, scan).map((file) => path.basename(file))).toEqual([
      'kept.md',
      'README.md',
    ]);
  });
});

describe('slugify', () => {
  it('drops punctuation and does not collapse the whitespace runs it leaves behind', () => {
    expect(slugify('Global Skills (`~/.claude/skills`) — Task → Skill Map')).toBe(
      'global-skills-claudeskills--task--skill-map'
    );
  });

  it('preserves underscores', () => {
    expect(slugify('Snake_case Heading')).toBe('snake_case-heading');
  });

  it('drops punctuation that sits inside a word', () => {
    expect(slugify('What does `make lint-dup` do?')).toBe('what-does-make-lint-dup-do');
  });

  it('lowercases and trims', () => {
    expect(slugify('  Route Registry  ')).toBe('route-registry');
  });
});

describe('scanFences', () => {
  it('marks the opener, the body, and the closer of a block', () => {
    expect(scanFences('a\n```\nb\n```\nc')).toEqual([
      { text: 'a', inFence: false, isFenceMarker: false },
      { text: '```', inFence: true, isFenceMarker: true },
      { text: 'b', inFence: true, isFenceMarker: false },
      { text: '```', inFence: true, isFenceMarker: true },
      { text: 'c', inFence: false, isFenceMarker: false },
    ]);
  });

  it('does not let a tilde line close a backtick block', () => {
    const scanned = scanFences('a\n```md\n~~~\n```\nd');

    expect(scanned.map((line) => line.inFence)).toEqual([false, true, true, true, false]);
    expect(scanned.map((line) => line.isFenceMarker)).toEqual([false, true, false, true, false]);
  });

  it('does not let a shorter backtick run close a longer opener', () => {
    const scanned = scanFences('a\n````\n```\nstill inside\n````\ne');

    expect(scanned.map((line) => line.inFence)).toEqual([false, true, true, true, true, false]);
  });

  it('closes a shorter opener on a longer run', () => {
    const scanned = scanFences('a\n```\ninside\n````\ne');

    expect(scanned.map((line) => line.inFence)).toEqual([false, true, true, true, false]);
  });

  it('does not let a closing candidate carrying an info string close the block', () => {
    const scanned = scanFences('a\n```ts\n```sh\nstill inside\n```\ne');

    expect(scanned.map((line) => line.inFence)).toEqual([false, true, true, true, true, false]);
  });

  it('keeps an unterminated fence open to the end of the document', () => {
    const scanned = scanFences('a\n```\nb\nc');

    expect(scanned.map((line) => line.inFence)).toEqual([false, true, true, true]);
  });
});

describe('stripFencedBlocks', () => {
  it('blanks the fence markers and every line between them', () => {
    expect(stripFencedBlocks('a\n```\nb\n```\nc')).toEqual(['a', '', '', '', 'c']);
  });

  it('blanks a tilde-delimited block the same way', () => {
    expect(stripFencedBlocks('a\n~~~\nb\n~~~\nc')).toEqual(['a', '', '', '', 'c']);
  });

  it('keeps the rest of the file scannable after a block that shows the other fence style', () => {
    const markdown = ['# G', '```md', '~~~', '```', '', '## Later heading'].join('\n');

    expect(stripFencedBlocks(markdown)).toEqual(['# G', '', '', '', '', '## Later heading']);
    expect(extractHeadings(markdown)).toEqual([
      { level: 1, text: 'G' },
      { level: 2, text: 'Later heading' },
    ]);
  });
});

describe('fencedBlocks', () => {
  it('returns the body of each block, one entry per block', () => {
    expect(fencedBlocks('a\n```\nb\nc\n```\nd\n~~~\ne\n~~~')).toEqual(['b\nc', 'e']);
  });

  it('returns an empty body for an empty block', () => {
    expect(fencedBlocks('```\n```')).toEqual(['']);
  });

  it('keeps a nested other-style marker inside the block body', () => {
    expect(fencedBlocks('```md\n~~~\ninner\n```')).toEqual(['~~~\ninner']);
  });

  it('returns the partial body of an unterminated block', () => {
    expect(fencedBlocks('a\n```\nb\nc')).toEqual(['b\nc']);
  });

  it('returns nothing for a document with no fences', () => {
    expect(fencedBlocks('# Title\n\nProse only.')).toEqual([]);
  });
});

describe('extractLinks and extractHeadings', () => {
  const markdown = [
    '# Title',
    '',
    '```md',
    '## Not a heading',
    '[not a link](./nope.md)',
    '```',
    '',
    '## Real heading',
    '',
    '[real link](./target.md)',
    '',
    '![image](./picture.png)',
    '',
    '[ref]: ./reference.md',
  ].join('\n');

  it('ignores headings inside a fenced block', () => {
    expect(extractHeadings(markdown)).toEqual([
      { level: 1, text: 'Title' },
      { level: 2, text: 'Real heading' },
    ]);
  });

  it('ignores links inside a fenced block and records the line of the rest', () => {
    expect(extractLinks(markdown)).toEqual([
      { target: './target.md', line: 10 },
      { target: './reference.md', line: 14 },
    ]);
  });

  it('does not treat an image as a link', () => {
    expect(extractLinks('![alt](./picture.png)')).toEqual([]);
  });

  it('reads the target of an inline link that carries a title', () => {
    expect(extractLinks('[x](./target.md "Title")')).toEqual([{ target: './target.md', line: 1 }]);
  });
});

describe('parseMakeTargets and parsePackageScripts', () => {
  it('collects real targets while skipping variable assignments and dot targets', () => {
    const makefile = 'lint:\n\techo\n\nVAR := 1\n.PHONY: lint\ntest-unit: lint\n';

    expect([...parseMakeTargets(makefile)].sort()).toEqual(['lint', 'test-unit']);
  });

  it('collects package scripts and tolerates a manifest with none', () => {
    expect([...parsePackageScripts('{"scripts":{"build":"x","test":"y"}}')].sort()).toEqual([
      'build',
      'test',
    ]);
    expect([...parsePackageScripts('{}')]).toEqual([]);
  });
});

describe('extractCommandText', () => {
  it('returns fenced blocks and inline code spans, never plain prose', () => {
    const markdown = [
      'Prose that says make sure the build passes.',
      '',
      '```bash',
      'make lint',
      '```',
      '',
      'Inline `make test-unit` reference.',
    ].join('\n');

    expect(extractCommandText(markdown)).toEqual(['make lint', 'make test-unit']);
  });

  it('keeps scanning code that follows a block showing the other fence style', () => {
    const markdown = [
      '# G',
      '```md',
      '~~~',
      '```',
      '',
      '```sh',
      'make ghost',
      '```',
      '',
      'And `bun run ghost` inline.',
    ].join('\n');

    expect(extractCommandText(markdown)).toEqual(['~~~', 'make ghost', 'bun run ghost']);
  });

  it('does not read an inline code span out of a fenced block twice', () => {
    expect(extractCommandText('```\n`make lint`\n```')).toEqual(['`make lint`']);
  });

  it('returns nothing for a document with no code at all', () => {
    expect(extractCommandText('Just make sure it works.')).toEqual([]);
  });
});

describe('checkDocReferences', () => {
  const check = (root: string): ReturnType<typeof checkDocReferences> =>
    checkDocReferences(root, fixtureScan, docsPolicy.commandReferences);

  it('passes for known targets in fences and code spans, ignoring prose and placeholders', () => {
    const guide = [
      '# Guide',
      '',
      'Run `make lint` before pushing, and make sure the build passes.',
      '',
      '```bash',
      'make test-unit',
      'bun run build',
      '```',
      '',
      'Use `make ...` as a placeholder.',
    ].join('\n');

    expect(check(referenceRoot(guide))).toEqual([]);
  });

  it('ignores a command-looking phrase that only appears in prose', () => {
    expect(check(referenceRoot('# Guide\n\nPlease make sure the build passes.\n'))).toEqual([]);
  });

  it('checks the very same words once they are written as code', () => {
    const violations = check(referenceRoot('# Guide\n\n`make sure` is a command span.\n'));

    expect(rulesOf(violations)).toEqual(['unknown-make-target']);
    expect(violations[0].message).toContain('make sure');
  });

  it('reports an unknown make target', () => {
    const violations = check(referenceRoot('# Guide\n\nRun `make nonexistent` now.\n'));

    expect(rulesOf(violations)).toEqual(['unknown-make-target']);
    expect(violations[0].subject).toBe('docs/guide.md');
    expect(violations[0].message).toContain('which is not a target in Makefile');
  });

  it('reports an unknown package script', () => {
    const violations = check(referenceRoot('# Guide\n\nRun `bun run nonexistent` now.\n'));

    expect(rulesOf(violations)).toEqual(['unknown-package-script']);
    expect(violations[0].message).toContain('which package.json does not define');
  });

  it('still reports an unknown target after a block that shows the other fence style', () => {
    const guide = ['# Guide', '', '```md', '~~~', '```', '', '```sh', 'make ghost', '```'].join(
      '\n'
    );
    const violations = check(referenceRoot(guide));

    expect(rulesOf(violations)).toEqual(['unknown-make-target']);
    expect(violations[0].message).toContain('make ghost');
  });

  it('refuses to run when the Makefile or the manifest is absent', () => {
    const root = makeRoot();
    write(root, 'docs/guide.md', '# Guide\n');

    expect(() => check(root)).toThrow(/Refusing to run with an unenforced command-reference gate/);
  });
});

describe('isRemoteTarget', () => {
  it('recognises scheme-qualified and protocol-relative targets', () => {
    expect(isRemoteTarget('https://example.com')).toBe(true);
    expect(isRemoteTarget('mailto:team@example.com')).toBe(true);
    expect(isRemoteTarget('//example.com/page')).toBe(true);
  });

  it('does not treat a relative path or an anchor as remote', () => {
    expect(isRemoteTarget('./target.md')).toBe(false);
    expect(isRemoteTarget('#anchor')).toBe(false);
  });
});

describe('checkDocLinks', () => {
  const check = (root: string): ReturnType<typeof checkDocLinks> =>
    checkDocLinks(root, fixtureScan);

  it('passes for resolving relative, root-absolute, anchor, and remote targets', () => {
    const guide = [
      '# Guide',
      '',
      '- [relative](./target.md)',
      '- [root absolute](/docs/target.md)',
      '- [self anchor](#a-real-heading)',
      '- [remote](https://example.com/page)',
      '- [mail](mailto:team@example.com)',
      '',
      '## A real heading',
      '',
      'Body.',
    ].join('\n');

    expect(check(linkRoot(guide))).toEqual([]);
  });

  it('passes for the disambiguated anchor of a repeated heading', () => {
    const guide = ['# Guide', '', '[second](#repeat-1)', '', '## Repeat', '', '## Repeat'].join(
      '\n'
    );

    expect(check(linkRoot(guide))).toEqual([]);
  });

  it('reports a relative link whose file does not exist', () => {
    const violations = check(linkRoot('# Guide\n\n[missing](./nope.md)\n'));

    expect(rulesOf(violations)).toEqual(['broken-link']);
    expect(violations[0].subject).toBe('docs/guide.md:3');
    expect(violations[0].message).toBe('target path does not exist — ./nope.md');
  });

  it('reports an anchor no heading produces', () => {
    const violations = check(linkRoot('# Guide\n\n[bad](#no-such-heading)\n\n## A real heading\n'));

    expect(rulesOf(violations)).toEqual(['broken-link']);
    expect(violations[0].message).toContain('no heading anchors to "#no-such-heading"');
  });

  it('passes for a plain link to a directory but reports an anchor on one', () => {
    const root = linkRoot('# Guide\n\n[dir](./sub)\n\n[anchored](./sub#nope)\n');
    write(root, 'docs/sub/page.md', '# Page\n');
    const violations = check(root);

    expect(rulesOf(violations)).toEqual(['broken-link']);
    expect(violations[0].subject).toBe('docs/guide.md:5');
    expect(violations[0].message).toBe(
      'anchor "#nope" points at a non-markdown target, which has no headings — ./sub#nope'
    );
  });

  it('reports an anchor on a non-markdown file', () => {
    const root = linkRoot('# Guide\n\n[img](./logo.svg#layer)\n');
    write(root, 'docs/logo.svg', '<svg></svg>\n');

    expect(rulesOf(check(root))).toEqual(['broken-link']);
  });

  it('reports a traversal that escapes the repository root', () => {
    const violations = check(linkRoot('# Guide\n\n[escape](../../../etc/passwd)\n'));

    expect(rulesOf(violations)).toEqual(['broken-link']);
    expect(violations[0].message).toBe('link escapes the repository root — ../../../etc/passwd');
  });
});

describe('lintAdrs', () => {
  it('passes for a well-formed ADR set', () => {
    expect(lintAdrs(scaffoldAdrs(), adrPolicy)).toEqual([]);
  });

  it('passes for an empty ADR directory whose index lists nothing', () => {
    expect(
      lintAdrs(scaffoldAdrs({ files: {}, index: '# ADRs\n\nNone yet.\n' }), adrPolicy)
    ).toEqual([]);
  });

  it('reports a filename that does not match the policy pattern', () => {
    const root = scaffoldAdrs({ files: { '001-Bad-Slug.md': validAdr('001') } });
    const violations = lintAdrs(root, adrPolicy);

    expect(rulesOf(violations)).toEqual(['bad-filename']);
    expect(violations[0].subject).toBe('docs/adr/001-Bad-Slug.md');
  });

  it('reports a title whose number disagrees with the filename', () => {
    const root = scaffoldAdrs({ files: { '002-second-decision.md': validAdr('003') } });
    const violations = lintAdrs(root, adrPolicy);

    expect(rulesOf(violations)).toEqual(['bad-title']);
    expect(violations[0].message).toBe('title declares ADR-003 but the filename declares 002');
  });

  it('reports a first line that is not an ADR title at all', () => {
    const body = adrDocument('Not a title', ADR_METADATA, adrPolicy.requiredSections);
    const violations = lintAdrs(scaffoldAdrs({ files: { '004-fourth.md': body } }), adrPolicy);

    expect(rulesOf(violations)).toEqual(['bad-title']);
    expect(violations[0].message).toContain('first line must match');
  });

  it('reports a missing metadata field', () => {
    const metadata = ADR_METADATA.filter((line) => !line.startsWith('- Deciders'));
    const body = adrDocument('# ADR-001: A decision', metadata, adrPolicy.requiredSections);
    const violations = lintAdrs(scaffoldAdrs({ files: { '001-a-decision.md': body } }), adrPolicy);

    expect(rulesOf(violations)).toEqual(['missing-metadata']);
    expect(violations[0].message).toBe('metadata block has no "- Deciders: …" line');
  });

  it('reports a status outside the allowed vocabulary', () => {
    const metadata = ADR_METADATA.map((line) =>
      line.startsWith('- Status') ? '- Status: Draft' : line
    );
    const body = adrDocument('# ADR-001: A decision', metadata, adrPolicy.requiredSections);
    const violations = lintAdrs(scaffoldAdrs({ files: { '001-a-decision.md': body } }), adrPolicy);

    expect(rulesOf(violations)).toEqual(['invalid-status']);
    expect(violations[0].message).toContain('status "Draft" is outside');
  });

  it('reports a date that does not match the policy pattern', () => {
    const metadata = ADR_METADATA.map((line) =>
      line.startsWith('- Date') ? '- Date: 13-08-2026' : line
    );
    const body = adrDocument('# ADR-001: A decision', metadata, adrPolicy.requiredSections);
    const violations = lintAdrs(scaffoldAdrs({ files: { '001-a-decision.md': body } }), adrPolicy);

    expect(rulesOf(violations)).toEqual(['invalid-date']);
    expect(violations[0].message).toContain('date "13-08-2026" must match');
  });

  it('reports a required section that is absent', () => {
    const sections = adrPolicy.requiredSections.filter((section) => section !== 'Links');
    const body = adrDocument('# ADR-001: A decision', ADR_METADATA, sections);
    const violations = lintAdrs(scaffoldAdrs({ files: { '001-a-decision.md': body } }), adrPolicy);

    expect(rulesOf(violations)).toEqual(['missing-section']);
    expect(violations[0].message).toBe('required section "Links" is absent');
  });

  it('reports every required section for an ADR that carries only the metadata block', () => {
    const body = adrDocument('# ADR-001: A decision', ADR_METADATA, []);
    const violations = lintAdrs(scaffoldAdrs({ files: { '001-a-decision.md': body } }), adrPolicy);

    expect(rulesOf(violations)).toEqual(adrPolicy.requiredSections.map(() => 'missing-section'));
    expect(violations.map((violation) => violation.message)).toEqual(
      adrPolicy.requiredSections.map((section) => `required section "${section}" is absent`)
    );
  });

  it('reports an ADR that the index does not list', () => {
    const root = scaffoldAdrs({ index: '# ADRs\n\nNothing linked yet.\n' });
    const violations = lintAdrs(root, adrPolicy);

    expect(rulesOf(violations)).toEqual(['missing-from-index']);
    expect(violations[0].message).toBe('not listed in docs/adr/README.md');
  });

  it('reports an index entry that points at no ADR', () => {
    const index = '# ADRs\n\n- [ADR entry](./001-a-decision.md)\n- [Ghost](./009-ghost.md)\n';
    const violations = lintAdrs(scaffoldAdrs({ index }), adrPolicy);

    expect(rulesOf(violations)).toEqual(['orphan-in-index']);
    expect(violations[0].subject).toBe('docs/adr/README.md → ./009-ghost.md');
    expect(violations[0].message).toBe('index links an ADR that does not exist');
  });

  it('does not let an entry outside the ADR directory stand in for a same-named ADR', () => {
    const root = scaffoldAdrs({ index: '# ADRs\n\n- [x](../elsewhere/001-a-decision.md)\n' });
    write(root, 'docs/elsewhere/001-a-decision.md', validAdr('001'));
    const violations = lintAdrs(root, adrPolicy);

    expect(rulesOf(violations).sort()).toEqual(['missing-from-index', 'orphan-in-index']);
    expect(violations.map((violation) => violation.message)).toContain(
      `index links outside ${adrPolicy.directory}`
    );
  });

  it('does not treat the template linked from the index as an orphan', () => {
    const index = [
      '# ADRs',
      '',
      '- [ADR entry](./001-a-decision.md)',
      '',
      'Copy [`template.md`](./template.md) to start a new one.',
      '',
    ].join('\n');

    expect(lintAdrs(scaffoldAdrs({ index }), adrPolicy)).toEqual([]);
  });

  it('accepts an index entry written without a leading ./', () => {
    expect(
      lintAdrs(scaffoldAdrs({ index: '# ADRs\n\n- [x](001-a-decision.md)\n' }), adrPolicy)
    ).toEqual([]);
  });

  it('accepts a percent-encoded index entry', () => {
    const root = scaffoldAdrs({
      files: { '001-a-decision.md': validAdr('001') },
      index: '# ADRs\n\n- [x](./001-a%2Ddecision.md)\n',
    });

    expect(lintAdrs(root, adrPolicy)).toEqual([]);
  });

  it('reports an absent index', () => {
    const root = makeRoot();
    write(root, `${adrPolicy.directory}/001-a-decision.md`, validAdr('001'));
    write(root, adrPolicy.templateFile, validAdr('NNN'));

    expect(rulesOf(lintAdrs(root, adrPolicy))).toEqual(['missing-index']);
  });

  it('reports an absent template', () => {
    const violations = lintAdrs(scaffoldAdrs({ template: null }), adrPolicy);

    expect(rulesOf(violations)).toEqual(['missing-template']);
    expect(violations[0].subject).toBe('docs/adr/template.md');
  });

  it('reports a template that omits a required section', () => {
    const sections = adrPolicy.requiredSections.filter((section) => section !== 'Links');
    const template = adrDocument('# ADR-NNN: Template', ADR_METADATA, sections);
    const violations = lintAdrs(scaffoldAdrs({ template }), adrPolicy);

    expect(rulesOf(violations)).toEqual(['template-drift']);
    expect(violations[0].message).toContain('template omits required section "Links"');
  });

  it('only inspects tracked ADR files when a tracked list is supplied', () => {
    const root = scaffoldAdrs();
    write(root, `${adrPolicy.directory}/untracked-scratch.md`, '# scratch\n');

    const scanned = lintAdrs(root, adrPolicy);

    expect(rulesOf(scanned)).toContain('bad-filename');
    expect(scanned.every((violation) => violation.subject.includes('untracked-scratch'))).toBe(
      true
    );
    expect(lintAdrs(root, adrPolicy, ['docs/adr/001-a-decision.md'])).toEqual([]);
  });
});

describe('checkDocCoverage', () => {
  const moduleDocs = docsPolicy.moduleDocs;

  it('passes for a module that ships a README', () => {
    const root = makeRoot();
    write(root, 'src/modules/user/README.md', '# User module\n');

    expect(checkDocCoverage(root, moduleDocs)).toEqual([]);
  });

  it('reports a module without a README', () => {
    const root = makeRoot();
    write(root, 'src/modules/order/index.ts', 'export {};\n');
    const violations = checkDocCoverage(root, moduleDocs);

    expect(rulesOf(violations)).toEqual(['missing-module-doc']);
    expect(violations[0].subject).toBe('src/modules/order');
  });

  it('reports a module whose README is empty', () => {
    const root = makeRoot();
    write(root, 'src/modules/blank/README.md', '   \n\n');
    const violations = checkDocCoverage(root, moduleDocs);

    expect(rulesOf(violations)).toEqual(['empty-module-doc']);
    expect(violations[0].subject).toBe('src/modules/blank/README.md');
  });

  it('reports nothing when the module root does not exist', () => {
    expect(checkDocCoverage(makeRoot(), moduleDocs)).toEqual([]);
  });
});

describe('matchesAny', () => {
  it('lets a double star cross directory separators', () => {
    expect(matchesAny('src/config/env/index.ts', ['src/config/**'])).toBe(true);
  });

  it('does not let a single star cross a directory separator', () => {
    expect(matchesAny('src/config/env/index.ts', ['src/config/*'])).toBe(false);
    expect(matchesAny('src/config/index.ts', ['src/config/*'])).toBe(true);
  });

  it('anchors the pattern and escapes regular-expression metacharacters', () => {
    expect(matchesAny('rsbuild.config.ts', ['rsbuild.config.ts'])).toBe(true);
    expect(matchesAny('rsbuildXconfig.ts', ['rsbuild.config.ts'])).toBe(false);
    expect(matchesAny('a/rsbuild.config.ts', ['rsbuild.config.ts'])).toBe(false);
  });

  it('reports no match for a path outside every glob', () => {
    expect(matchesAny('src/routes/registry.ts', ['src/config/**'])).toBe(false);
  });
});

describe('detectAdrDrift', () => {
  const policy = driftPolicy();
  const drift = policy.architectureDrift;
  const manifest = (dependencies: Record<string, string>, version: string): string =>
    JSON.stringify({ name: 'crm', version, dependencies });

  it('reports nothing when no significant path changed', () => {
    const result = detectAdrDrift(policy, driftContext({ changedPaths: ['README.md'] }));

    expect(result).toEqual({ violations: [], triggers: [], waived: false });
  });

  it('reports nothing when a significant change ships a real ADR', () => {
    const result = detectAdrDrift(
      policy,
      driftContext({ changedPaths: ['src/config/env/index.ts', 'docs/adr/004-thing.md'] })
    );

    expect(result.violations).toEqual([]);
    expect(result.triggers).toEqual(['src/config/env/index.ts']);
    expect(result.waived).toBe(false);
  });

  it('reports an undocumented architecture change when no ADR is touched', () => {
    const result = detectAdrDrift(
      policy,
      driftContext({ changedPaths: ['src/config/env/index.ts'] })
    );

    expect(rulesOf(result.violations)).toEqual(['undocumented-architecture-change']);
    expect(result.violations[0].subject).toBe('src/config/env/index.ts');
    expect(result.waived).toBe(false);
  });

  it('does not accept a touch of the ADR index as recording a decision', () => {
    const result = detectAdrDrift(
      policy,
      driftContext({ changedPaths: ['src/config/env/index.ts', 'docs/adr/README.md'] })
    );

    expect(rulesOf(result.violations)).toEqual(['undocumented-architecture-change']);
    expect(result.waived).toBe(false);
  });

  it('does not accept a touch of the ADR template as recording a decision', () => {
    const result = detectAdrDrift(
      policy,
      driftContext({ changedPaths: ['rsbuild.config.ts', 'docs/adr/template.md'] })
    );

    expect(rulesOf(result.violations)).toEqual(['undocumented-architecture-change']);
  });

  it('does not accept a nested file under the ADR prefix as recording a decision', () => {
    const result = detectAdrDrift(
      policy,
      driftContext({ changedPaths: ['rsbuild.config.ts', 'docs/adr/assets/005-diagram.md'] })
    );

    expect(rulesOf(result.violations)).toEqual(['undocumented-architecture-change']);
  });

  it('waives the violation for a body line containing only the marker', () => {
    const result = detectAdrDrift(
      policy,
      driftContext({
        changedPaths: ['rsbuild.config.ts'],
        pullRequestBody: `Rework the build.\n\n  ${drift.escapeHatchMarker}  \n\nDone.`,
      })
    );

    expect(result.violations).toEqual([]);
    expect(result.waived).toBe(true);
  });

  it('does not waive when the marker is only quoted or mentioned inline', () => {
    const quoted = detectAdrDrift(
      policy,
      driftContext({
        changedPaths: ['rsbuild.config.ts'],
        pullRequestBody: `Reviewer asked:\n\n> should we add \`${drift.escapeHatchMarker}\`?\n`,
      })
    );
    const inline = detectAdrDrift(
      policy,
      driftContext({
        changedPaths: ['rsbuild.config.ts'],
        pullRequestBody: `${drift.escapeHatchMarker} no decision here.`,
      })
    );

    expect(rulesOf(quoted.violations)).toEqual(['undocumented-architecture-change']);
    expect(quoted.waived).toBe(false);
    expect(rulesOf(inline.violations)).toEqual(['undocumented-architecture-change']);
  });

  it('waives the violation for the escape-hatch label', () => {
    const result = detectAdrDrift(
      policy,
      driftContext({
        changedPaths: ['.dependency-cruiser.js'],
        labels: ['bug', drift.escapeHatchLabel],
      })
    );

    expect(result.violations).toEqual([]);
    expect(result.waived).toBe(true);
  });

  it('names the template and the marker in the violation message', () => {
    const result = detectAdrDrift(
      policy,
      driftContext({ changedPaths: ['config/browser-support.json'] })
    );

    expect(result.violations[0].message).toContain(policy.adr.templateFile);
    expect(result.violations[0].message).toContain(`only "${drift.escapeHatchMarker}"`);
  });

  it('ignores a manifest edit that leaves the dependency map identical', () => {
    const result = detectAdrDrift(
      policy,
      driftContext({
        changedPaths: [drift.significantManifest],
        readBaseFile: () => manifest({ react: '18.3.1' }, '1.0.0'),
        readHeadFile: () => manifest({ react: '18.3.1' }, '1.1.0'),
      })
    );

    expect(result).toEqual({ violations: [], triggers: [], waived: false });
  });

  it('triggers on a manifest edit that moves the dependency map', () => {
    const result = detectAdrDrift(
      policy,
      driftContext({
        changedPaths: [drift.significantManifest],
        readBaseFile: () => manifest({ react: '18.3.1' }, '1.0.0'),
        readHeadFile: () => manifest({ react: '19.0.0' }, '1.0.0'),
      })
    );

    expect(result.triggers).toEqual([drift.significantManifest]);
    expect(rulesOf(result.violations)).toEqual(['undocumented-architecture-change']);
  });

  it('ignores a manifest edit whose content cannot be parsed on either side', () => {
    const result = detectAdrDrift(
      policy,
      driftContext({
        changedPaths: [drift.significantManifest],
        readBaseFile: () => 'not json',
        readHeadFile: () => 'also not json',
      })
    );

    expect(result.triggers).toEqual([]);
  });

  it('recognises a decision recorded under a policy-configured ADR prefix', () => {
    const relocated = driftPolicy({ adrPathPrefix: 'docs/decisions/' });
    const result = detectAdrDrift(
      relocated,
      driftContext({ changedPaths: ['rsbuild.config.ts', 'docs/decisions/004-thing.md'] })
    );

    expect(result.violations).toEqual([]);
  });
});

describe('the repository itself', () => {
  it('passes every documentation gate against the tracked markdown files', () => {
    const tracked = trackedMarkdown();

    expect(tracked.length).toBeGreaterThan(0);
    expect(lintAdrs(repoRoot, docsPolicy.adr, tracked)).toEqual([]);
    expect(checkDocCoverage(repoRoot, docsPolicy.moduleDocs)).toEqual([]);
    expect(
      checkDocReferences(repoRoot, docsPolicy.docs, docsPolicy.commandReferences, tracked)
    ).toEqual([]);
    expect(checkDocLinks(repoRoot, docsPolicy.docs, tracked)).toEqual([]);
  });
});
