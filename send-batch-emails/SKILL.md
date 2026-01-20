---
name: send-batch-emails
description: "Send multiple emails in a single API call using Resend's batch endpoint. Use when: (1) sending multiple transactional emails at once, (2) sending notifications to multiple distinct recipients, (3) reducing API calls by batching emails, (4) any task requiring batch email sending. Supports up to 100 emails per request. Auto-detects project language and provides SDK-specific implementation."
---

# Send Batch Emails with Resend

## Quick Start

1. Detect project language from config files (package.json, requirements.txt, go.mod, etc.)
2. If Resend SDK not installed, install with: `npm install resend` (Node.js), `pip install resend` (Python), etc.
3. Send batch emails using the appropriate SDK below
4. **Always** implement error handling, validation, and use idempotency keys for production code

## Best Practices

**Critical for production batch email sending:**

1. **Idempotency Keys** - Prevent duplicate batch sends on retries. Use format `batch-<event-type>/<batch-id>` (e.g., `batch-order-notifications/batch-123`). Keys expire after 24 hours, max 256 chars.

2. **Pre-send Validation** - The entire batch fails if any single email has invalid data. Validate all emails before sending to avoid partial failures.

3. **Error Handling** - Check for errors and handle appropriately. Don't retry validation errors (400, 422). Retry transient errors (429, 500) with backoff.

4. **Retry Logic** - Use exponential backoff (1s, 2s, 4s...) for rate limits and server errors. Max 3-5 retries. Idempotency keys ensure no duplicates on retry.

5. **Batch Size Management** - Maximum 100 emails per batch. For larger sends, chunk into multiple batch requests.

See [references/batch-examples.md](references/batch-examples.md) for complete implementations with validation, error handling, and retry logic.

## Limitations

The batch endpoint does **NOT** support:
- `attachments` - Use individual sends for emails with attachments
- `scheduled_at` - Use individual sends for scheduled emails
- Partial success - If one email fails validation, the entire batch fails

## SDK Examples

### Node.js

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

### Python

```python
import resend
import os

resend.api_key = os.environ["RESEND_API_KEY"]

emails = [
    {
        "from": "Acme <notifications@acme.com>",
        "to": ["user1@example.com"],
        "subject": "Order Shipped",
        "html": "<p>Your order has shipped!</p>",
    },
    {
        "from": "Acme <notifications@acme.com>",
        "to": ["user2@example.com"],
        "subject": "Order Confirmed",
        "html": "<p>Your order is confirmed!</p>",
    },
]

try:
    result = resend.Batch.send(emails, idempotency_key=f"batch-orders/{batch_id}")
    print(f"Sent: {[e['id'] for e in result]}")
except resend.exceptions.ResendError as e:
    print(f"Batch failed: {e}")
```

### Go

```go
import "github.com/resend/resend-go/v3"

client := resend.NewClient(os.Getenv("RESEND_API_KEY"))

batch := []*resend.SendEmailRequest{
    {
        From:    "Acme <notifications@acme.com>",
        To:      []string{"user1@example.com"},
        Subject: "Order Shipped",
        Html:    "<p>Your order has shipped!</p>",
    },
    {
        From:    "Acme <notifications@acme.com>",
        To:      []string{"user2@example.com"},
        Subject: "Order Confirmed",
        Html:    "<p>Your order is confirmed!</p>",
    },
}

params := &resend.BatchEmailRequest{
    Emails: batch,
    Headers: map[string]string{
        "Idempotency-Key": fmt.Sprintf("batch-orders/%s", batchID),
    },
}

sent, err := client.Batch.Send(params)
if err != nil {
    fmt.Printf("Batch failed: %v\n", err)
    return
}
fmt.Printf("Sent: %v\n", sent)
```

### cURL

```bash
curl -X POST 'https://api.resend.com/emails/batch' \
  -H 'Authorization: Bearer re_xxxxxxxxx' \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: batch-orders-12345' \
  -d '[
    {
      "from": "Acme <notifications@acme.com>",
      "to": ["user1@example.com"],
      "subject": "Order Shipped",
      "html": "<p>Your order has shipped!</p>"
    },
    {
      "from": "Acme <notifications@acme.com>",
      "to": ["user2@example.com"],
      "subject": "Order Confirmed",
      "html": "<p>Your order is confirmed!</p>"
    }
  ]'
```

## Parameters

Each email in the batch accepts:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | string | Yes | Sender address. Format: `"Name <email@domain.com>"` |
| `to` | string[] | Yes | Recipient addresses (max 50 per email) |
| `subject` | string | Yes | Email subject line |
| `html` or `text` | string | Yes | Email body content |
| `cc` | string[] | No | CC recipients |
| `bcc` | string[] | No | BCC recipients |
| `reply_to` | string[] | No | Reply-to addresses |
| `headers` | object | No | Custom headers |
| `tags` | array | No | Key/value pairs for tracking |

## Response Format

Successful batch returns an array of email IDs:

```json
{
  "data": [
    { "id": "ae2014de-c168-4c61-8267-70d2662a1ce1" },
    { "id": "faccb7a5-8a28-4e9a-ac64-8da1cc3bc1cb" }
  ]
}
```

## Notes

- Maximum **100 emails** per batch request
- Maximum **50 recipients** per individual email in the batch
- The `from` address must use a verified domain
- All emails in a batch are processed atomically - one failure fails the entire batch
- Use `RESEND_API_KEY` environment variable for API key storage
- For marketing campaigns to large lists, use Resend Broadcasts instead
