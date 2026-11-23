# Notifications feature

The history of outcomes a user has seen, kept behind a repository contract so that it can become
its own module later (issue #391). No back end stores notifications yet (user-service issues #526
and #527 are open), so the only adapter is an in-memory mock; live broadcast events can be added
from notification-service (see "Broadcast events"). The design decision (the bell notice as the
one transient surface, and its neutral edge at 3:1 or more) is recorded in the
[user module README](../../README.md).

## The port this feature listens to

Pages never import this feature. They raise outcomes through the port, which lives outside the
module so that any page can use it:

- `src/lib/notifications/`: the container-free Zustand outlet store
  (`use-notification-outlet-store.ts`), the actions that raise and dismiss
  (`notification-outlet-actions.ts`, `notification-raise-builder.ts`) and the port types in
  `types/` (`NotificationDraftSet`, `NotificationView`, `ShownNotification`,
  `NotificationOutletState` and the others).
- `src/hooks/use-notifications.ts`: `useNotifications()` returns the `NotificationsPort`
  (`src/hooks/types/notifications-port.ts`): `raise`, `dismiss`, `dismissAll`,
  `publishFocus` and `clear`.
- The read hooks beside it: `useShownNotifications`, `useNotificationViews`,
  `useRetiringNotificationViews`, `useNotificationFocus`, `useNotificationFocusReturn` and
  `useNotificationAnnouncement`. The focus return goes to the page's published control (Save, or
  its fallback), then to the last resort the caller passes: the bell.

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

## Isolation rule: no user-module imports

Nothing in this folder may import from the rest of `src/modules/user/`; the dependency-cruiser rule
`notifications-feature-self-contained` fails the build on such an import. The feature reaches only
shared code outside the module: the port (`src/lib/notifications`, the hooks in `src/hooks/`),
shared components (`ui-app-header`, `ui-bell-notice`, `ui-notification-history`,
`ui-notification-outlet`), `src/lib/reliability`, `src/lib/locale-catalog`, `@/i18n` and the route
and registrar types. The public barrel (`index.ts`) exports types only.

## The token and the hook seam

`NOTIFICATION_TOKENS.NotificationRepository` (`tokens.ts`) is the DI token, and
`NotificationsRegistrar` (`di.ts`) registers the in-memory singleton under it by value.
`src/config/dependency-injection-config.ts` applies the registrar with one import and one array
entry, after the user module registrar. Nothing in `src/` resolves the token today: the
registration is the seam for container code.

The container-free shell cannot resolve the token: resolving it would load tsyringe and the
composition root on the paint path of every protected page. It calls `useNotificationRepository()`
(`hooks/use-notification-repository.ts`), the one seam the bell uses. The hook reads
`NotificationRepositoryContext`, exported from the same file, whose default value is the singleton;
nothing in `src/` provides another value, so the app always gets that instance, and a unit test
resolves the token and asserts it is that very instance. A real adapter therefore has to change two
places: the registration in `di.ts` and the instance the hook returns (its context default, or a
`NotificationRepositoryContext.Provider` around the slot). Changing the registration alone leaves
the bell on the mock, and that unit test fails. Storybook's `withFreshNotificationRepository(seed?)`
provides a new `InMemoryNotificationRepository` per story through that context, so one story marking
rows read never reaches the next.

`features/notifications/di.ts` is not in `DI_COMPOSITION_ROOTS` (`.dependency-cruiser.js`), whose
module entry is `^src/modules/[^/]+/config/di[.]ts$`, so the
`no-di-config-import-outside-composition-root` rule does not guard it. The boundary rules do: an
importer outside the module is stopped by `no-module-internal-imports` (the aggregator is its one
exemption), a sibling feature by `no-cross-feature-imports`, and the module's shared layers by
`no-feature-internal-imports`. The file imports tsyringe as a type only. The gap is recorded here
rather than closed by widening that list.

## Hooks

All hooks in `hooks/` are container-free and read the repository through
`useNotificationRepository()`.

- `useNotificationRecorder(report)` records every raise of the outlet store once and reports a
  failed write as `app-shell:notifications-record`. The store's `recorded` field holds the revision
  of the last recorded raise, so the batch raised before this lazy slot mounts is recorded on mount
  and a remount never records a batch twice. The store keeps the latest batch only: of two raises
  made before the first mount, the earlier one is shown and announced but not recorded, and a batch
  whose page was left before the mount is not recorded.
- `useNotificationHistory(revision, report)` returns the records newest first, the unread count,
  `markAllRead` and `refresh`; it reloads on mount, on each revision and after `markAllRead`. A
  rejected `list` or `countUnread` is reported as `app-shell:notifications-list` and keeps the last
  snapshot; a rejected `markAllRead` is reported as `app-shell:notifications-mark-read` and leaves
  the rows unread.
