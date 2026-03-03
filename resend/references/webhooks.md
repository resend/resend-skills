# Webhooks

Receive real-time notifications when email events occur (delivered, bounced, opened, received, etc.).

## When to Use Webhooks

- Track delivery status in your database
- Remove bounced addresses from mailing lists
- Process incoming emails in real time
- Trigger follow-up actions when emails are opened/clicked
- Create alerts for failures or complaints
- Build custom analytics dashboards

## Event Types

### Delivery Events

| Event | Trigger | Use Case |
|-------|---------|----------|
| `email.sent` | API request successful, delivery attempted | Confirm email accepted |
| `email.delivered` | Email reached recipient's mail server | Confirm successful delivery |
| `email.bounced` | Mail server permanently rejected (hard bounce) | Remove from list, alert user |
| `email.complained` | Recipient marked as spam | Unsubscribe, review content |
| `email.opened` | Recipient opened email | Track engagement |
| `email.clicked` | Recipient clicked a link | Track engagement |
| `email.delivery_delayed` | Temporary delivery issue (soft bounce) | Monitor, may resolve automatically |
| `email.failed` | Send error (invalid recipient, quota, etc.) | Debug, alert |

### Inbound Events

| Event | Trigger | Use Case |
|-------|---------|----------|
| `email.received` | Email received at your domain | Process inbound email |

### Other Events

| Event | Trigger |
|-------|---------|
| `domain.created` / `updated` / `deleted` | Domain configuration changes |
| `contact.created` / `updated` / `deleted` | Contact list changes (not from CSV imports) |

### Bounce Types

| Type | Event | Action |
|------|-------|--------|
| **Hard bounce (Permanent)** | `email.bounced` | Remove address immediately - never retry |
| **Soft bounce (Transient)** | `email.delivery_delayed` | Monitor - Resend retries automatically |
| **Undetermined** | `email.bounced` | Treat as hard bounce if repeated |

**Hard bounces** (`email.bounced`) are permanent failures. The address is invalid and will never accept mail. Continuing to send to hard-bounced addresses destroys your sender reputation.

| Subtype | Cause |
|---------|-------|
| General | Recipient's email provider sent a hard bounce |
| NoEmail | Address doesn't exist or couldn't be determined |

**Soft bounces** (`email.delivery_delayed`) are temporary issues. Resend automatically retries these. If delivery ultimately fails after retries, you'll receive an `email.bounced` event.

| Subtype | Cause | May Resolve If... |
|---------|-------|-------------------|
| General | Temporary rejection | Underlying issue clears |
| MailboxFull | Recipient's inbox at capacity | Recipient frees space |
| MessageTooLarge | Exceeds provider size limit | You reduce message size |
| ContentRejected | Contains disallowed content | You modify content |
| AttachmentRejected | Attachment type/size rejected | You modify attachment |

**Undetermined bounces** occur when the bounce message doesn't contain enough information for Resend to determine the reason. Treat repeated undetermined bounces as hard bounces.

## Setup

### Option 1: Create Webhook via API (Recommended)

Use the Resend Webhook API to create webhooks programmatically. This is faster, less error-prone, and gives you the signing secret directly in the response.

#### Node.js

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.webhooks.create({
  endpoint: 'https://yourdomain.com/webhook',
  events: ['email.delivered', 'email.bounced', 'email.complained'],
});

if (error) {
  console.error('Failed to create webhook:', error);
  throw error;
}

// IMPORTANT: Store the signing secret — you need it to verify incoming webhooks
// Write it directly to .env, never log it
// fs.appendFileSync('.env', `\nRESEND_WEBHOOK_SECRET=${data.signing_secret}\n`);
console.log('Webhook created:', data.id);
```

#### Python

```python
import resend

resend.api_key = 're_xxxxxxxxx'

webhook = resend.Webhooks.create(params={
    "endpoint": "https://yourdomain.com/webhook",
    "events": ["email.delivered", "email.bounced", "email.complained"],
})

# Write the signing secret directly to .env, never log it
print(f"Webhook created: {webhook['id']}")
```

#### cURL

```bash
curl -X POST 'https://api.resend.com/webhooks' \
  -H 'Authorization: Bearer re_xxxxxxxxx' \
  -H 'Content-Type: application/json' \
  -d '{
    "endpoint": "https://yourdomain.com/webhook",
    "events": ["email.delivered", "email.bounced", "email.complained"]
  }'

