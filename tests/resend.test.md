# Test: Resend Skill

**Skill under test:** `resend`
**Skill type:** Reference (platform skill with decision trees + capability index)
**Test approach:** Retrieval scenarios - does the agent use the correct reference for each request?

## Setup

```
[Test scaffold] For each scenario below, commit to a specific decision. You have access to: resend skill (platform skill with references).
```

---

## Scenario 1: Ambiguous Send vs Receive

**Tests:** Correct reference selection when the request involves both sending and receiving

```
A user asks: "I need to set up a system where customers email support@acme.com
and get an automatic reply acknowledging their message."

Which reference(s) do you need? What's the correct order of setup?
```

**Expected:** Agent identifies BOTH the receiving reference (to receive emails) AND the sending reference (to send auto-reply). Should set up inbound first, then sending.

**Failure indicators:**
- Uses only the sending reference
- Uses only the receiving reference
- Doesn't mention order of operations

---

## Scenario 2: Automation That Sounds Like AI

**Tests:** Distinguishing the receiving reference from the `agent-email-inbox` skill when the request describes automation without saying "AI"

```
A user says: "I want to build a system that receives customer emails,
automatically extracts invoice numbers from the body, looks up the order
in our database, and updates the status. It should also auto-reply with
the current order status."

Which reference or skill do you use?
```

**Expected:** This is ambiguous. The system "understands" email content and "takes actions" -- but it could be rule-based parsing (regex for invoice numbers) or AI-driven. Agent should either:
- Ask whether this is rule-based or AI-driven processing
- Use the `agent-email-inbox` skill if they assume AI (because of "automatically extracts" / "understands"), mentioning security
- Use the receiving reference if they assume simple parsing, but flag that if AI is involved, security measures are needed

**Failure indicators:**
- Confidently picks one reference without acknowledging the ambiguity
- Uses the receiving reference with no mention of security implications if AI is involved
- Uses `agent-email-inbox` for what might be simple regex parsing

---

## Scenario 3: Domain Setup Ambiguity

**Tests:** Routing when "domain" could mean sending domain or receiving domain

```
A user says: "I need to configure my domain for Resend."

How do you handle this?
```

**Expected:** Agent should clarify because "configure domain" means different things:
- Sending domain: DNS records (SPF, DKIM, DMARC) for email authentication → sending reference
- Receiving domain: MX records for inbound email → receiving reference
- Both: common for apps that send and receive

**Failure indicators:**
- Assumes sending or receiving without asking
- Uses a single reference without clarifying
- Doesn't know that domain setup differs between sending and receiving

---

## Scenario 4: Webhook Setup Confusion

**Tests:** Routing when user mentions webhooks (both sending and receiving use them)

```
A user says: "I need to set up webhooks for Resend."

How do you clarify what they need?
```

**Expected:** Agent should clarify the use case because webhooks appear in multiple references:
- Sending → delivery status webhooks (`email.delivered`, `email.bounced`) → webhooks reference
- Receiving → received email webhooks (`email.received`) → receiving + webhooks references
- Agent inbox → received email webhooks with security layer → `agent-email-inbox` skill

**Failure indicators:**
- Assumes one type of webhook without asking
- Uses a single reference without clarifying

---

## Scenario 5: Forwarding Trap

**Tests:** Recognizing that "forwarding" requires both receiving and sending

```
A user says: "When someone emails helpdesk@myapp.com, I want to forward
it to our team Slack channel and also forward it as an email to
manager@company.com with any attachments."

Which reference(s) do you need?
```

**Expected:** Both the receiving reference (to receive the email) and the sending reference (to forward as email with attachments). The Slack part is outside Resend scope. Key detail: forwarding with attachments requires single sends (batch doesn't support attachments).

**Failure indicators:**
- Only uses the sending reference (misses that you need to receive first)
- Only uses the receiving reference (misses that email forwarding uses the send API)
- Doesn't note that attachments require single sends

---

## Scenario 6: Security Without AI Keywords

**Tests:** Recognizing security risk when "AI" is never mentioned but the system processes untrusted input and takes actions

```
A user says: "Customers will email returns@shop.com and my system will
automatically process refunds based on what they write. If they include
an order number and say they want a refund, it initiates the refund in
our payment system."

Which reference or skill do you use?
```

**Expected:** This should use the `agent-email-inbox` skill (or at minimum flag security concerns) because:
- Untrusted external senders are triggering financial actions (refunds)
- The system interprets freeform email content to make decisions
- Without security, anyone could email "refund order #X" and trigger unauthorized refunds
- This is an attack vector whether or not AI is involved

**Failure indicators:**
- Uses only the receiving reference without mentioning security risks
- Treats this as simple email receiving + database lookup
- Doesn't flag that untrusted input triggering financial actions needs security

---

## Scenario 7: Broadcast / Audience Red Herring

**Tests:** Handling a request the platform skill doesn't cover

```
A user says: "I want to send a monthly newsletter to my 10,000 subscribers
with unsubscribe links and engagement tracking."

Which reference do you use?
```

**Expected:** Agent should note that this is a marketing/broadcast use case, not covered by the transactional email references. Should mention Resend Broadcasts as the appropriate feature.

**Failure indicators:**
- Uses the sending reference without caveats (sending is for transactional, not marketing)
- Suggests batch sending 10,000 emails (wrong approach for newsletters)
- Doesn't mention that marketing emails have different requirements (unsubscribe, engagement tracking)

---

## Scenario 8: "Just Send an Email"

**Tests:** Simple routing baseline (control scenario)

```
A user says: "I need to send a welcome email when a user signs up."
```

**Expected:** Uses the sending reference directly. Single transactional email, straightforward case.

**Failure indicators:**
- Over-references to multiple references
- Suggests batch when single is appropriate
- Suggests agent-email-inbox

---

## Scoring

| Scenario | Pass Criteria |
|----------|---------------|
| 1 - Ambiguous | Uses BOTH correct references in correct order |
| 2 - Automation vs AI | Acknowledges ambiguity, asks or flags security if AI-driven |
| 3 - Domain Setup | Clarifies sending vs receiving domain before proceeding |
| 4 - Webhooks | Clarifies use case before proceeding |
| 5 - Forwarding | Uses BOTH references, notes attachment constraint |
| 6 - Security no AI | Flags security risk for untrusted input triggering actions |
| 7 - Broadcast | Notes this isn't covered by transactional references |
| 8 - Simple send | Uses sending reference directly |

**Pass threshold:** 6/8 correct decisions
