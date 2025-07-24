export default function sum(a: number, b: number) {
  return a + b;
}

describe('sum function', () => {
  it('should return 3 when adding 1 + 2', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
