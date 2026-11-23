---
name: agent-authoring
description: Create and maintain Claude Code subagents and skills for this repo: frontmatter, models, skills wiring, knowledge folders and the Before-you-answer rule.
---

# agent-authoring

Shared by: `meta-agent`, `orchestrator`

1. Agents live in `.claude/agents/<name>.md` with frontmatter `name`, `description`, `tools`, `model` (opus|sonnet|haiku), `skills` (comma-separated).
2. Skills live in `.claude/skills/<skill>/SKILL.md` with `name` and `description`.
3. Every agent has `knowledge/<name>/docs` (notes with source links) and `knowledge/<name>/examples` (small, correct, run where possible) and a "Before you answer" section.
4. Keep `docs/expert-roster.md` and `docs/agent-brains.md` in sync (regenerate from one table).
