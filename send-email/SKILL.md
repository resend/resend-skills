---
name: send-email
description: "Send emails using the Resend API. Use when: (1) sending transactional emails, (2) sending notifications, (3) emailing users, (4) any email sending task. Auto-detects project language and provides SDK-specific implementation."
---

# Send Email with Resend

## Quick Start

1. Detect project language from config files (package.json, requirements.txt, go.mod, etc.)
2. If Resend SDK not installed, see [references/installation.md](references/installation.md)
3. Send email using the appropriate SDK below
4. **Always** implement error handling and use idempotency keys for production code

## Best Practices

**Always implement these for production:**

1. **Idempotency Keys** - Prevent duplicate emails on retries. Use format `<event-type>/<entity-id>` (e.g., `welcome-email/user-123`). Keys expire after 24 hours, max 256 chars. If same key sent with different payload, returns 409 error.

2. **Error Handling** - Check for errors and handle appropriately. Don't retry validation errors (400, 422). Retry transient errors (429, 500) with backoff.

3. **Retry Logic** - Use exponential backoff (1s, 2s, 4s...) for rate limits and server errors. Max 3-5 retries.

See [references/examples.md](references/examples.md) for complete implementations with idempotency, error handling, and retry logic.

## SDK Examples

### Node.js

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
  { idempotencyKey: `welcome-email/${uniqueId}` }
);

if (error) {
  console.error('Failed:', error.message);
  return;
}
console.log('Sent:', data.id);
```

### Python

```python
import resend
import os

resend.api_key = os.environ["RESEND_API_KEY"]

try:
    email = resend.Emails.send({
        "from": "Acme <onboarding@resend.dev>",
        "to": ["user@example.com"],
        "subject": "Hello World",
        "html": "<p>Email body here</p>",
    }, idempotency_key=f"welcome-email/{unique_id}")
    print(f"Sent: {email['id']}")
except resend.exceptions.ResendError as e:
    print(f"Failed: {e}")
```

### Go

```go
import "github.com/resend/resend-go/v3"

client := resend.NewClient(os.Getenv("RESEND_API_KEY"))

params := &resend.SendEmailRequest{
    From:    "Acme <onboarding@resend.dev>",
    To:      []string{"user@example.com"},
    Subject: "Hello World",
    Html:    "<p>Email body here</p>",
    Headers: map[string]string{
        "Idempotency-Key": fmt.Sprintf("welcome-email/%s", uniqueID),
    },
}

sent, err := client.Emails.Send(params)
if err != nil {
    fmt.Printf("Failed: %v\n", err)
    return
}
fmt.Printf("Sent: %s\n", sent.Id)
```

### Ruby

```ruby
require "resend"

Resend.api_key = ENV["RESEND_API_KEY"]

params = {
  from: "Acme <onboarding@resend.dev>",
  to: ["user@example.com"],
  subject: "Hello World",
  html: "<p>Email body here</p>",
  headers: { "Idempotency-Key" => "welcome-email/#{unique_id}" }
}

Resend::Emails.send(params)
```

### PHP

```php
<?php
require __DIR__ . '/vendor/autoload.php';

$resend = Resend::client(getenv('RESEND_API_KEY'));

$resend->emails->send([
  'from' => 'Acme <onboarding@resend.dev>',
  'to' => ['user@example.com'],
  'subject' => 'Hello World',
  'html' => '<p>Email body here</p>',
  'headers' => ['Idempotency-Key' => 'welcome-email/' . $uniqueId]
]);
```

### Other SDKs

See [references/installation.md](references/installation.md) for Rust, Java, .NET, and Elixir installation.
See [references/examples.md](references/examples.md) for additional SDK examples with error handling and retry logic.

## Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | string | Sender address. Format: `"Name <email@domain.com>"` |
| `to` | string[] | Recipient addresses (max 50) |
| `subject` | string | Email subject line |
| `html` or `text` | string | Email body content |

## Optional Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cc` | string[] | CC recipients |
| `bcc` | string[] | BCC recipients |
| `reply_to` | string[] | Reply-to addresses |
| `scheduled_at` | string | Schedule send time (ISO 8601 or natural language) |
| `attachments` | array | File attachments (max 40MB total) |
| `tags` | array | Key/value pairs for tracking |
| `headers` | object | Custom headers including `Idempotency-Key` |

## Attachments

```typescript
// Node.js example
await resend.emails.send({
  from: 'Acme <onboarding@resend.dev>',
  to: ['user@example.com'],
  subject: 'Invoice',
  html: '<p>Please find attached.</p>',
  attachments: [
    {
      filename: 'invoice.pdf',
      content: Buffer.from(pdfContent).toString('base64'),
    },
  ],
});
```

## Notes

- The `from` address must use a verified domain
- Use `RESEND_API_KEY` environment variable for API key storage
- Node.js SDK supports `react` parameter for React Email components
- Response returns `{ id: "email-id" }` on success
