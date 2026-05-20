# Tooling And Agent Skills

## When Tooling Changes

Update:

- `Makefile` help text.
- `CLAUDE.md` Code Quality or Testing sections.
- `agents.md` agent workflow guidance.
- Relevant `.claude/skills/*/SKILL.md` and support files.

## When Skill Layout Changes

Keep these locations distinct:

- `.agents/skills`: BMAD workflows.
- `.claude/skills`: non-BMAD frontend project skills.

Run:

```bash
make lint-md
```
