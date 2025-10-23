export default class ThresholdsBuilder {
  constructor(endpointThresholds = null) {
    this.thresholds = {};
    this.endpointThresholds = endpointThresholds;
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

    this.thresholds[`http_req_duration{scenario:${testType}}`] = [`p(99)<${config.threshold}`];

    const checkPassRate = this.getCheckPassRate(testType);
    this.thresholds[`checks{scenario:${testType}}`] = [`rate>${checkPassRate}`];

    const errorRateThreshold = this.getErrorRateThreshold(testType);
    this.thresholds[`http_req_failed{scenario:${testType}}`] = [`rate<${errorRateThreshold}`];

    this.thresholds[`http_reqs{scenario:${testType}}`] = ['count>0'];

    return this;
  }

  getErrorRateThreshold(testType) {
    if (this.endpointThresholds?.errorRate?.[testType] !== undefined) {
      return this.endpointThresholds.errorRate[testType];
    }

    const thresholds = {
      smoke: 0.02,
      average: 0.05,
      stress: 0.15,
      spike: 0.2,
    };
    return thresholds[testType] || 0.05;
  }

  getCheckPassRate(testType) {
    if (this.endpointThresholds?.checkPassRate?.[testType] !== undefined) {
      return this.endpointThresholds.checkPassRate[testType];
    }

    const passRates = {
      smoke: 0.95,
      average: 0.95,
      stress: 0.9,
      spike: 0.85,
    };
    return passRates[testType] || 0.95;
  }

  build() {
    return this.thresholds;
  }
}
