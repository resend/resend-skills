# Test: Resend Inbound Skill

**Skill under test:** `resend-inbound`
**Skill type:** Reference/Technique
**Test approach:** Application scenarios - can the agent correctly set up inbound email, handle webhooks, retrieve content, and avoid common mistakes?

## Setup

```
IMPORTANT: This is a real scenario. You must choose and act.
Write actual code, not pseudocode. Use the resend-inbound skill as your reference.
```

---

## Scenario 1: Webhook Payload Understanding

**Tests:** Agent knows webhooks contain metadata only, not email body

```
You receive this webhook payload from Resend:

{
  "type": "email.received",
  "created_at": "2024-02-22T23:41:12.126Z",
  "data": {
    "email_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "from": "customer@example.com",
    "to": ["support@acme.com"],
    "subject": "I need help with my order",
    "attachments": [
      {
        "id": "att_receipt123",
        "filename": "receipt.pdf",
        "content_type": "application/pdf"
      }
    ]
  }
}

Write the handler to extract the email body text and download the attachment.
```

**Expected:**
- Does NOT try to read body from webhook payload (it's not there)
- Calls `resend.emails.receiving.get(event.data.email_id)` for body
- Calls `resend.emails.receiving.attachments.list()` for attachment URLs
- Downloads attachment via `fetch(attachment.download_url)`
- Notes that download_url expires after 1 hour

**Failure indicators:**
- Tries to access `event.data.body` or `event.data.html` (doesn't exist)
- Skips the separate API call for email content
- Doesn't handle attachment download URL expiration

---

## Scenario 2: Domain Setup - Existing Email Provider

**Tests:** Subdomain recommendation when root domain has existing MX records

```
Your company uses Google Workspace for email at acme.com. All employees
have @acme.com addresses. You want Resend to receive emails at
support addresses for your app.

How do you configure the domain?
```

**Expected:**
- Recommends a **subdomain** (e.g., `support.acme.com` or `inbound.acme.com`)
- Explains that setting MX on root domain would break Google Workspace
- MX record with priority 10 pointing to Resend's value
- Shows example: `support.acme.com. MX 10 <resend-mx-value>`

**Failure indicators:**
- Suggests adding MX record to root domain `acme.com` (breaks existing email)
- Doesn't mention the risk to existing email service
- Doesn't explain MX priority

---

## Scenario 3: Webhook Signature Verification

**Tests:** Agent always includes webhook verification

```
Write a Next.js API route that handles the email.received webhook from Resend.
Keep it minimal but production-ready.
```

**Expected:**
- Verifies webhook signature using `resend.webhooks.verify()`
- Extracts svix-id, svix-timestamp, svix-signature headers
- Uses `RESEND_WEBHOOK_SECRET` for verification
- Returns 200 OK on success
- Returns 400 on verification failure

**Failure indicators:**
- Parses JSON directly without signature verification
- Skips verification "for simplicity"
- Doesn't use the svix headers
- Doesn't return appropriate status codes

---

## Scenario 4: Email Forwarding with Attachments

**Tests:** Complete forwarding flow including attachment re-encoding

```
Build a Node.js email forwarding handler: when an email arrives at
support@acme.com, forward it to team@acme.com with all attachments intact.
```

**Expected flow:**
1. Verify webhook signature
2. Get email content via `resend.emails.receiving.get()`
3. List attachments via `resend.emails.receiving.attachments.list()`
4. Download each attachment via `fetch(download_url)`
5. Convert to base64 for re-sending
6. Forward via `resend.emails.send()` with attachments array

**Failure indicators:**
- Skips webhook verification
- Tries to forward attachments without downloading them first
- Doesn't convert attachment content to base64
- Doesn't handle the case where there are no attachments
- Uses batch send (batch doesn't support attachments)

---

## Scenario 5: Routing by Recipient

**Tests:** Handling multiple addresses on the same domain

```
Your domain receives emails at:
- support@inbound.acme.com → create support ticket
- billing@inbound.acme.com → forward to accounting team
- feedback@inbound.acme.com → store in database

All arrive at the same webhook endpoint. Write the routing logic.
```

**Expected:**
- Routes based on `event.data.to[0]` field
- Checks for each address prefix (support@, billing@, feedback@)
- Handles unknown recipients (catch-all)
- All arrive at the same webhook because that's how Resend works

**Failure indicators:**
- Tries to set up separate webhook endpoints per address
- Doesn't handle unknown/unmatched recipients
- Hardcodes full email addresses instead of pattern matching

---

## Scenario 6: Return 200 OK

**Tests:** Understanding webhook retry behavior

```
Your webhook handler throws an unhandled error while processing an email.
What happens? How should you handle this?
```

**Expected:**
- Resend retries on non-200 responses (exponential backoff over ~6 hours)
- Handler MUST return 200 OK to acknowledge receipt
- Should catch errors and still return 200 (or at least handle gracefully)
- Notes that emails are stored even if webhooks fail (no data loss)

**Failure indicators:**
- Doesn't know about retry behavior
- Doesn't mention the importance of returning 200
- Doesn't know emails are stored regardless of webhook status

---

## Scenario 7: Quick Start Domain Choice

**Tests:** Recommending the right domain option for the situation

```
You're a developer who just wants to test receiving emails with Resend
as quickly as possible. No DNS access, no custom domain yet.
What's the fastest path?
```

**Expected:**
- Use Resend's `.resend.app` managed domain
- No DNS configuration needed
- Auto-generated address: `<anything>@<your-id>.resend.app`
- Find address in Dashboard -> Emails -> Receiving -> "Receiving address"

**Failure indicators:**
- Immediately suggests custom domain setup with MX records
- Doesn't mention the `.resend.app` option
- Makes it sound like DNS setup is required

---

## Scoring

| Scenario | Pass Criteria |
|----------|---------------|
| 1 - Webhook Payload | Knows body isn't in webhook, calls separate API |
| 2 - Domain Setup | Recommends subdomain, explains root domain risk |
| 3 - Signature Verification | Includes full svix verification, correct headers |
| 4 - Forwarding | Complete flow: verify -> get content -> download attachments -> base64 -> send |
| 5 - Routing | Routes by to field, handles unknown recipients |
| 6 - Return 200 | Understands retry behavior, returns 200, knows emails are stored |
| 7 - Quick Start | Recommends .resend.app domain for fastest path |

**Pass threshold:** 6/7 scenarios correct
