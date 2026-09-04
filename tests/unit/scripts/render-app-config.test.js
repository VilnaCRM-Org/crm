const fs = require('fs');
const path = require('path');

const { buildHttpUrl } = require('@tests/builders');

const {
  CONFIG_ELEMENT_ID,
  FLAG_ENV_PREFIX,
  renderAppConfig,
  toCamelCase,
} = require('../../../scripts/render-app-config');

const projectRoot = path.resolve(__dirname, '../../..');

const API_BASE_URL_VAR = 'APP_CONFIG_API_BASE_URL';
const GRAPHQL_URL_VAR = 'APP_CONFIG_GRAPHQL_URL';
const FORGOT_PASSWORD_VAR = `${FLAG_ENV_PREFIX}FORGOT_PASSWORD`;
const UNKNOWN_FLAG_VAR = `${FLAG_ENV_PREFIX}DARK_MODE`;

const blockPattern = () =>
  new RegExp(`(<script[^>]*\\bid="${CONFIG_ELEMENT_ID}"[^>]*>)([\\s\\S]*?)(</script>)`);

const shell = (body, openTag = `<script id="${CONFIG_ELEMENT_ID}" type="application/json">`) =>
  [
    '<!doctype html>',
    '<html lang="en">',
    '  <head>',
    '    <title>VilnaCRM</title>',
    `    ${openTag}`,
    `      ${body}`,
    '    </script>',
    '  </head>',
    '  <body><div id="root"></div></body>',
    '</html>',
  ].join('\n');

const defaultShell = () => shell('{ "flags": { "forgotPassword": false } }');

const readBlockBody = (html) => {
  const match = blockPattern().exec(html);

  if (!match) {
    throw new Error('the rendered HTML no longer contains a runtime configuration block');
  }

  return match[2];
};

const readBlockConfig = (html) => JSON.parse(readBlockBody(html));

const stripBlockBody = (html) =>
  html.replace(blockPattern(), (_full, open, _body, close) => `${open}${close}`);