- `useBellDisclosure(layout)` owns the bell's open state and `visited`. Opening dismisses the
  merged card; an outcome raised while the panel is open is listed there, and its card waits until
  the panel closes. Escape, a pointerdown or focus leaving the bell wrapper, a
  route change and a layout change close it. It is built from `useBellOutsideClose`,
  `useBellFocusOut`, `useBellDismissal` and `useBellContextClose`.

- `useBroadcastEvents(report)` opens the broadcast stream while the `notificationEventsUrl` setting
  names a service, records each event as unread, and returns how many have settled; the slot adds
  it to the recorder's revision, so the bell reloads for either.

## Broadcast events

[notification-service](https://github.com/VilnaCRM-Org/notification-service) streams the events of
one Kafka topic. It stores nothing and authorizes no subscriber: its `SECURITY.md` forbids anything
meant for one user on the topic. The owner therefore decided on 2026-11-23 that the bell takes
**broadcast events only**, and only when `APP_CONFIG_NOTIFICATION_EVENTS_URL` is set. Personal
notifications wait for authorized subscriptions there and for user-service #526 and #527.

- **Contract (ours, to be agreed with the service):** event type `crm.broadcast`, envelope
  `{ id, type, occurredAt, data: { code } }`. `BroadcastEventParser` accepts the codes
  `maintenance_planned` and `new_version` and maps each to a `notification_center.broadcast.*` key
  of this catalog. Text in an event is never shown, and any other event is dropped.
- **Delivery:** `BroadcastEventClient` follows the service's streaming protocol over SSE. It drops
  repeated envelope ids (the newest 500), lets the browser reconnect an interrupted stream, and
  reopens a closed one after the last event id, with a delay that doubles up to 30 s and has a
  random part. It sends no token and no cross-origin credentials (`withCredentials` stays off); an
  `EventSource` still sends the cookies of its own origin, so a stream served from the app's origin
  receives them.
- **Limits:** a page that loads receives live events only, and the in-memory records go with a
  reload, like every other record here.

## Components

- `BellNotifications` (`components/bell-notifications.tsx`) is the bell connector. It renders
  the enabled `HeaderIconButton` with its `disclosure` (the button draws the alert badge and the
  single unread-count description, `notification_center.bell.unread_count_*`, or none at zero), the
  always-present `UINotificationHistoryFrame` host its `aria-controls`
  names, and the merged outcome card. It reads
  `useNotificationHistory(revision)` and `useBellDisclosure(layout)`, anchors the panel under the
  bell through `useBellAnchor`, and registers this feature's catalog on `@/i18n` when the module
  evaluates, so the panel and the card translate on every protected page.
- `NotificationHistoryPanel` (chunk `notifications-history`) is the panel content. It mounts in
  the host on the first open and stays mounted, so its loader runs once; the host's deferred
  `RouteFallback` covers the wait. It receives the records and `onMarkAllRead` from the bell.
- `BellOutcomeNotice` (chunk `notifications-notice`) draws the shown items as `UIBellNotice`. It
  sits in its own `Suspense` with a `0 × 0` `aria-hidden` fallback, so neither the bell nor the
  badge suspends on it. Its edge is neutral for every kind; only the row icons keep the status
  colour.
- Each loader reports a final chunk failure as `app-shell:notifications-history` or
  `app-shell:notifications-notice` and resolves to an empty component, so the bell keeps working.

- `NotificationsShellSlot` (`components/notifications-shell-slot.tsx`) is the shell slot of
  every protected page. It calls `useNotificationRecorder(onChunkFailure)`,
  which records each raise once and reports a rejected write as `app-shell:notifications-record`,
  and `useBroadcastEvents(onChunkFailure)`, and renders `BellNotifications` with the shell `layout`
  and the sum of both revisions, so the badge counts every recorded outcome and broadcast. It
  declares no `Suspense`: the shell slot factory's
  boundary waits for its chunk inside the fixed-size `BellSlotFrame`, and the panel and the card
  are caught by the boundaries `BellNotifications` owns.

The route contract `routes/index.ts` (`user.notifications`, no routes of its own) declares
`shell.notifications`, which lazily imports the slot as the `notifications-shell` chunk; the
route registry appends it, so the composer mounts the slot on every protected page.

## Chunks

| Chunk                   | Holds                                | Loads                      |
| ----------------------- | ------------------------------------ | -------------------------- |
| `notifications-shell`   | slot, recorder, broadcast, bell      | every protected page       |
| `notifications-history` | `NotificationHistoryPanel`           | the first open of the bell |
| `notifications-notice`  | `BellOutcomeNotice`, the merged card | every protected page       |

## Extraction checklist

1. Move this folder (and its tests) to `src/modules/notifications/`.
2. Re-point `src/routes/registry.ts` and the `src/config/dependency-injection-config.ts` entry.
3. Rename this feature's catalog and owner paths in `config/i18n-catalog-policy.json`.
