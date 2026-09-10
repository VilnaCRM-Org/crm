import useAccess from '@/hooks/use-access';
import { FEATURE_FLAG_DEFAULTS } from '@/lib/access/feature-flag-catalog';
import type { FeatureFlag } from '@/lib/types/access/feature-flag';

export default function useAccessFlag(flag: FeatureFlag): boolean {
  return useAccess().flags[flag] ?? FEATURE_FLAG_DEFAULTS[flag];
}
