# Complete Example: Secure Agent Inbox

```typescript
// lib/agent-email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const config = {
  allowedSenders: (process.env.ALLOWED_SENDERS || '').split(',').filter(Boolean),
  allowedDomains: (process.env.ALLOWED_DOMAINS || '').split(',').filter(Boolean),
  securityLevel: process.env.SECURITY_LEVEL || 'strict', // 'strict' | 'domain' | 'filtered' | 'sandboxed'
  ownerEmail: process.env.OWNER_EMAIL,
};

export async function handleIncomingEmail(
  event: EmailReceivedWebhookEvent
): Promise<void> {
  const sender = event.data.from.toLowerCase();
  const { data: email } = await resend.emails.receiving.get(event.data.email_id);

  switch (config.securityLevel) {
    case 'strict':
      if (!config.allowedSenders.some(a => sender === a.toLowerCase())) {
        await logRejection(event, 'sender_not_allowed');
        return;
      }
      break;
    case 'domain':
      const domain = sender.split('@')[1];
      if (!config.allowedDomains.includes(domain)) {
        await logRejection(event, 'domain_not_allowed');
        return;
      }
      break;
    case 'filtered':
      const analysis = checkContentSafety(email.text || '');
      if (!analysis.safe) {
        await logRejection(event, 'content_flagged', analysis.flags);
        return;
      }
      break;
    case 'sandboxed':
      break; // Process with reduced capabilities
  }

  await processWithAgent({
    id: event.data.email_id,
    from: event.data.from,
    to: event.data.to,
    subject: event.data.subject,
    body: email.text || email.html,
    receivedAt: event.created_at,
  });
}

async function logRejection(
  event: EmailReceivedWebhookEvent,
  reason: string,
  details?: string[]
): Promise<void> {
  console.log(`[SECURITY] Rejected email from ${event.data.from}: ${reason}`, details);

  if (config.ownerEmail) {
    await resend.emails.send({
      from: 'Agent Security <agent@yourdomain.com>',
      to: [config.ownerEmail],
      subject: `[Agent] Rejected email: ${reason}`,
      text: `
An email was rejected by your agent's security filter.

From: ${event.data.from}
Subject: ${event.data.subject}
Reason: ${reason}
${details ? `Details: ${details.join(', ')}` : ''}

Review this in your security logs if needed.
      `.trim(),
    });
  }
}
```

## Environment Variables

```bash
# Required
RESEND_API_KEY=re_xxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxx

# Security Configuration
SECURITY_LEVEL=strict                    # strict | domain | filtered | sandboxed
ALLOWED_SENDERS=you@email.com,trusted@example.com
ALLOWED_DOMAINS=yourcompany.com
OWNER_EMAIL=you@email.com               # For security notifications
```

## Sending Emails from Your Agent

Use the `send-email` skill for sending. Quick example:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendAgentReply(
  to: string,
  subject: string,
  body: string,
  inReplyTo?: string
) {
  if (!isAllowedToReply(to)) {
    throw new Error('Cannot send to this address');
  }

  const { data, error } = await resend.emails.send({
    from: 'Agent <agent@yourdomain.com>',
    to: [to],
    subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
    text: body,
    headers: inReplyTo ? { 'In-Reply-To': inReplyTo } : undefined,
  });

  if (error) throw new Error(`Failed to send: ${error.message}`);
  return data.id;
}
```

## Clawdbot Integration

### Webhook Gateway (Recommended)

```typescript
async function processWithAgent(email: ProcessedEmail) {
  const message = `
New Email
From: ${email.from}
Subject: ${email.subject}

${email.body}
  `.trim();

  await sendToClawdbot(message);
}
```

### Alternative: Polling

Clawdbot can poll the Resend API for new emails during heartbeats. Simpler to set up but emails are not delivered in real time.

```typescript
async function checkForNewEmails() {
  const { data: emails } = await resend.emails.list({});
  for (const email of emails) {
    if (!alreadyProcessed(email.id)) {
      await processEmail(email);
      markAsProcessed(email.id);
    }
  }
}
```

### Alternative: External Channel Plugin

For deep integration, implement Clawdbot's external channel plugin interface to treat email as a first-class channel alongside Telegram, Signal, etc.
