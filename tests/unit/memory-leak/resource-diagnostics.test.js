const {
  collectResourceSnapshot,
  startResourceDiagnostics,
} = require('../../memory-leak/utils/resource-diagnostics');

function diagnosticHarness() {
  const timer = { unref: jest.fn() };
  return {
    timer,
    sample: jest.fn(() => ({ processes: [] })),
    log: jest.fn(),
    timers: { setInterval: jest.fn(() => timer), clearInterval: jest.fn() },
  };
}

describe('opt-in MemLab resource diagnostics', () => {
  it('does not sample, log, or schedule when disabled', () => {
    const harness = diagnosticHarness();
    startResourceDiagnostics({ ...harness, enabled: false })();
    expect(harness.sample).not.toHaveBeenCalled();
    expect(harness.log).not.toHaveBeenCalled();
    expect(harness.timers.setInterval).not.toHaveBeenCalled();
  });

  it('requires the exact environment opt-in value', () => {
    const previous = process.env.MEMLAB_DIAGNOSTICS;
    try {
      for (const value of ['', '0', 'true']) {
        process.env.MEMLAB_DIAGNOSTICS = value;
        const harness = diagnosticHarness();
        startResourceDiagnostics(harness)();
        expect(harness.sample).not.toHaveBeenCalled();
      }
      process.env.MEMLAB_DIAGNOSTICS = '1';
      const harness = diagnosticHarness();
      startResourceDiagnostics(harness)();
      expect(harness.sample).toHaveBeenCalledTimes(2);
    } finally {
      if (previous === undefined) delete process.env.MEMLAB_DIAGNOSTICS;
      else process.env.MEMLAB_DIAGNOSTICS = previous;
    }
  });

  it('timestamps before/during/after samples and unrefs and clears the timer once', () => {
    const harness = diagnosticHarness();
    const stop = startResourceDiagnostics({ ...harness, enabled: true });
    expect(harness.timers.setInterval).toHaveBeenCalledWith(expect.any(Function), 15000);
    expect(harness.timer.unref).toHaveBeenCalledTimes(1);
    harness.timers.setInterval.mock.calls[0][0]();
    stop();
    stop();
    expect(harness.timers.clearInterval).toHaveBeenCalledTimes(1);
    expect(harness.timers.clearInterval).toHaveBeenCalledWith(harness.timer);
    const records = harness.log.mock.calls.map(([line]) => JSON.parse(line.split('] ')[1]));
    expect(records.map(({ phase }) => phase)).toEqual([
      'before-run',
      'during-run',
      'after-cleanup',
    ]);
    for (const record of records) {
      expect(Number.isNaN(Date.parse(record.time))).toBe(false);
      expect(record.workerPid).toBe(process.pid);
    }
  });

  it('clears on failure and never propagates sampling or logging errors', () => {
    const harness = diagnosticHarness();
    harness.sample.mockImplementationOnce(() => {
      throw new Error('private sample error');
    });
    const stop = startResourceDiagnostics({ ...harness, enabled: true });
    harness.log.mockImplementation(() => {
      throw new Error('private logger error');
    });
    expect(() => stop('after-failure')).not.toThrow();
    expect(harness.timers.clearInterval).toHaveBeenCalledWith(harness.timer);
    expect(harness.log).toHaveBeenCalledWith(expect.stringContaining('after-failure'));
    expect(harness.log.mock.calls.flat().join()).not.toContain('private');
  });
});

