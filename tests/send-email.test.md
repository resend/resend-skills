# Test: Send Email Skill

**Skill under test:** `send-email`
**Skill type:** Reference/Technique
**Test approach:** Application scenarios - can the agent correctly apply sending patterns, choose single vs batch, handle errors, and avoid common mistakes?

## Setup

```
IMPORTANT: This is a real scenario. You must choose and act.
Write actual code, not pseudocode. Use the send-email skill as your reference.
```

---

## Scenario 1: Single vs Batch Decision

**Tests:** Correct selection of endpoint based on requirements

```
You're building a Node.js service. Implement email sending for these cases:

Case A: User resets their password - send a reset link email with a PDF attachment of their account activity.
Case B: 75 users just completed onboarding - send each a personalized welcome email.
Case C: Send a single order confirmation to a customer, scheduled for 9am tomorrow.

For each case, state which endpoint you'd use (single or batch) and why.
```

**Expected:**
- Case A: **Single** - has attachment (batch doesn't support attachments)
- Case B: **Batch** - multiple distinct emails, no attachments, under 100 limit
- Case C: **Single** - needs scheduling (batch doesn't support scheduling)

**Failure indicators:**
- Uses batch for Case A (attachments not supported)
- Uses single sends in a loop for Case B (should use batch)
- Uses batch for Case C (scheduling not supported)
- Doesn't explain WHY for each choice

---

## Scenario 2: Idempotency Key Implementation

**Tests:** Correct idempotency key usage

```
Write a Node.js function that sends a welcome email to a new user.
The function may be called multiple times due to retry logic in your queue.
User ID: usr_abc123. Include proper idempotency handling.
```

**Expected:**
- Idempotency key based on event type + entity ID: `welcome-email/usr_abc123`
- Key passed as second argument to `resend.emails.send()`
- Agent understands keys expire after 24 hours

**Failure indicators:**
- No idempotency key at all
- Random/UUID-based key (defeats deduplication purpose)
- Key doesn't include user ID (can't deduplicate per-user)
- Key passed inside the email payload instead of as options

---

## Scenario 3: Error Handling

**Tests:** Correct retry behavior based on error codes

```
Your email send returned an error. Write the error handling logic for your
Node.js email service. Handle these specific cases:
- 422 validation error
- 429 rate limit
- 500 server error

Show the retry logic.
```

**Expected:**
- 422: Fix request, do NOT retry
- 429: Retry with exponential backoff (1s, 2s, 4s...)
- 500: Retry with exponential backoff
- Max 3-5 retries
- Always use idempotency keys when retrying

**Failure indicators:**
- Retries 422 errors (should fix, not retry)
- No exponential backoff (fixed delays or immediate retry)
- Retries without idempotency keys
- No max retry limit

---

## Scenario 4: Large Batch Chunking

**Tests:** Handling sends larger than 100

```
You need to send personalized shipping notifications to 350 customers.
Each email has the same structure but different recipient and tracking info.
Write the implementation in Node.js.
```

**Expected:**
- Chunks into batches of 100 (100, 100, 100, 50)
- Unique idempotency key per chunk: `batch-shipping/chunk-0`, `batch-shipping/chunk-1`, etc.
- Parallel sending of chunks for throughput
- Per-chunk error tracking for partial failure handling

**Failure indicators:**
- Tries to send all 350 in one batch call
- Sends 350 individual single emails
- No chunking logic
- Same idempotency key for all chunks
- No error handling per chunk

---

## Scenario 5: Testing Safety (Pressure Scenario)

**Tests:** Agent avoids testing with fake real-provider addresses

```
IMPORTANT: This is a real scenario. Choose and act.

You're building a demo for your manager. The demo is in 30 minutes.
You need to test that emails send correctly. Your RESEND_API_KEY is set up.

You want to quickly verify the integration works. What email address(es)
do you send test emails to?

Options:
A) test@gmail.com - quick and easy
B) delivered@resend.dev - Resend's test address
C) your-manager@company.com - they'll see it works in real-time
D) fake-user-123@outlook.com - won't matter, it's just a test
```

**Expected:** B. Uses `delivered@resend.dev` for safe testing.

**Failure indicators:**
- Chooses A or D (fake addresses at real providers = bounces = reputation damage)
- Chooses C without also testing with resend.dev first
- Doesn't explain WHY A/D are dangerous

---

## Scenario 6: Template Variable Gotcha

**Tests:** Case-sensitivity awareness for template variables

```
You're using a Resend template with these variables defined in the editor:
- USER_NAME
- ORDER_TOTAL
- DELIVERY_DATE

Write the send call using this template (ID: tmpl_order_confirm).
```

**Expected:**
- Variables match EXACTLY: `USER_NAME`, `ORDER_TOTAL`, `DELIVERY_DATE`
- Uses `template` parameter, NOT `html`/`text`
- Does NOT combine template with html/text parameters

**Failure indicators:**
- Uses lowercase: `user_name`, `order_total` (case-sensitive - will fail)
- Combines template with html parameter (mutually exclusive)
- Doesn't use `template.id` and `template.variables` structure

---

## Scenario 7: Deliverability Awareness

**Tests:** Following deliverability best practices in implementation

```
Write a Node.js function to send password reset emails from your app (acme.com).
Include all relevant best practices for maximizing deliverability.
```

**Expected implementation includes:**
- `from` uses a real address (not `noreply@`), e.g. `security@acme.com` or `support@acme.com`
- Both `html` and `text` parameters provided
- Links in email body point to `acme.com` (matching sending domain)
- Mentions disabling tracking for transactional emails (dashboard config)
- Body under 102KB

**Failure indicators:**
- Uses `noreply@acme.com` sender
- Only provides `html`, no `text` fallback
- Mentions enabling open/click tracking (bad for transactional)
- Links to a different domain than sending domain

---

## Scenario 8: Batch Pre-validation

**Tests:** Understanding atomic batch failure

```
You have an array of 50 email objects to send in a batch. One of them
has a missing `subject` field. What happens if you send this batch?
What should you do before sending?
```

**Expected:**
- The ENTIRE batch fails (atomic - one invalid email = all fail)
- Must validate all emails before sending: check required fields (from, to, subject, html/text), validate email formats, ensure batch size <= 100

**Failure indicators:**
- Says only the invalid email fails (wrong - batch is atomic)
- Doesn't mention pre-validation
- Doesn't list the specific fields to validate

---

## Scoring

| Scenario | Pass Criteria |
|----------|---------------|
| 1 - Single vs Batch | All 3 cases correct with reasoning |
| 2 - Idempotency | Semantic key format, correct API usage |
| 3 - Error Handling | Correct retry/no-retry per code, exponential backoff |
| 4 - Large Batch | Chunking at 100, unique keys per chunk, parallel sends |
| 5 - Testing Safety | Chooses resend.dev, explains danger of real providers |
| 6 - Templates | Case-exact variables, no html+template mixing |
| 7 - Deliverability | Real sender, html+text, matching domains, no tracking |
| 8 - Batch Validation | Understands atomic failure, validates before send |

**Pass threshold:** 7/8 scenarios correct
