import * as Sentry from '@sentry/react';

import { SentryClient } from '@/services/observability/sentry-client';

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

const DSN = 'https://key@sentry.io/1';

describe('SentryClient capture buffering is gated on the DSN', () => {
  afterEach(() => {
    delete process.env.REACT_APP_SENTRY_DSN;
  });

  it('never replays a capture taken while the DSN was absent', async () => {
    const client = new SentryClient();
    const dropped = new Error('captured while telemetry was disabled');

    client.captureException(dropped, { requestId: 'req-dropped' });
    expect(Sentry.captureException).not.toHaveBeenCalled();

    process.env.REACT_APP_SENTRY_DSN = DSN;
    await client.init();

    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('replays only the captures taken after the DSN was configured', async () => {
    const client = new SentryClient();
    const dropped = new Error('captured while telemetry was disabled');
    const buffered = new Error('captured once telemetry was enabled');

    client.captureException(dropped);
    process.env.REACT_APP_SENTRY_DSN = DSN;
    client.captureException(buffered);

    await client.init();

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(buffered, undefined);
  });
});
