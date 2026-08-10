const fs = require('node:fs');

const MOTIF_SEPARATOR = ' | ';

class LeakAllowlist {
  constructor(entries) {
    this.entries = entries;
  }

  match(leakText) {
    const motifs = leakText.split(MOTIF_SEPARATOR);
    const waivers = motifs.map((motif) => this.entries.find((entry) => entry.trace === motif));

    return waivers.every(Boolean) ? waivers : null;
  }
}

class LeakAllowlistLoader {
  load(filePath) {
    const parsed = this.parse(filePath);
    const entries = parsed.leaks;

    if (!Array.isArray(entries)) {
      throw new Error(`Leak allowlist ${filePath} must declare a "leaks" array.`);
    }

    entries.forEach((entry, index) => this.assertEntry(entry, index, filePath));

    return new LeakAllowlist(entries);
  }

  parse(filePath) {
    let raw;
    try {
      raw = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Leak allowlist ${filePath} is unreadable: ${error.message}`);
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new Error(`Leak allowlist ${filePath} is not valid JSON: ${error.message}`);
    }
  }

  assertEntry(entry, index, filePath) {
    this.assertField(entry, 'trace', index, filePath);
    this.assertField(entry, 'reason', index, filePath);
  }

  assertField(entry, field, index, filePath) {
    const value = entry?.[field];

    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(
        `Leak allowlist ${filePath} entry #${index} needs a non-empty "${field}" string.`
      );
    }
  }
}

class LeakTraceSummarizer {
  summarize(leak) {
    const serialized = JSON.stringify(leak) ?? '';
    const detached = [...new Set(this.detachedNodes(serialized))].sort();

    return detached.length > 0 ? detached.join(MOTIF_SEPARATOR) : serialized.slice(0, 500);
  }

  detachedNodes(serialized) {
    const matches = serialized.match(/Detached (?:[^"\\]|\\.)*/g) ?? [];

    return matches.map((entry) =>
      entry
        .replace(/\\"/g, '"')
        .replace(/\](?:\(native\))?(?:\s*@\d+.*)?$/, '')
        .trim()
    );
  }
}

class LeakReporter {
  constructor(allowlist, logger, summarizer = new LeakTraceSummarizer()) {
    this.allowlist = allowlist;
    this.logger = logger;
    this.summarizer = summarizer;
  }

  report(leaks, scenarioName) {
    let unexpected = 0;

    for (const leak of leaks) {
      const leakText = this.summarizer.summarize(leak);
      const waivers = this.allowlist.match(leakText);

      if (waivers) {
        const reasons = waivers.map((entry) => `${entry.trace}: ${entry.reason}`).join('; ');

        this.logger.warn(`⚠️  Allowlisted leak in scenario ${scenarioName} (${reasons})`);
      } else {
        unexpected += 1;
        this.logger.error(`✗ Memory leak in scenario ${scenarioName}:\n${leakText}`);
      }
    }

    return unexpected;
  }
}

module.exports = { LeakAllowlist, LeakAllowlistLoader, LeakReporter, LeakTraceSummarizer };
