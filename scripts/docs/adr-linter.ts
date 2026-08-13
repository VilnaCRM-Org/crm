import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

import type { AdrPolicy, DocsViolation } from './docs-policy';
import { extractHeadings, extractLinks } from './markdown';

const METADATA_LINE = (field: string): RegExp => new RegExp(`^-\\s*${field}:\\s*(.+?)\\s*$`, 'm');

const listAdrFiles = (
  directory: string,
  policy: AdrPolicy,
  tracked?: readonly string[]
): string[] => {
  const indexName = policy.indexFile.split('/').pop() ?? '';
  const templateName = policy.templateFile.split('/').pop() ?? '';
  const isCandidate = (name: string): boolean =>
    name.endsWith('.md') && name !== indexName && name !== templateName;

  const names = tracked
    ? tracked
        .filter((repoPath) => repoPath.startsWith(`${policy.directory}/`))
        .map((repoPath) => repoPath.slice(policy.directory.length + 1))
        .filter((name) => !name.includes('/'))
    : existsSync(directory)
      ? readdirSync(directory)
      : [];

  return names.filter(isCandidate).sort((a, b) => a.localeCompare(b));
};

const checkFilename = (name: string, policy: AdrPolicy): DocsViolation[] =>
  new RegExp(policy.filePattern).test(name)
    ? []
    : [
        {
          rule: 'bad-filename',
          subject: `${policy.directory}/${name}`,
          message: `filename must match ${policy.filePattern} (NNN-kebab-case-slug.md)`,
        },
      ];

const checkTitle = (name: string, body: string, policy: AdrPolicy): DocsViolation[] => {
  const subject = `${policy.directory}/${name}`;
  const [titleLine = ''] = body.split('\n');
  const match = new RegExp(policy.titlePattern).exec(titleLine);

  if (!match) {
    return [
      {
        rule: 'bad-title',
        subject,
        message: `first line must match ${policy.titlePattern}`,
      },
    ];
  }

  const [fileNumber] = name.split('-');
  return match[1] === fileNumber
    ? []
    : [
        {
          rule: 'bad-title',
          subject,
          message: `title declares ADR-${match[1]} but the filename declares ${fileNumber}`,
        },
      ];
};

const checkMetadata = (name: string, body: string, policy: AdrPolicy): DocsViolation[] => {
  const subject = `${policy.directory}/${name}`;

  return policy.requiredMetadata.flatMap<DocsViolation>((field) => {
    const match = METADATA_LINE(field).exec(body);
    if (!match?.[1]) {
      return [
        {
          rule: 'missing-metadata',
          subject,
          message: `metadata block has no "- ${field}: …" line`,
        },
      ];
    }

    const value = match[1];
    if (field === 'Status' && !policy.allowedStatuses.includes(value)) {
      return [
        {
          rule: 'invalid-status',
          subject,
          message: `status "${value}" is outside [${policy.allowedStatuses.join(', ')}]`,
        },
      ];
    }
    if (field === 'Date' && !new RegExp(policy.datePattern).test(value)) {
      return [
        {
          rule: 'invalid-date',
          subject,
          message: `date "${value}" must match ${policy.datePattern}`,
        },
      ];
    }

    return [];
  });
};

const missingSections = (body: string, policy: AdrPolicy): string[] => {
  const headings = new Set(
    extractHeadings(body)
      .filter((heading) => heading.level >= 2)
      .map((heading) => heading.text)
  );
  return policy.requiredSections.filter((section) => !headings.has(section));
};

const checkSections = (name: string, body: string, policy: AdrPolicy): DocsViolation[] =>
  missingSections(body, policy).map((section) => ({
    rule: 'missing-section',
    subject: `${policy.directory}/${name}`,
    message: `required section "${section}" is absent`,
  }));

const checkIndex = (root: string, names: string[], policy: AdrPolicy): DocsViolation[] => {
  const indexPath = join(root, policy.indexFile);

  if (!existsSync(indexPath)) {
    return [
      {
        rule: 'missing-index',
        subject: policy.indexFile,
        message: 'the ADR index is absent',
      },
    ];
  }

  const indexDirectory = dirname(indexPath);
  const adrDirectory = resolve(root, policy.directory);

  // Resolve each entry against the index's own directory rather than matching basenames: a
  // link to `../elsewhere/001-a.md` must not count as listing `docs/adr/001-a.md`.
  const targets = extractLinks(readFileSync(indexPath, 'utf8'))
    .map((link) => decodeURIComponent(link.target.split('#')[0] ?? ''))
    .filter((target) => target.endsWith('.md'))
    .map((target) => ({ target, absolute: resolve(indexDirectory, target) }));

  const linked = new Set(
    targets
      .filter(({ absolute }) => dirname(absolute) === adrDirectory)
      .map(({ absolute }) => basename(absolute))
  );

  const missing = names
    .filter((name) => !linked.has(name))
    .map<DocsViolation>((name) => ({
      rule: 'missing-from-index',
      subject: `${policy.directory}/${name}`,
      message: `not listed in ${policy.indexFile}`,
    }));

  // Compare the resolved path, not the basename: exempting by name would let any broken link
  // called `template.md` slip past both the location and the existence check.
  const templatePath = resolve(root, policy.templateFile);
  const orphans = targets
    .filter(({ absolute }) => absolute !== templatePath)
    .filter(({ absolute }) => dirname(absolute) !== adrDirectory || !existsSync(absolute))
    .map<DocsViolation>(({ target }) => ({
      rule: 'orphan-in-index',
      subject: `${policy.indexFile} → ${target}`,
      message:
        dirname(resolve(indexDirectory, target)) === adrDirectory
          ? 'index links an ADR that does not exist'
          : `index links outside ${policy.directory}`,
    }));

  return [...missing, ...orphans];
};

const checkTemplate = (root: string, policy: AdrPolicy): DocsViolation[] => {
  const templatePath = join(root, policy.templateFile);

  if (!existsSync(templatePath)) {
    return [
      {
        rule: 'missing-template',
        subject: policy.templateFile,
        message: 'the canonical ADR skeleton is absent',
      },
    ];
  }

  return missingSections(readFileSync(templatePath, 'utf8'), policy).map((section) => ({
    rule: 'template-drift',
    subject: policy.templateFile,
    message: `template omits required section "${section}" — template and policy must agree`,
  }));
};

/** Validate every ADR, the index, and the template against the policy (issue #122). */
export const lintAdrs = (
  root: string,
  policy: AdrPolicy,
  tracked?: readonly string[]
): DocsViolation[] => {
  const directory = join(root, policy.directory);
  const names = listAdrFiles(directory, policy, tracked);

  const perFile = names.flatMap((name) => {
    const body = readFileSync(join(directory, name), 'utf8');
    return [
      ...checkFilename(name, policy),
      ...checkTitle(name, body, policy),
      ...checkMetadata(name, body, policy),
      ...checkSections(name, body, policy),
    ];
  });

  return [...perFile, ...checkIndex(root, names, policy), ...checkTemplate(root, policy)];
};
