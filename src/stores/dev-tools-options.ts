import { DevToolsEnhancerOptions, AnyAction } from '@reduxjs/toolkit';

import deepRedact from './dev-tools-redaction';

const META_FIELDS = ['arg', 'headers', 'request'] as const;

function sanitizeMeta(meta: unknown): { meta: Record<string, unknown> | undefined; changed: boolean } {
  if (!meta || typeof meta !== 'object') return { meta: meta as undefined, changed: false };
  const m = { ...(meta as Record<string, unknown>) };
  let changed = false;
  for (const field of META_FIELDS) {
    const value = m[field];
    if (value && typeof value === 'object') {
      m[field] = deepRedact(value);
      changed = true;
    }
  }
  return { meta: changed ? m : (meta as Record<string, unknown>), changed };
}

function sanitizePayload(payload: unknown): { payload: unknown; changed: boolean } {
  if (!payload || typeof payload !== 'object') return { payload, changed: false };
  const next = deepRedact(payload);
  return { payload: next, changed: next !== payload };
}

function actionSanitizer<A extends AnyAction>(action: A): A {
  const { meta, changed: metaChanged } = sanitizeMeta(action.meta);
  const original = (action as A & { payload?: unknown }).payload;
  const { payload, changed: payloadChanged } = sanitizePayload(original);
  if (!metaChanged && !payloadChanged) return action;
  return { ...action, meta, payload } as A;
}

function stateSanitizer<S>(state: S): S {
  if (!state || typeof state !== 'object') return state;
  const stateObj = state as S & { auth?: unknown };
  return { ...stateObj, auth: stateObj.auth ? deepRedact(stateObj.auth) : undefined };
}

const devToolsOptions: DevToolsEnhancerOptions = { actionSanitizer, stateSanitizer };

export default devToolsOptions;
