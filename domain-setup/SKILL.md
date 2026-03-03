---
name: domain-setup
description: Use when setting up, verifying, or troubleshooting email domains with Resend — DNS records (SPF, DKIM, MX), DMARC, BIMI, subdomain strategy, custom return path, and domain API management.
inputs:
    - name: RESEND_API_KEY
      description: Resend API key for managing domains. Get yours at https://resend.com/api-keys
      required: true
---

# Domain Setup with Resend

## Overview

Before sending emails through Resend, you must add and verify a domain. This involves configuring DNS records (SPF, DKIM, MX) so email providers trust your messages. This skill covers the full domain lifecycle: creation, DNS configuration, verification, DMARC/BIMI setup, and troubleshooting.

## Domain Strategy: Subdomain vs Root Domain

**Always recommend a subdomain** (e.g., `send.yourdomain.com`) over the root domain:

| Approach | Example | Recommendation |
|----------|---------|----------------|
| **Subdomain** | `send.yourdomain.com` | ✅ Recommended |
| **Root domain** | `yourdomain.com` | ⚠️ Avoid unless necessary |

**Why subdomains:**
- No MX record conflicts with existing email providers (Google Workspace, Microsoft 365)
- Isolates sending reputation — transactional email reputation stays separate from marketing
- Allows multiple sending services on different subdomains
- If reputation gets damaged, your root domain remains unaffected

## Domain Verification

Resend requires three types of DNS records:

### 1. SPF (Sender Policy Framework)
- **Type:** MX record on your sending subdomain
- **Purpose:** Authorizes Resend's servers to send email on your behalf + handles bounce/complaint feedback
- **Record:** MX record on `send.yourdomain.com` pointing to Resend's feedback server

### 2. DKIM (DomainKeys Identified Mail)
- **Type:** 3 CNAME records
- **Purpose:** Cryptographically signs emails so recipients can verify they haven't been tampered with
- **Records:** 3 CNAME records provided by Resend after domain creation

### 3. Region Selection
Resend operates in multiple regions. Choose the one closest to your users:

| Region | Code |
|--------|------|
| US East | `us-east-1` |
| EU West | `eu-west-1` |
| South America | `sa-east-1` |
| Asia Pacific | `ap-northeast-1` |

**Important:** The MX record value is region-specific. Using the wrong region causes verification failure.

→ **See `references/domain-verification.md`** for step-by-step instructions with code examples.

## Custom Return Path

The return path (also called envelope sender or bounce address) is where bounce notifications go. By default, Resend uses its own return path. You can customize it:

```
customReturnPath: "bounce"
# Results in: bounce@send.yourdomain.com
```

Set this when creating the domain via API. It helps with DMARC alignment and deliverability.

## DMARC Implementation

DMARC tells receiving mail servers what to do when SPF or DKIM checks fail. Implement progressively:

### Progressive Rollout

1. **Monitor (start here):** `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`
2. **Quarantine (after 2-4 weeks of clean reports):** `v=DMARC1; p=quarantine; pct=10; rua=mailto:dmarc@yourdomain.com`
3. **Reject (final goal):** `v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com`

Add the DMARC record as a TXT record at `_dmarc.yourdomain.com`.

→ **See `references/dmarc-bimi.md`** for full DMARC parameter reference and BIMI setup.

## BIMI Setup

Brand Indicators for Message Identification (BIMI) displays your logo next to emails in supporting clients (Gmail, Apple Mail, Yahoo).

**Prerequisites:**
- DMARC policy of `p=quarantine` or `p=reject` (not `p=none`)
- A Verified Mark Certificate (VMC) or Common Mark Certificate (CMC)
- Logo in SVG Tiny P/S format

**DNS Record:** TXT at `default._bimi.yourdomain.com`:
```
v=BIMI1; l=https://yourdomain.com/logo.svg; a=https://yourdomain.com/cert.pem
```

→ **See `references/dmarc-bimi.md`** for detailed BIMI implementation guide.

