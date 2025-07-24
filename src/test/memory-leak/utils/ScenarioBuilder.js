/**
 * ScenarioBuilder creates MemLab test scenarios with environment-aware configuration.
 * Handles URL generation, HTTP headers, and scenario composition for memory leak testing.
 */

require('dotenv').config();

class ScenarioBuilder {
  /**
   * Creates a new ScenarioBuilder instance.
   * @param {string} [path] - Optional path to append to the base URL
   */
  constructor(path) {
    this.path = path;
    const requiredEnvVars = [
      'REACT_APP_CONTINUOUS_DEPLOYMENT_HEADER_NAME',
      'REACT_APP_CONTINUOUS_DEPLOYMENT_HEADER_VALUE',
      'REACT_APP_PROD_CONTAINER_API_URL',
      'REACT_APP_PROD_HOST_API_URL',
    ];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
    this.beforeInitialPageLoad = async (page) => {
      try {
        const headerName = process.env.REACT_APP_CONTINUOUS_DEPLOYMENT_HEADER_NAME;
        const headerValue = process.env.REACT_APP_CONTINUOUS_DEPLOYMENT_HEADER_VALUE;

        await page.setExtraHTTPHeaders({
          [`aws-cf-cd-${headerName}`]: headerValue,
        });
      } catch (error) {
        throw new Error(
          `❌ Failed to set extra HTTP headers before initial page load: ${error.message}`
        );
      }
    };
  }

  url() {
    const requiredUrlEnvVars =
      process.env.NODE_ENV === 'production'
        ? ['REACT_APP_PROD_CONTAINER_API_URL']
        : ['REACT_APP_PROD_HOST_API_URL'];
    for (const envVar of requiredUrlEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable for URL generation: ${envVar}`);
      }
    }
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.REACT_APP_PROD_CONTAINER_API_URL
        : process.env.REACT_APP_PROD_HOST_API_URL;
    if (!baseUrl) {
      throw new Error('Failed to determine base URL from environment variables');
    }
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
