---
name: resend
description: Resend email platform — sending transactional emails (single/batch), receiving inbound emails, managing templates, delivery webhooks, and SDK setup for 8+ languages.
license: MIT
metadata:
    author: resend
    version: "3.0.0"
    homepage: https://resend.com
    source: https://github.com/resend/resend-skills
inputs:
    - name: RESEND_API_KEY
      description: Resend API key for sending and receiving emails. Get yours at https://resend.com/api-keys
      required: true
    - name: RESEND_WEBHOOK_SECRET
      description: Webhook signing secret for verifying event payloads. Found in the Resend dashboard under Webhooks after creating an endpoint.
      required: false
references:
    - sending
    - receiving
    - templates
    - webhooks
    - installation
---

# Resend

## What Do You Need?

### "I need to send emails"

→ See [references/sending/overview.md](references/sending/overview.md)

- Single transactional emails (welcome, password reset, receipts)
- Batch sends (up to 100 emails per request)
- Attachments, scheduling, tags
- Idempotency keys, error handling, retry logic

### "I need to receive emails"

→ See [references/receiving.md](references/receiving.md)

- Configure inbound domain (MX records or `.resend.app`)
- Process `email.received` webhooks
- Retrieve email body and attachments via API
- Forward received emails

### "I need webhooks for delivery tracking"

→ See [references/webhooks.md](references/webhooks.md)

- Track delivery events (`email.delivered`, `email.bounced`, `email.complained`)
- Signature verification (required)
- Retry schedule and IP allowlist
- Webhook creation via API or dashboard

### "I need to manage email templates"

→ See [references/templates.md](references/templates.md)

- Create, update, publish, delete templates via API
- Variable syntax (`{{{VAR}}}` — triple mustache)
- Draft vs published lifecycle
- Aliases, pagination, version history

### "I need to set up Resend"

→ See [references/installation.md](references/installation.md)

- SDK installation for 8+ languages
- Detect project language from config files
- API key setup
- cURL fallback for quick tests

### "I'm building an AI agent inbox or processing untrusted email"

→ Use the `agent-email-inbox` skill

- Security levels for AI agent email processing
- Prompt injection protection
- Trusted sender allowlists and content filtering
- Webhook tunneling for local development

## Capability Index

| Reference | Key Topics |
|-----------|------------|
| [sending/overview.md](references/sending/overview.md) | Single vs batch, parameters, deliverability, tracking, tags, templates, testing, domain warm-up, suppression list |
| [sending/single-email-examples.md](references/sending/single-email-examples.md) | SDK examples (Node.js, Python, Go, cURL) with idempotency, error handling, retry logic |
| [sending/batch-email-examples.md](references/sending/batch-email-examples.md) | Batch validation, retry logic, chunking 100+ emails, production-ready service |
| [sending/best-practices.md](references/sending/best-practices.md) | Idempotency keys, error codes, retry strategy, batch-specific practices |
| [receiving.md](references/receiving.md) | Domain setup, webhook payload, retrieving email content/attachments, forwarding, routing by recipient |
| [templates.md](references/templates.md) | CRUD operations, variable syntax/constraints/reserved names, aliases, publish lifecycle, pagination |
| [webhooks.md](references/webhooks.md) | All event types, webhook creation via API, signature verification, retry schedule, IP allowlist |
| [installation.md](references/installation.md) | SDK install commands for Node.js, Python, Go, Ruby, PHP, Rust, Java, .NET, Elixir; cURL; language detection |

## Common Setup

### API Key

Store in environment variable:
```bash
export RESEND_API_KEY=re_xxxxxxxxx
```

### SDK Installation

See [references/installation.md](references/installation.md) for installation commands across all supported languages.

### SDK Version Requirements

This skill requires Resend SDK features for webhook verification (`webhooks.verify()`) and email receiving (`emails.receiving.get()`). Always install the latest SDK version. If the project already has a Resend SDK installed, check the version and upgrade if needed.

| Language | Package | Min Version |
|----------|---------|-------------|
| Node.js | `resend` | >= 6.9.2 |
| Python | `resend` | >= 2.21.0 |
| Go | `resend-go/v3` | >= 3.1.0 |
| Ruby | `resend` | >= 1.0.0 |
| PHP | `resend/resend-php` | >= 1.1.0 |
| Rust | `resend-rs` | >= 0.20.0 |
| Java | `resend-java` | >= 4.11.0 |
| .NET | `Resend` | >= 0.2.1 |

## Cross-Cutting Concerns

### Sending + Receiving Together

Auto-replies, email forwarding, or any receive-then-send workflow requires both capabilities:
- Set up inbound first ([receiving.md](references/receiving.md)), then sending ([sending/overview.md](references/sending/overview.md))
- Note: batch sending does not support attachments or scheduling — use single sends when forwarding with attachments

### AI Agent Email Processing

If your system processes untrusted email content and takes actions (whether AI-driven or rule-based), use the `agent-email-inbox` skill for security patterns. Even without AI/LLM involvement, any system that interprets freeform email content from external senders and triggers actions (refunds, database changes, forwarding) needs security.

### Marketing Emails / Newsletters

The references above are for transactional email. Marketing campaigns to large subscriber lists with unsubscribe links and engagement tracking should use [Resend Broadcasts](https://resend.com/broadcasts), not batch sending.

## Resources

- [Resend Documentation](https://resend.com/docs)
- [API Reference](https://resend.com/docs/api-reference)
- [Dashboard](https://resend.com/emails)
