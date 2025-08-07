import FacebookFooterIcon from '@/assets/icons/facebook.svg';
import GitHubFooterIcon from '@/assets/icons/github.svg';
import InstagramFooterIcon from '@/assets/icons/instagram.svg';
import LinkedinFooterIcon from '@/assets/icons/linkedin.svg';

export interface SocialLinks {
  icon: string;
  alt: string;
  linkHref: string;
  ariaLabel: string;
}

export const socialLinks: SocialLinks[] = [
  {
    icon: InstagramFooterIcon,
    alt: 'footer.alt_images.instagram',
    linkHref: 'https://www.instagram.com/',
    ariaLabel: 'footer.aria_labels.instagram',
  },
  {
    icon: GitHubFooterIcon,
    alt: 'footer.alt_images.github',
    linkHref: ' https://github.com/VilnaCRM-Org',
    ariaLabel: 'footer.aria_labels.github',
  },
  {
    icon: FacebookFooterIcon,
    alt: 'footer.alt_images.facebook',
    linkHref: 'https://www.facebook.com/',
    ariaLabel: 'footer.aria_labels.facebook',
  },
  {
    icon: LinkedinFooterIcon,
    alt: 'footer.alt_images.linkedin',
    linkHref: 'https://www.linkedin.com/',
    ariaLabel: 'footer.aria_labels.linkedin',
  },
];
