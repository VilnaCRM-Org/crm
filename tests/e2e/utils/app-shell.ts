import type { Locator, Page } from '@playwright/test';

import { expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';

const escapePattern = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const shellText = {
  navigation: t('app_shell.navigation.label'),
  signOut: t('app_shell.sign_out'),
  settings: t('app_shell.items.settings'),
  openMenu: t('app_shell.drawer.open'),
  closeMenu: t('app_shell.drawer.close'),
  collapse: t('app_shell.sidebar.collapse'),
  expand: t('app_shell.sidebar.expand'),
  groupCollapse: t('app_shell.settings_group.collapse'),
  groupExpand: t('app_shell.settings_group.expand'),
  unavailable: t('app_shell.unavailable'),
  search: t('app_shell.search.label'),
  notifications: t('app_shell.notifications.label'),
  tasks: t('app_shell.tasks.label'),
  userMenu: t('user_menu.button'),
  profileItem: t('user_menu.my_profile'),
  settingsItem: t('user_menu.settings'),
  signOutItem: t('user_menu.sign_out'),
};

export const sidebarOf = (page: Page): Locator =>
  page.getByRole('navigation', { name: shellText.navigation });

export const sidebarSignOutOf = (page: Page): Locator =>
  sidebarOf(page).getByRole('button', { name: shellText.signOut, exact: true });

export const sidebarSettingsOf = (page: Page): Locator =>
  sidebarOf(page).getByRole('link', { name: shellText.settings, exact: true });

export const chipOf = (page: Page): Locator =>
  page
    .getByRole('banner')
    .getByRole('button', { name: new RegExp(`${escapePattern(shellText.userMenu)}$`) });

export const userMenuOf = (page: Page): Locator => page.getByRole('menu');

export const menuItemOf = (page: Page, name: string): Locator =>
  userMenuOf(page).getByRole('menuitem', { name, exact: true });

export const drawerOf = (page: Page): Locator =>
  page.getByRole('dialog', { name: shellText.navigation });

export const burgerOf = (page: Page): Locator =>
  page.getByRole('banner').getByRole('button', { name: shellText.openMenu, exact: true });

export async function expectShellReady(page: Page): Promise<void> {
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(chipOf(page)).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
}

export async function openChipMenu(page: Page): Promise<void> {
  await chipOf(page).click();
  await expect(userMenuOf(page)).toBeVisible();
}

export async function openDrawer(page: Page): Promise<void> {
  await burgerOf(page).click();
  await expect(drawerOf(page)).toBeVisible();
}

const VISITED_MARKER = 'pw-visited';

export const visitedColourOf = (link: Locator): Promise<string> =>
  link.evaluate((element, marker): string => {
    const visitedRules = [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
      .filter((rule) => rule.selectorText.includes(':visited'))
      .map((rule) => rule.cssText.replaceAll(':visited', `.${marker}`));
    const style = document.createElement('style');
    style.textContent = visitedRules.join('\n');
    document.head.append(style);
    element.classList.add(marker);
    const colour = getComputedStyle(element).color;
    element.classList.remove(marker);
    style.remove();

    return colour;
  }, VISITED_MARKER);
