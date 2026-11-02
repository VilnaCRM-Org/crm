import 'reflect-metadata';

import { ApolloError } from '@apollo/client';

import UnseenFailureReporter from '@/services/observability/unseen-failure-reporter';
import type { ObservabilityService } from '@/services/types/observability/observability';

const setUp = (): { reporter: UnseenFailureReporter; captureError: jest.Mock } => {
  const captureError = jest.fn();
  const observability = { captureError } as unknown as ObservabilityService;
  return { reporter: new UnseenFailureReporter(observability), captureError };
};

const context = { source: 'settings:profile', stage: 'read' };

describe('UnseenFailureReporter', () => {
  it.each([
    [
      'an Apollo error carrying a network error',
      new ApolloError({ networkError: new TypeError('Failed to fetch') }),
    ],
    [
      'an Apollo error carrying a GraphQL error',
      new ApolloError({ graphQLErrors: [{ message: 'Boom' }] }),
    ],
    [
      'an Error carrying both',
      Object.assign(new Error('both'), {
        networkError: new Error('offline'),
        graphQLErrors: [{ message: 'Boom' }],
      }),
    ],
  ])('leaves %s to the Apollo link, which already reported it', (_label, caught) => {
    const { reporter, captureError } = setUp();

    reporter.report(caught, context);

    expect(captureError).not.toHaveBeenCalled();
  });

  it.each([
    ['an Apollo error carrying neither', new ApolloError({ graphQLErrors: [] })],
    ['a programming error', new TypeError('Cannot read properties of undefined')],
    [
      'an Error whose GraphQL errors are not an array',
      Object.assign(new Error('odd'), { graphQLErrors: { length: 1 } }),
    ],
    ['a plain object with a network error', { networkError: new Error('offline') }],
    ['a plain object with GraphQL errors', { graphQLErrors: [{ message: 'Boom' }] }],
    ['a string', 'boom'],
    ['null', null],
    ['undefined', undefined],
  ])('captures %s once, because the link never saw it', (_label, caught) => {
    const { reporter, captureError } = setUp();

    reporter.report(caught, context);

    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledWith(caught, context);
  });
});
