function hasValidScenarioHooks(scenario) {
  const hasUrl = typeof scenario.url === 'function' || typeof scenario.url === 'string';
  const hasAction = typeof scenario.action === 'function';
  const hasBack = typeof scenario.back === 'undefined' || typeof scenario.back === 'function';

  return hasUrl && hasAction && hasBack;
}

module.exports = {
  hasValidScenarioHooks,
};
