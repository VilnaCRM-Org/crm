import { check } from 'k6';

export default class Utils {
  constructor(endpointName = null) {
    const config = this.getConfig();
    const { protocol, host, port, params } = config;

    // Use endpoint-specific host/port if available
    let finalHost = host;
    let finalPort = port;

    if (endpointName && config.endpoints && config.endpoints[endpointName]) {
      const endpointConfig = config.endpoints[endpointName];
      if (endpointConfig.host) finalHost = endpointConfig.host;
      if (endpointConfig.port) finalPort = endpointConfig.port;
    }

    this.baseUrl = `${protocol}://${finalHost}${finalPort ? `:${finalPort}` : ''}`;
    this.params = params;
  }

  getConfig() {
    try {
      return JSON.parse(open('config.json'));
    } catch (error) {
      try {
        return JSON.parse(open('config.json.dist'));
      } catch (fallbackError) {
        throw new Error(
          `Failed to load both config.json and config.json.dist: ${fallbackError.message}`
        );
      }
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  getParams() {
    return this.params;
  }

  shouldSkipScenario(variable) {
    if (typeof variable !== 'string' || !variable) {
      throw new Error('variable must be a non-empty string');
    }
    return __ENV[variable] === 'true' || __ENV[variable] === '1';
  }

  checkResponse(response, checkName, checkFunction) {
    if (!response) {
      throw new Error('response is required');
    }
    if (!checkName || typeof checkName !== 'string') {
      throw new Error('checkName must be a non-empty string');
    }
    if (typeof checkFunction !== 'function') {
      throw new Error('checkFunction must be a function');
    }

    check(response, {
      [checkName]: (res) => checkFunction(res),
    });
  }
}
