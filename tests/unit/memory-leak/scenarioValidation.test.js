const { hasValidScenarioHooks } = require('../../memory-leak/utils/scenarioValidation');

describe('hasValidScenarioHooks', () => {
  it('accepts scenarios without a back hook', () => {
    expect(
      hasValidScenarioHooks({
        url: 'http://example.com',
        action: () => {},
      })
    ).toBe(true);
  });

  it('rejects scenarios when back is present but not a function', () => {
    expect(
      hasValidScenarioHooks({
        url: 'http://example.com',
        action: () => {},
        back: true,
      })
    ).toBe(false);
  });
});
