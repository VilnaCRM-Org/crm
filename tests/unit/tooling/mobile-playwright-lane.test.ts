// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const listFiles = (relativePath: string): string[] =>
  fs.readdirSync(path.join(projectRoot, relativePath));

const listFilesRecursively = (relativePath: string): string[] =>
  fs
    .readdirSync(path.join(projectRoot, relativePath), { recursive: true, encoding: 'utf8' })
    .filter((entry) => fs.statSync(path.join(projectRoot, relativePath, entry)).isFile())
    .map((entry) => path.join(relativePath, entry));

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
  const laneFiles = listFilesRecursively('tests/e2e/mobile').filter((file) => file.endsWith('.ts'));
  const specs = laneFiles.filter((file) => file.endsWith('.spec.ts'));

  it('ships at least one touch spec', () => {
    expect(specs.length).toBeGreaterThan(0);
  });

  it('drives every spec with tap()', () => {
    specs.forEach((spec) => {
      expect(readFile(spec)).toContain('.tap()');
    });
  });

  it('never falls back to click() anywhere in the lane, helpers included', () => {
    laneFiles.forEach((file) => {
      expect(readFile(file)).not.toContain('.click(');
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

  it('never reaches for the viewport-resizing desktop helper', () => {
    listFilesRecursively('tests/visual/mobile')
      .filter((file) => file.endsWith('.ts'))
      .forEach((file) => {
        const source = readFile(file);

        expect(source).not.toContain('take-visual-snapshot');
        expect(source).not.toContain('setViewportSize');
      });
  });

  it('records exactly one baseline per page per mobile project, and nothing else', () => {
    const expected = MOBILE_PROJECTS.flatMap((project) => [
      `uk-sign-in-${project}-linux.png`,
      `uk-sign-up-${project}-linux.png`,
    ]).sort();

    expect(listFiles(snapshotDir).sort()).toEqual(expected);
  });
});
