<img width="432" height="187" alt="ascii-text-art" src="https://github.com/user-attachments/assets/72f8ab6b-dafd-436c-bacb-d49c20d3f0be" />

# Resend Skills

A collection of skills for AI coding agents following the [Agent Skills](https://agentskills.io) format. Available as a plugin for Claude Code, Cursor, and OpenAI Codex. Includes an MCP server for tool access.

## Install

```bash
npx skills add resend/resend-skills
```
Then select the ones you wish to install.


## Available Skills

| Skill | Description | Source |
|---|---|---|
| [`resend`](./skills/resend) | Resend email API | Authored here |
| [`agent-email-inbox`](./skills/agent-email-inbox) | Secure email inbox for AI agents | Authored here |
| [`resend-cli`](./skills/resend-cli) | Operate Resend from the terminal  | Synced from [resend/resend-cli](https://github.com/resend/resend-cli) |
| [`react-email`](./skills/react-email) | Build HTML emails with React components | Synced from [resend/react-email](https://github.com/resend/react-email) |
| [`email-best-practices`](./skills/email-best-practices) | Guidance for building deliverable, compliant, user-friendly emails | Synced from [resend/email-best-practices](https://github.com/resend/email-best-practices) |

## MCP Server

The plugin includes the [Resend MCP server](https://github.com/resend/resend-mcp), giving agents tool access to the full Resend API.

## Plugins

This repo serves as a plugin for multiple platforms:

- **Claude Code** — `.claude-plugin/`
- **Cursor** — `.cursor-plugin/`
- **OpenAI Codex** — `.codex-plugin/`

## Editing skills

Skills marked **"Authored here"** can be edited directly in this repo.

Skills marked **"Synced from"** are automatically synced from their source repos. **Do not edit them here** — changes will be overwritten on the next sync. Edit in the source repo instead.

## Prerequisites

- A Resend account with a verified domain
- API key stored in `RESEND_API_KEY` environment variable

Get your API key at [resend.com/api-keys](https://resend.com/api-keys)

## License

MIT
