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

    // Response time threshold (p99)
    this.thresholds[`http_req_duration{scenario:${testType}}`] = [`p(99)<${config.threshold}`];

    // Check pass rate threshold - adjusted based on test type
    // Smoke/Average: 95% pass rate (tight control under normal conditions)
    // Stress: 90% pass rate (system under heavy load)
    // Spike: 85% pass rate (sudden traffic can cause more failures)
    const checkPassRate = this.getCheckPassRate(testType);
    this.thresholds[`checks{scenario:${testType}}`] = [`rate>${checkPassRate}`];

    // HTTP failure rate threshold - scenario-specific following industry best practices:
    // Smoke: < 2% (basic functionality verification)
    // Average: < 5% (normal load conditions)
    // Stress: < 15% (pushed beyond normal capacity, some failures expected)
    // Spike: < 20% (sudden traffic bursts, temporary failures acceptable)
    const errorRateThreshold = this.getErrorRateThreshold(testType);
    this.thresholds[`http_req_failed{scenario:${testType}}`] = [`rate<${errorRateThreshold}`];

    // Request count threshold (at least some requests must be made)
    this.thresholds[`http_reqs{scenario:${testType}}`] = ['count>0'];

    return this;
  }

  /**
   * Get error rate threshold based on test type
   * Checks for endpoint-specific overrides first, then falls back to defaults
   * Industry best practices for load testing:
   * - Smoke: Minimal failures expected (< 2%)
   * - Average: Low failure rate under normal load (< 5%)
   * - Stress: Moderate failures acceptable when pushing limits (< 15%)
   * - Spike: Higher failures acceptable during traffic bursts (< 20%)
   */
  getErrorRateThreshold(testType) {
    // Check for endpoint-specific override
    if (this.endpointThresholds?.errorRate?.[testType] !== undefined) {
      return this.endpointThresholds.errorRate[testType];
    }

    // Default thresholds
    const thresholds = {
      smoke: 0.02, // 2%
      average: 0.05, // 5%
      stress: 0.15, // 15%
      spike: 0.2, // 20%
    };
    return thresholds[testType] || 0.05; // Default to 5% if unknown type
  }

  /**
   * Get check pass rate based on test type
   * Checks for endpoint-specific overrides first, then falls back to defaults
   * More lenient for stress and spike scenarios
   */
  getCheckPassRate(testType) {
    // Check for endpoint-specific override
    if (this.endpointThresholds?.checkPassRate?.[testType] !== undefined) {
      return this.endpointThresholds.checkPassRate[testType];
    }

    // Default pass rates
    const passRates = {
      smoke: 0.95, // 95%
      average: 0.95, // 95%
      stress: 0.9, // 90%
      spike: 0.85, // 85%
    };
    return passRates[testType] || 0.95; // Default to 95% if unknown type
  }

  build() {
    return this.thresholds;
  }
}
