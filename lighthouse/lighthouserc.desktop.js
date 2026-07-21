const { pages } = require('./constants');
const { lighthouse: lh } = require('../config/performance-budget.json');

module.exports = {
  ci: {
    collect: {
      url: pages,
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: 'lhci-reports-desktop',
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:bestPractices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        // Resource-weight budgets (issue #117): fail CI on large byte regressions
        // independent of the category scores above, which are preserved unchanged.
        // Values sourced from config/performance-budget.json (single source of truth).
        'resource-summary:script:size': ['error', { maxNumericValue: lh.scriptSizeBytes }],
        'resource-summary:total:size': ['error', { maxNumericValue: lh.totalSizeBytes }],
        'resource-summary:script:count': ['warn', { maxNumericValue: lh.scriptCountWarn }],
      },
    },
  },
};
