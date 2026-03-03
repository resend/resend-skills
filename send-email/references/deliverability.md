# Email Deliverability Best Practices

## Overview

Deliverability is the ability to get your emails into recipients' inboxes (not spam). This guide covers common deliverability issues and how to resolve them with Resend.

## Prerequisites for Good Deliverability

1. **Verified domain** with SPF and DKIM passing — see the `domain-setup` sub-skill
2. **DMARC record** published — see [DMARC guide](https://resend.com/docs/dashboard/domains/dmarc)
3. **Use a subdomain** for sending (e.g., `updates.yourdomain.com`) to isolate sending reputation

## Deliverability Insights

Resend provides built-in deliverability checks on every sent email. View them in the dashboard by clicking an email → "Insights". Checks include:

- **Link URLs match sending domain** — mismatched URLs trigger spam filters
- **DMARC record is valid** — required by Gmail and Yahoo since 2024
- **Unsubscribe header present** — required for bulk senders
- **Text version included** — improves deliverability over HTML-only
- **Email size** — keep under 100KB for best results

## Common Deliverability Issues

### Landing in Spam (Gmail)

1. Check DMARC is passing: inspect email headers for `dmarc=pass`
2. Ensure links in email match your sending domain
3. Avoid URL shorteners (bit.ly, etc.) — these trigger spam filters
4. Include a plain-text version alongside HTML
5. Use [Google Postmaster Tools](https://gmail.com/postmaster/) to monitor domain reputation
6. Don't send to purchased or scraped lists

### Landing in Spam (Outlook/Microsoft)

1. Ensure SPF and DKIM are passing
2. Microsoft uses SmartScreen filtering — avoid spam trigger words
3. Consider applying for [SNDS](https://sendersupport.olc.protection.outlook.com/snds/) (Smart Network Data Services)
4. Warm up new domains gradually

### Email Bounces

Bounces happen when an email can't be delivered. Types:

| Type | Also Known As | Meaning | Action |
|------|---------------|---------|--------|
| **Permanent** | Hard bounce | Server permanently rejects (invalid address, etc.) | Remove address, don't retry |
| **Transient** | Soft bounce | Temporary issue (mailbox full, server busy) | May resolve on its own |
| **Undetermined** | — | Not enough info to classify | Monitor and investigate |

**Permanent bounce subtypes:**
- `General` — hard bounce from recipient's provider
- `NoEmail` — couldn't extract recipient address from bounce

**Transient bounce subtypes:**
- `General` — generic soft bounce, may deliver later
- `MailboxFull` — inbox full, try later
- `MessageTooLarge` — reduce message size
- `ContentRejected` — content blocked by provider
- `AttachmentRejected` — attachment type/size not allowed

View bounce details in the Resend dashboard by clicking on the email and hovering over the status.

### Email Suppressions

A suppression occurs when you try to send to a recipient that previously bounced (hard) or marked your email as spam. Resend proactively blocks these sends to protect your reputation.

**Key facts:**
- Suppression list is **per region** — a bounce on any domain suppresses the address across all domains in that region
- Caused by: hard bounces or spam complaints
- Gmail/Google Workspace doesn't return complaint events
- You can remove addresses from the suppression list in the dashboard

### "Delivered but Not Received"

If Resend shows the email as `delivered` but the recipient doesn't see it:

1. **Check spam/junk folder** — most common cause
2. **Check Resend dashboard** for the email status and any bounce/suppression info
3. **Check suppression list** — the address may be suppressed from a previous bounce
4. **Verify the recipient address** — typos are surprisingly common
5. **Check email client filters** — recipient may have rules that auto-archive or delete
6. **Apple Private Relay** — Apple hides real email addresses; the relay address must be valid

## Audience Hygiene

- Remove hard bounces immediately (Resend does this automatically via suppressions)
- Monitor bounce rates — keep under 2%
- Monitor spam complaint rates — keep under 0.1%
- Use double opt-in for marketing emails
- Include clear unsubscribe links in every email
- Clean inactive addresses periodically

## Domain Warmup

New domains have no sending reputation. Warm up gradually:

1. **Week 1:** Send to your most engaged recipients (50-100/day)
2. **Week 2:** Gradually increase volume (double each day)
3. **Week 3-4:** Continue scaling while monitoring bounces and complaints
4. **Ongoing:** Monitor [Resend Deliverability Insights](https://resend.com/emails) and reputation tools

## Resources

- [Resend Deliverability Insights](https://resend.com/docs/dashboard/emails/deliverability-insights)
- [Email Bounces](https://resend.com/docs/dashboard/emails/email-bounces)
- [Email Suppressions](https://resend.com/docs/dashboard/emails/email-suppressions)
- [Google Postmaster Tools](https://gmail.com/postmaster/)
- [DMARC Implementation](https://resend.com/docs/dashboard/domains/dmarc)
- [BIMI Implementation](https://resend.com/docs/dashboard/domains/bimi)
