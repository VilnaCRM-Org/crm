const jsdomModule = require('jest-environment-jsdom');

const JSDOMEnvironment = jsdomModule.default || jsdomModule.TestEnvironment || jsdomModule;

class JsdomFetchEnvironment extends JSDOMEnvironment {
  constructor(...args) {
    super(...args);
    const target = this.global;
    const nodeGlobals = {
      Headers: globalThis.Headers,
      Request: globalThis.Request,
      Response: globalThis.Response,
      FormData: globalThis.FormData,
      Blob: globalThis.Blob,
      File: globalThis.File,
      AbortController: globalThis.AbortController,
      AbortSignal: globalThis.AbortSignal,
      ReadableStream: globalThis.ReadableStream,
      TextEncoder: globalThis.TextEncoder,
      TextDecoder: globalThis.TextDecoder,
      structuredClone: globalThis.structuredClone,
    };
    for (const key of Object.keys(nodeGlobals)) {
      target[key] = nodeGlobals[key];
    }
    target.fetch = () =>
      Promise.reject(new Error('fetch is not implemented in this test environment'));
  }
}

module.exports = JsdomFetchEnvironment;
