import type { FooterInsetRef } from '@/components/types/ui-navigation-drawer';

class FooterInsetSource {
  public attach: FooterInsetRef = (scrim) => {
    if (scrim === null) return undefined;

    const place = (): void => {
      scrim.style.setProperty('bottom', `${this.read()}px`);
    };

    place();
    window.addEventListener('resize', place);

    return (): void => window.removeEventListener('resize', place);
  };

  private read(): number {
    const footer = [...document.querySelectorAll('footer')].find(
      (candidate) => candidate.closest('main') === null
    );
    const viewport = window.innerHeight;
    const top = footer?.getBoundingClientRect().top ?? viewport;

    return Math.min(viewport, Math.max(0, viewport - top));
  }
}

const footerInsetSource = new FooterInsetSource();

export default function useFooterInset(): FooterInsetRef {
  return footerInsetSource.attach;
}
