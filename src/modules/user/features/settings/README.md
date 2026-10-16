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
- `routes/user-profile/settings-catalog-loader.ts` — registers the lazy `settings.*` catalog.
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
- The page registers its catalog through `SettingsCatalogLoader` when the route module evaluates,
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

- `UIToastStack`, `UIToast` and `useToastQueue`: no timer, one polite status region, error
  toasts with `role="alert"`, at most three on screen.
- The `RouteFlagGate` and the route `flag` field, and the `SettingsGrid` whose second slot is
  reserved for the two-factor card.

## Page tree

```text
UserProfile [component]<route>          title, toast queue, useProfileLoad
└ UIContainer
  ├ h1 "Налаштування", subtitle
  ├ SettingsGrid
  │ └ UserProfileSettings               loading | failed | ready
  │   ├ UILiveStatus                    "Завантаження профілю…" while loading
  │   ├ ProfileSkeleton (aria-hidden) | ProfileLoadError (role=alert, retry)
  │   └ card: ProfileHeader, ProfileForm
  │       └ UIForm key=version, submitRef=saveRef, footer=ClearButton
  │         ├ h2 "Особисті дані": full name, e-mail + EmailStatusRow
  │         ├ ChangePassword: h2 "Пароль", current password, new password, policy rules
  │         ├ UIServerFieldError per field, p role=status (no changes)
  └ UIToastStack                        returns focus to Save
```

## Layer stack

The board's `React hook ⇄ Data provider ⇄ Transformer → Repository → API` stack. A component never
reaches a Repository, a Transformer or a Data provider; a hook reaches the Data provider through
`useService`, by type only.

| Board box             | Implemented by                                                    |
| --------------------- | ----------------------------------------------------------------- |
| `UserProfile` route   | `routes/user-profile/index.tsx`                                   |
| `UserProfileSettings` | `components/user-profile-settings` and its child components       |
| `ChangePassword`      | `components/change-password`                                      |
| React hook            | `useProfileLoad`, `useProfileSave`, `useEmailResend`              |
| Data provider         | `ProfileProvider` (three `@inject` collaborators)                 |
| Transformer           | `GraphQLProfileTransformer`, #315's `UserServiceErrorTransformer` |
| Repository            | `GraphQLProfileRepository` and the three document seams           |
| Repository → API edge | the container's Apollo client with the `SessionLinkFactory` link  |
| State                 | `useAuthStore`, read by the link and by `ProtectedRoute`          |

No file names a controller, a service or a handler: the board has none. Gaps that remain gaps:
the board's social-network component is not built (user-service has no link, list or unlink), the
header menu with the "Log-out" edge is app-shell work and the home link stands in for it, the
two-factor card is #331's, and the session link reads and resets `useAuthStore` without a
Repository → State edge on the board.

## Data provider outcomes

`ProfileProvider` never throws and never leaks a status, a server message or a generated type.

| Method           | Outcome                     | Meaning                                        |
| ---------------- | --------------------------- | ---------------------------------------------- |
| `read`, `update` | `ok` with a `UserEntity`    | the profile as stored                          |
| `update`         | `invalid` with field errors | name, e-mail, current or new password rejected |
| `resend`         | `confirmed`                 | the link was sent; carries the stored flag     |
| any              | `failed: session_ended`     | HTTP 401 or "Access Denied."                   |
| any              | `failed: rate_limited`      | HTTP 429                                       |
| any              | `failed: transient`         | network, 5xx, time-out or abort                |
| any              | `failed: rejected`          | any other answer, including an unreadable one  |

Field error reasons are `name_rejected`, `email_taken`, `email_invalid`, `password_wrong`,
`password_not_accepted` and `new_password_rejected`; the hooks turn each into an i18n key.