describe('scripts/render-app-config.js', () => {
  describe('renderAppConfig — block rewriting', () => {
    it('replaces the committed block with compact JSON', () => {
      const rendered = renderAppConfig(defaultShell(), {});

      expect(readBlockBody(rendered)).toBe('{"flags":{"forgotPassword":false}}');
    });

    it('leaves every byte outside the block untouched', () => {
      const html = defaultShell();
      const rendered = renderAppConfig(html, { [GRAPHQL_URL_VAR]: buildHttpUrl('/graphql') });

      expect(stripBlockBody(rendered)).toBe(stripBlockBody(html));
    });

    it('matches the block regardless of attribute order', () => {
      const html = shell(
        '{ "flags": { "forgotPassword": false } }',
        `<script type="application/json" id="${CONFIG_ELEMENT_ID}">`
      );

      const rendered = renderAppConfig(html, { [FORGOT_PASSWORD_VAR]: 'true' });

      expect(readBlockConfig(rendered)).toEqual({ flags: { forgotPassword: true } });
    });

    it('throws when the HTML shell has no runtime configuration block', () => {
      expect(() => renderAppConfig('<!doctype html><html><head></head></html>', {})).toThrow(
        /no <script id="app-runtime-config"> block found/
      );
    });
  });

  describe('renderAppConfig — existing block contents', () => {
    it('throws when the block does not contain valid JSON', () => {
      expect(() => renderAppConfig(shell('{ not json }'), {})).toThrow(
        /does not contain valid JSON/
      );
    });

    it.each([
      ['an array', '[]'],
      ['null', 'null'],
      ['a number', '42'],
      ['a string', '"nope"'],
    ])('throws when the block contains %s instead of a JSON object', (_label, body) => {
      expect(() => renderAppConfig(shell(body), {})).toThrow(/must contain a JSON object/);
    });

    it('normalises a block with no flags key to an empty flags object', () => {
      const rendered = renderAppConfig(shell('{}'), {});

      expect(readBlockBody(rendered)).toBe('{"flags":{}}');
    });

    it('normalises a non-object flags value to an empty flags object', () => {
      const rendered = renderAppConfig(shell('{ "flags": "nope" }'), {});

      expect(readBlockBody(rendered)).toBe('{"flags":{}}');
    });
  });

  describe('renderAppConfig — URL settings', () => {
    it('applies both URL settings', () => {
      const apiBaseUrl = buildHttpUrl('/api');
      const graphqlUrl = buildHttpUrl('/graphql');

      const rendered = renderAppConfig(defaultShell(), {
        [API_BASE_URL_VAR]: apiBaseUrl,
        [GRAPHQL_URL_VAR]: graphqlUrl,
      });

      expect(readBlockConfig(rendered)).toEqual({
        flags: { forgotPassword: false },
        apiBaseUrl,
        graphqlUrl,
      });
    });

    it('trims surrounding whitespace from a URL setting', () => {
      const graphqlUrl = buildHttpUrl('/graphql');

      const rendered = renderAppConfig(defaultShell(), {
        [GRAPHQL_URL_VAR]: `  ${graphqlUrl}\n`,
      });

      expect(readBlockConfig(rendered).graphqlUrl).toBe(graphqlUrl);
    });

    it('ignores URL settings that are unset', () => {
      const rendered = renderAppConfig(defaultShell(), {});

      expect(readBlockConfig(rendered)).not.toHaveProperty('apiBaseUrl');
      expect(readBlockConfig(rendered)).not.toHaveProperty('graphqlUrl');
    });

    it('ignores a whitespace-only URL setting', () => {
      const rendered = renderAppConfig(defaultShell(), { [API_BASE_URL_VAR]: '   \t ' });

      expect(readBlockConfig(rendered)).not.toHaveProperty('apiBaseUrl');
    });

    it.each([
      ['a bare host', 'example.com/graphql'],
      ['a relative path', '/graphql'],
      ['empty-looking punctuation', '://'],
    ])('rejects %s as a URL setting', (_label, value) => {
      expect(() => renderAppConfig(defaultShell(), { [GRAPHQL_URL_VAR]: value })).toThrow(
        /must be an absolute URL/
      );
    });

    it.each([
      ['ftp', 'ftp://files.example.com/graphql'],
      ['javascript', 'javascript:alert(1)'],
      ['file', 'file:///etc/passwd'],
    ])('rejects the %s scheme as a URL setting', (_label, value) => {
      expect(() => renderAppConfig(defaultShell(), { [API_BASE_URL_VAR]: value })).toThrow(
        /must use http or https/
      );
    });

    it('names the offending variable in a URL rejection', () => {
      expect(() => renderAppConfig(defaultShell(), { [GRAPHQL_URL_VAR]: 'nope' })).toThrow(
        new RegExp(`^${GRAPHQL_URL_VAR} must be an absolute URL, got "nope"\\.$`)
      );
    });
  });

  describe('renderAppConfig — feature flags', () => {
    it.each([
      ['true', true],
      ['false', false],
    ])('applies the flag value %s', (raw, expected) => {
      const rendered = renderAppConfig(defaultShell(), { [FORGOT_PASSWORD_VAR]: raw });

      expect(readBlockConfig(rendered).flags.forgotPassword).toBe(expected);
    });

    it.each([['TRUE'], ['1'], ['yes'], ['on'], ['False ']])('rejects %p as a flag value', (raw) => {
      expect(() => renderAppConfig(defaultShell(), { [FORGOT_PASSWORD_VAR]: raw })).toThrow(
        /must be exactly "true" or "false"/
      );
    });

    it('keeps the committed default when a flag variable is empty', () => {
      const rendered = renderAppConfig(defaultShell(), { [FORGOT_PASSWORD_VAR]: '   ' });

      expect(readBlockConfig(rendered).flags.forgotPassword).toBe(false);
    });

    it('rejects a flag variable naming a flag the committed block does not declare', () => {
      expect(() => renderAppConfig(defaultShell(), { [UNKNOWN_FLAG_VAR]: 'true' })).toThrow(
        /names unknown feature flag "darkMode"/
      );
    });

    it('lists the known flags when rejecting an unknown flag', () => {
      const html = shell('{ "flags": { "forgotPassword": false, "auditLog": true } }');

      expect(() => renderAppConfig(html, { [UNKNOWN_FLAG_VAR]: 'true' })).toThrow(
        /Known flags: auditLog, forgotPassword\./
      );
    });

    it('reports "(none)" when the committed block declares no flags at all', () => {
      expect(() => renderAppConfig(shell('{}'), { [UNKNOWN_FLAG_VAR]: 'false' })).toThrow(
        /Known flags: \(none\)\./
      );
    });

    it('ignores environment variables outside the flag prefix', () => {
      const rendered = renderAppConfig(defaultShell(), {
        PATH: '/usr/bin',
        NODE_ENV: 'production',
        APP_CONFIG_NOT_A_FLAG: 'true',
      });

      expect(readBlockConfig(rendered)).toEqual({ flags: { forgotPassword: false } });
    });
  });

  describe('toCamelCase', () => {
    it.each([
      ['FORGOT_PASSWORD', 'forgotPassword'],
      ['NEW_CHECKOUT_V2_BETA', 'newCheckoutV2Beta'],
      ['FLAG_2FA', 'flag2fa'],
      ['SINGLE', 'single'],
    ])('converts %s to %s', (input, expected) => {
      expect(toCamelCase(input)).toBe(expected);
    });
  });

  describe('renderAppConfig — injection and replacement safety', () => {
    it('escapes "<" so a value cannot terminate the script block', () => {
      const hostile = `${buildHttpUrl()}/</script><script>alert(1)</script>`;

      const rendered = renderAppConfig(defaultShell(), { [API_BASE_URL_VAR]: hostile });
      const body = readBlockBody(rendered);

      expect(body).not.toContain('<');
      expect(body).toContain('\\u003c/script>\\u003cscript>');
      expect(JSON.parse(body).apiBaseUrl).toBe(hostile);
    });

    it('leaves exactly one closing script tag for the block', () => {
      const hostile = `${buildHttpUrl()}/</script>`;

      const rendered = renderAppConfig(defaultShell(), { [GRAPHQL_URL_VAR]: hostile });

      expect(rendered.match(/<\/script>/g)).toHaveLength(1);
    });

    it('preserves regex replacement tokens in a value verbatim', () => {
      const tricky = `${buildHttpUrl()}/?a=$&b=$1c=$$d=$'`;

      const rendered = renderAppConfig(defaultShell(), { [API_BASE_URL_VAR]: tricky });

      expect(rendered).toContain('$&');
      expect(JSON.parse(readBlockBody(rendered)).apiBaseUrl).toBe(tricky);
    });
  });

  describe('renderAppConfig — idempotence', () => {
    it('is idempotent for the same environment', () => {
      const env = {
        [API_BASE_URL_VAR]: `${buildHttpUrl()}/?next=</script>&token=$&`,
        [GRAPHQL_URL_VAR]: buildHttpUrl('/graphql'),
        [FORGOT_PASSWORD_VAR]: 'true',
      };

      const once = renderAppConfig(defaultShell(), env);
      const twice = renderAppConfig(once, env);

      expect(twice).toBe(once);
    });
  });

  describe('renderAppConfig — the committed public/index.html shell', () => {
    // Every flag the shell declares must ship default-off (docs/feature-flags.md, stage 1), and
    // the renderer only accepts an APP_CONFIG_FLAG_* variable for a flag the block declares.
    const COMMITTED_FLAG_DEFAULTS = {
      forgotPassword: false,
      oauthProviders: false,
      rememberMe: false,
    };

    const committedShell = () =>
      fs.readFileSync(path.join(projectRoot, 'public', 'index.html'), 'utf8');

    it('renders the real shell without a rebuild', () => {
      const graphqlUrl = buildHttpUrl('/graphql');
      const html = committedShell();

      const rendered = renderAppConfig(html, {
        [GRAPHQL_URL_VAR]: graphqlUrl,
        [FORGOT_PASSWORD_VAR]: 'true',
      });

      expect(readBlockConfig(rendered)).toEqual({
        flags: { ...COMMITTED_FLAG_DEFAULTS, forgotPassword: true },
        graphqlUrl,
      });
      expect(stripBlockBody(rendered)).toBe(stripBlockBody(html));
    });

    it('declares every flag as a committed, default-off default', () => {
      const { flags } = readBlockConfig(committedShell());

      expect(flags).toEqual(COMMITTED_FLAG_DEFAULTS);
      expect(Object.values(flags)).not.toContain(true);
    });
  });
});
