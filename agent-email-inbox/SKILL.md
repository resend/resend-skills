---
name: agent-email-inbox
description: Configures a secure email inbox for AI agents using Resend — sets up inbound webhooks, tunneling for local development, and sender validation with tiered security levels. Use when building an AI agent that receives and processes emails, or when any automated system handles untrusted inbound email content.
inputs:
    - name: RESEND_API_KEY
      description: Resend API key for sending and receiving emails. Get yours at https://resend.com/api-keys
      required: true
    - name: RESEND_WEBHOOK_SECRET
      description: Webhook signing secret for verifying inbound email event payloads. Returned as `signing_secret` in the response when you create a webhook via the API.
      required: true
---

# AI Agent Email Inbox

## Overview

Moltbot (formerly Clawdbot) is an AI agent that can send and receive emails. This skill covers setting up a secure email inbox that allows your agent to be notified of incoming emails and respond appropriately, with content safety measures in place.

**Core principle:** An AI agent's inbox receives untrusted input. Security configuration is important to handle this safely.

## Architecture

```
Sender → Email → Resend (MX) → Webhook → Your Server → AI Agent
                                              ↓
                                    Security Validation
                                              ↓
                                    Process or Reject
```

## SDK Version Requirements

This skill requires `webhooks.verify()` and `emails.receiving.get()`. Always install the latest SDK version.

| Language | Package | Min Version |
|----------|---------|-------------|
| Node.js | `resend` | >= 6.9.2 |
| Python | `resend` | >= 2.21.0 |
| Go | `resend-go/v3` | >= 3.1.0 |
| Ruby | `resend` | >= 1.0.0 |
| PHP | `resend/resend-php` | >= 1.1.0 |
| Rust | `resend-rs` | >= 0.20.0 |
| Java | `resend-java` | >= 4.11.0 |
| .NET | `Resend` | >= 0.2.1 |

See `send-email` skill's [installation guide](../send-email/references/installation.md) for full installation commands.

## Quick Start

1. **Ask the user for their email address** — placeholder addresses like `test@example.com` won't work
2. **Choose your security level** — see [security levels reference](references/security-levels.md) for all 5 tiers
3. **Set up receiving domain** — configure MX records (see Domain Setup below)
4. **Create webhook endpoint** — handle `email.received` events with security built in. **Must be a POST route.**
5. **Set up tunneling** (local dev) — see [tunneling reference](references/tunneling.md) for options
6. **Register webhook via API** — use the Resend Webhook API to get the signing secret
7. **Connect to agent** — pass validated emails to your AI agent

## Before You Start: Account & API Key Setup

### First Question: New or Existing Resend Account?

- **New account just for the agent?** → Full account access is fine
- **Existing account with other projects?** → Use domain-scoped API keys for sandboxing

### Creating API Keys Securely

> Don't paste API keys in chat — they'll be in conversation history forever.

**Safer options:**
1. **Environment file:** Human creates `.env` file directly: `echo "RESEND_API_KEY=re_xxx" >> .env`
2. **Password/secrets manager:** Human stores key in 1Password, Vault, etc.
3. **If key must be shared in chat:** Rotate the key immediately after setup

### Domain-Scoped API Keys (Recommended for Existing Accounts)

1. Verify the agent's domain (Dashboard → Domains → Add Domain)
2. Create a scoped API key: Dashboard → API Keys → Create API Key → "Sending access" → select only the agent's domain
3. Even if the key leaks, it can only send from one domain

**Skip this when:** account is new, agent needs multiple domains, or you're testing with `.resend.app`.

## Domain Setup

### Option 1: Resend-Managed Domain (Fastest)

Use your auto-generated address: `<anything>@<your-id>.resend.app` — no DNS configuration needed.

### Option 2: Custom Domain

Enable receiving in Dashboard → Domains → toggle "Enable Receiving". Then add an MX record:

| Setting | Value |
|---------|-------|
| **Type** | MX |
| **Host** | Your domain or subdomain (e.g., `agent.yourdomain.com`) |
| **Value** | Provided in Resend dashboard |
| **Priority** | 10 (must be lowest number to take precedence) |

