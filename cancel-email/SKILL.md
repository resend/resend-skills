---
name: cancel-email
description: Cancel a scheduled email using the Resend API. Use when the user needs to stop a scheduled email from being sent, abort pending delivery, or prevent an email from going out. Only works with emails that have been scheduled but not yet sent. Supports Node.js, Python, PHP, Ruby, Go, Rust, Java, .NET, and cURL.
---

# Cancel Email

Cancel a scheduled email before it's sent.

**Endpoint:** `POST https://api.resend.com/emails/:id/cancel`

## Quick Start

1. Identify the user's SDK from their codebase or ask if unclear
2. Use the appropriate SDK pattern from `references/sdk-examples.md`
3. Always implement error handling

## Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | The Email ID to cancel |

## Response

```json
{
  "object": "email",
  "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794"
}
```

## Error Handling Best Practices

```typescript
const { data, error } = await resend.emails.cancel('email-id-here');

if (error) {
  console.error('Failed to cancel email:', error.message);
  return;
}

console.log('Email cancelled:', data.id);
```

Common error scenarios:
- **Email not found** - Invalid email ID
- **Email already sent** - Cannot cancel delivered emails
- **Email not scheduled** - Only scheduled emails can be cancelled

## Important Notes

- Only scheduled emails can be cancelled
- Once an email is sent, it cannot be cancelled
- Use `update-email` if you want to reschedule instead of cancel

## SDK Examples

See `references/sdk-examples.md` for complete examples in all supported SDKs.