# Response:
# {
#   "object": "webhook",
#   "id": "4dd369bc-aa82-4ff3-97de-514ae3000ee0",
#   "signing_secret": "whsec_xxxxxxxxxx"
# }
```

The webhook creation API is available in all Resend SDKs: Go, Ruby, PHP, Rust, Java, and .NET.

### Option 2: Create via Dashboard

1. Go to resend.com/webhooks
2. Click "Add Webhook"
3. Enter your endpoint URL and select events
4. Copy the signing secret (starts with `whsec_`)

## Signature Verification

**You MUST verify webhook signatures.** Without verification, attackers can send fake webhooks to your endpoint.

### Why Verification Matters

- Webhooks are unauthenticated HTTP POST requests
- Anyone who knows your endpoint URL can send fake events
- Verification ensures the webhook genuinely came from Resend
- Unique signatures prevent replay attacks

### Required Headers

Every webhook includes these headers for verification:

| Header | Purpose |
|--------|---------|
| `svix-id` | Unique message identifier |
| `svix-timestamp` | Unix timestamp when sent |
| `svix-signature` | Cryptographic signature |

### Get Your Webhook Secret

Store the signing secret (starts with `whsec_`) securely as `RESEND_WEBHOOK_SECRET` environment variable. If created via the API, the secret is returned in the `signing_secret` field of the response. If created via dashboard, find it under resend.com/webhooks → click your webhook.

### Using Resend SDK (Recommended)

Example using Next.js:

```typescript
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    // CRITICAL: Use raw body, not parsed JSON
    const payload = await req.text();

    // Throws an error if the webhook is invalid
    // Otherwise, returns the parsed payload object
    const event = resend.webhooks.verify({
      payload,
      headers: {
        'svix-id': req.headers.get('svix-id'),
        'svix-timestamp': req.headers.get('svix-timestamp'),
        'svix-signature': req.headers.get('svix-signature'),
      },
      secret: process.env.RESEND_WEBHOOK_SECRET,
    });

    // Handle the verified event
    switch (event.type) {
      case 'email.delivered':
        // update database with the email delivery status
        break;

      case 'email.bounced':
        // Hard bounce - remove from mailing list immediately
        break;

      case 'email.complained':
        // Spam complaint - unsubscribe and flag
        break;

      case 'email.received':
        // Inbound email - retrieve content via Receiving API
        break;

      default:
        // handle other events
        return new Response('OK', { status: 200 });
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return new NextResponse('Invalid signature', { status: 400 });
  }
}
```

### Webhook Verification Fallback (Svix)

If you're using an older Resend SDK that doesn't have `resend.webhooks.verify()`, verify signatures directly with the `svix` package:

```bash
npm install svix
```

```javascript
import { Webhook } from 'svix';

const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET);
const event = wh.verify(payload, {
  'svix-id': req.headers['svix-id'],
  'svix-timestamp': req.headers['svix-timestamp'],
  'svix-signature': req.headers['svix-signature'],
});
```

## Inbound Email Payload

The `email.received` webhook contains metadata only — not the email body or attachment content. Call the Receiving API to retrieve the full email.

```json
{
  "type": "email.received",
  "created_at": "2024-02-22T23:41:12.126Z",
  "data": {
    "email_id": "a1b2c3d4-...",
    "from": "sender@example.com",
    "to": ["support@acme.com"],
    "subject": "Question about my order",
    "attachments": [
      {
        "id": "att_abc123",
        "filename": "receipt.pdf",
        "content_type": "application/pdf"
      }
    ]
  }
}
```

See [receiving.md](receiving.md) for full details on retrieving email content and attachments.

## Delivery Event Payload

```json
{
  "type": "email.delivered",
  "created_at": "2024-01-15T12:00:00.000Z",
  "data": {
    "email_id": "ae2014de-c168-4c61-8267-70d2662a1ce1",
    "from": "Acme <noreply@acme.com>",
    "to": ["delivered@resend.dev"],
    "subject": "Welcome to Acme"
  }
}
```

## Retry Schedule

If your endpoint doesn't return HTTP 200, Resend retries with exponential backoff:

| Attempt | Delay After Failure |
|---------|---------------------|
| 1 | Immediate |
| 2 | 5 seconds |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |
| 6 | 5 hours |
| 7 | 10 hours |

Example: A webhook that fails 3 times before succeeding will be delivered ~35 minutes after the first attempt.

**Tip:** Always return 200 quickly, then process asynchronously if needed. You can manually replay failed webhooks from the dashboard.

## IP Allowlist

If your firewall requires allowlisting, webhooks come from:

```
44.228.126.217
50.112.21.217
52.24.126.164
54.148.139.208
```

IPv6: `2600:1f24:64:8000::/52`

## Local Development

Use tunneling tools to test webhooks locally:

```bash
# ngrok
ngrok http 3000

# use the port that your server is running on (e.g. 3000)
# Then use the ngrok URL in Resend dashboard
# https://abc123.ngrok.io/webhooks/resend
```

For AI agent inboxes with persistent tunneling needs, see the `agent-email-inbox` skill for detailed ngrok, Cloudflare Tunnel, and VS Code Port Forwarding setup.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not verifying signatures | **Always verify** - attackers can send fake webhooks |
| Using parsed JSON body | Use raw request body - JSON parsing breaks signature |
| Using `express.json()` middleware | Use `express.raw()` for webhook routes |
| Hardcoding webhook secret | Store in environment variable |
| Returning non-200 status for valid webhooks | Return 200 OK to acknowledge receipt |
| Expecting email body in `email.received` payload | Call `resend.emails.receiving.get()` for body content |
