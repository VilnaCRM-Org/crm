---
name: figma-design-check
description: Use BEFORE building or changing any UI — components, layout, color, spacing, typography, interaction states, or visual styling — to verify the planned change matches the Figma design via the Figma MCP. Run this gate before writing or editing UI code.
---

# Figma Design Check

Verify every UI change against the Figma design **before** implementing it, using the
Figma MCP server. The Figma design is the source of truth for visuals; code must match
it (or the user must explicitly approve a deviation).

## When to use (mandatory before UI changes)

Run this gate before ANY change that affects what the user sees: new or modified React
components, layout, color/fill/border, spacing, typography, sizing, icons, or
interaction states (default / hover / focus-visible / active / disabled / loading /
error). It runs **before** `frontend-component-development` and before any UI edit.

It does NOT apply to pure logic, data-layer, test-only, or non-visual config changes.

## Prerequisite: the Figma MCP server (issue #152)

The gate runs through Figma's remote MCP server, registered for this project in
[`.mcp.json`](../../../.mcp.json) as `figma` → `https://mcp.figma.com/mcp`. Access is
granted by an OAuth sign-in in the agent client (in Claude Code: `/mcp` → `figma` →
authenticate), so **no Figma token is ever committed or read from a dotenv file** — the
server entry carries a URL and nothing else. A teammate on another agent platform
registers the same URL in that platform's MCP configuration.

Before step 1 of the workflow, confirm the server answers: load
`mcp__figma__get_metadata` with ToolSearch and call it with the design file key and no
`nodeId` — it returns the top-level pages when connected. If the tool is not listed, the
call errors, or the client reports the server as failed to connect, the gate is
**BLOCKED, not skipped**: report `figma-design-check: BLOCKED — Figma MCP unreachable`
with the client's error text, tell the user to authenticate or repair the server
(`claude mcp list` shows its health), and do not write UI code until it answers or the
user explicitly accepts the offline fallback below. Silently continuing without the
design is the failure mode this gate exists to prevent.

### Design references for this repository

| Surface                                        | File key                 | Node        |
| ---------------------------------------------- | ------------------------ | ----------- |
| CRM design (pages `Design CRM`, `Components`)  | `xZ7ccrH6d4QyqLQsayFSEX` | page `0:1`  |
| Auth submit button (idle / loading / disabled) | `xZ7ccrH6d4QyqLQsayFSEX` | `439:19256` |

Verified: `get_metadata` on `439:19256` returns the button instance (`Frame 69`, label
`Спробувати`, 171 × 62) whose grey `#E1E7EA` loading state the auth submit loader
implements (CLAUDE.md, Important Patterns 5). Add a row when a new surface gets a design;
a node id from a `figma.com/design/<fileKey>/...?node-id=439-19256` URL is written
`439:19256`.

### Offline fallback (only with the user's explicit acceptance)

When the server is unreachable and the user accepts proceeding anyway, the design
evidence is the committed visual baselines under `tests/visual/**-snapshots/` (the
authoritative production rasters) plus the documented specs (CLAUDE.md pattern 5, the
theme in `src/styles/`). Record in the response that the gate ran in fallback mode and
which baseline or spec stood in for the design, so the review can re-run the live check.

## Prerequisite: a design reference

You need a Figma reference for the affected UI: a `figma.com` file/node URL, a node id,
or the user's current Figma desktop selection. **If no reference is available, ask the
user for the Figma link (or confirm there is no design for this surface) before
implementing the UI change** — do not silently guess the design intent.

## Workflow

1. **Identify the surface + its Figma node.** Map the component/screen you are about to
   change to the corresponding Figma frame/component.
2. **Pull the design via the Figma MCP** (load tool schemas with ToolSearch first):
   - `mcp__figma__get_design_context` — structured design + code context for the node.
   - `mcp__figma__get_screenshot` — the rendered visual to compare against.
   - `mcp__figma__get_variable_defs` — design tokens (colors, spacing, radii, type).
   - `mcp__figma__get_metadata` — node structure/hierarchy when needed.
   - `mcp__figma__get_code_connect_map` — existing component ↔ code mappings, if any.
3. **Compare the planned change to the design**, field by field: fill/background,
   text/label color, border + radius, spacing/padding, typography, size, and **every
   interaction state** the design defines (not just the default). Prefer the repo's
   design tokens (`src/styles/colors.ts`, theme) over raw values, and check they match
   the Figma variables.
4. **Decide:**
   - **Match** → proceed with the implementation.
   - **Divergence** → STOP. Surface the specific discrepancy (design value vs planned
     value) to the user and get a decision. The design wins unless the user explicitly
     overrides; record the override.
   - **No design exists for this surface** → tell the user and confirm the intended
     look before coding.
5. **After implementing**, re-verify the result against the Figma screenshot (optionally
   via `browser-testing-with-devtools` / Chrome) and report the comparison.

## Notes

- This is a **verification gate**, distinct from `pix` (the autonomous pixel-perfect
  Figma→code implementation loop). Use `pix` when you want the full automated loop; use
  this skill as the lightweight "does my change match the design?" check before edits.
- A design match does **not** waive accessibility: still run the `accessibility-lead`
  review for UI code. If the Figma design itself fails a WCAG gate (e.g. contrast),
  flag it to the user — accessibility constraints can override the visual design.
- Keep evidence in your response: which Figma node you checked, the values compared, and
  the match/divergence outcome.
