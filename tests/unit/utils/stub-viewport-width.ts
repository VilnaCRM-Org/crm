const stubViewportWidth = (width: number): void => {
  window.matchMedia = ((query: string) => {
    const minWidth = Number(/min-width:\s*(\d+)px/u.exec(query)?.[1]);

    return {
      matches: width >= minWidth,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  }) as unknown as typeof window.matchMedia;
};

export default stubViewportWidth;
