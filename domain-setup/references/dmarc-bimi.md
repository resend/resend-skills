# DMARC and BIMI Implementation Guide

## DMARC (Domain-based Message Authentication, Reporting & Conformance)

DMARC builds on SPF and DKIM to tell receiving servers what to do when authentication fails.

### DNS Record

Add a TXT record at `_dmarc.yourdomain.com`:

```
v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com
```

**Important:** DMARC is set on the **root domain**, not the sending subdomain. Even if you send from `send.yourdomain.com`, the DMARC record goes at `_dmarc.yourdomain.com`.

### Progressive Rollout Strategy

#### Phase 1: Monitor (Weeks 1-4)

```
v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com; ruf=mailto:dmarc-forensic@yourdomain.com
```

- `p=none` — take no action, just report
- Monitor reports to identify legitimate senders that might fail
- Ensure all your sending services (Resend, newsletters, CRM) pass SPF/DKIM

#### Phase 2: Quarantine (Weeks 5-8)

```
v=DMARC1; p=quarantine; pct=10; rua=mailto:dmarc-reports@yourdomain.com
```

- `p=quarantine` — send failing emails to spam
- `pct=10` — only apply to 10% of failing emails initially
- Gradually increase `pct` to 25, 50, 100 as confidence grows

#### Phase 3: Reject (Week 9+)

```
v=DMARC1; p=reject; rua=mailto:dmarc-reports@yourdomain.com
```

- `p=reject` — outright reject failing emails
- This is the goal — maximum protection against spoofing
- Required for BIMI

### DMARC Parameters Reference

| Parameter | Required | Values | Description |
|-----------|----------|--------|-------------|
| `v` | Yes | `DMARC1` | Version (always DMARC1) |
| `p` | Yes | `none`, `quarantine`, `reject` | Policy for failing emails |
| `pct` | No | `1`-`100` | Percentage of emails to apply policy to (default: 100) |
| `rua` | No | `mailto:address` | Aggregate report destination |
| `ruf` | No | `mailto:address` | Forensic (failure) report destination |
| `sp` | No | `none`, `quarantine`, `reject` | Subdomain policy (inherits from `p` if omitted) |
| `adkim` | No | `r` (relaxed), `s` (strict) | DKIM alignment mode (default: relaxed) |
| `aspf` | No | `r` (relaxed), `s` (strict) | SPF alignment mode (default: relaxed) |

### DMARC Alignment with Resend

When sending from `user@send.yourdomain.com`:
- **SPF alignment:** The return path domain must match the From domain (custom return path helps)
- **DKIM alignment:** The DKIM signing domain (`d=` tag) must match the From domain
- **Relaxed mode** (`adkim=r`): Organizational domain match is enough (`yourdomain.com` matches `send.yourdomain.com`)
- **Strict mode** (`adkim=s`): Exact domain match required

**Recommendation:** Use relaxed alignment (the default) when sending from a subdomain.

### Reading DMARC Reports

Aggregate reports (`rua`) are XML files sent daily by receiving mail servers. Use a service to parse them:
- [DMARC Analyzer](https://www.dmarcanalyzer.com/)
- [Postmark DMARC](https://dmarc.postmarkapp.com/) (free)
- [Valimail](https://www.valimail.com/)

---

## BIMI (Brand Indicators for Message Identification)

BIMI displays your brand logo next to emails in supporting inbox providers.

### Prerequisites

1. **DMARC policy:** Must be `p=quarantine` or `p=reject` (not `p=none`)
2. **Certificate:** VMC (Verified Mark Certificate) or CMC (Common Mark Certificate)
3. **Logo:** SVG file in **SVG Tiny P/S** format (not regular SVG)

### Supported Inbox Providers

- Gmail (requires VMC)
- Apple Mail (requires VMC or CMC)
- Yahoo Mail
- Fastmail

### Getting a VMC/CMC

**VMC (Verified Mark Certificate):**
- Requires a registered trademark
- Issued by DigiCert or Entrust
- Typically costs $1,000-$1,500/year
- Provides the highest level of brand verification

**CMC (Common Mark Certificate):**
- Does NOT require a registered trademark
- More accessible for smaller companies
- Supported by some providers (Apple Mail) but not all (Gmail still requires VMC)

### Logo Requirements

- **Format:** SVG Tiny P/S (Profile/Secure) — a restricted subset of SVG
- **Shape:** Square aspect ratio
- **Size:** No specific pixel size (it's vector), but must be SVG Tiny P/S compliant
- **Background:** Solid color or transparent
- **Hosting:** Must be served over HTTPS
- **Tools:** Use [BIMI SVG Conversion Tool](https://bimigroup.org/bimi-generator/) to convert

### DNS Record

Add a TXT record at `default._bimi.yourdomain.com`:

```
v=BIMI1; l=https://yourdomain.com/brand/logo.svg; a=https://yourdomain.com/brand/cert.pem
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `v` | Yes | Version (always `BIMI1`) |
| `l` | Yes | HTTPS URL to your SVG Tiny P/S logo |
| `a` | No* | HTTPS URL to your VMC/CMC certificate PEM file |

*Required by Gmail. Optional for Yahoo and others.

### Verification

Test your BIMI setup:
- [BIMI Inspector](https://bimigroup.org/bimi-inspector/)
- [BIMI LookUp](https://bimilookup.org/)

### Timeline

1. Get DMARC to `p=quarantine` or `p=reject` → 1-2 months
2. Obtain VMC/CMC certificate → 2-4 weeks
3. Prepare SVG Tiny P/S logo → 1-2 days
4. Add BIMI DNS record → minutes
5. Gmail/Apple Mail adoption → can take weeks to appear
