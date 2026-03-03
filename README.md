<img width="432" height="187" alt="ascii-text-art" src="https://github.com/user-attachments/assets/72f8ab6b-dafd-436c-bacb-d49c20d3f0be" />

# Resend Skills

A collection of skills for AI coding agents following the Agent Skills format. These skills enable AI agents to work with the [Resend](https://resend.com) email platform.

## Skills

### [`resend`](./resend/SKILL.md) — Core Platform Skill

The main Resend skill with decision trees and a capability index. Covers all API functionality through reference files:

| Reference | Description |
|-----------|-------------|
| [sending/overview.md](./resend/references/sending/overview.md) | Single and batch email sending — parameters, deliverability, tracking, tags, templates, testing, domain warm-up, suppression list |
| [sending/single-email-examples.md](./resend/references/sending/single-email-examples.md) | SDK examples (Node.js, Python, Go, cURL) with idempotency, error handling, retry logic |
| [sending/batch-email-examples.md](./resend/references/sending/batch-email-examples.md) | Batch validation, retry logic, chunking 100+ emails, production-ready service |
| [sending/best-practices.md](./resend/references/sending/best-practices.md) | Idempotency keys, error codes, retry strategy, batch-specific practices |
| [receiving.md](./resend/references/receiving.md) | Inbound email — MX record setup, webhook payload, retrieving content/attachments, forwarding, routing by recipient |
| [templates.md](./resend/references/templates.md) | Template CRUD, variable syntax (`{{{VAR}}}`), constraints, reserved names, aliases, publish lifecycle, pagination |
| [webhooks.md](./resend/references/webhooks.md) | All event types, webhook creation via API, signature verification, retry schedule, IP allowlist |
| [installation.md](./resend/references/installation.md) | SDK install commands for Node.js, Python, Go, Ruby, PHP, Rust, Java, .NET, Elixir; cURL; language detection |

### [`agent-email-inbox`](./agent-email-inbox) — AI Agent Security Skill

Set up a secure email inbox for AI agents or any system where untrusted email content triggers actions. Includes security levels, trusted sender allowlists, prompt injection protection, and webhook tunneling for local development.

## Installation

```bash
npx skills add resend/resend-skills
```

## Usage

Skills are automatically activated when relevant tasks are detected. Example prompts:

- "Send a welcome email to new users"
- "Send batch notifications to all order customers"
- "Create a reusable order confirmation template with variables"
- "Set up an inbound email handler for support@myapp.com"
- "Schedule a newsletter for tomorrow at 9am"

## Supported SDKs

- Node.js / TypeScript
- Python
- Go
- Ruby
- PHP
- Rust
- Java
- .NET
- cURL
- SMTP

## Prerequisites

- A Resend account with a verified domain
- API key stored in `RESEND_API_KEY` environment variable

Get your API key at [resend.com/api-keys](https://resend.com/api-keys)

## License

MIT
