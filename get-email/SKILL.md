---
name: get-email
description: Retrieve a single email by ID using the Resend API. Use when the user needs to fetch email details, check email status/delivery state, inspect email content, or debug email delivery issues. Supports Node.js, Python, PHP, Ruby, Go, Rust, Java, .NET, and cURL.
---

# Get Email

Retrieve a single email's details using the Resend API.

**Endpoint:** `GET https://api.resend.com/emails/:id`

## Quick Start

1. Identify the user's SDK from their codebase or ask if unclear
2. Use the appropriate SDK pattern from `references/sdk-examples.md`
3. Always implement error handling

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique email identifier |
| `to` | string[] | Recipient addresses |
| `from` | string | Sender address |
| `subject` | string | Email subject |
| `html` | string | HTML content |
| `text` | string \| null | Plain text content |
| `cc` | string[] | CC recipients |
| `bcc` | string[] | BCC recipients |
| `reply_to` | string[] | Reply-to addresses |
| `last_event` | string | Current status (e.g., `delivered`, `bounced`, `complained`) |
| `created_at` | string | ISO 8601 timestamp |
| `scheduled_at` | string \| null | Scheduled send time |
| `tags` | object[] | Array of `{name, value}` tag objects |

## Error Handling Best Practices

Always handle both the error response and validate the data:

```typescript
// Node.js pattern
const { data, error } = await resend.emails.get(emailId);

if (error) {
  // Handle API errors (invalid ID, auth failure, rate limit)
  console.error('Failed to retrieve email:', error.message);
  return;
}

// data is now safely available
console.log('Email status:', data.last_event);
```

Common error scenarios to handle:
- **Invalid email ID** - 404 response
- **Authentication failure** - Invalid or missing API key
- **Rate limiting** - Too many requests

## SDK Examples

See `references/sdk-examples.md` for complete examples in all supported SDKs:
- Node.js, Python, PHP, Ruby, Go, Rust, Java, .NET, cURL
