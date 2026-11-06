import createAppShellLocaleI18n from './create-app-shell-locale-i18n';
import createLocaleI18n from './create-locale-i18n';

describe('createAppShellLocaleI18n', () => {
  it('resolves the shell copy in uk', () => {
    const { t } = createAppShellLocaleI18n('uk');

    expect(t('app_shell.navigation.label')).toBe('Основна навігація');
    expect(t('app_shell.items.boards')).toBe('Дошки');
    expect(t('app_shell.items.billing')).toBe('Білінг');
    expect(t('app_shell.sign_out')).toBe('Вийти');
    expect(t('app_shell.search.placeholder')).toBe('Щось шукаєте?');
    expect(t('app_shell.settings_group.expand')).toBe('Розгорнути налаштування');
  });

  it('resolves the shell copy in en', () => {
    const { t } = createAppShellLocaleI18n('en');

    expect(t('app_shell.navigation.label')).toBe('Main navigation');
    expect(t('app_shell.items.boards')).toBe('Boards');
    expect(t('app_shell.items.billing')).toBe('Billing');
    expect(t('app_shell.sign_out')).toBe('Sign out');
    expect(t('app_shell.search.placeholder')).toBe('Looking for something?');
    expect(t('app_shell.settings_group.expand')).toBe('Expand Settings');
  });

  it('keeps the merged catalogs, so an eager key still resolves beside the shell copy', () => {
    const { t } = createAppShellLocaleI18n('en');

    expect(t('error_boundary.title')).toBe('Something went wrong');
  });

  it('declines the uk counts through the CLDR one, few and many forms', () => {
    const { t } = createAppShellLocaleI18n('uk');

    expect(t('app_shell.notifications.count', { count: 1 })).toBe('1 сповіщення');
    expect(t('app_shell.notifications.count', { count: 3 })).toBe('3 сповіщення');
    expect(t('app_shell.notifications.count', { count: 5 })).toBe('5 сповіщень');
    expect(t('app_shell.tasks.count', { count: 1 })).toBe('1 завдання');
    expect(t('app_shell.tasks.count', { count: 4 })).toBe('4 завдання');
    expect(t('app_shell.tasks.count', { count: 8 })).toBe('8 завдань');
  });

  it('declines the en counts through the one and other forms', () => {
    const { t } = createAppShellLocaleI18n('en');

    expect(t('app_shell.notifications.count', { count: 1 })).toBe('1 notification');
    expect(t('app_shell.notifications.count', { count: 8 })).toBe('8 notifications');
    expect(t('app_shell.tasks.count', { count: 1 })).toBe('1 task');
    expect(t('app_shell.tasks.count', { count: 8 })).toBe('8 tasks');
  });

  it('leaves a shell key raw without the helper, because the catalog is lazy', () => {
    const { t } = createLocaleI18n('uk');

    expect(t('app_shell.items.boards')).toBe('app_shell.items.boards');
  });
});
