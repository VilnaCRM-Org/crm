import type ExponentialBackoffStrategy from '@/services/resilience/exponential-backoff-strategy';
import loadIsolated from '@tests/unit/utils/isolated-module';

type StrategyModule = typeof import('@/services/resilience/exponential-backoff-strategy');

// The base and cap are module-level literals, so the module is loaded inside each test to keep a
// mutant in them reachable by an assertion (issue #171).
const loadStrategy = async (): Promise<ExponentialBackoffStrategy> => {
  const { default: Strategy } = await loadIsolated<StrategyModule>(
    () => import('@/services/resilience/exponential-backoff-strategy')
  );
  return new Strategy();
};

describe('ExponentialBackoffStrategy', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    [1, 125],
    [2, 250],
    [3, 500],
    [4, 1_000],
  ])('attempt %i waits at least half of the exponential window (%i ms)', async (attempt, min) => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const strategy = await loadStrategy();

    expect(strategy.delayMs(attempt)).toBe(min);
  });

  it.each([
    [1, 250],
    [2, 500],
    [3, 1_000],
    [4, 2_000],
  ])('attempt %i waits at most the full exponential window (%i ms)', async (attempt, max) => {
    jest.spyOn(Math, 'random').mockReturnValue(1);
    const strategy = await loadStrategy();

    expect(strategy.delayMs(attempt)).toBe(max);
  });

  it('caps the window at 2 s however high the attempt count grows', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(1);
    const strategy = await loadStrategy();

    expect(strategy.delayMs(5)).toBe(2_000);
    expect(strategy.delayMs(12)).toBe(2_000);
  });

  it('jitters inside the upper half of the window and rounds to whole milliseconds', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const strategy = await loadStrategy();

    expect(strategy.delayMs(1)).toBe(188);
    expect(strategy.delayMs(3)).toBe(750);
  });

  it('draws a fresh random value per call so consecutive delays differ', async () => {
    const random = jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(1);
    const strategy = await loadStrategy();

    expect(strategy.delayMs(1)).toBe(125);
    expect(strategy.delayMs(1)).toBe(250);
    expect(random).toHaveBeenCalledTimes(2);
  });
});
