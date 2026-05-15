/**
 * This script follows ES5.1 rules for compatibility.
 * Avoid ES6+ syntax (e.g., `let`, `const`, arrow functions).
 */

'use strict';

function getMappedUri(uri) {
  switch (uri) {
    case '/':
      return '/index.html';
    case '/about':
    case '/about/':
      return '/about/index.html';
    case '/en':
    case '/en/':
      return '/en/index.html';
    case '/swagger':
      return '/swagger.html';
    default:
      return null;
  }
}

function logRoutingError(error) {
  return error;
}

function handler(event) {
  if (!event.request.uri || typeof event.request.uri !== 'string') {
    return event.request;
  }

  try {
    if (getMappedUri(event.request.uri) !== null) {
      event.request.uri = getMappedUri(event.request.uri);
      return event.request;
    }

    if (event.request.uri.slice(-1) === '/') {
      event.request.uri += 'index.html';
    } else if (event.request.uri.indexOf('.') === -1) {
      event.request.uri += '/index.html';
    }

    return event.request;
  } catch (error) {
    logRoutingError(error);
    return event.request;
  }
}

handler.toString();
