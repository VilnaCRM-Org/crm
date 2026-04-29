import mobileConfig from '../../../lighthouse/lighthouserc.mobile';

describe('lighthouse mobile config', () => {
  it('keeps the mobile performance threshold strict enough to catch regressions', () => {
    expect(mobileConfig.ci.assert.assertions['categories:performance']).toEqual([
      'error',
      { minScore: 0.85, aggregationMethod: 'median-run' },
    ]);
  });
});
