import AppConfigSchema from '@/config/runtime/app-config-schema';

describe('AppConfigSchema notificationStyle', () => {
  it.each(['toast', 'inline', 'bell'])('accepts %s', (style) => {
    expect(AppConfigSchema.safeParse({ notificationStyle: style }).success).toBe(true);
  });

  it('accepts an absent key', () => {
    expect(AppConfigSchema.safeParse({}).success).toBe(true);
  });

  it.each(['Toast', 'banner', '', 5])('rejects %j', (value) => {
    expect(AppConfigSchema.safeParse({ notificationStyle: value }).success).toBe(false);
  });

  it('keeps the parsed style on the result', () => {
    expect(AppConfigSchema.parse({ notificationStyle: 'inline' }).notificationStyle).toBe('inline');
  });
});
