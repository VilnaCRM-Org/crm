const runtimeConsole = Reflect.get(globalThis, 'console') as Console;

const RTL_ACT_DEPRECATION = [
  'Warning: `ReactDOMTestUtils.act` is deprecated in favor of `React.act`.',
  'Import `act` from `react` instead of `react-dom/test-utils`.',
].join(' ');

describe('console gate fixture', () => {
  it('passes when the message is on the allowlist', () => {
    console.error(RTL_ACT_DEPRECATION);

    expect(true).toBe(true);
  });

  it('passes when the level is outside the gated error and warn scope', () => {
    runtimeConsole.log('an intentional log line');
    runtimeConsole.info('an intentional info line');

    expect(true).toBe(true);
  });
});
