import notificationStyleConfig from '@/config/runtime/notification-style-config';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

describe('notificationStyleConfig', () => {
  beforeEach(() => clearConfigBlock());

  afterAll(() => clearConfigBlock());

  it('is toast when there is no block', () => {
    expect(notificationStyleConfig.value()).toBe('toast');
  });

  it('is toast when the block omits the key', () => {
    writeConfigBlock(JSON.stringify({ flags: {} }));

    expect(notificationStyleConfig.value()).toBe('toast');
  });

  it.each(['toast', 'inline', 'bell'])('reads %s from the block', (style) => {
    writeConfigBlock(JSON.stringify({ notificationStyle: style }));

    expect(notificationStyleConfig.value()).toBe(style);
  });

  it('trims the stored text before choosing', () => {
    writeConfigBlock(JSON.stringify({ notificationStyle: ' bell ' }));

    expect(notificationStyleConfig.value()).toBe('bell');
  });

  it('falls back to toast for a value that is not text', () => {
    writeConfigBlock(JSON.stringify({ notificationStyle: 5 }));

    expect(notificationStyleConfig.value()).toBe('toast');
  });

  it('throws for a value outside the three styles instead of guessing', () => {
    writeConfigBlock(JSON.stringify({ notificationStyle: 'Toast' }));

    expect(() => notificationStyleConfig.value()).toThrow(
      'notificationStyle must be one of toast, inline, bell, got "Toast".'
    );
  });
});
