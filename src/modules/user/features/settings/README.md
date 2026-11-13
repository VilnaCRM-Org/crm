# Settings feature

The user settings page (issue #330): `/settings`, a protected route registered in every
environment, with no feature flag. A signed-in user reads their profile, changes the name, the
e-mail and the password in three forms, one thing saved at a time, resends the confirmation link
and sees every outcome as a toast or a field error. The decisions are recorded in
`## User Settings decisions` of the
[user module README](../../README.md).

## What is here

- `routes/index.ts` — the `user.settings` route contract.
- `routes/user-profile/index.tsx` — `UserProfile`, the page: title, heading, subtitle, grid,
  toast queue.
- `components/` — `user-profile-settings` (states), `profile-header`, `profile-form`
  (`ProfileSectionForm`, `SectionFields`, `ClearButton`, `EmailStatusRow`), `change-password`,
  `settings-grid`, `social-networks`, `two-factor-settings` (the two-factor card, issue #331),
  `qr-code-image` (the setup QR code, drawn as one inline SVG path) and `user-menu` (the
  app-shell chip and menu, issue #362, with its own lazy `user_menu.*` catalog).
- `components/two-factor-settings/` — `TwoFactorSettings` calls `useTwoFactorSettings` and hands
  the result to `TwoFactorPanel`, which picks one view from a `Record<TwoFactorSettingsView, …>`
  table: `OffView`, `SetupView`, `CodesView`, `OnView`, `DisableView`, `RegenerateView` and
  `ReauthView`. The pieces they share are the card header and status heading, the setup guide
  (`SetupGuide`, `StepItem`, `ScanStepBody`, `KeyBlock` with its copy button and info tooltip), the
  confirmation form and its code fields, the recovery `CodesBlock` and `SavedCheckbox`, and
  `OnActions`.
- `components/user-menu/user-menu-slot.tsx` — `UserMenuSlot`, the `user-menu` chunk entry. It
  mounts one `UserMenu` for its whole life and owns the identity it shows. It lazy-loads only the
  identity source, `CurrentUserMenu` (chunk `current-user`), which
  renders nothing, calls `useCurrentUser()` and reports the identity through `onIdentity`. The
  Suspense fallback around it renders nothing too, because the loading UI is the name-less chip
  outside the boundary. So the chip, its focus, an open menu with its focused item, the menu id and
  the once-only Sign out survive the chunk arriving: only the chip's name and monogram change. A
  failed chunk is reported once as `app-shell:current-user` and the chip stays name-less.
- The chip's read is container-free, so a protected page never downloads tsyringe, the
  composition root, Apollo or zod for it (mobile Lighthouse script budget on `/`).
  `useCurrentUser` takes the `session` from `ProtectedRoute`'s outlet context
  (`ProtectedSessionContext`) and calls `currentUserSource.read(session, signal)`
  (`utils/current-user-source.ts`). `CurrentUserClient` posts the same `CurrentUser` document the
  profile repository sends (a unit test pins it to the generated `CurrentUserDocument`) to the
  runtime GraphQL URL, falling back to the build-time one, with the Bearer token, `X-Request-Id`,
  `X-Correlation-Id` and the request deadline. `CurrentUserResponseParser` narrows the answer by
  hand and reads only `initials` (the full name). A transport 401 ends the session through
  `session.end(token)`, which, like `SessionLinkFactory`, only ends it while the store still holds
  the token the request carried; a GraphQL error with extension status 401 only resets the chip to
  pending. Every other failure, a GraphQL `Access Denied.` included, keeps the last good name or
  shows the name-less chip,
  and is captured through `observabilityCore` (`source: 'settings:current-user'`) unless the
  caller aborted the read. The settings page itself still reads through `ProfileProvider`.
- `hooks/` — `useProfileLoad`, `useProfileSave`, `useEmailResend`, `useEmailRow`,
  `useProfileFormRules`, `useProfileFormModel`, `useSettledFocus`, `useSectionReveal`,
  `useCollapseFocus`, `useBlurHold`, `useDisplayName`,
  `useCurrentUser`, `useChipLabel`, `useUserMenu`, `useUserMenuKeys`.
- `hooks/` for two-factor — the compose hook `useTwoFactorSettings` over `useTwoFactorTransition`
  (the view state store) and the three operations `useTwoFactorSetup`, `useTwoFactorDisable` and
  `useRecoveryCodesRegenerate`, which settle through `useTwoFactorSettle`. The panel reads
  `useTwoFactorHeading`, `usePreviousView`, `useStatusText` and `useTwoFactorBanner`; the views
  build their forms with `useSetupFormProps`, `useCodesFormProps`, `useDisableFormProps`,
  `useRegenerateFormProps`, `useCodeFormProps`, `useCodeSubmit`, `useSettledSubmit` and
  `useConfirmationShell`. Focus and feedback are `useConfirmFieldFocus`, `useOptionalFocus`,
  `useEscapeCancel`, `useCopyToClipboard`, `useCopyAnnouncement`, `useKeyInfoTooltip`,
  `useKeyInfoControls` and `useKeyInfoDismissal`.
- `data-providers/` — `ProfileProvider` and `TwoFactorSettingsProvider`, the translation
  boundaries.
- `transformers/` — `GraphQLProfileTransformer` and `GraphQLTwoFactorSettingsTransformer`.
- `repositories/` — `GraphQLProfileRepository` and its three GraphQL document seams, and
  `GraphQLTwoFactorSettingsRepository` with its four (`setup`, `confirm`, `disable` and
  `regenerate-recovery-codes` mutations, each a `.graphql` document beside its typed mutation).
- `utils/` — `ProfileChangeDetector`, the zod `response-schemas`, and the container-free chip read:
  `currentUserSource`, `CurrentUserClient`, `CurrentUserResponseParser`.
- `types/` — type-only files, grouped by source area (TB-1).
- `i18n/{en,uk}.json` — the lazy settings catalog.

## Contract

- The route is always registered and guarded by `ProtectedRoute`; the home page links to it
  (see `src/routes/README.md`).
- The page registers its catalog through the shared `lazyCatalogLoader`
  (`src/lib/locale-catalog`) when the route module evaluates,
  before `usePageTitle('settings.title')` runs. The catalog is listed in
  `config/i18n-catalog-policy.json`, so the merged `localization.json` holds no `settings.*` key.
- The page imports nothing from the auth feature: shared form pieces live in `src/components` and
  `src/modules/user/lib`. `tests/unit/tooling/settings-layer-edges.test.ts` pins that no settings
  source file imports `@auth` or `src/modules/user/features/auth`, and the layer edges below.

## Shared pieces

Each shared piece has one owner (architecture §15.2). Imported from #315 (password recovery), not
copied:

- `UserServiceErrorTransformer` (`src/modules/user/transformers`) and `UserEntity`.
- `UIForm`, the name, e-mail and password validators, `useAbortableSubmit` and `useOfflineSubmit`.

Built here:

- The `submitRef`, `submitSx` and `footer` props of `UIForm`.
- `SessionLinkFactory` (`@auth/repositories`), where a transport 401 on an Apollo operation ends
  a session. No settings file imports it: the user module's composition root
  (`src/modules/user/config/di.ts`) puts its link on the Apollo client the settings repositories
  receive by injection. The chip's container-free read ends a session through the outlet `session`
  instead.
- The `UI*` moves of #315's field pieces (`UIFormField`, `UIPasswordField`,
  `UIPasswordPolicyRules`, `UIServerFieldError`) and the policy catalog.
- `UIToastStack`, `UIToast` and `useToastQueue`, used by settings alone (R16): no timer, a polite
  region for success texts and an assertive one for error texts, both always mounted, at most three
  on screen. The two-factor card reports inside its own card.
- The `SettingsGrid`, whose second slot holds the two-factor card.
- The two-factor card itself (#331): `TwoFactorSettings` in that slot, the `TwoFactorSettingsEntity`,
  the `TwoFactorDto` and `TwoFactorCodeNormalizer` in the user module, and `twoFactorStatus` /
  `setTwoFactorStatus` on `ProtectedOutletContext`, which `ProtectedRoute` provides and through
  which the card reads and records the account's two-factor status.

Two-factor authentication (#331) imports these rather than rebuilding them (architecture §15.3):
`SessionLinkFactory`, the `UserProfile` shell and its grid slot, the `UIForm` `footer` slot, the
`error.text` token and the `session_ended` notice. The card reuses `UserServiceErrorTransformer`
through `TwoFactorSettingsProvider` and signs the user out through the outlet `signOut`.

## Page tree

```text
UserProfile [component]<route>          title, toast queue, useProfileLoad
└ UIShellContent                      15 / 26 / 12 px insets, shared with home
  ├ h1 "Налаштування", subtitle
  ├ SettingsGrid                        profile column; the second column holds the 2FA card
  │ ├ UserProfileSettings               loading | failed | ready
  │ │ ├ UILiveStatus                    "Завантаження профілю…" while loading, set after mount
  │ │ ├ UILiveStatus (assertive)        "Не вдалося завантажити профіль" while failed
  │ │ ├ ProfileSkeleton (aria-hidden) | ProfileLoadError (message; the alert announces it)
  │ │ └ card: ProfileHeader, ProfileForm
  │ │     ├ ProfileSectionForm fullName     UIForm key=saved, submitRef, onInvalid
  │ │     │ ├ "Ваше ПІБ"; once changed: "Пароль для зміни імені", "Зберегти ім’я", ClearButton
  │ │     │ └ UIServerFieldError per field, p role=status
  │ │     ├ h2 "Особисті дані"
  │ │     ├ ProfileSectionForm email        UIForm key=saved, submitRef, onInvalid
  │ │     │ ├ e-mail + EmailStatusRow; once changed: "Пароль для зміни пошти", "Зберегти пошту",
  │ │     │ │ ClearButton
  │ │     │ └ UIServerFieldError per field, p role=status
  │ │     └ ProfileSectionForm password     UIForm key=saved, submitRef, onInvalid, ClearButton
  │ │       ├ ChangePassword key=cleared: h2 "Пароль", both passwords, policy rules
  │ │       └ UIServerFieldError per field, p role=status
  │ ├ SocialNetworks                    h2 "Соціальні мережі", four presentational tiles
  │ └ TwoFactorSettings                 section, useTwoFactorSettings; reports inside its card
  │   └ TwoFactorPanel                  CardHeader (key=view) + one view, ArrivalContext
  │     ├ OffView                       off: UIForm "Почати налаштування", OffGuide, banner
  │     ├ SetupView                     setup: SetupGuide (QrCodeImage, KeyBlock), code field
  │     ├ CodesView                     codes: CodesBlock, SavedCheckbox, confirm
  │     ├ OnView                        on: OnActions (disable, regenerate)
  │     ├ DisableView                   disable: code field, Cancel
  │     ├ RegenerateView                regenerate: confirm, Cancel
  │     └ ReauthView                    reauth: message, "sign in again" button
  └ UIToastStack                        returns focus to the Save, or the input if its Save hid
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
| `TwoFactorSettings`   | `components/two-factor-settings` and `components/qr-code-image`  |
| React hook            | `useProfileLoad`, `useProfileFormModel` over `useProfileSave`, … |
| React hook (2FA)      | `useTwoFactorSettings` over the three two-factor operation hooks |
| Data provider         | `ProfileProvider` (three `@inject` collaborators)                |
| Data provider (2FA)   | `TwoFactorSettingsProvider` (three `@inject` collaborators)      |
| Transformer           | `GraphQLProfileTransformer`, over #315's error transformer       |
| Transformer (2FA)     | `GraphQLTwoFactorSettingsTransformer`                            |
| Repository            | `GraphQLProfileRepository` and the three document seams          |
| Repository (2FA)      | `GraphQLTwoFactorSettingsRepository` and the four document seams |
| Repository → API edge | the container's Apollo client with the `SessionLinkFactory` link |
| State                 | `useAuthStore`, read by the link and by `ProtectedRoute`         |

No file names a controller, a service or a handler: the board has none. Gaps that remain gaps: the
board's social-network component is presentational only — `SocialNetworks` draws the Figma card as a
list rather than buttons, each tile telling a screen reader that linking is not available yet,
because user-service has no link, list or unlink — the header menu with the "Log-out" edge is now
drawn (the app-shell user menu in `components/user-menu/`, declared as `shell.userMenu` in
`routes/index.ts`, issue #362) and is no longer one of them, nor is the two-factor card (#331),
whose layers are in the rows above, and the session link reads and resets `useAuthStore`
without a Repository → State edge on the board.

## Data provider outcomes

`ProfileProvider` never throws and never leaks a status, a server message or a generated type.
Its collaborators are the Repository, the Transformer and `UnseenFailureReporter`: a failure that
never reached the link (a programming error) is captured once, as #315's recovery flow does,
before it becomes `failed: rejected`.

| Method           | Outcome                     | Meaning                                        |
| ---------------- | --------------------------- | ---------------------------------------------- |
| `read`, `update` | `ok` with a `UserEntity`    | the profile as stored                          |
| `update`         | `invalid` with field errors | name, e-mail, current or new password rejected |
| `resend`         | `sent`                      | the link was sent; carries the stored flag     |
| any              | `failed: session_ended`     | HTTP 401                                       |
| any              | `failed: rate_limited`      | HTTP 429                                       |
| any              | `failed: transient`         | network, 5xx, time-out or abort                |
| any              | `failed: rejected`          | any other answer, including "Access Denied."   |

`session_ended` is the one outcome the page answers with nothing, because the link has already
cleared the token and `ProtectedRoute` redirects. "Access Denied." clears no token, so a page that
receives it is still signed in; it is `rejected` and gets the same error toast as any refused
Save, read or resend (amended 2026-11-02, superseding the earlier `session_ended` mapping).

Field error reasons are `name_rejected`, `email_taken`, `email_invalid`, `password_wrong`,
`password_not_accepted` and `new_password_rejected`. The hooks turn every toast reason into an
i18n key; a field error reason is copy that `ProfileSectionForm` looks up in its module-private
`ERROR_MESSAGES` table when it renders the error under its field, and it focuses the first
field, in field order, that has one. A `currentPassword` error goes to the password field of the
section that sent it. A Save that settles with a toast moves focus when focus has fallen to the
page body or is still inside the form, as after Enter in a field (`useSettledFocus`), so a control
the user moved to outside the form keeps focus: to that form's Save, or to the text input when a
name or e-mail save succeeded and hid its Save. When Save is itself disabled as it settles, because
the connection dropped during the Save, focus that fell to the page body moves to the `h1`, the same
fallback closing a toast uses, and a field the user is still in keeps focus. `useCollapseFocus`
does the same for a Clear that removes itself.

Each section sends only its own field and its own password (`ProfileChangeDetector.detect`), and a
form remounts only on its own successful save (`key=saved`), so a draft in another form survives.
`ProfileSectionForm` calls one compose hook, `useProfileFormModel`, which calls `useProfileSave` and
`useProfileFormRules`; `EmailFields` calls `useEmailRow` (over `useEmailResend`); all take the
hook-owned `ProfileEditContext`. A resend that settles after a Save changed the address has no visible
effect: before it confirms, toasts or moves focus it asks `adoption.isCurrent(email)` with the
e-mail it was issued for, which `adopt` answers synchronously (a ref written before the dispatch),
so even a resend that settles before React commits the adopted entity is dropped. The reducer's
`confirm` still carries the e-mail as a second guard. Save is never held by a resend. A Save for the
unchanged address that succeeds while a resend is in flight moves `adoption.revision()` on, so the
resend still shows its toast, because the link was sent, but drops its older `confirmed` flag. A
failed Save adopts nothing, so the revision stays and the resend applies its confirmation.

## Figma parity

Figma section `6242:41691` is the source of truth; the frames are 1440 (`313:10242`), 1024
(`313:10480`) and 375 px (`313:10606`).

| Layout  | Viewport          | Card                    | Field row                        |
| ------- | ----------------- | ----------------------- | -------------------------------- |
| Phone   | below 768 px      | 8 px from the edges     | label over a 48 px input         |
| Tablet  | 768 px to 1024 px | one 749 px column       | 173 px label column, 70 px input |
| Desktop | above 1024 px     | 675 px, 2FA card beside | 152 px label column, 64 px input |

- **Desktop starts above 1024 px**, so the 1024 px tablet frame gets its own layout. The
  2FA card sits in an implicit grid column: with one section there is no empty column.
- **Desktop content is centred beside the sidebar** (owner decision of 2026-11-04,
  [DV-12](../../../../components/ui-app-shell/README.md#dv-12-the-settings-page-centres-beside-the-sidebar-owner-decision-2026-11-04)).
  Above 1024 px the heading and the grid shrink to the grid's columns (`width: fit-content`) and
  centre in the content column. Where the columns need all the room there is nothing to centre, so
  the expanded sidebar keeps Figma's x 262 at 1440 and x 263 at 1024; on the rail at 1440 the gaps
  to the rail and to the screen edge are both 95 px (x 179), where Figma draws x 137. The toolkit
  `UIContainer` pads 32 px at 1024 and 124 px at 1440 (AV-7 measured it and found it does not yield
  the Figma start), so the page renders inside the shared `UIShellContent` (15 / 26 / 12 px insets;
  see
  [frame and settings alignment](../../../../components/ui-app-shell/README.md#measured-against-figma-frame-and-settings-alignment-issue-362)
  in the shell README).
- **The name row sits under the header, above "Особисті дані"**, as `315:11316` draws it: the
  header leaves 20 / 25 / 28 px to it, its label is "Ваше ПІБ" (Figma "Ваше ФИО"), and the
  "Особисті дані" section holds the e-mail only. The loading skeleton follows the same order.
  The field holds the full ПІБ (surname, first name, patronymic), while the header greets by
  first name and surname: three or more words show as the second then the first ("Маслова
  Євгенія Олегівна" → "Євгенія Маслова"), one or two words show as typed, and the monogram
  follows the greeted name.
- **"Новий пароль" shows nothing extra at rest.** Figma draws no hint and no rule list, so the
  field's hint is visually hidden (still in `aria-describedby`) and the four policy rules
  appear while the field has focus or a value. When an empty field loses focus `useBlurHold` keeps
  them for 200 ms more, so a click on Save that starts the blur lands before Save moves up. A new
  password equal to the current one is refused once the policy passes.
- **"Вітаємо!" uses the Figma grey `#969B9D`** at 2.81:1, below the 4.5:1 text minimum, by the
  product owner's call; `#settings-greeting` carries a scoped `color-contrast` exception in
  `tests/utils/a11y/axe-config.ts`, tracked with the other palette debt in #276.
- **The pencil badge is decoration** (`315:11418`): a 26 px `#1EAEFF` disc with the white
  `edit-02` outline at the monogram's corner, 5 px lower on a phone, inside the hidden
  monogram. Uploading a photo waits for user-service#519 and is tracked in #361.
- **The social networks card sits under the profile card in one column** (`476:46530`,
  `386:27239`, `386:27457`), 12 / 15 / 19 px below it, so the 2FA card still takes the second
  grid column. Its tiles follow each frame as drawn, including the ones that disagree: a 1 px
  border below 1025 px and 2 px above, 9 / 12 / 4 px between columns, a 42 px bottom inset on
  desktop against 23 px at the top, icon-only tiles below 768 px that fill the columns first
  (Google and GitHub on top, as on the sign-in provider grid), and the Figma heading copy
  "Социальные сети" translated to "Соціальні мережі" / "Social networks".
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
- **Page top.** The heading starts 24 px below the top of the content on a phone and tablet and
  28 px on desktop, the offsets each frame draws under its top bar.
- **Heading size.** The 1024 px tablet frame draws "Налаштування" at 28 px (`313:10484`, 34 px
  tall) and the 1440 and 375 px frames at 22 px (`313:10257`, `313:10628`, 26 px tall), so the
  28 px rule starts at 1024 px, not above it, and 1440 px returns to 22 px.

Where the frames contradict each other or the copy, the page follows one reading:

- **Card top (F-02).** Desktop follows `313:10242`: 12 px between the subtitle and the card.
- **Tablet pills.** The frame draws two 339 px pills and an 8 px gap, 686 px, in a 685 px content
  box; the pills are 339 and 338 px, so 339 + 8 + 338 fills the 685 px box and both edges sit on
  whole pixels.
- **Labels.** The Ukrainian labels can wrap in the label column, so a label is as tall as its
  input and centres its text on it, also when a field error grows the row.
- **Toasts (T13, T15).** One layout from the desktop and phone frames, bottom-right 12 px from
  the edge on desktop. An action sits on its own row under the message.
- **Phone values (M-20).** Field values are `#1A1C1E` as on desktop and tablet, not the
  placeholder grey the phone frame draws.

### The two-factor card

Frames `313:10242`, `313:10480`, `313:10606` (setup) and `315:11502`, `315:12300`, `318:13133`
(connected), measured in Firefox and Chromium against the live page, relative to the card. Every
value below is both the Figma value and the rendered one:

| Property       | 1440            | 1024            | 375        |
| -------------- | --------------- | --------------- | ---------- |
| Card width     | 479             | 749             | 359        |
| Logo           | 32,24 73        | 32,32.5 73      | 18,27 40   |
| Title start    | x 125           | x 125           | x 70       |
| Step 1         | 32,147          | 36,150          | 20,99      |
| Step 2         | 32,206          | 36,223          | 20,152     |
| QR frame       | 72,275 250      | 84,287 297      | 62,202 210 |
| First key chip | 72,533          | 84,593          | 62,421     |
| Info button    | x 312           | x 354           | x 279      |
| Tooltip        | x 155, 334 wide | x 179, 373 wide | not drawn  |

Deliberate differences, each for a reason a frame cannot show:

- **Start stays** (owner decision of 2026-11-04). Figma opens on the QR; requesting a secret on page
  load would burn one for every settings visit, so the off view shows the header, the three steps
  and "Почати налаштування".
- **The key wraps.** Figma's sample key has 16 characters and its chip is 226 px; a real key has 32,
  so the chip grows to the column and wraps to two lines where it must. Everything below it moves
  down by that difference.
- **Confirmation stays below step 3.** No frame draws the six cells or "Підтвердити", which setup
  cannot complete without, so the setup card is taller than the frame's 748 px.
- **The info glyph is `#57595B`, not `#969B9D`** (WCAG 1.4.11: 2.81:1 on white for the only visible
  sign of the control; 7.03:1 now), the colour of the copy glyph beside it.
- **The phone "Вимкнути" is 44 px, not 40**, keeping the mobile lane's primary-control floor, and the
  regenerate button, which no frame draws, stacks under it in the same text column.
- **Copying gives visible feedback**: the glyph becomes a check on success and the manual instruction
  appears on failure, because an icon-only button has no label to change.

The tooltip has no frame at 1025 to 1439 px, where the card is narrower than it: there it aligns to
the step's right edge without an arrow, and on a phone it fills the step, so it can never add
horizontal scroll. It opens on hover, focus and tap, stays while hovered, and closes on Escape, on
leaving and on a press elsewhere. It drops the frame's second sentence, that a reset takes at
least 7 days (owner decision of 2026-11-04): nothing confirms that process exists.

States Figma does not draw follow the card: the skeleton and the load failure render inside the
card, the skeleton reserves the loaded card's height at each layout, and "Спробувати ще раз" is
the outlined "Очистити" pill. The card's buttons and focusable headings take the shared
`focusVisibleRing` (`src/styles/focus-ring.ts`, 2 px `#404142`, offset 2 px, NFR-9); the profile
forms' buttons and the page `h1` keep #330's 2 px `#1A1C1E` ring. Text links (the resend control
and the home "Налаштування" link) use a 2 px `#0074B5` ring and darken to `#00588A` on hover.
Deliberate colour deviations (greeting, resend link, field errors, toast
icon and text) are recorded in the user module README.
