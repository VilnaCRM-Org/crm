import { z } from '@/config/zod';

describe('@/config/zod (issue #113)', () => {
  it('runs zod in jitless mode so no schema compiles through the Function constructor', () => {
    expect(z.config().jitless).toBe(true);
  });

  it('still parses object schemas on the interpreted path', () => {
    const schema = z.object({ email: z.string().email(), age: z.number().int().min(0) });

    expect(schema.safeParse({ email: 'user@example.com', age: 3 }).success).toBe(true);
    expect(schema.safeParse({ email: 'nope', age: -1 }).success).toBe(false);
  });

  it('keeps the eval probe out of the runtime: parsing never calls Function', () => {
    const construct = jest.spyOn(globalThis, 'Function');

    z.object({ id: z.string() }).parse({ id: 'x' });

    expect(construct).not.toHaveBeenCalled();
    construct.mockRestore();
  });
});
