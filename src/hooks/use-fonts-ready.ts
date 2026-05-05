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

function transitionFontsReady(
  setFontsReady: React.Dispatch<React.SetStateAction<boolean>>,
  value: boolean
): void {
  startTransition(() => {
    setFontsReady(value);
  });
}

export default function useFontsReady(fonts: readonly string[]): boolean {
  const [fontsReady, setFontsReady] = useState(() => {
    const fontFaceSet = getFontFaceSet();

    return !fontFaceSet || areFontsReady(fontFaceSet, fonts);
  });

  useEffect(() => {
    const fontFaceSet = getFontFaceSet();

    if (!fontFaceSet) {
      return undefined;
    }

    let isMounted = true;
    const updateFontsReady = (value: boolean): void => {
      if (!isMounted) {
        return;
      }

      transitionFontsReady(setFontsReady, value);
    };

    if (areFontsReady(fontFaceSet, fonts)) {
      updateFontsReady(true);
    } else {
      setFontsReady(false);
      Promise.all(fonts.map((font) => fontFaceSet.load(font)))
        .catch(() => undefined)
        .finally(() => {
          updateFontsReady(true);
        });
    }

    return (): void => {
      isMounted = false;
    };
  }, [fonts]);

  return fontsReady;
}
