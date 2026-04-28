import { AnyAction, DevToolsEnhancerOptions } from '@reduxjs/toolkit';
import { inject, injectable } from 'tsyringe';

import TOKENS from '@/config/tokens';

import { DevToolsRedactor } from './dev-tools-redaction';

const META_FIELDS = ['arg', 'headers', 'request'] as const;

@injectable()
export class DevToolsOptionsFactory {
  private readonly devToolsRedactor: DevToolsRedactor;

  constructor(@inject(TOKENS.DevToolsRedactor) devToolsRedactor: DevToolsRedactor) {
    this.devToolsRedactor = devToolsRedactor;
  }

  public create(): DevToolsEnhancerOptions {
    return {
      actionSanitizer: <A extends AnyAction>(action: A): A => this.sanitizeAction(action),
      stateSanitizer: <S>(state: S): S => this.sanitizeState(state),
    };
  }

  private sanitizeAction<A extends AnyAction>(action: A): A {
    const { meta, changed: metaChanged } = this.sanitizeMeta(action.meta);
    const originalPayload = (action as A & { payload?: unknown }).payload;
    const { payload, changed: payloadChanged } = this.sanitizePayload(originalPayload);

    if (!metaChanged && !payloadChanged) {
      return action;
    }

    return { ...action, meta, payload } as A;
  }

  private sanitizeState<S>(state: S): S {
    if (!state || typeof state !== 'object') {
      return state;
    }

    const stateObject = state as S & { auth?: unknown };
    return {
      ...stateObject,
      auth:
        stateObject.auth === undefined
          ? undefined
          : this.devToolsRedactor.deepRedact(stateObject.auth),
    };
  }

  private sanitizeMeta(meta: unknown): {
    meta: Record<string, unknown> | undefined;
    changed: boolean;
  } {
    if (!meta || typeof meta !== 'object') return { meta: meta as undefined, changed: false };
    const nextMeta = { ...(meta as Record<string, unknown>) };
    let changed = false;
    for (const field of META_FIELDS) {
      const sanitizedValue = this.getSanitizedMetaField(nextMeta[field]);
      if (sanitizedValue.changed) {
        nextMeta[field] = sanitizedValue.value;
        changed = true;
      }
    }
    return { meta: changed ? nextMeta : (meta as Record<string, unknown>), changed };
  }

  private sanitizePayload(payload: unknown): { payload: unknown; changed: boolean } {
    if (!payload || typeof payload !== 'object') {
      return { payload, changed: false };
    }

    const sanitizedPayload = this.devToolsRedactor.deepRedact(payload);
    return { payload: sanitizedPayload, changed: sanitizedPayload !== payload };
  }

  private getSanitizedMetaField(value: unknown): { value: unknown; changed: boolean } {
    if (!value || typeof value !== 'object') {
      return { value, changed: false };
    }

    return {
      value: this.devToolsRedactor.deepRedact(value),
      changed: true,
    };
  }
}

const devToolsOptions = new DevToolsOptionsFactory(new DevToolsRedactor()).create();

export default devToolsOptions;
