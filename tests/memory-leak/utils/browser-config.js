function configureBrowser(puppeteerConfig, disableGpu = process.env.MEMLAB_DISABLE_GPU) {
  if (disableGpu !== '1') return;

  const args = puppeteerConfig.args || [];
  if (!args.includes('--disable-gpu')) args.push('--disable-gpu');
  puppeteerConfig.args = args;
}

module.exports = { configureBrowser };
