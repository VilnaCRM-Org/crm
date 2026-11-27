import type useSocialLinks from '@/modules/user/features/settings/hooks/use-social-links';

export default function useSocialLinksStub(): ReturnType<typeof useSocialLinks> {
  return {
    status: 'ready',
    linked: { items: [] },
    busy: false,
    link: (): Promise<void> => Promise.resolve(),
    unlink: (): Promise<void> => Promise.resolve(),
    retry: (): undefined => undefined,
  };
}
