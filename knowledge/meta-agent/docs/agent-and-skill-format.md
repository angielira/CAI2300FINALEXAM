# Agent and skill file format

Sources: https://code.claude.com/docs/en/sub-agents · https://code.claude.com/docs/en/skills (not fetched in the build session; re-verify)

Agent `.claude/agents/<name>.md`:
```
---
name: <kebab-case>
description: <who + when to use>
tools: Read, Write, Edit, Glob, Grep, Bash
model: opus | sonnet | haiku | inherit
skills: skill-a, skill-b
---
<system prompt: job, personality, Before you answer, responsibilities, team rules>
```
Skill `.claude/skills/<name>/SKILL.md`:
```
---
name: <kebab-case>
description: <what it does and when to use it>
---
<steps>
```