## MX Record Conflicts

**The most common question:** "Will Resend's MX record break my Google Workspace / Microsoft 365 email?"

**Answer: No, if you use a subdomain.**

- Resend's MX record goes on `send.yourdomain.com`
- Your email provider's MX record is on `yourdomain.com`
- These are completely separate DNS zones — no conflict

**If you must use the root domain:**
- Set Resend's MX record with a higher priority number (lower priority) than your email provider
- Example: Google is priority 1, Resend is priority 10

→ **See `references/troubleshooting.md`** for MX conflict resolution.

## Domain API

### Create a Domain
```bash
curl -X POST https://api.resend.com/domains \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "send.yourdomain.com",
    "region": "us-east-1",
    "customReturnPath": "bounce"
  }'
```

Response includes the DNS records you need to add.

### Verify a Domain
```bash
curl -X POST https://api.resend.com/domains/{domain_id}/verify \
  -H "Authorization: Bearer $RESEND_API_KEY"
```

Triggers Resend to check your DNS records. Can take a few minutes.

### List All Domains
```bash
curl https://api.resend.com/domains \
  -H "Authorization: Bearer $RESEND_API_KEY"
```

### Get Domain Details
```bash
curl https://api.resend.com/domains/{domain_id} \
  -H "Authorization: Bearer $RESEND_API_KEY"
```

### Update a Domain
```bash
curl -X PATCH https://api.resend.com/domains/{domain_id} \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "openTracking": true,
    "clickTracking": true
  }'
```

## DNS Provider-Specific Notes

### Cloudflare
- **Disable proxy mode** (orange cloud → gray cloud) for all Resend DNS records
- CNAME records with proxy enabled will break DKIM verification
- MX records cannot be proxied (Cloudflare enforces this)

### Providers That Auto-Append Domain
Some DNS providers (GoDaddy, Namecheap) auto-append your domain to record values:
- You enter: `resend._domainkey.send.yourdomain.com`
- Provider stores: `resend._domainkey.send.yourdomain.com.yourdomain.com` ← broken!
- **Fix:** Add a trailing dot: `resend._domainkey.send.yourdomain.com.`
- Or enter just the subdomain portion without the root domain

### Trailing Dots
A trailing dot (`.`) in DNS means "this is a fully qualified domain name":
- `send.yourdomain.com.` = absolute, don't append anything
- `send.yourdomain.com` = relative, provider may append the zone

When in doubt, add the trailing dot.

## Troubleshooting

Common issues when domain verification fails:

| Issue | Solution |
|-------|----------|
| DNS records not found | Check records are on correct subdomain, not root |
| Auto-appended domain | Use trailing dot in DNS values |
| Region mismatch | MX record must match the region selected during domain creation |
| DKIM value truncated | Some providers truncate long TXT values — paste carefully |
| Multiple regions detected | Only configure one region per domain |
| Nameserver conflict | Check authoritative nameservers at [dns.email](https://dns.email) |
| Propagation delay | DNS changes can take up to 72h (usually <1h) |

→ **See `references/troubleshooting.md`** for detailed troubleshooting guide.

## Workflow: Setting Up a New Domain

1. **Choose subdomain** — e.g., `send.yourdomain.com`
2. **Create domain via API** — `POST /domains` with name, region, optional custom return path
3. **Add DNS records** — SPF (MX), DKIM (3 CNAMEs) from API response
4. **Wait for propagation** — usually minutes, can take up to 72h
5. **Verify domain** — `POST /domains/{id}/verify`
6. **Set up DMARC** — start with `p=none`, monitor, then tighten
7. **(Optional) Set up BIMI** — after DMARC is at `quarantine` or `reject`

## Resources

- [Resend Domain Documentation](https://resend.com/docs/dashboard/domains/introduction)
- [DNS Record Reference](https://resend.com/docs/dashboard/domains/dns-records)
- [API Reference — Domains](https://resend.com/docs/api-reference/domains)
