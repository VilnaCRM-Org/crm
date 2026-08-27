import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import AppConfigSchema from '@/config/runtime/app-config-schema';
import { APP_CONFIG_ELEMENT_ID } from '@/config/runtime/app-config-source';
import featureFlagService from '@/config/runtime/feature-flag-service';

const BLOCK_PATTERN = new RegExp(
  `<script id="${APP_CONFIG_ELEMENT_ID}" type="application/json">([\\s\\S]*?)</script>`
);

function readCommittedConfigBlock(): string {
  const html = readFileSync(join(process.cwd(), 'public', 'index.html'), 'utf8');
  const block = BLOCK_PATTERN.exec(html)?.[1];

  if (block === undefined) {
    throw new Error(`public/index.html is missing the #${APP_CONFIG_ELEMENT_ID} block.`);
  }

  return block;
}

describe('committed runtime configuration defaults (public/index.html)', () => {
  const block = readCommittedConfigBlock();
  const parsed: unknown = JSON.parse(block);

  it('ships a JSON object that satisfies the runtime configuration schema', () => {
    const result = AppConfigSchema.safeParse(parsed);

    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);
  });

  it('declares exactly the flags the feature-flag service knows about', () => {
    const values = AppConfigSchema.parse(parsed);

    // Sorted on both sides: the contract is set equality, so declaring the same flags in a
    // different order than FEATURE_FLAG_DEFAULTS is valid and must not fail here.
    expect(Object.keys(values.flags ?? {}).sort()).toEqual([...featureFlagService.names()].sort());
  });
});
