import JSDOMEnvironment from 'jest-environment-jsdom';

export default class JsdomFetchEnvironment extends JSDOMEnvironment {
  constructor(...args: ConstructorParameters<typeof JSDOMEnvironment>) {
    super(...args);
    const target = this.global as unknown as Record<string, unknown>;
    const nodeGlobals: Record<string, unknown> = {
      fetch,
      Headers,
      Request,
      Response,
      FormData,
      Blob,
      File,
      AbortController,
      AbortSignal,
      ReadableStream,
      TextEncoder,
      TextDecoder,
      structuredClone,
    };
    for (const [key, value] of Object.entries(nodeGlobals)) {
      target[key] = value;
    }
  }
}
