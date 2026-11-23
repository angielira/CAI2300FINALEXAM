# Claude Code subagents and skills (how this team is wired)

Sources: https://code.claude.com/docs/en/sub-agents · https://code.claude.com/docs/en/skills (not fetched in the build session: approval needed; re-verify)

- A project subagent is a Markdown file in `.claude/agents/` with YAML frontmatter: `name`, `description` (when to use it), optional `tools` (comma-separated; omit to inherit all), optional `model` (`opus`, `sonnet`, `haiku`, or `inherit`), and `skills` to preload skills. The body is its system prompt.
- Each subagent runs in its own context window and returns a result to the caller.
- A skill is a folder `.claude/skills/<name>/SKILL.md` with `name` and `description` frontmatter plus instructions (and optional extra files).
- Agents created during a session are loaded when a new session starts.
- Invoke explicitly with `@agent-orchestrator …`, or let Claude delegate based on descriptions.
