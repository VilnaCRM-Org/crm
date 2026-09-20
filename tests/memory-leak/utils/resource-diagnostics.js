const fs = require('node:fs');
const path = require('node:path');

const logger = require('./logger');

function executableName(executable) {
  const name = path.basename(executable);
  return /^[a-zA-Z0-9._-]{1,64}$/.test(name) ? name : 'redacted';
}

function launchSnapshot(configuration) {
  try {
    const launch = configuration();
    const args = Array.isArray(launch.args) ? launch.args : [];
    const executable = launch.executablePath || process.env.PUPPETEER_EXECUTABLE_PATH;
    return {
      configuredExecutable: executable ? executableName(executable) : 'default',
      headless: [true, false, 'shell'].includes(launch.headless) ? launch.headless : null,
      devtools: typeof launch.devtools === 'boolean' ? launch.devtools : null,
      protocolTimeout: Number.isFinite(launch.protocolTimeout) ? launch.protocolTimeout : null,
      flags: Object.fromEntries(
        ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--enable-webgl'].map(
          (flag) => [flag, args.includes(flag)]
        )
      ),
    };
  } catch {
    return null;
  }
}

function readText(fileSystem, file) {
  try {
    return fileSystem.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function numericValue(value) {
  const text = value.trim();
  if (text === 'max') return text;
  return /^\d+$/.test(text) ? Number(text) : null;
}

function counters(text, names) {
  const values = Object.fromEntries(
    text
      .trim()
      .split('\n')
      .map((line) => line.split(/\s+/))
  );
  return Object.fromEntries(names.map((name) => [name, numericValue(values[name] || '')]));
}

function processSnapshot(fileSystem) {
  let entries;
  try {
    entries = fileSystem.readdirSync('/proc').filter((entry) => /^\d+$/.test(entry));
  } catch {
    return { unavailable: true };
  }
  const processes = entries.slice(0, 256).map((entry) => {
    const status = readText(fileSystem, `/proc/${entry}/status`);
    const field = (name) => status.match(new RegExp(`^${name}:\\s+(\\d+)`, 'm'))?.[1];
    let executable = 'unavailable';
    try {
      executable = executableName(fileSystem.readlinkSync(`/proc/${entry}/exe`));
    } catch {
      // Processes can exit between enumeration and sampling, including zombies.
    }
    return {
      pid: Number(entry),
      ppid: numericValue(field('PPid') || ''),
      state: status.match(/^State:\s+([A-Z])\b/m)?.[1] || null,
      rssKiB: numericValue(field('VmRSS') || ''),
      executable,
    };
  });
  return { processes, truncated: entries.length > processes.length };
}

function collectResourceSnapshot({
  fileSystem = fs,
  configuration = () => require('@memlab/api').config.puppeteerConfig,
} = {}) {
  const read = (file) => readText(fileSystem, `/sys/fs/cgroup/${file}`);
  const v2 = read('cgroup.controllers') !== '' || read('memory.current') !== '';
  const memory = v2 ? '' : 'memory/';
  const pids = v2 ? '' : 'pids/';
  let sharedMemory = null;
  try {
    const stat = fileSystem.statfsSync('/dev/shm');
    sharedMemory = {
      totalBytes: stat.blocks * stat.bsize,
      usedBytes: (stat.blocks - stat.bfree) * stat.bsize,
      availableBytes: stat.bavail * stat.bsize,
    };
  } catch {
    // Missing mounts or permissions must not affect the memory leak verdict.
  }
  return {
    ...processSnapshot(fileSystem),
    launch: launchSnapshot(configuration),
    cgroup: {
      scope: 'container-visible',
      version: v2 ? 2 : 1,
      memoryCurrent: numericValue(read(`${memory}memory.${v2 ? 'current' : 'usage_in_bytes'}`)),
      memoryMax: numericValue(read(`${memory}memory.${v2 ? 'max' : 'limit_in_bytes'}`)),
      memoryEvents: counters(read('memory.events'), ['low', 'high', 'max', 'oom', 'oom_kill']),
      memoryFailCount: v2 ? null : numericValue(read('memory/memory.failcnt')),
      cpu: counters(read(v2 ? 'cpu.stat' : 'cpu/cpu.stat'), [
        'nr_periods',
        'nr_throttled',
        v2 ? 'throttled_usec' : 'throttled_time',
      ]),
      pidsCurrent: numericValue(read(`${pids}pids.current`)),
      pidsMax: numericValue(read(`${pids}pids.max`)),
    },
    sharedMemory,
  };
}

function startResourceDiagnostics({
  enabled = process.env.MEMLAB_DIAGNOSTICS === '1',
  sample = collectResourceSnapshot,
  log = logger.info,
  timers = globalThis,
} = {}) {
  if (!enabled) return () => {};
  const emit = (phase) => {
    try {
      log(
        `[memlab-diagnostics] ${JSON.stringify({
          time: new Date().toISOString(),
          phase,
          workerPid: process.pid,
          ...sample(),
        })}`
      );
    } catch {
      // Never print raw errors: paths/error text may contain sensitive arguments.
    }
  };
  emit('before-run');
  const timer = timers.setInterval(() => emit('during-run'), 15000);
  timer.unref();
  let stopped = false;
  return (phase = 'after-cleanup') => {
    if (stopped) return;
    stopped = true;
    timers.clearInterval(timer);
    emit(phase);
  };
}

module.exports = { collectResourceSnapshot, startResourceDiagnostics };
