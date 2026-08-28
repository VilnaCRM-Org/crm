describe('console gate fixture', () => {
  it('installs a console.error spy and never restores it', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    console.error('an expected, asserted error');

    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it('is still gated in the next test of the same file', () => {
    console.error('seeded console-gate defect: emitted after an unrestored spy');

    expect(true).toBe(true);
  });
});
