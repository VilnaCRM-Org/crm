import loadIsolated from '../utils/isolated-module';

type ZodModule = typeof import('@/config/zod');

const loadZod = (): Promise<ZodModule> => loadIsolated(() => import('@/config/zod'));

describe('@/config/zod (issue #113)', () => {
  it('runs zod in jitless mode so no schema compiles through the Function constructor', async () => {
    const { z } = await loadZod();

    expect(z.config()).toMatchObject({ jitless: true });
  });

  it('still parses object schemas on the interpreted path', async () => {
    const { z } = await loadZod();
    const schema = z.object({ email: z.string().email(), age: z.number().int().min(0) });

    expect(schema.safeParse({ email: 'user@example.com', age: 3 }).success).toBe(true);
    expect(schema.safeParse({ email: 'nope', age: -1 }).success).toBe(false);
  });

  it('keeps the eval probe out of the runtime: parsing never calls Function', async () => {
    const { z } = await loadZod();
    const construct = jest.spyOn(globalThis, 'Function');

    z.object({ id: z.string() }).parse({ id: 'x' });

    expect(construct).not.toHaveBeenCalled();
    construct.mockRestore();
  });
});
