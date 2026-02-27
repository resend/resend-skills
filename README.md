<img width="432" height="187" alt="ascii-text-art" src="https://github.com/user-attachments/assets/72f8ab6b-dafd-436c-bacb-d49c20d3f0be" />

# Resend Skills

A collection of skills for AI coding agents following the Agent Skills format. These skills enable AI agents to send and receive emails using the [Resend](https://resend.com) email platform.

## Available Skills

### [`send-email`](./skills/send-email)
Send emails using the Resend API — single or batch. Supports transactional emails, notifications, and bulk sending (up to 100 emails per batch). Includes best practices for idempotency keys, error handling, and retry logic.

### [`templates`](./skills/templates)
Create, update, publish, and delete reusable email templates via the Resend API. Covers template lifecycle (draft → publish → send), variable syntax (`{{{VAR}}}`), variable constraints, reserved names, and cursor-based pagination for listing templates.

### [`resend-inbound`](./skills/resend-inbound)
Receive and process inbound emails with Resend. Covers domain setup (MX records), `email.received` webhooks, retrieving email content and attachments, forwarding, and routing by recipient.

### [`agent-email-inbox`](./skills/agent-email-inbox)
Set up a secure email inbox for AI agents. Covers webhook setup, sender allowlists, content filtering, sandboxed processing, and human-in-the-loop approval to protect against prompt injection attacks.

## Installation

```bash
npx skills add resend/resend-skills
```

## Usage

Skills are automatically activated when relevant tasks are detected. Example prompts:

- "Send a welcome email to new users"
- "Send batch notifications to all order customers"
- "Create a reusable order confirmation template with variables"
- "Set up inbound email for my support address"
- "Build an AI agent that can receive and respond to emails"

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
