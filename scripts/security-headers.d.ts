export interface SecurityHeader {
  readonly key: string;
  readonly value: string;
}

export interface CacheControlRule {
  readonly source: string;
  readonly value: string;
}

export interface ConnectSrcFromEnv {
  readonly build: readonly string[];
  readonly runtime: readonly string[];
}

export interface ContentSecurityPolicy {
  readonly directives: Record<string, string[]>;
  readonly connectSrcFromEnv: ConnectSrcFromEnv;
}

export interface HeaderRule {
  readonly source: string;
  readonly headers: SecurityHeader[];
}

export interface SecurityHeaderPolicy {
  readonly document: HeaderRule;
  readonly response: HeaderRule;
  readonly contentSecurityPolicy: ContentSecurityPolicy;
  readonly cacheControl: CacheControlRule[];
}

export interface ServeHeaderRule {
  readonly source: string;
  readonly headers: SecurityHeader[];
}

export interface ServeConfig {
  headers: ServeHeaderRule[];
  [key: string]: unknown;
}

export type Env = Record<string, string | undefined>;

export const CACHE_CONTROL: string;
export const CONNECT_SRC: string;
export const CSP_HEADER: string;
export const POLICY_PATH: string;

export function assertBaselineFloors(policy: SecurityHeaderPolicy): SecurityHeaderPolicy;
export function buildCsp(policy: SecurityHeaderPolicy, extraConnectSrc?: string[]): string;
export function cacheControlRules(policy: SecurityHeaderPolicy): ServeHeaderRule[];
export function committedConnectSrc(
  serveConfig: { headers: ServeHeaderRule[] },
  policy: SecurityHeaderPolicy
): string[];
export function extendRuntimeConnectSrc(
  serveConfig: { headers: ServeHeaderRule[] },
  policy: SecurityHeaderPolicy,
  env: Env
): string[];
export function loadPolicy(policyPath?: string): SecurityHeaderPolicy;
export function originOf(raw: unknown): string | null;
export function originsFromEnv(variables: readonly string[], env: Env): string[];
export function parseCsp(value: string): Record<string, string[]>;
export function renderHeadersBlock(
  policy: SecurityHeaderPolicy,
  extraConnectSrc?: string[]
): ServeHeaderRule[];
export function renderServeConfig(
  policy: SecurityHeaderPolicy,
  env: Env,
  existing?: Record<string, unknown>
): ServeConfig;
export function documentHeaders(
  policy: SecurityHeaderPolicy,
  extraConnectSrc?: string[]
): SecurityHeader[];
export function responseHeaders(policy: SecurityHeaderPolicy): SecurityHeader[];
export function serializeCsp(directives: Record<string, string[]>): string;