**Use a subdomain** to avoid disrupting existing email services. Verify propagation at [dns.email](https://dns.email).

> DNS propagation can take up to 48 hours. Test by sending to your new address and checking the Resend dashboard's Receiving tab.

## Security Levels

Choose a security level before writing your webhook endpoint. See [security levels reference](references/security-levels.md) for full implementations of all 5 tiers.

| Level | Approach | Best For |
|-------|----------|----------|
| **1. Strict Allowlist** (recommended) | Only approved email addresses | Most use cases |
| **2. Domain Allowlist** | Any address at approved domains | Organization-wide access |
| **3. Content Filtering** | Accept all, sanitize content | Public-facing agents |
| **4. Sandboxed Processing** | Accept all, restrict capabilities | Advanced setups |
| **5. Human-in-the-Loop** | Human approves untrusted actions | Highest security |

## Webhook Setup

### Step 1: Set up tunneling for a public URL

You need a public HTTPS URL before registering with Resend. See [tunneling reference](references/tunneling.md) for all options. **Recommended:** Tailscale Funnel for permanent stable URLs.

### Step 2: Choose your webhook path and keep it stable

Pick a path (recommended: `/webhook`) and commit to it. Changing the path after registration causes silent 404s.

> **Critical: Use raw body for verification.** Signature verification requires the raw request body.
> - **Next.js App Router:** Use `req.text()` (not `req.json()`)
> - **Express:** Use `express.raw({ type: 'application/json' })` on the webhook route

### Next.js App Router

```typescript
// app/webhook/route.ts
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
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

    if (event.type === 'email.received') {
      const { data: email } = await resend.emails.receiving.get(
        event.data.email_id
      );
      await processEmailForAgent(event.data, email);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Error', { status: 400 });
  }
}
```

### Express

```javascript
import express from 'express';
import { Resend } from 'resend';

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const payload = req.body.toString();

    const event = resend.webhooks.verify({
      payload,
      headers: {
        'svix-id': req.headers['svix-id'],
        'svix-timestamp': req.headers['svix-timestamp'],
        'svix-signature': req.headers['svix-signature'],
      },
      secret: process.env.RESEND_WEBHOOK_SECRET,
    });

    if (event.type === 'email.received') {
      const sender = event.data.from.toLowerCase();
      if (!isAllowedSender(sender)) {
        console.log(`Rejected email from unauthorized sender: ${sender}`);
        res.status(200).send('OK');
        return;
      }

      const { data: email } = await resend.emails.receiving.get(event.data.email_id);
      await processEmailForAgent(event.data, email);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Error');
  }
});

app.get('/', (req, res) => res.send('Agent Email Inbox - Ready'));
app.listen(3000, () => console.log('Webhook server running on :3000'));
```

### Webhook Verification Fallback (Svix)

If using an older SDK without `resend.webhooks.verify()`:

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

### Register Webhook via API

Use the API to create webhooks programmatically — faster and gives you the signing secret directly.

```typescript
const { data, error } = await resend.webhooks.create({
  endpoint: 'https://<your-tunnel-domain>/webhook',
  events: ['email.received'],
});
// IMPORTANT: Store data.signing_secret as RESEND_WEBHOOK_SECRET immediately
```

The response includes `signing_secret` (format: `whsec_xxxxxxxxxx`) — store this immediately. This is the only time you'll see it.

Every webhook request includes three verification headers: `svix-id`, `svix-timestamp`, `svix-signature`. Use `resend.webhooks.verify()` to validate these against the raw request body.

### Webhook Retry Behavior

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 5 seconds |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |
| 6 | 5 hours |
| 7 | 10 hours |

Return 2xx to acknowledge receipt. Emails are stored even if webhooks fail.

## Production Deployment

| Option | Details |
|--------|---------|
| **Serverless** (Vercel, Netlify, Cloudflare Workers) | Zero server management, automatic HTTPS, free tiers available |
| **VPS/cloud instance** | Webhook handler alongside agent, use nginx/caddy for HTTPS |
| **Existing infrastructure** | Add webhook route to existing web server |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| No sender verification | Always validate who sent the email before processing |
| Trusting email headers | Use webhook verification, not email headers for auth |
| Same treatment for all emails | Differentiate trusted vs untrusted senders |
| No rate limiting | Implement per-sender rate limits |
| Processing HTML directly | Strip HTML or use text-only to reduce risk |
| No logging of rejections | Log all security events for audit |
| Using ephemeral tunnel URLs | Use persistent URLs or deploy to production |
| Using `express.json()` on webhook route | Use `express.raw({ type: 'application/json' })` — JSON parsing breaks signature verification |
| Returning non-200 for rejected emails | Always return 200 to acknowledge receipt — otherwise Resend retries |
| Old Resend SDK version | `emails.receiving.get()` and `webhooks.verify()` require recent SDK versions |

## Testing

Use Resend's test addresses: `delivered@resend.dev` (success), `bounced@resend.dev` (hard bounce). Send from non-allowlisted addresses to verify rejection.

**Verification checklist:**
1. Server running: `curl http://localhost:3000`
2. Tunnel working: `curl https://<your-tunnel-url>`
3. Webhook active: Check Resend dashboard → Webhooks
4. Send test email from an allowlisted address and check server logs

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot read properties of undefined (reading 'verify')` | SDK too old | `npm install resend@latest` or use Svix fallback |
| `Cannot read properties of undefined (reading 'get')` | SDK too old | `npm install resend@latest` |
| Webhook returns 400 | Wrong signing secret, body parsing issue, or old SDK | Verify secret, use raw body, update SDK |
| ngrok connection refused | Free tunnel timed out | Restart ngrok, recreate webhook via API. Better: use Tailscale Funnel |
| Email received but no webhook fires | Webhook inactive or wrong URL | Check dashboard status, endpoint URL, tunnel, and Recent Deliveries |
| Security check rejecting all emails | Allowlist mismatch | Check sender in `ALLOWED_SENDERS`, ensure case-insensitive comparison |

## Related Skills

- `send-email` — Sending emails from your agent
- `resend-inbound` — Detailed inbound email processing
- `email-best-practices` — Deliverability and compliance

For a complete working example with all security levels integrated, see [complete example reference](references/complete-example.md).
