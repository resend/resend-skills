---
name: send-email
description: "Send emails using the Resend API - single or batch. Use when: (1) sending transactional emails, (2) sending notifications, (3) sending multiple emails in bulk (up to 100 per batch), (4) batch email sending, (5) any email sending task. Auto-detects project language."
---

# Send Email with Resend

## Overview

Resend provides two endpoints for sending emails:

| Approach | Endpoint | Use Case |
|----------|----------|----------|
| **Single** | `POST /emails` | Individual transactional emails, emails with attachments, scheduled sends |
| **Batch** | `POST /emails/batch` | Multiple distinct emails in one request (max 100), bulk notifications |

**Choose batch when:**
- Sending 2+ distinct emails at once
- Reducing API calls is important
- No attachments or scheduling needed

**Choose single when:**
- Sending one email
- Email needs attachments
- Email needs to be scheduled
- Different recipients need different timing

## Quick Start

1. **Detect project language** from config files (package.json, requirements.txt, go.mod, etc.)
2. **Install SDK if needed** - See [references/installation.md](references/installation.md)
3. **Choose single or batch** based on the decision matrix above
4. **Implement best practices** - Idempotency keys, error handling, retries

## Best Practices (Critical for Production)

Always implement these for production email sending. See [references/best-practices.md](references/best-practices.md) for complete implementations.

### Idempotency Keys

Prevent duplicate emails when retrying failed requests.

| Key Facts | |
|-----------|---|
| **Format (single)** | `<event-type>/<entity-id>` (e.g., `welcome-email/user-123`) |
| **Format (batch)** | `batch-<event-type>/<batch-id>` (e.g., `batch-orders/batch-456`) |
| **Expiration** | 24 hours |
| **Max length** | 256 characters |
| **Duplicate payload** | Returns original response without resending |
| **Different payload** | Returns 409 error |

### Error Handling

| Code | Action |
|------|--------|
| 400, 422 | Fix request parameters, don't retry |
| 401, 403 | Check API key / verify domain, don't retry |
| 409 | Idempotency conflict - use new key or fix payload |
| 429 | Rate limited - retry with exponential backoff |
| 500 | Server error - retry with exponential backoff |

### Retry Strategy

- **Backoff:** Exponential (1s, 2s, 4s...)
- **Max retries:** 3-5 for most use cases
- **Only retry:** 429 (rate limit) and 500 (server error)
- **Always use:** Idempotency keys when retrying

## Single Email

**Endpoint:** `POST /emails`

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | string | Sender address. Format: `"Name <email@domain.com>"` |
| `to` | string[] | Recipient addresses (max 50) |
| `subject` | string | Email subject line |
| `html` or `text` | string | Email body content |

### Optional Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cc` | string[] | CC recipients |
| `bcc` | string[] | BCC recipients |
| `reply_to` | string[] | Reply-to addresses |
| `scheduled_at` | string | Schedule send time (ISO 8601) |
| `attachments` | array | File attachments (max 40MB total) |
| `tags` | array | Key/value pairs for tracking |
| `headers` | object | Custom headers |

### Minimal Example (Node.js)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send(
  {
    from: 'Acme <onboarding@resend.dev>',
    to: ['user@example.com'],
    subject: 'Hello World',
    html: '<p>Email body here</p>',
  },
  { idempotencyKey: `welcome-email/${userId}` }
);

if (error) {
  console.error('Failed:', error.message);
  return;
}
console.log('Sent:', data.id);
```

See [references/single-email-examples.md](references/single-email-examples.md) for all SDK implementations with error handling and retry logic.

## Batch Email

**Endpoint:** `POST /emails/batch`

### Limitations

- **No attachments** - Use single sends for emails with attachments
- **No scheduling** - Use single sends for scheduled emails
- **Atomic** - If one email fails validation, the entire batch fails
- **Max 100 emails** per request
- **Max 50 recipients** per individual email in the batch

### Pre-validation

Since the entire batch fails on any validation error, validate all emails before sending:
- Check required fields (from, to, subject, html/text)
- Validate email formats
- Ensure batch size <= 100

### Minimal Example (Node.js)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.batch.send(
  [
    {
      from: 'Acme <notifications@acme.com>',
      to: ['user1@example.com'],
      subject: 'Order Shipped',
      html: '<p>Your order has shipped!</p>',
    },
    {
      from: 'Acme <notifications@acme.com>',
      to: ['user2@example.com'],
      subject: 'Order Confirmed',
      html: '<p>Your order is confirmed!</p>',
    },
  ],
  { idempotencyKey: `batch-orders/${batchId}` }
);

if (error) {
  console.error('Batch failed:', error.message);
  return;
}
console.log('Sent:', data.map(e => e.id));
```

See [references/batch-email-examples.md](references/batch-email-examples.md) for all SDK implementations with validation, error handling, and retry logic.

## Large Batches (100+ Emails)

For sends larger than 100 emails, chunk into multiple batch requests:

1. **Split into chunks** of 100 emails each
2. **Use unique idempotency keys** per chunk: `<batch-prefix>/chunk-<index>`
3. **Send chunks in parallel** for better throughput
4. **Track results** per chunk to handle partial failures

See [references/batch-email-examples.md](references/batch-email-examples.md) for complete chunking implementations.

## Notes

- The `from` address must use a verified domain
- Store API key in `RESEND_API_KEY` environment variable
- Node.js SDK supports `react` parameter for React Email components
- Response returns `{ id: "email-id" }` on success (single) or array of IDs (batch)
- For marketing campaigns to large lists, use Resend Broadcasts instead