# One table, generated files

`tools/gen_team.py` holds the AGENTS and SKILLS tables. Running `python3 tools/gen_team.py .` rewrites:
`.claude/agents/*.md`, `.claude/skills/*/SKILL.md`, `docs/expert-roster.md`, `docs/agent-brains.md`.
So a model change or a new skill is one edit, and names/models/skills can never disagree between files.
Knowledge folders are hand-written (they hold real notes) and are not generated.
