import { startTransition, useEffect, useState } from 'react';

function getFontFaceSet(): FontFaceSet | null {
  if (typeof document === 'undefined' || !document.fonts) {
    return null;
  }

  return document.fonts;
}

function areFontsReady(fontFaceSet: FontFaceSet, fonts: readonly string[]): boolean {
  return fonts.every((font) => fontFaceSet.check(font));
}

export default function useFontsReady(fonts: readonly string[]): boolean {
  const [fontsReady, setFontsReady] = useState(() => {
    const fontFaceSet = getFontFaceSet();

    return !fontFaceSet || areFontsReady(fontFaceSet, fonts);
  });

  useEffect(() => {
    const fontFaceSet = getFontFaceSet();
    let isMounted = true;

    if (!fontFaceSet) {
      return undefined;
    }

    if (areFontsReady(fontFaceSet, fonts)) {
      startTransition(() => setFontsReady(true));
      return undefined;
    }

    setFontsReady(false);
    Promise.all(fonts.map((font) => fontFaceSet.load(font)))
      .catch(() => undefined)
      .finally(() => {
        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setFontsReady(true);
        });
      });

    return (): void => {
      isMounted = false;
    };
  }, [fonts]);

  return fontsReady;
}
