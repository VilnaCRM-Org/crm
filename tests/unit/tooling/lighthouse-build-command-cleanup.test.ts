/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */

import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const makefilePath = path.join(repoRoot, 'Makefile');

describe('Lighthouse build-command cleanup contract', () => {
  it('drops LHCI_BUILD_CMD wiring but keeps the direct LHCI desktop/mobile commands', () => {
    const makefileSource = fs.readFileSync(makefilePath, 'utf8');

    expect(makefileSource).not.toContain('LHCI_BUILD_CMD');
    expect(makefileSource).toContain(
      'LHCI_DESKTOP           \t\t= $(LHCI) $(LHCI_CONFIG_DESKTOP) ' +
        '$(LHCI_CHROME_PATH_ARG) $(LHCI_CHROME_FLAGS_ARG)'
    );
    expect(makefileSource).toContain(
      'LHCI_MOBILE            \t\t= $(LHCI) $(LHCI_CONFIG_MOBILE) ' +
        '$(LHCI_CHROME_PATH_ARG) $(LHCI_CHROME_FLAGS_ARG)'
    );
  });
});
