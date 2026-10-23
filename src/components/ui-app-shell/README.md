# App shell

The shell is the persistent frame of every protected page: the header, the sidebar and the mobile
drawer. Its surfaces are user-agnostic `UI*` components in `src/components/`; nothing here imports
`src/modules/`. Planning artifacts live in `specs/app-shell-navigation/planning-artifacts/`.

## Layouts

`useShellLayout()` returns `'mobile'` below 1024 px, `'tablet'` from 1024 to 1439 px and
`'desktop'` from 1440 px. It reads the two breakpoints from the crm scale (`lg`, `xl`) through
`useMediaQuery` with `noSsr`, so the first render is already the right layout.

## Header

`UIAppHeader` (`src/components/ui-app-header/`) is the 64 px banner. Search, bell and list are
natively `disabled` and described by the visually hidden status "Not available yet"; the mobile
header has no search. The bell and list take an optional badge count that only stories pass: the
header stories feed exactly 1 and 8, and no page, hook or route passes a count. The badge is
painted in the disabled-variant colour `#D0D4D8` that Figma draws on the disabled bell (`451:26214`).
The user slot reserves the chip's box with an `aria-hidden` placeholder until the chip arrives.

### Measured against Figma

Chromium on the dev server at device scale factor 1, `scrollY` 0, `getBoundingClientRect()` and
`getComputedStyle()`; boxes are x, y, width × height in CSS px.

| Row            | Width | Figma             | Measured            | Verdict |
| -------------- | ----- | ----------------- | ------------------- | ------- |
| P-1 header     | 1440  | 0,0, 1440×64      | 0,0, 1440×64        | pass    |
| P-2 logo       | 1440  | 32,8, 143×48.125  | 32,8, 143×48.125    | pass    |
| P-3 search     | 1440  | 600,8, 477×48     | 600,8, 477×48       | pass    |
| P-4 bell       | 1440  | 1087,8, 48×48     | 1087,8, 48×48       | pass    |
| P-5 list       | 1440  | 1145,8, 48×48     | 1145,8, 48×48       | pass    |
| P-6 chip slot  | 1440  | 1203,8, 225×48    | 1203,8, 225×48      | pass    |
| P-39 badge     | 1440  | 34,30 in bell, 18 | 34,30 in bell, 18   | pass    |
| P-40 badge     | 1440  | 34,30 in list, 18 | 34,30 in list, 18   | pass    |
| P-15 header    | 1024  | 0,0, 1024×64      | 0,0, 1024×64        | pass    |
| P-16 logo      | 1024  | 12,8, 143×48.125  | 12,8, 143×48.125    | pass    |
| P-17 search    | 1024  | 271,6, 360×52     | 271,6, 360×52       | pass    |
| P-18 bell      | 1024  | 639,6, 52×52      | 639,6, 52×52        | pass    |
| P-19 list      | 1024  | 699,6, 52×52      | 699,6, 52×52        | pass    |
| P-20 chip slot | 1024  | 759,6, 253×52     | 759,6, 253×52       | pass    |
| P-41 badge     | 1024  | 34,30 in bell, 18 | 34,30 in bell, 18   | pass    |
| P-42 badge     | 1024  | 34,30 in list, 18 | 34,30 in list, 18   | pass    |
| P-28 header    | 375   | 0,0, 375×64       | 0,0, 375×64         | pass    |
| P-29 logo      | 375   | 15,7, 125×42.067  | 15,6.97, 125×42.063 | pass    |
| P-30 bell      | 375   | 200,16, 24×24     | 200,16, 24×24       | pass    |
| P-31 list      | 375   | 240,16, 24×24     | 240,16, 24×24       | pass    |
| P-32 avatar    | 375   | 280,8, 40×40      | 280,8, 40×40        | pass    |

Paint rows read from `getComputedStyle()`: the desktop header border is 1 px `#E1E7EA` on four
sides and the tablet and mobile headers draw none; the disabled search is `#EAECEE` with no border,
radius 8, placeholder `#969B9D`, Inter 500 14/18 (desktop) and 16/18 (tablet); the disabled round
buttons are `#E1E7EA` with a `#D0D4D8` glyph and no border; the badge is 18 px, radius 45, white
Inter 500 12/18, digits within 0.2 px of Figma's text origin.

The badge rows were measured with counts 1 and 8 passed through the header, as the header stories
do. The header is not mounted by `AppLayout` yet (Story 3.1), so the rows above were read from a
temporary local mount that was removed again; the burger (P-33) and the drawer rows belong to the
drawer story.

Two choices record what Figma leaves open:

- The desktop frame has no fill, so the sticky header paints the page colour `#FBFBFB`, the colour
  that shows through in the frame.
- The disabled bell variant `451:26214` draws its badge `#D0D4D8`, not `#1EAEFF`. Every header
  button is disabled, so the badge follows the disabled variant.
