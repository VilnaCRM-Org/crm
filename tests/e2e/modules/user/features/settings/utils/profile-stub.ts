import type { Page, Request, Route } from '@playwright/test';

import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

const GRAPHQL_URL = '**/graphql';

export type ProfileOperation = 'CurrentUser' | 'UpdateUser' | 'ResendEmailToUser';

export type Reply = (route: Route) => Promise<void>;

export interface RecordedCall {
  readonly operation: ProfileOperation;
  readonly variables: Record<string, unknown>;
  readonly authorization: string | undefined;
  readonly url: string;
}

export interface StubbedProfile {
  readonly calls: RecordedCall[];
  readonly count: (operation: ProfileOperation) => number;
}

export type ProfileReplies = Partial<Record<ProfileOperation, Reply[]>>;

export const PROFILE_NODE = {
  id: '/api/users/0193a9e2-7c1d-7d8e-9f3a-5b6c7d8e9f01',
  email: 'olena.petrenko@example.com',
  initials: 'Олена Петренко',
  confirmed: true,
};

const json = (route: Route, status: number, body: unknown): Promise<void> =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

export const replyWithProfile = (overrides: Partial<typeof PROFILE_NODE> = {}): Reply => {
  const node = { ...PROFILE_NODE, ...overrides };
  return (route) => json(route, 200, { data: { users: { edges: [{ node }] } } });
};

export const replyWithSaved = (overrides: Partial<typeof PROFILE_NODE> = {}): Reply => {
  const user = { ...PROFILE_NODE, ...overrides };
  return (route) => json(route, 200, { data: { updateUser: { user } } });
};

export const replyWithResent = (): Reply => (route) =>
  json(route, 200, { data: { resendEmailToUser: { user: { ...PROFILE_NODE } } } });

export const replyWithGraphQLError = (message: string, status?: number): Reply => {
  const extensions = status === undefined ? undefined : { status };
  return (route) => json(route, 200, { data: null, errors: [{ message, extensions }] });
};

export const replyWithStatus =
  (status: number): Reply =>
  (route) =>
    route.fulfill({ status, body: '' });

export const replyWithEndedSession: Reply = (route) =>
  route.fulfill({
    status: 401,
    contentType: 'application/problem+json',
    headers: { 'WWW-Authenticate': 'Bearer' },
    body: JSON.stringify({ title: 'Unauthorized', status: 401 }),
  });

const DEFAULT_REPLIES: Record<ProfileOperation, Reply> = {
  CurrentUser: replyWithProfile(),
  UpdateUser: replyWithSaved(),
  ResendEmailToUser: replyWithResent(),
};

const recordOf = (request: Request): RecordedCall => {
  const body = request.postDataJSON() as {
    operationName: ProfileOperation;
    variables?: Record<string, unknown>;
  };
  return {
    operation: body.operationName,
    variables: body.variables ?? {},
    authorization: request.headers().authorization,
    url: request.url(),
  };
};

const isProfileOperation = (name: string | undefined): name is ProfileOperation =>
  name === 'CurrentUser' || name === 'UpdateUser' || name === 'ResendEmailToUser';

export async function stubProfile(
  page: Page,
  replies: ProfileReplies = {}
): Promise<StubbedProfile> {
  const calls: RecordedCall[] = [];
  const count = (operation: ProfileOperation): number =>
    calls.filter((call) => call.operation === operation).length;

  await page.route(GRAPHQL_URL, async (route: Route) => {
    const name = (route.request().postDataJSON() as { operationName?: string }).operationName;
    if (!isProfileOperation(name)) return route.fallback();
    calls.push(recordOf(route.request()));
    const queue = replies[name] ?? [];
    const reply = queue[Math.min(count(name), queue.length) - 1] ?? DEFAULT_REPLIES[name];
    return reply(route);
  });
  return { calls, count };
}

export async function signInWithFlag(page: Page, userSettings: boolean): Promise<void> {
  await seedPreloadedAuthToken(page);
  await overrideRuntimeConfig(page, { flags: { userSettings } });
}

export function watchContactedOrigins(page: Page): () => string[] {
  const urls: string[] = [];
  page.on('request', (request: Request) => {
    urls.push(request.url());
  });
  return () => urls;
}

export const configuredOrigin = (configuredUrl: string | undefined, documentUrl: string): string =>
  new URL(configuredUrl ?? documentUrl).origin;

export function originsOf(urls: readonly string[]): string[] {
  return [...new Set(urls.filter((url) => /^https?:/.test(url)).map((url) => new URL(url).origin))];
}

export interface ReleaseGate {
  readonly reply: Reply;
  readonly release: () => void;
}

export function holdReply(reply: Reply): ReleaseGate {
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  return {
    reply: async (route): Promise<void> => {
      await released;
      await reply(route);
    },
    release: () => release(),
  };
}
