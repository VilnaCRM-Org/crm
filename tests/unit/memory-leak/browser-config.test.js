const { configureBrowser } = require('../../memory-leak/utils/browser-config');

function fixture() {
  return {
    args: ['--no-sandbox', '--enable-webgl', '--js-flags="--no-move-object-start"'],
    headless: true,
    devtools: false,
    protocolTimeout: 300000,
    executablePath: '/usr/bin/chromium-browser',
  };
}

describe('controlled MemLab GPU candidate', () => {
  it.each(['', '0', 'true', 'false', '01', ' 1', 1])('does nothing for %p', (value) => {
    const config = fixture();
    const original = fixture();
    const args = config.args;
    configureBrowser(config, value);
    expect(config).toEqual(original);
    expect(config.args).toBe(args);
  });

  it('appends only disable-gpu, preserving all settings and existing arguments', () => {
    const config = fixture();
    const expected = { ...fixture(), args: [...fixture().args, '--disable-gpu'] };
    configureBrowser(config, '1');
    expect(config).toEqual(expected);
    configureBrowser(config, '1');
    expect(config).toEqual(expected);
  });

  it('does not duplicate or reorder an existing disable-gpu flag', () => {
    const config = fixture();
    config.args.unshift('--disable-gpu');
    const original = [...config.args];
    configureBrowser(config, '1');
    expect(config.args).toEqual(original);
  });

  it('initializes omitted arguments only when enabled', () => {
    const config = { protocolTimeout: 12345 };
    configureBrowser(config, '0');
    expect(config).toEqual({ protocolTimeout: 12345 });
    configureBrowser(config, '1');
    expect(config).toEqual({ protocolTimeout: 12345, args: ['--disable-gpu'] });
  });

  it('defaults off with no environment value and uses the explicit environment opt-in', () => {
    const previous = process.env.MEMLAB_DISABLE_GPU;
    try {
      delete process.env.MEMLAB_DISABLE_GPU;
      const config = fixture();
      configureBrowser(config);
      expect(config).toEqual(fixture());
      process.env.MEMLAB_DISABLE_GPU = '1';
      configureBrowser(config);
      expect(config.args).toEqual([...fixture().args, '--disable-gpu']);
    } finally {
      if (previous === undefined) delete process.env.MEMLAB_DISABLE_GPU;
      else process.env.MEMLAB_DISABLE_GPU = previous;
    }
  });
});
