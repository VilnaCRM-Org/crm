import { useState } from 'react';

import type {
  SocialLinks,
  SocialLinkTarget,
  UnlinkConfirmation,
  UnlinkContext,
  UnlinkRequest,
} from '../types/social-link/social-links';

const NO_REQUEST: UnlinkRequest = { target: null, count: 0 };

function askFor({ links, request, setRequest }: UnlinkContext, target: SocialLinkTarget): void {
  if (!links.busy) setRequest({ target, count: request.count + 1 });
}

function linkInstead(
  { links, request, setRequest }: UnlinkContext,
  target: SocialLinkTarget
): void {
  setRequest({ ...request, target: null });
  void links.link(target);
}

function cancelFor({ request, setRequest }: UnlinkContext, { controlRef }: SocialLinkTarget): void {
  setRequest({ ...request, target: null });
  controlRef.current?.focus();
}

function confirmFor(context: UnlinkContext, target: SocialLinkTarget): void {
  if (context.links.busy || context.request.target?.id !== target.id) return;
  cancelFor(context, target);
  void context.links.unlink(target);
}

export default function useUnlinkConfirmation(links: SocialLinks): UnlinkConfirmation {
  const [request, setRequest] = useState(NO_REQUEST);
  const context = { links, request, setRequest };

  return {
    request,
    ask: (target): void => askFor(context, target),
    link: (target): void => linkInstead(context, target),
    cancel: (target): void => cancelFor(context, target),
    confirm: (target): void => confirmFor(context, target),
  };
}
