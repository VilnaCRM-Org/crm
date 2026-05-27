function resolveMaxVUs(config) {
  if (config.maxVUs != null) {
    return config.maxVUs;
  }
  if (config.maxVus != null) {
    return config.maxVus;
  }
  return config.vus;
}

export default class ScenariosBuilder {
  constructor() {
    this.scenarios = {};
  }

  addSmokeScenario(smokeConfig) {
    this.scenarios.smoke = {
      executor: 'constant-arrival-rate',
      rate: smokeConfig.rps,
      timeUnit: '1s',
      duration: smokeConfig.duration + 's',
      preAllocatedVUs: smokeConfig.vus,
      maxVUs: resolveMaxVUs(smokeConfig),
      tags: { test_type: 'smoke' },
    };

    return this;
  }

  addAverageScenario(averageConfig, startTime) {
    return this.addDefaultScenario('average', averageConfig, startTime);
  }

  addStressScenario(stressConfig, startTime) {
    return this.addDefaultScenario('stress', stressConfig, startTime);
  }

  addSpikeScenario(spikeConfig, startTime) {
    const scenario = {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: spikeConfig.vus,
      maxVUs: resolveMaxVUs(spikeConfig),
      stages: [
        { target: spikeConfig.rps, duration: spikeConfig.duration.rise + 's' },
        { target: 0, duration: spikeConfig.duration.fall + 's' },
      ],
      tags: { test_type: 'spike' },
    };
    if (startTime != null) {
      scenario.startTime = startTime + 's';
    }
    this.scenarios.spike = scenario;
    return this;
  }

  addDefaultScenario(scenarioName, config, startTime) {
    const scenario = {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: config.vus,
      maxVUs: resolveMaxVUs(config),
      stages: [
        { target: config.rps, duration: config.duration.rise + 's' },
        { target: config.rps, duration: config.duration.plateau + 's' },
        { target: 0, duration: config.duration.fall + 's' },
      ],
      tags: { test_type: scenarioName },
    };
    if (startTime != null) {
      scenario.startTime = startTime + 's';
    }
    this.scenarios[scenarioName] = scenario;
    return this;
  }

  build() {
    return this.scenarios;
  }
}
