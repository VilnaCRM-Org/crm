const loadFonts = (): Promise<FontFace[][]> => {
  if (typeof document === 'undefined' || !document.fonts?.load) return Promise.resolve([]);
  return Promise.all([
    document.fonts.load('400 1em Golos'),
    document.fonts.load('500 1em Golos'),
    document.fonts.load('700 1em Golos'),
    document.fonts.load('900 1em Golos'),
    document.fonts.load('400 1em Inter'),
    document.fonts.load('500 1em Inter'),
  ]);
};

export default loadFonts;
