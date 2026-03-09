---
name: error-troubleshooting
description: Use when debugging Resend API errors, troubleshooting email delivery issues, or diagnosing 403/422/429 errors. Covers all error codes, common pitfalls, and resolution steps.
inputs:
    - name: RESEND_API_KEY
      description: Resend API key for authentication. Get yours at https://resend.com/api-keys
      required: true
---

# Resend Error Troubleshooting

## Quick Decision Tree

Got an error? Find your status code:

| Status | Jump to |
|--------|---------|
| **400** | [Bad Request](#400-bad-request) |
| **401** | [Authentication](#401-authentication) |
| **403** | [Forbidden](#403-forbidden) — most common for new users |
| **404** | [Not Found](#404-not-found) |
| **405** | [Method Not Allowed](#405-method-not-allowed) |
| **409** | [Idempotency Conflict](#409-idempotency-conflict) |
| **422** | [Validation Error](#422-validation-error) |
| **429** | [Rate Limited](#429-rate-limited) |
| **451** | [Security Error](#451-security-error) |
| **500** | [Server Error](#500-server-error) |
| **No error but email missing?** | [Delivered But Not Received](#delivered-but-not-received) |
| **CORS error in browser?** | [CORS Issues](#cors-issues) |

For the complete error code table, see `references/error-reference.md`.

---

## 400 Bad Request

### `invalid_idempotency_key`
The `Idempotency-Key` header must be between 1 and 256 characters.

**Fix:** Ensure your idempotency key is a non-empty string ≤256 chars. UUIDs work well.

### `validation_error`
Field-level validation failed. The response body contains details about which fields are invalid.

**Fix:** Check the error message for the specific field. Common causes: malformed email addresses, empty required fields, invalid data types.

---

## 401 Authentication

### `missing_api_key`
No `Authorization` header was sent with the request.

**Fix:** Add the header: `Authorization: Bearer re_your_api_key`

### `restricted_api_key`
You're using a sending-only API key for a non-sending endpoint (e.g., reading domains, managing contacts).

**Fix:** Create a full-access API key at https://resend.com/api-keys, or use a key with the appropriate permissions.

---

## 403 Forbidden

This is the most common error for new Resend users. Three distinct causes:

### 1. Using `resend.dev` domain (most common for new users)

**Error:** `validation_error` — "You can only send testing emails to your own email address"

**What's happening:** The default `onboarding@resend.dev` sender can only deliver to the email on your Resend account. It's a sandbox for testing.

**Fix:** Verify your own domain at https://resend.com/domains. Once DNS records are configured and verified, you can send to any recipient.

→ See the **domain-setup** skill for step-by-step domain verification.

### 2. Domain mismatch

**Error:** `validation_error` — domain not verified or from address doesn't match

**What's happening:** You verified `sending.example.com` but are sending from `user@example.com`. The `from` address domain must exactly match a verified domain.

**Fix:** Either:
- Send from `user@sending.example.com` (matching your verified domain)
- Verify `example.com` as an additional domain

### 3. Invalid API key

**Error:** `invalid_api_key`

**What's happening:** The API key is malformed, revoked, or from a different account.

**Fix:** Generate a new key at https://resend.com/api-keys. Keys start with `re_`.

---

## 404 Not Found

### `not_found`
The endpoint URL is wrong.

**Fix:** Check the URL. Base URL is `https://api.resend.com`. Common endpoints:
- `POST /emails` — send email
- `POST /emails/batch` — batch send
- `GET /emails/{id}` — get email status

---

## 405 Method Not Allowed

### `method_not_allowed`
Wrong HTTP method for the endpoint.

**Fix:** Check the docs. Sending uses `POST`, fetching uses `GET`.

---

## 409 Idempotency Conflict

### `invalid_idempotent_request`
You reused an `Idempotency-Key` with a different request payload.

**Fix:** Each unique request needs a unique idempotency key. If you want to retry the same request, use the same key AND the same payload.

### `concurrent_idempotent_requests`
You sent two requests with the same `Idempotency-Key` simultaneously and the first hasn't finished.

**Fix:** Wait for the first request to complete before retrying with the same key.

---

## 422 Validation Error

### `invalid_from_address`
The `from` field format is invalid.

**Fix:** Use a valid format:
- `sender@yourdomain.com`
- `Sender Name <sender@yourdomain.com>`

### `invalid_attachment`
Attachment is missing both `content` and `path`.

**Fix:** Every attachment needs either `content` (base64 string) or `path` (URL). You must provide one.

### `missing_required_field`
A required field is missing from the request body.

**Fix:** Minimum required fields: `from`, `to`, and either `html`, `text`, or `react`.

### `invalid_region`
Invalid region specified.

**Fix:** Valid regions: `us-east-1`, `eu-west-1`, `sa-east-1`.

### `invalid_parameter`
A parameter expected a UUID but got something else.

**Fix:** Ensure IDs (email ID, domain ID, etc.) are valid UUIDs.

### `invalid_access`
Invalid API key access level specified.

**Fix:** When creating API keys, `permission` must be `full_access` or `sending_access`.

---

## 429 Rate Limited

### `rate_limit_exceeded`
Too many requests per second. Default limit: **2 requests/second**.

**Fix:** Add delays between requests. For batch sending, use `POST /emails/batch` (up to 100 emails per request) instead of individual calls.

→ See the **send-email** skill for retry and backoff patterns.

### `daily_quota_exceeded`
You've hit your plan's daily sending limit.

**Fix:** Wait until the next day (UTC reset), or upgrade your plan at https://resend.com/pricing.

### `monthly_quota_exceeded`
You've hit your plan's monthly sending limit.

**Fix:** Upgrade your plan at https://resend.com/pricing.

---

## 451 Security Error

### `security_error`
Resend detected a security concern with your request (e.g., phishing content, suspicious patterns).

**Fix:** Review your email content for anything that could trigger security filters. If you believe this is a false positive, contact support@resend.com.

---

## 500 Server Error

### `application_error` / `internal_server_error`
Something went wrong on Resend's side.

**Fix:** Retry with exponential backoff:

```
Attempt 1: wait 1s
Attempt 2: wait 2s
Attempt 3: wait 4s
Attempt 4: wait 8s
Max: 5 attempts
```

If 500 errors persist, check https://resend.com/status or contact support.

→ See the **send-email** skill for retry implementation patterns.

---

## Delivered But Not Received

The API returned success and the email shows as "delivered," but the recipient can't find it.

### Troubleshooting steps:

1. **Check spam/junk folder** — most common cause, especially for new domains without reputation
2. **Check Resend dashboard** — look at the email status at https://resend.com/emails
   - **Bounced?** The recipient address is invalid or the receiving server rejected it
   - **Complained?** The recipient marked a previous email as spam — they're now suppressed
3. **Check suppressions** — `GET /audiences/{audience_id}/contacts` — if the recipient is suppressed, they won't receive emails
4. **Check DNS/authentication:**
   - SPF record configured?
   - DKIM records configured?
   - DMARC policy set?
   → See the **domain-setup** skill for DNS verification
5. **Gmail-specific:** Gmail may delay or filter emails from new domains. Build reputation by sending wanted emails to engaged recipients first.

---

## CORS Issues

**Error:** `Access-Control-Allow-Origin` error in browser console.

**What's happening:** You're calling the Resend API directly from client-side JavaScript (browser). The Resend API does not support CORS — this is intentional and by design.

**Why:** Calling the API from the browser would expose your API key in the client-side code. Anyone could extract it and send emails on your behalf.

**Fix:** Always call the Resend API from your server/backend:
- Next.js API routes or Server Actions
- Express/Fastify/Hono endpoints
- Serverless functions (Vercel, AWS Lambda, Cloudflare Workers)
- Any server-side environment

Never put your `RESEND_API_KEY` in client-side code.
