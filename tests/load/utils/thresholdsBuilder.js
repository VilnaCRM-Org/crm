export default class ThresholdsBuilder {
  constructor() {
    this.thresholds = {};
  }

  addThreshold(testType, config) {
    if (!testType || typeof testType !== 'string') {
      throw new Error('testType must be a non-empty string');
    }
    if (!config || typeof config.threshold === 'undefined') {
      throw new Error('config must contain a threshold property');
    }
    const thr = Number(config.threshold);
    if (!Number.isFinite(thr) || thr <= 0) {
      throw new Error('threshold must be a positive number (milliseconds)');
    }

    // Response time threshold (p99)
    this.thresholds[`http_req_duration{scenario:${testType}}`] = [`p(99)<${config.threshold}`];

    // Check pass rate threshold (95% must pass - realistic for load testing)
    this.thresholds[`checks{scenario:${testType}}`] = ['rate>0.95'];

    // Error rate threshold (less than 5% failed requests - allows for failures under extreme load)
    this.thresholds[`http_req_failed{scenario:${testType}}`] = ['rate<0.05'];

    // Request count threshold (at least some requests must be made)
    this.thresholds[`http_reqs{scenario:${testType}}`] = ['count>0'];

    return this;
  }

  build() {
    return this.thresholds;
  }
}
