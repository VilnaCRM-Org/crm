const ResponseMessages = {
  NETWORK_ERROR: 'Network error',
  RESPONSE_NOT_JSON: 'Response is not JSON',
  JSON_PARSE_FAILED: 'Failed to parse JSON response',
  INVALID_RESPONSE_SHAPE: 'Response did not match the expected schema',
} as const;

export default ResponseMessages;
