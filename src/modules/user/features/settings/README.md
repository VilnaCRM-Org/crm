# Settings feature

The user settings page (issue #330): `/settings`, a protected route behind the `userSettings`
runtime flag. A signed-in user reads their profile, changes the name, the e-mail and the
password in one form, resends the confirmation link and sees every outcome as a toast or a field
error. The decisions are recorded in `## User Settings decisions` of the
[user module README](../../README.md).

## What is here

- `routes/index.ts` — the `user.settings` route contract.
- `routes/user-profile/index.tsx` — `UserProfile`, the page: title, heading, subtitle, grid,
  toast queue.
- `components/` — `user-profile-settings` (states), `profile-header`, `profile-form`
  (`ClearButton`, `EmailStatusRow`), `change-password`, `settings-grid`.
- `hooks/` — `useProfileLoad`, `useProfileSave`, `useEmailResend`, `useEmailRow`,
  `useProfileFormRules`, `useProfileFormModel`, `useSettledFocus`.
- `data-providers/profile-provider.ts` — `ProfileProvider`, the translation boundary.
- `transformers/graphql-profile-transformer.ts` — `GraphQLProfileTransformer`.
- `repositories/` — `GraphQLProfileRepository` and the three GraphQL document seams.
- `utils/` — `ProfileChangeDetector` and the zod `response-schemas`.
- `types/` — type-only files, grouped by source area (TB-1).
- `i18n/{en,uk}.json` — the lazy settings catalog.

## Contract

- The route is always registered; the `RouteFlagGate` shows the not-found page while
  `userSettings` is off, so the page chunk is never requested (see `src/routes/README.md`).
- The page registers its catalog through the shared `lazyCatalogLoader`
  (`src/lib/locale-catalog`) when the route module evaluates,
  before `usePageTitle('settings.title')` runs. The catalog is listed in
  `config/i18n-catalog-policy.json`, so the merged `localization.json` holds no `settings.*` key.
- The page imports nothing from the auth feature: shared form pieces live in `src/components` and
  `src/modules/user/lib`. `tests/unit/tooling/settings-layer-edges.test.ts` pins the layer edges
  below.

## Shared pieces

Imported from #315 (password recovery), not copied:

- `UserServiceErrorTransformer` (`src/modules/user/transformers`) and `UserEntity`.
- `UIForm`, `UIFormField`, `UIPasswordField`, `UIPasswordPolicyRules`, `UIServerFieldError`, the
  name, e-mail and password validators, `useAbortableSubmit` and `useOfflineSubmit`.
- `SessionLinkFactory` (`@auth/repositories`), the one place a transport 401 ends a session.

Owned here for #331 (two-factor authentication), which imports them rather than rebuilding them:

- `UIToastStack`, `UIToast` and `useToastQueue`: no timer, a polite region for success texts and
  an assertive one for error texts, both always mounted, at most three on screen.
- The `RouteFlagGate` and the route `flag` field, and the `SettingsGrid` whose second slot is
  reserved for the two-factor card.

## Page tree

```text
UserProfile [component]<route>          title, toast queue, useProfileLoad
└ UIContainer
  ├ h1 "Налаштування", subtitle
  ├ SettingsGrid
  │ └ UserProfileSettings               loading | failed | ready
  │   ├ UILiveStatus                    "Завантаження профілю…" while loading, set after mount
  │   ├ UILiveStatus (assertive)        "Не вдалося завантажити профіль" while failed
  │   ├ ProfileSkeleton (aria-hidden) | ProfileLoadError (retry described by the message)
  │   └ card: ProfileHeader, ProfileForm
  │       └ UIForm key=version, submitRef=saveRef, footer=ClearButton
  │         ├ h2 "Особисті дані": full name, e-mail + EmailStatusRow
  │         ├ ChangePassword key=cleared: h2 "Пароль", current and new password, policy rules
  │         ├ UIServerFieldError per field, keyed per Save attempt
  │         ├ p role=status (no changes, alternating mark on a repeat)
  └ UIToastStack                        returns focus to Save
```

## Layer stack

The board's `React hook ⇄ Data provider ⇄ Transformer → Repository → API` stack. A component never
reaches a Repository, a Transformer or a Data provider; a hook reaches the Data provider through
`useService`, by type only.

| Board box             | Implemented by                                                   |
| --------------------- | ---------------------------------------------------------------- |
| `UserProfile` route   | `routes/user-profile/index.tsx`                                  |
| `UserProfileSettings` | `components/user-profile-settings` and its child components      |
| `ChangePassword`      | `components/change-password`                                     |
| React hook            | `useProfileLoad`, `useProfileFormModel` over `useProfileSave`, … |
| Data provider         | `ProfileProvider` (three `@inject` collaborators)                |
| Transformer           | `GraphQLProfileTransformer`, over #315's error transformer       |
| Repository            | `GraphQLProfileRepository` and the three document seams          |
| Repository → API edge | the container's Apollo client with the `SessionLinkFactory` link |
| State                 | `useAuthStore`, read by the link and by `ProtectedRoute`         |

No file names a controller, a service or a handler: the board has none. Gaps that remain gaps:
the board's social-network component is not built (user-service has no link, list or unlink), the
header menu with the "Log-out" edge is app-shell work and the home link stands in for it, the
two-factor card is #331's, and the session link reads and resets `useAuthStore` without a
Repository → State edge on the board.

## Data provider outcomes

`ProfileProvider` never throws and never leaks a status, a server message or a generated type.
Its collaborators are the Repository, the Transformer and `ObservabilityService`: a failure that
never reached the link (a programming error) is captured once, as #315's recovery flow does,
before it becomes `failed: rejected`.

| Method           | Outcome                     | Meaning                                        |
| ---------------- | --------------------------- | ---------------------------------------------- |
| `read`, `update` | `ok` with a `UserEntity`    | the profile as stored                          |
| `update`         | `invalid` with field errors | name, e-mail, current or new password rejected |
| `resend`         | `sent`                      | the link was sent; carries the stored flag     |
| any              | `failed: session_ended`     | HTTP 401 or "Access Denied."                   |
| any              | `failed: rate_limited`      | HTTP 429                                       |
| any              | `failed: transient`         | network, 5xx, time-out or abort                |
| any              | `failed: rejected`          | any other answer, including an unreadable one  |

Field error reasons are `name_rejected`, `email_taken`, `email_invalid`, `password_wrong`,
`password_not_accepted` and `new_password_rejected`. The hooks turn every toast reason into an
i18n key; a field error reason is copy that `ProfileForm` looks up in its module-private
`ERROR_MESSAGES` table when it renders the error under its field, and it focuses the first
field, in field order, that has one.

`ProfileForm` calls one compose hook, `useProfileFormModel`, which calls `useProfileSave`,
`useProfileFormRules` and `useEmailRow` (over `useEmailResend`); both take the hook-owned
`ProfileEditContext`. A resend carries the e-mail it was issued for, so one that settles after a
Save changed the address never marks the new address confirmed.

## Figma parity

Figma section `6242:41691` is the source of truth; the frames are 1440 (`313:10242`), 1024
(`313:10480`) and 375 px (`313:10606`).

| Layout  | Viewport          | Card                    | Field row                        |
| ------- | ----------------- | ----------------------- | -------------------------------- |
| Phone   | below 768 px      | 8 px from the edges     | label over a 48 px input         |
| Tablet  | 768 px to 1024 px | one 749 px column       | 173 px label column, 70 px input |
| Desktop | above 1024 px     | 675 px, 2FA slot beside | 152 px label column, 64 px input |

- **Desktop starts above 1024 px**, so the 1024 px tablet frame gets its own layout. The
  2FA slot is an implicit grid column: with one section there is no empty column.
- **Card padding is the Figma inset minus the 1 px border.** The card declares the inline
  insets as `--settings-card-inset-start` / `--settings-card-inset-end`, and the section
  titles and the divider above Save and "Очистити" bleed through them to the card edges.
- **Every override is scoped to the settings styles.** The shared auth field, label, input and
  submit styles are untouched, so `/sign-in`, `/sign-up` and the recovery pages do not move.
- **Rhythm.** Phone: 16 px around every divider and between fields. Tablet: 24 px above and
  below a divider, 13 px from a title to its first field and between fields, 16 px from the last
  divider to the pills. Desktop: 24 px around a divider, 16 px from a title to its first field,
  12 px between fields, 24 px from the last divider to the pills. The unconfirmed row sits 8 /
  10 / 9 px under the input and 15 / 17 / 24 px above the next divider, as each frame draws it.

Where the frames contradict each other or the copy, the page follows one reading:

- **Header to first divider.** Figma puts the name input there; the page puts it under
  "Особисті дані", so the gap is Figma's header-to-content gap: 20 px on a phone, 24 px above.
- **Card top (F-02).** Desktop follows `313:10242`: 12 px between the subtitle and the card.
- **Tablet pills.** The frame draws 339 + 8 + 339 px in a 685 px content box; the pills are
  339 and 338 px so both edges sit on whole pixels.
- **Labels.** The Ukrainian labels can wrap in the label column, so a label is as tall as its
  input and centres its text on it, also when a field error grows the row.
- **Toasts (T13, T15).** One layout from the desktop and phone frames, bottom-right 12 px from
  the edge on desktop. An action sits on its own row under the message.
- **Phone values (M-20).** Field values are `#1A1C1E` as on desktop and tablet, not the
  placeholder grey the phone frame draws.

States Figma does not draw follow the card: the skeleton and the load failure render inside the
card, the skeleton reserves the loaded card's height at each layout, and "Спробувати ще раз" is
the outlined "Очистити" pill. Buttons and the `h1` share the 2 px `#1A1C1E` ring; text links (the
resend control and the home "Налаштування" link) use a 2 px `#0074B5` ring and darken to
`#00588A` on hover. Deliberate colour deviations (greeting, resend link, field errors, toast
icon and text) are recorded in the user module README.
