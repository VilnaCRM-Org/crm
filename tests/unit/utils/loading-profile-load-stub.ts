import type useProfileLoad from '@/modules/user/features/settings/hooks/use-profile-load';

export default function useLoadingProfileLoadStub(): ReturnType<typeof useProfileLoad> {
  return {
    status: 'loading',
    user: null,
    version: 0,
    refocus: false,
    retry: (): undefined => undefined,
    adoption: {
      adopt: (): undefined => undefined,
      confirm: (): undefined => undefined,
      isCurrent: (): boolean => true,
      revision: (): number => 0,
    },
  };
}
