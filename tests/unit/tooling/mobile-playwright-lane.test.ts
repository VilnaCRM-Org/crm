// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const listFiles = (relativePath: string): string[] =>
  fs.readdirSync(path.join(projectRoot, relativePath));

const playwrightConfig = readFile('playwright.config.ts');

const projectSource = (name: string): string => {
  const start = playwrightConfig.indexOf(`name: '${name}',`);
  expect(start).toBeGreaterThan(-1);
  const next = playwrightConfig.indexOf("name: '", start + 1);
  return playwrightConfig.slice(start, next === -1 ? playwrightConfig.length : next);
};

const DESKTOP_PROJECTS = ['chromium', 'firefox', 'webkit'];
const MOBILE_PROJECTS = ['mobile-chrome', 'mobile-safari'];

describe('mobile device emulation lane', () => {
  it('declares both mobile projects from built-in device descriptors', () => {
    expect(projectSource('mobile-chrome')).toContain("...devices['Pixel 7']");
    expect(projectSource('mobile-safari')).toContain("...devices['iPhone 14']");
  });

  it('defines the lane globs the projects are scoped by', () => {
    expect(playwrightConfig).toContain("const MOBILE_LANE = '**/mobile/**/*.spec.ts';");
    expect(playwrightConfig).toContain("const DESKTOP_LANE_IGNORE = '**/mobile/**';");
  });

  it('keeps the desktop projects out of the mobile lane', () => {
    DESKTOP_PROJECTS.forEach((name) => {
      expect(projectSource(name)).toContain('testIgnore: DESKTOP_LANE_IGNORE,');
    });
    expect(projectSource('chromium-dev')).toContain('testIgnore: DESKTOP_LANE_IGNORE,');
  });

  it('keeps the mobile projects inside the mobile lane only', () => {
    MOBILE_PROJECTS.forEach((name) => {
      expect(projectSource(name)).toContain('testMatch: MOBILE_LANE,');
    });
  });

  it('limits the dev-mode mobile project to the touch E2E lane', () => {
    const devMobile = projectSource('mobile-chrome-dev');

    expect(devMobile).toContain("testMatch: '**/e2e/mobile/**/*.spec.ts',");
    expect(devMobile).toContain("...devices['Pixel 7']");
  });
});

describe('mobile touch specs', () => {
  const specs = listFiles('tests/e2e/mobile').filter((file) => file.endsWith('.spec.ts'));

  it('ships at least one touch spec', () => {
    expect(specs.length).toBeGreaterThan(0);
  });

  it('drives interactions with tap(), never click()', () => {
    specs.forEach((spec) => {
      const source = readFile(path.join('tests/e2e/mobile', spec));

      expect(source).toContain('.tap()');
      expect(source).not.toContain('.click(');
    });
  });
});

describe('mobile visual baselines', () => {
  const snapshotDir = 'tests/visual/mobile/auth.spec.ts-snapshots';

  it('captures at the emulated device pixel ratio', () => {
    const helper = readFile('tests/visual/mobile/take-mobile-snapshot.ts');

    expect(helper).toContain("scale: 'device'");
    expect(helper).not.toContain('setViewportSize');
  });

  it('records one baseline per page per mobile project', () => {
    const baselines = listFiles(snapshotDir);

    MOBILE_PROJECTS.forEach((project) => {
      expect(baselines).toContain(`uk-sign-in-${project}-linux.png`);
      expect(baselines).toContain(`uk-sign-up-${project}-linux.png`);
    });
  });

  it('records no desktop-project baseline in the mobile lane', () => {
    listFiles(snapshotDir).forEach((baseline) => {
      expect(MOBILE_PROJECTS.some((project) => baseline.includes(`-${project}-`))).toBe(true);
    });
  });
});
