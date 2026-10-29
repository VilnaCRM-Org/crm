const widthBound = (query: string, edge: 'min' | 'max'): number =>
  Number(new RegExp(`${edge}-width:\\s*([\\d.]+)px`, 'u').exec(query)?.[1]);

const matchesWidth = (width: number, query: string): boolean => {
  const min = widthBound(query, 'min');
  const max = widthBound(query, 'max');
  if (Number.isNaN(min) && Number.isNaN(max)) return false;

  return !(width < min) && !(width > max);
};

const stubViewportWidth = (width: number): void => {
  window.matchMedia = ((query: string) => ({
    matches: matchesWidth(width, query),
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })) as unknown as typeof window.matchMedia;
};

export default stubViewportWidth;
