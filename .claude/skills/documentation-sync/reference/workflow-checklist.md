# Documentation Sync Workflow Checklist

1. Identify user-visible or contributor-visible behavior changed.
2. Search for existing mentions with `rg`.
3. Update the closest owning doc first.
4. Update `CLAUDE.md`, `agents.md`, or `.claude/skills` only when the change is
   cross-cutting.
5. Run `make format` for docs and skills.
6. Run `make lint-md`.

Use `make lint` before finishing when docs changed with code.
