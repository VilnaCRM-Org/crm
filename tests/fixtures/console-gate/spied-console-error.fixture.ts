describe('console gate fixture', () => {
  it('passes when the expected error is spied on and asserted', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    console.error('an expected, asserted error');

    expect(consoleError).toHaveBeenCalledWith('an expected, asserted error');
  });
});
