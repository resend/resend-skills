# Webhooks

Receive real-time notifications when email events occur (delivered, bounced, opened, etc.).

## When to Use Webhooks

- Track delivery status in your database
- Remove bounced addresses from mailing lists
- Trigger follow-up actions when emails are opened/clicked
- Create alerts for failures or complaints
- Build custom analytics dashboards

## Event Types

### Email Events

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

### Other Events

| Event | Trigger |
|-------|---------|
| `domain.created` / `updated` / `deleted` | Domain configuration changes |
| `contact.created` / `updated` / `deleted` | Contact list changes (not from CSV imports) |

## Setup

1. **Create endpoint** - POST endpoint that returns HTTP 200
2. **Add webhook** - In Resend dashboard (resend.com/webhooks), add your URL and select events
3. **Verify signatures** - **REQUIRED** - See [Signature Verification](#signature-verification)
4. **Test locally** - Use ngrok or similar for local development

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

Find your signing secret in the Resend dashboard:
1. Go to resend.com/webhooks
2. Click on your webhook
3. Copy the signing secret (starts with `whsec_`)

Store it securely as `RESEND_WEBHOOK_SECRET` environment variable.

### Node.js - Using Resend SDK (Recommended)

```typescript
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Your database client (Prisma, Drizzle, etc.)

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    // CRITICAL: Use raw body, not parsed JSON
    const payload = await req.text();

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
        await db.emailLog.update({
          where: { emailId: event.data.email_id },
          data: { status: 'delivered', deliveredAt: new Date() },
        });
        break;

      case 'email.bounced':
        // Hard bounce - remove from mailing list immediately
        const bouncedEmail = event.data.to[0];
        await db.subscriber.update({
          where: { email: bouncedEmail },
          data: {
            status: 'bounced',
            bouncedAt: new Date(),
            canReceiveEmail: false,
          },
        });
        console.log(`Removed bounced address: ${bouncedEmail}`);
        break;

      case 'email.complained':
        // Spam complaint - unsubscribe and flag
        const complainedEmail = event.data.to[0];
        await db.subscriber.update({
          where: { email: complainedEmail },
          data: {
            status: 'complained',
            unsubscribedAt: new Date(),
            canReceiveEmail: false,
          },
        });
        console.log(`Unsubscribed due to complaint: ${complainedEmail}`);
        break;

      case 'email.delivery_delayed':
        // Soft bounce - log but don't remove (Resend will retry)
        console.log(`Delivery delayed for ${event.data.email_id}, Resend will retry`);
        break;
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return new NextResponse('Invalid signature', { status: 400 });
  }
}
```

### Node.js - Using Svix Library

```typescript
import { Webhook } from 'svix';

const webhook = new Webhook(process.env.RESEND_WEBHOOK_SECRET);

export async function POST(req: Request) {
  try {
    // CRITICAL: Use raw body, not parsed JSON
    const payload = await req.text();

    const event = webhook.verify(payload, {
      'svix-id': req.headers.get('svix-id'),
      'svix-timestamp': req.headers.get('svix-timestamp'),
      'svix-signature': req.headers.get('svix-signature'),
    });

    // Handle verified event...

    return new Response('OK', { status: 200 });
  } catch (error) {
    return new Response('Invalid signature', { status: 400 });
  }
}
```

### Python - Using Svix Library

```python
from svix.webhooks import Webhook, WebhookVerificationError
from flask import Flask, request, jsonify
from sqlalchemy import update
from datetime import datetime
import os

app = Flask(__name__)
webhook = Webhook(os.environ['RESEND_WEBHOOK_SECRET'])
# db, EmailLog, Subscriber assumed to be defined in your models

@app.route('/webhooks/resend', methods=['POST'])
def handle_webhook():
    try:
        # CRITICAL: Use raw body, not parsed JSON
        payload = request.get_data(as_text=True)
        headers = {
            'svix-id': request.headers.get('svix-id'),
            'svix-timestamp': request.headers.get('svix-timestamp'),
            'svix-signature': request.headers.get('svix-signature'),
        }

        event = webhook.verify(payload, headers)

        # Handle verified event
        event_type = event.get('type')
        event_data = event.get('data', {})

        if event_type == 'email.delivered':
            db.session.execute(
                update(EmailLog)
                .where(EmailLog.email_id == event_data['email_id'])
                .values(status='delivered', delivered_at=datetime.utcnow())
            )
            db.session.commit()

        elif event_type == 'email.bounced':
            # Hard bounce - remove from mailing list immediately
            bounced_email = event_data['to'][0]
            db.session.execute(
                update(Subscriber)
                .where(Subscriber.email == bounced_email)
                .values(
                    status='bounced',
                    bounced_at=datetime.utcnow(),
                    can_receive_email=False
                )
            )
            db.session.commit()
            print(f"Removed bounced address: {bounced_email}")

        elif event_type == 'email.complained':
            # Spam complaint - unsubscribe and flag
            complained_email = event_data['to'][0]
            db.session.execute(
                update(Subscriber)
                .where(Subscriber.email == complained_email)
                .values(
                    status='complained',
                    unsubscribed_at=datetime.utcnow(),
                    can_receive_email=False
                )
            )
            db.session.commit()
            print(f"Unsubscribed due to complaint: {complained_email}")

        elif event_type == 'email.delivery_delayed':
            # Soft bounce - log but don't remove (Resend will retry)
            print(f"Delivery delayed for {event_data['email_id']}, Resend will retry")

        return jsonify({'status': 'ok'}), 200

    except WebhookVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400
```

### Express.js

```typescript
import express from 'express';
import { Webhook } from 'svix';

const app = express();
const webhook = new Webhook(process.env.RESEND_WEBHOOK_SECRET);

// CRITICAL: Use raw body parser for webhook route
app.post('/webhooks/resend',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    try {
      const event = webhook.verify(req.body.toString(), {
        'svix-id': req.headers['svix-id'],
        'svix-timestamp': req.headers['svix-timestamp'],
        'svix-signature': req.headers['svix-signature'],
      });

      // Handle verified event...

      res.status(200).send('OK');
    } catch (error) {
      res.status(400).send('Invalid signature');
    }
  }
);
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not verifying signatures | **Always verify** - attackers can send fake webhooks |
| Using parsed JSON body | Use raw request body - JSON parsing breaks signature |
| Using `express.json()` middleware | Use `express.raw()` for webhook routes |
| Hardcoding webhook secret | Store in environment variable |
| Returning non-200 status for valid webhooks | Return 200 OK to acknowledge receipt |

## Retry Schedule

If your endpoint doesn't return HTTP 200, Resend retries with exponential backoff (8 total attempts):

| Attempt | Delay After Failure |
|---------|---------------------|
| 1 | Immediate |
| 2 | 5 seconds |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |
| 6 | 5 hours |
| 7 | 10 hours |
| 8 | 10 hours |

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

# Then use the ngrok URL in Resend dashboard
# https://abc123.ngrok.io/webhooks/resend
```

## Event Payload Example

```json
{
  "type": "email.delivered",
  "created_at": "2024-01-15T12:00:00.000Z",
  "data": {
    "email_id": "ae2014de-c168-4c61-8267-70d2662a1ce1",
    "from": "Acme <noreply@acme.com>",
    "to": ["user@example.com"],
    "subject": "Welcome to Acme"
  }
}
```
