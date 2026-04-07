type NotificationSnapshotState = 'success' | 'error';

export default function getRegistrationNotificationSnapshotName(
  language: string,
  screenName: string,
  state: NotificationSnapshotState
): string {
  return `${language}-${state}-${screenName}.png`;
}
