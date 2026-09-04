/**
 * `displayName` is assigned at module scope, so the assignment only runs on import. Importing
 * inside the test keeps that assignment itself under test.
 */
describe('UIButton display name', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('pins the forwardRef display name React DevTools and error messages show', async () => {
    const { default: UIButton } = await import('@/components/ui-button');

    expect(UIButton.displayName).toBe('UIButton');
  });
});
