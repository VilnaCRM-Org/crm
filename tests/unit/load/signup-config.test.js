const fs = require('fs');
const path = require('path');

describe('signup load configuration', () => {
  it('targets the signup API fixture service instead of the frontend container', () => {
    const configPath = path.resolve(__dirname, '../../load/config.json.dist');
    let config;

    if (!fs.existsSync(configPath)) {
      throw new Error(`Expected signup load config to exist at ${configPath}`);
    }

    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to read or parse signup load config at ${configPath}: ${error.message}`);
    }

    expect(config.endpoints.signup).toMatchObject({
      host: 'mockoon',
      port: '8080',
    });
  });
});
