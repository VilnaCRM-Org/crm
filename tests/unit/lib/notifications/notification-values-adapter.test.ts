import notificationValuesAdapter from '@/lib/notifications/notification-values-adapter';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

describe('NotificationValuesAdapter', () => {
  it('nests each named value under replace, the interpolation variables of i18next', () => {
    expect(
      notificationValuesAdapter.options({
        items: [
          { name: 'provider', value: 'Google' },
          { name: 'window', value: '02:00' },
        ],
      })
    ).toEqual({ replace: { provider: 'Google', window: '02:00' } });
  });

  it('gives an empty replace for a message without values', () => {
    expect(notificationValuesAdapter.options(undefined)).toEqual({ replace: {} });
    expect(notificationValuesAdapter.options({ items: [] })).toEqual({ replace: {} });
  });

  it.each([
    ['lng', 'en'],
    ['ns', 'missing'],
    ['returnDetails', 'true'],
  ])('keeps a value named %s from changing how the message is translated', (name, value) => {
    const i18n = createSettingsLocaleI18n('uk', ['en']);

    expect(
      i18n.t(
        'settings.social.linked',
        notificationValuesAdapter.options({
          items: [
            { name, value },
            { name: 'provider', value: 'Google' },
          ],
        })
      )
    ).toBe('Ви успішно підключили Google');
  });
});
