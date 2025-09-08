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

    this.thresholds[`http_req_duration{test_type:${testType}}`] = ['p(99)<' + config.threshold];
    this.thresholds[`checks{scenario:${testType}}`] = ['rate>0.99'];
    return this;
  }

  build() {
    return this.thresholds;
  }
}
