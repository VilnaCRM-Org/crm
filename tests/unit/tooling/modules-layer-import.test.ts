import modulesLayerImport from '@tests/unit/utils/modules-layer-import';

describe('modulesLayerImport (issue #362)', () => {
  it.each([
    ["import UserMenu from '@/modules/user';"],
    ['import { authActions } from "@auth";'],
    ["export { default } from '@/modules/user/features/settings';"],
    ["import '@/modules/user/features/settings/i18n';"],
    ["import('@/modules/user')"],
    ['import(/* webpackChunkName: "user-menu" */ \'@/modules/user\')'],
    [
      'import(\n  /* webpackChunkName: "user-menu",\n' +
        "     webpackPrefetch: true */\n  '@auth/stores'\n)",
    ],
    ["import(\n  // the user menu\n  '@/modules/user'\n)"],
    ["import /* side effect */ '@/modules/user/features/settings/i18n';"],
    ["import UserMenu from /* the menu */ '@/modules/user';"],
    ["export { default } from // the menu\n  '@auth';"],
    ["import /* lazy */ ('@/modules/user')"],
  ])('catches %s', (source) => {
    expect(source).toMatch(modulesLayerImport);
  });

  it.each([
    ["import UIButton from '@/components/ui-button';"],
    ["import('@/components/coming-soon')"],
    ["const label = 'see @/modules/user in the docs';"],
  ])('leaves %s alone', (source) => {
    expect(source).not.toMatch(modulesLayerImport);
  });

  it.each([['//x '], ['/*x*/ '], ['/* x */\n']])(
    'rejects a long run of %j comments with no specifier in linear time',
    (comment) => {
      const source = `import ${comment.repeat(40)}`;
      const start = performance.now();

      expect(source).not.toMatch(modulesLayerImport);
      expect(performance.now() - start).toBeLessThan(250);
    }
  );
});
