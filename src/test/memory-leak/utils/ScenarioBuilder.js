class ScenarioBuilder {
  constructor(path) {
    this.path = path;
    this.beforeInitialPageLoad = async (page) => {
      await page.setExtraHTTPHeaders({
        [`aws-cf-cd-${process.env.REACT_APP_CONTINUOUS_DEPLOYMENT_HEADER_NAME}`]:
          process.env.REACT_APP_CONTINUOUS_DEPLOYMENT_HEADER_VALUE,
      });
    };
  }

  url() {
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.REACT_APP_PROD_CONTAINER_API_URL
        : process.env.REACT_APP_PROD_HOST_API_URL;
    return this.path ? `${baseUrl}${this.path}` : baseUrl;
  }

  createScenario(scenarioOptions) {
    return {
      url: this.url,
      beforeInitialPageLoad: this.beforeInitialPageLoad,
      ...scenarioOptions,
    };
  }
}

module.exports = ScenarioBuilder;
