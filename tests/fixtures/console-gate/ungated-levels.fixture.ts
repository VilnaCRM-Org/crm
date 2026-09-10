const runtimeConsole = Reflect.get(globalThis, 'console') as Console;

describe('console gate fixture', () => {
  it('passes when the level is outside the gated error and warn scope', () => {
    runtimeConsole.log('an intentional log line');
    runtimeConsole.info('an intentional info line');

    expect(true).toBe(true);
  });
});