describe('sanitized Linux resource snapshots', () => {
  function fixture(extra = {}) {
    const files = {
      '/proc/22/status': 'Name:\tprivate-secret\nPPid:\t1\nState:\tS (sleeping)\nVmRSS:\t123 kB',
      '/sys/fs/cgroup/cgroup.controllers': 'cpu memory pids',
      '/sys/fs/cgroup/memory.current': '8192',
      '/sys/fs/cgroup/memory.max': 'max',
      '/sys/fs/cgroup/memory.events': 'oom 2\noom_kill 1\nsecret private-secret',
      '/sys/fs/cgroup/cpu.stat': 'nr_periods 4\nnr_throttled 2\nthrottled_usec 300',
      '/sys/fs/cgroup/pids.current': '12',
      '/sys/fs/cgroup/pids.max': '128',
      ...extra,
    };
    return {
      readFileSync: jest.fn((file) => files[file] || ''),
      readdirSync: jest.fn(() => ['self', '22']),
      readlinkSync: jest.fn(() => '/private-secret/bin/chromium'),
      statfsSync: jest.fn(() => ({ blocks: 100, bfree: 80, bavail: 75, bsize: 4096 })),
    };
  }

  it('logs launch settings without raw arguments, URLs, or executable directories', () => {
    const result = collectResourceSnapshot({
      fileSystem: fixture(),
      configuration: () => ({
        executablePath: '/private-secret/bin/chromium',
        headless: true,
        devtools: false,
        protocolTimeout: 300000,
        args: [
          '--no-sandbox',
          '--enable-webgl',
          '--token=private-secret',
          'https://private-secret',
        ],
        env: { TOKEN: 'private-secret' },
        browserURL: 'https://private-secret',
      }),
    });
    expect(result.launch).toEqual({
      configuredExecutable: 'chromium',
      headless: true,
      devtools: false,
      protocolTimeout: 300000,
      flags: {
        '--no-sandbox': true,
        '--enable-webgl': true,
        '--disable-gpu': false,
        '--disable-dev-shm-usage': false,
      },
    });
    expect(JSON.stringify(result)).not.toContain('private-secret');
  });

  it('reads only safe metadata and allowlisted numeric counters, never argv or environment', () => {
    const fileSystem = fixture();
    const result = collectResourceSnapshot({ fileSystem });
    expect(result.processes).toEqual([
      { pid: 22, ppid: 1, state: 'S', rssKiB: 123, executable: 'chromium' },
    ]);
    expect(result.cgroup).toMatchObject({
      version: 2,
      scope: 'container-visible',
      memoryCurrent: 8192,
      memoryMax: 'max',
      memoryEvents: { oom: 2, oom_kill: 1 },
      pidsCurrent: 12,
      pidsMax: 128,
      cpu: { nr_periods: 4, nr_throttled: 2, throttled_usec: 300 },
    });
    expect(result.sharedMemory).toEqual({
      totalBytes: 409600,
      usedBytes: 81920,
      availableBytes: 307200,
    });
    expect(JSON.stringify(result)).not.toContain('private-secret');
    expect(fileSystem.readFileSync.mock.calls.map(([file]) => file)).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/cmdline|environ/)])
    );
  });

  it('supports conventional cgroup v1 paths without inventing missing metrics', () => {
    const fileSystem = fixture({
      '/sys/fs/cgroup/cgroup.controllers': '',
      '/sys/fs/cgroup/memory.current': '',
      '/sys/fs/cgroup/memory/memory.usage_in_bytes': '4096',
      '/sys/fs/cgroup/memory/memory.limit_in_bytes': '8192',
      '/sys/fs/cgroup/memory/memory.failcnt': '3',
      '/sys/fs/cgroup/cpu/cpu.stat': 'nr_throttled 2\nthrottled_time 900',
    });
    expect(collectResourceSnapshot({ fileSystem }).cgroup).toMatchObject({
      version: 1,
      memoryCurrent: 4096,
      memoryMax: 8192,
      memoryFailCount: 3,
      cpu: { nr_periods: null, nr_throttled: 2, throttled_time: 900 },
      pidsCurrent: null,
      pidsMax: null,
    });
  });

  it('recognizes a cgroup v2 leaf with no delegated controllers', () => {
    const fileSystem = fixture({ '/sys/fs/cgroup/cgroup.controllers': '' });
    expect(collectResourceSnapshot({ fileSystem }).cgroup).toMatchObject({
      version: 2,
      memoryCurrent: 8192,
    });
  });

  it('redacts unsafe executable names and tolerates unavailable files and mounts', () => {
    const fileSystem = fixture();
    fileSystem.readlinkSync.mockReturnValue('/bin/chrome --token=private-secret');
    fileSystem.statfsSync.mockImplementation(() => {
      throw new Error('private-secret');
    });
    let result = collectResourceSnapshot({ fileSystem });
    expect(result.processes[0].executable).toBe('redacted');
    expect(result.sharedMemory).toBeNull();
    fileSystem.readdirSync.mockImplementation(() => {
      throw new Error('private-secret');
    });
    fileSystem.readFileSync.mockImplementation(() => {
      throw new Error('private-secret');
    });
    result = collectResourceSnapshot({ fileSystem });
    expect(result.unavailable).toBe(true);
    expect(result.cgroup.memoryCurrent).toBeNull();
    expect(JSON.stringify(result)).not.toContain('private-secret');
  });
});
