import notificationValuesAdapter from '@/lib/notifications/notification-values-adapter';

describe('NotificationValuesAdapter', () => {
  it('turns each named value into an interpolation option', () => {
    expect(
      notificationValuesAdapter.options({
        items: [
          { name: 'provider', value: 'Google' },
          { name: 'window', value: '02:00' },
        ],
      })
    ).toEqual({ provider: 'Google', window: '02:00' });
  });

  it('gives no options for a message without values', () => {
    expect(notificationValuesAdapter.options(undefined)).toEqual({});
    expect(notificationValuesAdapter.options({ items: [] })).toEqual({});
  });
});
