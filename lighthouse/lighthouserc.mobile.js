const { pages } = require('./constants');

module.exports = {
  ci: {
    collect: {
      url: pages,
      numberOfRuns: 3,
      settings: {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 360,
          height: 640,
          deviceScaleFactor: 3,
          disabled: false,
        },
        emulatedUserAgent:
          'Mozilla/5.0 (Linux; Android 10; Pixel 5) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/144.0.7559.59 Mobile Safari/537.36',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: 'lhci-reports-mobile',
    },
    assert: {
      assertions: {
        // 0.85 (vs 0.9 desktop): the deferred-DI refactor lifted the /authentication
        // median to 0.88 in CI (probe run 27332237906); 0.85 keeps headroom for the
        // mobile network/CPU simulation variance between runners.
        'categories:performance': ['error', { minScore: 0.85, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:bestPractices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
  },
};
