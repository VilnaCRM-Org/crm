import type { SerializedError } from '@reduxjs/toolkit';

const UNKNOWN_KEY = 'auth.errors.unknown';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function trimmedString(value: unknown): string | null {
  const s = typeof value === 'string' && value.trim() ? value.trim() : null;
  return s;
}

function getNestedMessage(value: unknown): string | null {
  const direct = trimmedString(value);
  if (direct) return direct;
  return isRecord(value) ? trimmedString(value.message) : null;
}

type Extractor = (error: unknown) => string | null;

function directStringExtractor(error: unknown): string | null {
  return trimmedString(error);
}

function errorInstanceExtractor(error: unknown): string | null {
  return error instanceof Error ? error.message.trim() || UNKNOWN_KEY : null;
}

function serializedExtractor(error: unknown): string | null {
  return isRecord(error) ? trimmedString((error as SerializedError).message) : null;
}

function nestedFieldsExtractor(error: unknown): string | null {
  if (!isRecord(error)) return null;
  const candidates = [error.message, error.displayMessage, error.data];
  for (const candidate of candidates) {
    const message = getNestedMessage(candidate);
    if (message) return message;
  }
  return null;
}

const EXTRACTORS: Extractor[] = [
  directStringExtractor,
  errorInstanceExtractor,
  serializedExtractor,
  nestedFieldsExtractor,
];

export default function normalizeLoginErrorMessage(error: unknown): string {
  for (const extract of EXTRACTORS) {
    const result = extract(error);
    if (result) return result;
  }
  return UNKNOWN_KEY;
}
