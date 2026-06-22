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
