---
name: update-email
description: Update a scheduled email using the Resend API. Use when the user needs to reschedule an email, change the scheduled send time, or modify pending email delivery. Only works with emails that have been scheduled but not yet sent. Supports Node.js, Python, PHP, Ruby, Go, Rust, Java, .NET, and cURL.
---

# Update Email

Reschedule a scheduled email that hasn't been sent yet.

**Endpoint:** `PATCH https://api.resend.com/emails/:id`

## Quick Start

1. Identify the user's SDK from their codebase or ask if unclear
2. Use the appropriate SDK pattern from `references/sdk-examples.md`
3. Always implement error handling

## Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | The Email ID to update |

## Request Body

| Parameter | Type | Description |
|-----------|------|-------------|
| `scheduledAt` | string | New ISO 8601 timestamp for scheduled delivery |

## Response

```json
{
  "object": "email",
  "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794"
}
```

## Error Handling Best Practices

```typescript
const { data, error } = await resend.emails.update({
  id: 'email-id-here',
  scheduledAt: '2024-12-25T10:00:00Z'
});

if (error) {
  console.error('Failed to update email:', error.message);
  return;
}

console.log('Email rescheduled:', data.id);
```

Common error scenarios:
- **Email not found** - Invalid email ID
- **Email already sent** - Cannot update emails that have been delivered
- **Invalid timestamp** - Malformed ISO 8601 date

## Important Notes

- Only scheduled emails can be updated
- Once an email is sent, it cannot be modified
- Use `cancel-email` if you need to stop delivery entirely

## SDK Examples

See `references/sdk-examples.md` for complete examples in all supported SDKs.
