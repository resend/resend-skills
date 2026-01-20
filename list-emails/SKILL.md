---
name: list-emails
description: List sent emails using the Resend API. Use when the user needs to retrieve email history, view sent messages, audit email activity, or implement email dashboards. Supports pagination for large datasets. Supports Node.js, Python, PHP, Ruby, Go, Rust, Java, .NET, and cURL.
---

# List Emails

Retrieve a list of emails sent by your team.

**Endpoint:** `GET https://api.resend.com/emails`

## Quick Start

1. Identify the user's SDK from their codebase or ask if unclear
2. Use the appropriate SDK pattern from `references/sdk-examples.md`
3. Always implement error handling and pagination

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `data` | array | Array of email objects |
| `data[].id` | string | Email ID |
| `data[].from` | string | Sender address |
| `data[].to` | string[] | Recipients |
| `data[].subject` | string | Subject line |
| `data[].created_at` | string | ISO 8601 timestamp |
| `data[].last_event` | string | Current status |

## Pagination

The API uses cursor-based pagination. Handle it properly for large datasets:

```typescript
// Fetch first page
const { data, error } = await resend.emails.list();

// Fetch with cursor for next page
const { data: nextPage } = await resend.emails.list({
  cursor: data.cursor
});
```

## Error Handling Best Practices

```typescript
const { data, error } = await resend.emails.list();

if (error) {
  console.error('Failed to list emails:', error.message);
  return;
}

console.log(`Found ${data.data.length} emails`);
data.data.forEach(email => {
  console.log(`${email.id}: ${email.subject} (${email.last_event})`);
});
```

Common error scenarios:
- **Authentication failure** - Invalid API key
- **Rate limiting** - Too many requests

## SDK Examples

See `references/sdk-examples.md` for complete examples in all supported SDKs.
