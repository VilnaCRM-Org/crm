import { readFileSync } from 'node:fs';

export interface AdrPolicy {
  directory: string;
  indexFile: string;
  templateFile: string;
  filePattern: string;
  titlePattern: string;
  requiredMetadata: string[];
  datePattern: string;
  allowedStatuses: string[];
  requiredSections: string[];
}

export interface ModuleDocsPolicy {
  roots: string[];
  requiredFile: string;
}

export interface DocsScanPolicy {
  roots: string[];
  ignoredPaths: string[];
  ignoredFiles: string[];
}

export interface CommandReferencePolicy {
  makefile: string;
  packageJson: string;
}

export interface ArchitectureDriftPolicy {
  significantPaths: string[];
  significantManifest: string;
  manifestKeys: string[];
  adrPathPrefix: string;
  escapeHatchMarker: string;
  escapeHatchLabel: string;
}

export interface DocsPolicy {
  adr: AdrPolicy;
  moduleDocs: ModuleDocsPolicy;
  docs: DocsScanPolicy;
  commandReferences: CommandReferencePolicy;
  architectureDrift: ArchitectureDriftPolicy;
}

export interface DocsViolation {
  rule: string;
  subject: string;
  message: string;
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string' && entry.length > 0);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const SHAPE: Record<keyof DocsPolicy, Record<string, 'string' | 'string[]'>> = {
  adr: {
    directory: 'string',
    indexFile: 'string',
    templateFile: 'string',
    filePattern: 'string',
    titlePattern: 'string',
    requiredMetadata: 'string[]',
    datePattern: 'string',
    allowedStatuses: 'string[]',
    requiredSections: 'string[]',
  },
  moduleDocs: { roots: 'string[]', requiredFile: 'string' },
  docs: { roots: 'string[]', ignoredPaths: 'string[]', ignoredFiles: 'string[]' },
  commandReferences: { makefile: 'string', packageJson: 'string' },
  architectureDrift: {
    significantPaths: 'string[]',
    significantManifest: 'string',
    manifestKeys: 'string[]',
    adrPathPrefix: 'string',
    escapeHatchMarker: 'string',
    escapeHatchLabel: 'string',
  },
};

/**
 * Fail fast rather than let a malformed policy silently disable the documentation gates —
 * an unreadable policy would make every check vacuously pass (issue #122).
 */
export const parseDocsPolicy = (raw: unknown, source: string): DocsPolicy => {
  const reject = (reason: string): never => {
    throw new Error(`${source}: ${reason}. Refusing to run with unenforced documentation gates.`);
  };

  if (typeof raw !== 'object' || raw === null) {
    return reject('policy must be a JSON object');
  }
  const candidate = raw as Record<string, unknown>;

  for (const [section, fields] of Object.entries(SHAPE)) {
    const block = candidate[section];
    if (typeof block !== 'object' || block === null) {
      reject(`"${section}" must be an object`);
    }

    const values = block as Record<string, unknown>;
    for (const [field, kind] of Object.entries(fields)) {
      const valid =
        kind === 'string' ? isNonEmptyString(values[field]) : isStringArray(values[field]);
      if (!valid) {
        const expectation = kind === 'string' ? 'a non-empty string' : 'a non-empty string array';
        reject(`"${section}.${field}" must be ${expectation}`);
      }
    }
  }

  const policy = candidate as unknown as DocsPolicy;

  // Compile the patterns here so a malformed one fails with the policy's own refusal message
  // rather than as a raw SyntaxError from inside whichever gate happens to run first.
  for (const field of ['filePattern', 'titlePattern', 'datePattern'] as const) {
    try {
      RegExp(policy.adr[field]);
    } catch (error) {
      reject(`"adr.${field}" is not a valid regular expression: ${String(error)}`);
    }
  }

  return policy;
};

export const loadDocsPolicy = (path: string): DocsPolicy => {
  const raw = readFileSync(path, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${path} is not valid JSON: ${String(error)}`);
  }
  return parseDocsPolicy(parsed, path);
};
