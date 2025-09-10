import ScenariosBuilder from './scenariosBuilder.js';
import ThresholdsBuilder from './thresholdsBuilder.js';

export default class ScenarioUtils {
  constructor(utils, scenarioName) {
    this.utils = utils;
    this.config = utils.getConfig();

    const requiredScenarios = ['smoke', 'average', 'stress', 'spike'];
    const missing = requiredScenarios.filter(
      (type) => !this.config.endpoints[scenarioName] || !this.config.endpoints[scenarioName][type]
    );
    if (missing.length > 0) {
      throw new Error(`Missing scenario configurations: ${missing.join(', ')}`);
    }

    this.smokeConfig = this.config.endpoints[scenarioName].smoke;
    this.averageConfig = this.config.endpoints[scenarioName].average;
    this.stressConfig = this.config.endpoints[scenarioName].stress;
    this.spikeConfig = this.config.endpoints[scenarioName].spike;
    this.setupTimeout = `${Number(this.config.endpoints[scenarioName].setupTimeoutInMinutes || 2)}m`;
    this.delay = Number(this.config.delayBetweenScenarios || 0);
    this.averageTestStartTime = 0;
    this.stressTestStartTime = 0;
    this.spikeTestStartTime = 0;
  }

  getOptions() {
    return {
      setupTimeout: this.setupTimeout,
      insecureSkipTLSVerify: true,
      scenarios: this.getScenarios(),
      thresholds: this.getThresholds(),
    };
  }

  getScenarios() {
    const scenariosBuilder = new ScenariosBuilder();
    const scenarioFunctions = {
      run_smoke: this.addSmokeScenario.bind(this, scenariosBuilder),
      run_average: this.addAverageScenario.bind(this, scenariosBuilder),
      run_stress: this.addStressScenario.bind(this, scenariosBuilder),
      run_spike: this.addSpikeScenario.bind(this, scenariosBuilder),
    };

    for (const key in scenarioFunctions) {
      if (!this.utils.shouldSkipScenario(key)) scenarioFunctions[key]();
    }
    return scenariosBuilder.build();
  }

  addSmokeScenario(scenariosBuilder) {
    scenariosBuilder.addSmokeScenario(this.smokeConfig);
    this.averageTestStartTime = Number(this.smokeConfig.duration) + this.delay;
  }

  addAverageScenario(scenariosBuilder) {
    scenariosBuilder.addAverageScenario(this.averageConfig, this.averageTestStartTime);
    this.stressTestStartTime =
      this.averageTestStartTime +
      Number(this.averageConfig.duration.rise) +
      Number(this.averageConfig.duration.plateau) +
      Number(this.averageConfig.duration.fall) +
      this.delay;
  }

  addStressScenario(scenariosBuilder) {
    scenariosBuilder.addStressScenario(this.stressConfig, this.stressTestStartTime);
    this.spikeTestStartTime =
      this.stressTestStartTime +
      Number(this.stressConfig.duration.rise) +
      Number(this.stressConfig.duration.plateau) +
      Number(this.stressConfig.duration.fall) +
      this.delay;
  }

  addSpikeScenario(scenariosBuilder) {
    scenariosBuilder.addSpikeScenario(this.spikeConfig, this.spikeTestStartTime);
  }

  getThresholds() {
    const thresholdsBuilder = new ThresholdsBuilder();
    const thresholdConfigs = {
      run_smoke: { name: 'smoke', config: this.smokeConfig },
      run_average: { name: 'average', config: this.averageConfig },
      run_stress: { name: 'stress', config: this.stressConfig },
      run_spike: { name: 'spike', config: this.spikeConfig },
    };

    for (const key in thresholdConfigs) {
      if (!this.utils.shouldSkipScenario(key)) {
        const { name, config } = thresholdConfigs[key];
        thresholdsBuilder.addThreshold(name, config);
      }
    }

    return thresholdsBuilder.build();
  }
}
