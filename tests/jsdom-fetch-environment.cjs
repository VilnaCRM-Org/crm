const jsdomModule = require('jest-environment-jsdom');

const JSDOMEnvironment = jsdomModule.default || jsdomModule.TestEnvironment || jsdomModule;

const trackClosable = (HostChannel, register) =>
  class TrackedChannel extends HostChannel {
    constructor(...args) {
      super(...args);
      register(this);
    }
  };

class JsdomFetchEnvironment extends JSDOMEnvironment {
  constructor(...args) {
    super(...args);
    const target = this.global;
    const openChannels = [];
    this.openChannels = openChannels;
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
      TransformStream: globalThis.TransformStream,
      WritableStream: globalThis.WritableStream,
      BroadcastChannel: trackClosable(globalThis.BroadcastChannel, (channel) =>
        openChannels.push(channel)
      ),
      MessageChannel: trackClosable(globalThis.MessageChannel, (channel) =>
        openChannels.push(channel.port1, channel.port2)
      ),
      MessagePort: globalThis.MessagePort,
      crypto: globalThis.crypto,
    };
    for (const key of Object.keys(nodeGlobals)) {
      target[key] = nodeGlobals[key];
    }
    target.fetch = () =>
      Promise.reject(new Error('fetch is not implemented in this test environment'));
  }

  async teardown() {
    for (const channel of this.openChannels.splice(0)) {
      channel.close();
    }
    await super.teardown();
  }
}

module.exports = JsdomFetchEnvironment;
