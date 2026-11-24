import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { type JSX, Suspense } from 'react';

import useRetryableChunk from '@/modules/user/features/notifications/hooks/use-retryable-chunk';
import type {
  NotificationChunkModule,
  NotificationChunkReporter,
  NotificationChunkSource,
} from '@/modules/user/features/notifications/types/components';

type Loader = NotificationChunkSource<object>;

interface HarnessProps {
  readonly loader: Loader;
  readonly report: NotificationChunkReporter;
  readonly attempt: number;
}

const failure = new Error('chunk');

const loaded: NotificationChunkModule<object> = { default: () => <p>loaded</p> };

const givenUp: NotificationChunkModule<object> = { default: () => <p>empty</p> };

const giveUp: Loader['load'] = async (report) => {
  await Promise.resolve();
  report('app-shell:notifications-history', failure);

  return givenUp;
};

const succeed: Loader['load'] = () => Promise.resolve(loaded);

const loaderOf = (...loads: Loader['load'][]): { readonly load: jest.Mock } => {
  const load = jest.fn<ReturnType<Loader['load']>, Parameters<Loader['load']>>();
  loads.forEach((each) => load.mockImplementationOnce(each));

  return { load };
};

function Harness({ loader, report, attempt }: HarnessProps): JSX.Element {
  const Chunk = useRetryableChunk({ loader, onChunkFailure: report, attempt });

  return (
    <Suspense fallback={<p>pending</p>}>
      <Chunk />
    </Suspense>
  );
}

describe('useRetryableChunk', () => {
  it('loads a chunk that succeeds once, whatever the attempts', async () => {
    const loader = loaderOf(succeed);
    const report = jest.fn();
    const { rerender } = render(<Harness loader={loader} report={report} attempt={0} />);
    expect(await screen.findByText('loaded')).toBeInTheDocument();

    rerender(<Harness loader={loader} report={report} attempt={1} />);

    expect(screen.getByText('loaded')).toBeInTheDocument();
    expect(loader.load).toHaveBeenCalledTimes(1);
    expect(report).not.toHaveBeenCalled();
  });

  it('reports a failure and waits for the next attempt', async () => {
    const loader = loaderOf(giveUp);
    const report = jest.fn();
    const { rerender } = render(<Harness loader={loader} report={report} attempt={0} />);
    expect(await screen.findByText('empty')).toBeInTheDocument();

    rerender(<Harness loader={loader} report={report} attempt={0} />);

    expect(loader.load).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith('app-shell:notifications-history', failure);
  });

  it('loads again on the attempt after a failure and keeps what that brought', async () => {
    const loader = loaderOf(giveUp, succeed);
    const report = jest.fn();
    const { rerender } = render(<Harness loader={loader} report={report} attempt={0} />);
    await screen.findByText('empty');

    rerender(<Harness loader={loader} report={report} attempt={1} />);
    expect(await screen.findByText('loaded')).toBeInTheDocument();
    rerender(<Harness loader={loader} report={report} attempt={2} />);

    expect(screen.getByText('loaded')).toBeInTheDocument();
    expect(loader.load).toHaveBeenCalledTimes(2);
  });

  it('retries through the latest loader and the latest reporter', async () => {
    const first = loaderOf(giveUp);
    const second = loaderOf(giveUp);
    const stale = jest.fn();
    const report = jest.fn();
    const { rerender } = render(<Harness loader={first} report={stale} attempt={0} />);
    await screen.findByText('empty');

    rerender(<Harness loader={second} report={report} attempt={1} />);
    await waitFor(() => expect(report).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('empty')).toBeInTheDocument();

    expect(first.load).toHaveBeenCalledTimes(1);
    expect(second.load).toHaveBeenCalledTimes(1);
    expect(stale).toHaveBeenCalledTimes(1);
  });
});
