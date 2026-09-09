describe('console gate fixture', () => {
  it('emits an unexpected console.error', () => {
    console.error('seeded console-gate defect: unexpected error output');

    expect(true).toBe(true);
  });
});
