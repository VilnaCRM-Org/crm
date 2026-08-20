import HttpRequestConfigBuilder from '@/services/https-client/http-request-config-builder';
import type { RequestMethod } from '@/services/types/https-client/https-client';
import { buildCredentials, buildEmail } from '@tests/builders';

jest.mock('uuid', () => ({ v4: (): string => 'test-request-id' }));

const BASE_HEADERS = {
  Accept: 'application/json',
  'X-Request-Id': 'test-request-id',
  'X-Correlation-Id': 'test-request-id',
};

const builder = new HttpRequestConfigBuilder();

function headersOf(config: RequestInit): Record<string, string> {
  return config.headers as Record<string, string>;
}

function createWithoutArrayBuffer(body: unknown): RequestInit {
  const globalWithArrayBuffer = globalThis as { ArrayBuffer?: ArrayBufferConstructor };
  const originalArrayBuffer = globalWithArrayBuffer.ArrayBuffer;
  delete globalWithArrayBuffer.ArrayBuffer;

  try {
    return builder.create('POST', body, undefined);
  } finally {
    globalWithArrayBuffer.ArrayBuffer = originalArrayBuffer;
  }
}

describe('HttpRequestConfigBuilder request shape', () => {
  describe('methods that must never carry a body', () => {
    it('drops a supplied body on GET instead of serializing it', () => {
      const config = builder.create('GET', buildCredentials(), undefined);

      expect(config).toEqual({ method: 'GET', headers: BASE_HEADERS });
      expect(config.body).toBeUndefined();
      expect(headersOf(config)['Content-Type']).toBeUndefined();
    });

    it('drops a supplied body on HEAD instead of serializing it', () => {
      const head = 'HEAD' as unknown as RequestMethod;

      const config = builder.create(head, buildCredentials(), undefined);

      expect(config).toEqual({ method: 'HEAD', headers: BASE_HEADERS });
      expect(config.body).toBeUndefined();
      expect(headersOf(config)['Content-Type']).toBeUndefined();
    });

    it('serializes a body on POST (positive control for the body-less guard)', () => {
      const credentials = buildCredentials();

      const config = builder.create('POST', credentials, undefined);

      expect(config.body).toBe(JSON.stringify(credentials));
      expect(headersOf(config)['Content-Type']).toBe('application/json');
    });

    it('serializes a body on DELETE (positive control for the body-less guard)', () => {
      const credentials = buildCredentials();

      const config = builder.create('DELETE', credentials, undefined);

      expect(config.body).toBe(JSON.stringify(credentials));
      expect(headersOf(config)['Content-Type']).toBe('application/json');
    });
  });

  describe('native BodyInit payloads pass through untouched', () => {
    it('sends URLSearchParams as-is and lets the runtime set its content type', () => {
      const body = new URLSearchParams({ email: buildEmail() });

      const config = builder.create('POST', body, undefined);

      expect(config.body).toBe(body);
      expect(headersOf(config)['Content-Type']).toBeUndefined();
    });

    it('sends FormData as-is and lets the runtime set its multipart boundary', () => {
      const body = new FormData();
      body.append('email', buildEmail());

      const config = builder.create('POST', body, undefined);

      expect(config.body).toBe(body);
      expect(headersOf(config)['Content-Type']).toBeUndefined();
    });

    it('sends a Blob as-is', () => {
      const body = new Blob([buildEmail()], { type: 'text/plain' });

      const config = builder.create('POST', body, undefined);

      expect(config.body).toBe(body);
      expect(headersOf(config)['Content-Type']).toBeUndefined();
    });

    it('sends an ArrayBuffer as-is', () => {
      const body = new ArrayBuffer(8);

      const config = builder.create('POST', body, undefined);

      expect(config.body).toBe(body);
      expect(headersOf(config)['Content-Type']).toBeUndefined();
    });

    it('sends a ReadableStream as-is', () => {
      const body = new ReadableStream();

      const config = builder.create('POST', body, undefined);

      expect(config.body).toBe(body);
      expect(headersOf(config)['Content-Type']).toBeUndefined();
    });

    it('sends a typed-array view as-is', () => {
      const body = new Uint8Array([1, 2, 3]);

      const config = builder.create('POST', body, undefined);

      expect(config.body).toBe(body);
      expect(headersOf(config)['Content-Type']).toBeUndefined();
    });

    it('sends a DataView as-is', () => {
      const body = new DataView(new ArrayBuffer(4));

      const config = builder.create('POST', body, undefined);

      expect(config.body).toBe(body);
      expect(headersOf(config)['Content-Type']).toBeUndefined();
    });

    it('sends a string body as-is', () => {
      const body = buildEmail();

      const config = builder.create('POST', body, undefined);

      expect(config.body).toBe(body);
      expect(headersOf(config)['Content-Type']).toBeUndefined();
    });
  });

  describe('runtimes without binary globals', () => {
    it('serializes a typed array as JSON when the runtime exposes no ArrayBuffer', () => {
      // Captured before the global is removed: a plain object would take the same JSON path with
      // or without ArrayBuffer, so it could never show that the guard short-circuits.
      const view = new Uint8Array([1, 2, 3]);

      expect(builder.create('POST', view, undefined).body).toBe(view);

      const config = createWithoutArrayBuffer(view);

      expect(config.body).toBe(JSON.stringify(view));
      expect(headersOf(config)['Content-Type']).toBe('application/json');
    });

    it('still serializes a plain object when the runtime exposes no ArrayBuffer', () => {
      const credentials = buildCredentials();

      const config = createWithoutArrayBuffer(credentials);

      expect(config.body).toBe(JSON.stringify(credentials));
      expect(headersOf(config)['Content-Type']).toBe('application/json');
    });

    it('restores the ArrayBuffer global after the guarded build', () => {
      createWithoutArrayBuffer(buildCredentials());

      expect(typeof ArrayBuffer).toBe('function');
    });
  });
});
