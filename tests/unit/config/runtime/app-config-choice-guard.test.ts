import appConfigChoiceGuard, {
  APP_CONFIG_CHOICE_KEYS,
} from '@/config/runtime/app-config-choice-guard';
import loadIsolated from '@tests/unit/utils/isolated-module';

describe('appConfigChoiceGuard', () => {
  it('returns undefined for an absent value', () => {
    expect(appConfigChoiceGuard.choice('notificationStyle', undefined)).toBeUndefined();
  });

  it.each(['toast', 'inline', 'bell'])('returns the allowed value %s unchanged', (style) => {
    expect(appConfigChoiceGuard.choice('notificationStyle', style)).toBe(style);
  });

  it.each(['Toast', 'banner', 'toast,bell', 'inline ', ''])(
    'throws for the value %j naming the setting, the value and the allowed values',
    (value) => {
      expect(() => appConfigChoiceGuard.choice('notificationStyle', value)).toThrow(
        new Error(`notificationStyle must be one of toast, inline, bell, got "${value}".`)
      );
    }
  );

  it('lists the one choice key the source passes through the guard', () => {
    expect([...APP_CONFIG_CHOICE_KEYS]).toEqual(['notificationStyle']);
    expect(Object.isFrozen(APP_CONFIG_CHOICE_KEYS)).toBe(true);
  });

  it('freezes its choice table in a freshly loaded module', async () => {
    const guard = await loadIsolated(
      async () => (await import('@/config/runtime/app-config-choice-guard')).default
    );

    expect(Object.isFrozen(Reflect.get(guard, 'choices'))).toBe(true);
    expect(guard.choice('notificationStyle', 'bell')).toBe('bell');
  });
});
