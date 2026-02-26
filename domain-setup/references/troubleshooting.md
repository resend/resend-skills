# Domain Troubleshooting Guide

## Domain Not Verifying

### 1. Incorrect DNS Record Location

**Symptom:** Records show as "not found" even though you added them.

**Cause:** Records were added to the wrong subdomain or the root domain instead of the sending subdomain.

**Fix:**
- DKIM CNAMEs should be at `resend._domainkey.send.yourdomain.com`, not `resend._domainkey.yourdomain.com`
- MX and TXT records should be on `send.yourdomain.com`, not `yourdomain.com`
- Check your DNS provider to confirm exact record placement

**Verify with dig:**
```bash
dig TXT send.yourdomain.com +short
dig MX send.yourdomain.com +short
dig CNAME resend._domainkey.send.yourdomain.com +short
```

### 2. DNS Provider Auto-Appending Domain

**Symptom:** DNS lookup shows something like `resend._domainkey.send.yourdomain.com.yourdomain.com`.

**Cause:** Your DNS provider automatically appends the zone's domain name to record names.

**Fix:** 
- Add a trailing dot to make it a FQDN: `resend._domainkey.send.yourdomain.com.`
- Or enter only the subdomain portion relative to the zone: if your zone is `yourdomain.com`, enter `resend._domainkey.send` instead of the full name

**Common providers with this behavior:** GoDaddy, Namecheap, HostGator, Bluehost

### 3. Nameserver Conflicts

**Symptom:** Some records verify, others don't. Or verification is inconsistent.

**Cause:** Your domain has conflicting nameserver configurations (e.g., some records on Cloudflare, some on the registrar).

**Fix:**
- Use [dns.email](https://dns.email) to check authoritative nameservers
- Ensure all DNS records are managed by the same provider
- If you recently changed nameservers, wait for propagation

### 4. Region Mismatch in MX Records

**Symptom:** MX record shows as "incorrect value" even though you added it.

**Cause:** The MX record value contains a region code that doesn't match the region you selected when creating the domain.

**Fix:**
- Check the domain's region: `GET /domains/{id}`
- The MX value must match: `feedback-smtp.{region}.amazonses.com`
- Example: If you chose `eu-west-1`, the MX must point to `feedback-smtp.eu-west-1.amazonses.com`
- If wrong: delete the domain and recreate with the correct region

### 5. Multiple Regions Detected

**Symptom:** Error about multiple regions or conflicting records.

**Cause:** You have DNS records pointing to different Resend regions (e.g., MX for us-east-1 but DKIM for eu-west-1).

**Fix:**
- Remove all Resend DNS records
- Recreate the domain in a single region
- Add only the records from that single creation response

### 6. DKIM Value Mismatches

**Symptom:** DKIM records show as "incorrect value."

**Causes:**
- Extra quotes added by DNS provider (some add literal `"` characters)
- Value truncated (DKIM CNAME targets can be long)
- Copy-paste errors (extra whitespace, missing characters)

**Fix:**
- Re-copy the exact CNAME target from the API response or dashboard
- Check for invisible characters (use a plain text editor)
- Verify no extra quotes: `dig CNAME resend._domainkey.send.yourdomain.com +short`
- If truncated, check your DNS provider's character limit for CNAME values

### 7. DNS Propagation Delay

**Symptom:** Records just added, verification says "not found."

**Reality:** DNS changes can take time to propagate globally.

**Typical times:**
- Most providers: 5 minutes to 1 hour
- Some providers: up to 24 hours
- Worst case: up to 72 hours

**What to do:**
- Wait at least 15 minutes before first verification attempt
- Re-trigger verification: `POST /domains/{id}/verify`
- Check propagation: [whatsmydns.net](https://www.whatsmydns.net/)

---

## MX Record Conflicts

### Scenario: Google Workspace + Resend

**Setup:**
- Root domain (`yourdomain.com`) → Google Workspace MX records
- Subdomain (`send.yourdomain.com`) → Resend MX record

**These do NOT conflict.** MX records on different (sub)domains are independent.

### Scenario: Receiving Email on the Same Subdomain

If you want to both send (Resend) and receive email on the same subdomain:

**Option A (recommended):** Use different subdomains
- `send.yourdomain.com` → Resend (sending)
- `mail.yourdomain.com` → Your mail server (receiving)

**Option B:** Multiple MX records with priorities
- MX 10 `send.yourdomain.com` → Your receiving server
- MX 20 `send.yourdomain.com` → Resend's feedback server

Lower priority number = higher priority. Email delivery tries MX records in priority order.

### Scenario: Multiple Sending Services

Using Resend + another sending service (SendGrid, Mailgun, etc.):

- Use different subdomains for each: `resend.yourdomain.com`, `sendgrid.yourdomain.com`
- Each gets its own DNS records without conflicts
- SPF allows up to 10 DNS lookups — using subdomains avoids hitting this limit on the root domain

---

## DNS Provider-Specific Issues

### Cloudflare

**Problem:** DKIM CNAME records not resolving.
**Cause:** Cloudflare proxy (orange cloud) is enabled.
**Fix:** Set all Resend DNS records to "DNS only" (gray cloud). CNAME and MX records must not be proxied.

**Problem:** TXT records with special characters.
**Fix:** Cloudflare handles quoting automatically — don't add extra quotes around SPF values.

### GoDaddy

**Problem:** Records have the domain appended.
**Fix:** In the "Name" field, enter only the subdomain part. For `send.yourdomain.com`, enter just `send`. For `resend._domainkey.send`, enter just `resend._domainkey.send`.

### Namecheap

**Problem:** Similar auto-append behavior.
**Fix:** Use `@` for root domain records. For subdomains, enter the part before your domain. For `send.yourdomain.com`, enter `send`.

### AWS Route 53

**Problem:** Records require FQDN.
**Fix:** Always use trailing dot: `send.yourdomain.com.`, `resend._domainkey.send.yourdomain.com.`

### Vercel DNS

**Problem:** CNAME at zone apex not supported.
**Fix:** Use a subdomain (which you should be doing anyway). Vercel DNS works fine with subdomain CNAMEs.

---

## Verification Checklist

When domain verification fails, work through this checklist:

- [ ] Records are on the correct subdomain (not root)
- [ ] No domain auto-appending issues (check with `dig`)
- [ ] Region in MX record matches domain creation region
- [ ] DKIM CNAME values are exact (no truncation, no extra quotes)
- [ ] Cloudflare proxy is disabled for all records (if using Cloudflare)
- [ ] All records are on the same DNS provider
- [ ] At least 15 minutes have passed since adding records
- [ ] Re-triggered verification via API or dashboard
