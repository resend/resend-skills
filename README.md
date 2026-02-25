<img width="432" height="187" alt="ascii-text-art" src="https://github.com/user-attachments/assets/72f8ab6b-dafd-436c-bacb-d49c20d3f0be" />

# Resend Skills

A collection of skills for AI coding agents following the Agent Skills format. These skills enable AI agents to work with the [Resend](https://resend.com) email platform.

## Available Skills

### [`send-email`](./send-email)
Send emails using the Resend API — single or batch. Supports transactional emails, notifications, and bulk sending (up to 100 emails per batch). Includes best practices for idempotency keys, error handling, and retry logic.

### [`templates`](./templates)
Create, update, publish, and delete reusable email templates via the Resend API. Covers template lifecycle (draft → publish → send), variable syntax (`{{{VAR}}}`), variable constraints, reserved names, and cursor-based pagination for listing templates.

### [`resend-inbound`](./resend-inbound)
Receive emails with Resend. Covers MX record setup, processing `email.received` webhooks, retrieving attachments, and forwarding received emails.

### [`agent-email-inbox`](./agent-email-inbox)
Set up a secure email inbox for AI agents or any system where untrusted email content triggers actions. Includes security levels, trusted sender allowlists, and prompt injection protection.

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
