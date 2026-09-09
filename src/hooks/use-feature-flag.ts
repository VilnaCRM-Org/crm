import featureFlagService from '@/config/runtime/feature-flag-service';
import type { FeatureFlag } from '@/config/runtime/types/feature-flag';

// The runtime configuration is immutable for the lifetime of the document (it is rendered into
// the HTML shell at container start), so this is a plain synchronous read rather than a
// subscription. It deliberately stays container-free: the flag lookup happens on the auth paint
// path, which must not load tsyringe or the DI graph (issue #145 — Lighthouse budget unchanged).
export default function useFeatureFlag(flag: FeatureFlag): boolean {
  return featureFlagService.isEnabled(flag);
}
