/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';

const readFile = (filePath: string): string =>
  fs.readFileSync(path.resolve(__dirname, '..', '..', '..', filePath), 'utf-8');

describe('Mockoon readiness tooling contract', () => {
  it('uses a tcp wait-on probe with explicit readiness and failure output', () => {
    const makefile = readFile('Makefile');

    expect(makefile).toMatch(/MOCKOON_PORT\s+\?=\s+8080/);
    expect(makefile).toContain(
      'wait-for-mockoon: ## Wait for the Mockoon API mock to be ready on port $(MOCKOON_PORT).'
    );
    expect(makefile).toContain(
      '@echo "Waiting for Mockoon API mock to be ready on tcp:$(WEBSITE_DOMAIN):$(MOCKOON_PORT)..."'
    );
    expect(makefile).toContain(
      '$(BIN_DIR)/wait-on tcp:$(WEBSITE_DOMAIN):$(MOCKOON_PORT) --timeout 60000 > /dev/null 2>&1 || \\'
    );
    expect(makefile).not.toContain(
      '$(BUNX) wait-on tcp:$(WEBSITE_DOMAIN):$(MOCKOON_PORT) --timeout 60000'
    );
    expect(makefile).toContain(`printf '\\n✅ Mockoon API mock is ready!\\n'`);
    expect(makefile).toContain(
      `printf '\\n❌ Mockoon API mock failed to become ready on tcp:$(WEBSITE_DOMAIN):$(MOCKOON_PORT)\\n'`
    );
    expect(makefile).toContain('exit 1');
  });
});
