import { useLayoutEffect, useState } from 'react';

class FooterInsetSource {
  public read(): number {
    const footer = [...document.querySelectorAll('footer')].find(
      (candidate) => candidate.closest('main') === null
    );
    const viewport = window.innerHeight;
    const top = footer?.getBoundingClientRect().top ?? viewport;

    return Math.min(viewport, Math.max(0, viewport - top));
  }
}

const footerInsetSource = new FooterInsetSource();

export default function useFooterInset(): number {
  const [inset, setInset] = useState(0);

  useLayoutEffect(() => {
    const measure = (): void => setInset(footerInsetSource.read());

    measure();
    window.addEventListener('resize', measure);

    return (): void => window.removeEventListener('resize', measure);
  });

  return inset;
}
