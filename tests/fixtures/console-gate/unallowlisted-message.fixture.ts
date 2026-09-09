// The allowlist is empty: @testing-library/react 16 renders through React.act, so the single
// entry the gate ever carried expired with that upgrade and was deleted. This fixture emits the
// message that entry used to exempt and must now fail, which is what proves the exemption is
// really gone rather than merely absent from the source.
const RTL_ACT_DEPRECATION = [
  'Warning: `ReactDOMTestUtils.act` is deprecated in favor of `React.act`.',
  'Import `act` from `react` instead of `react-dom/test-utils`.',
  'See https://react.dev/warnings/react-dom-test-utils for more info.',
].join(' ');

describe('console gate fixture', () => {
  it('fails when a message no entry exempts reaches console.error', () => {
    console.error(RTL_ACT_DEPRECATION);

    expect(true).toBe(true);
  });
});
