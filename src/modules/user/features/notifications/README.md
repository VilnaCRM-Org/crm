# Notifications feature

The history of outcomes a user has seen, kept behind a repository contract so that it can become
its own module later (issue #391). No notification back end exists yet (user-service issues #526
and #527 are open), so the only adapter is an in-memory mock.

## The contract

`NotificationRepository` (`types/notification-repository.ts`) is the whole boundary. It has four
operations, and each one returns a promise:

| Operation        | Resolves with                               |
| ---------------- | ------------------------------------------- |
| `record(drafts)` | the new records, unread, with generated ids |
| `list()`         | every record, newest first                  |
| `countUnread()`  | how many records are unread                 |
| `markAllRead()`  | nothing; every record is read afterwards    |

A `NotificationRecord` holds only `id`, `kind`, `messageKey`, `createdAt` (epoch milliseconds) and
`read`. It stores an i18n key, never translated text, and carries no action, e-mail, name,
password, token or user id.

## The in-memory adapter and its seed

`InMemoryNotificationRepository` (`repositories/in-memory-notification-repository.ts`) keeps its
records in the instance, so a reload starts again from the seed. It touches neither the network
nor storage, and every operation resolves on a microtask. The file exports the class, the frozen
`NOTIFICATION_SEED` and a default instance built from that seed, so tests and Storybook import one
seed.

The seed holds three success rows: `seed-1` unread and `seed-2` and `seed-3` read. Their message
keys live in this feature's own lazy catalog (`i18n/`, namespace `notification_center`), and their
texts equal the shipped `settings.toasts.password_changed`, `email_sent` and `saved` texts.
`tests/unit/modules/user/features/notifications/i18n/seed-copy.test.ts` turns red when the
settings copy changes and the seed does not follow.

## Extraction rule: no user-module imports

Nothing in this folder may import from the rest of `src/modules/user/`. It imports only the port
types in `src/lib/notifications/types` with `import type`, so the feature can move to
`src/modules/notifications/` without changing a caller. The public barrel (`index.ts`) exports
types only.

Later stories add the DI token and the hook seam, then the port and the shell slot; this README
grows with them.
