describe('console gate fixture', () => {
  it('emits an unexpected console.warn', () => {
    console.warn('seeded console-gate defect: unexpected warn output');

    expect(true).toBe(true);
  });
});
