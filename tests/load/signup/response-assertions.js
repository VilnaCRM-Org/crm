function hasSuccessfulSignupBody(body, expectedEmail, useRealBackend) {
  if (body === null || typeof body !== 'object') {
    return false;
  }

  if (useRealBackend) {
    return Boolean(body.id) && body.email === expectedEmail;
  }

  return Object.prototype.hasOwnProperty.call(body, 'id');
}

module.exports = {
  hasSuccessfulSignupBody,
};
