const { baseUrl } = require('./constants');

module.exports = {
  ci: {
    collect: {
      url: [baseUrl],
      numberOfRuns: 3,
      settings: {
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
        screenEmulation: {
          mobile: true,
          width: 360,
          height: 640,
          deviceScaleFactor: 3,
          disabled: false,
        },
        emulatedUserAgent:
          'Mozilla/5.0 (Linux; Android 10; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: 'lhci-reports-mobile',
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:bestPractices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
  },
};
