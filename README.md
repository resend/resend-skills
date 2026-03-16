<img width="432" height="187" alt="ascii-text-art" src="https://github.com/user-attachments/assets/72f8ab6b-dafd-436c-bacb-d49c20d3f0be" />

# Resend Skills

A collection of skills for AI coding agents following the Agent Skills format. These skills enable AI agents to work with the [Resend](https://resend.com) email platform.

## Available Skills

### [`resend`](./skills/resend)

Unified skill for the Resend email API — sending transactional emails (single or batch), receiving inbound emails via webhooks, managing email templates, tracking delivery events, and SDK setup for 8+ languages. Includes critical gotchas (idempotency keys, webhook verification, template variable syntax) that prevent common production issues.

**Reference files:**
- `references/sending/overview.md` — Single vs batch, parameters, deliverability, testing
- `references/sending/single-email-examples.md` — Full SDK examples (Node.js, Python, Go, cURL)
- `references/sending/batch-email-examples.md` — Batch validation, chunking, retry logic
- `references/sending/best-practices.md` — Idempotency, error handling, retries
- `references/receiving.md` — Inbound domain setup, webhooks, attachments, forwarding
- `references/templates.md` — Template CRUD, variables, lifecycle, aliases, pagination
- `references/webhooks.md` — All event types, signature verification, retry schedule
- `references/installation.md` — SDK install for all languages

### [`agent-email-inbox`](./skills/agent-email-inbox)

Set up a secure email inbox for AI agents or any system where untrusted email content triggers actions. Includes security levels (strict allowlist, domain allowlist, content filtering, sandboxed processing, human-in-the-loop), webhook setup with tunneling for local dev, and content safety filtering.

**Reference files:**
- `references/security-levels.md` — Detailed implementation for each security level
- `references/webhook-setup.md` — Tunneling, webhook creation, local dev, production deployment
- `references/advanced-patterns.md` — Rate limiting, content limits, troubleshooting

## Installation

```bash
# Install all skills
npx skills add resend/resend-skills

# Install individual skills
npx skills add resend/resend-skills/resend
npx skills add resend/resend-skills/agent-email-inbox
```

## Usage

Skills are automatically activated when relevant tasks are detected. Example prompts:

- "Send a welcome email to new users"
- "Send batch notifications to all order customers"
- "Create a reusable order confirmation template with variables"
- "Set up an inbound email handler for support@myapp.com"
- "Set up a secure email inbox for my AI agent"

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
