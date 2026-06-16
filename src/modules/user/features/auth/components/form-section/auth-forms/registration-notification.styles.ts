import { notificationSection } from './registration-notification.shared-styles';

// The RegistrationNotification container only styles its own overlay box; the
// success/error visuals live in the split views and their dedicated style files
// (`registration-notification.{success,error}-styles.ts`). Re-export the shared
// overlay style here so this container keeps a co-located styles file without
// duplicating the fragments owned by the split views.
export default { notificationSection } as const;
