# Test: Resend Skill

**Skill under test:** `resend` (unified skill)
**Skill type:** Reference (unified with decision tree)
**Test approach:** Retrieval scenarios - does the agent navigate to the correct reference file?

## Setup

```
[Test scaffold] For each scenario below, commit to a specific routing decision. You have access to: resend skill.
```

---

## Scenario 1: Ambiguous Send vs Receive

**Tests:** Correct navigation when the request involves both sending and receiving

```
A user asks: "I need to set up a system where customers email support@acme.com
and get an automatic reply acknowledging their message."

Which reference file(s) do you need? What's the correct order of setup?
```

**Expected:** Agent navigates to BOTH `references/receiving.md` (to receive emails) AND `references/sending/overview.md` (to send auto-reply). Should set up inbound first, then sending.

**Failure indicators:**
- Only reads sending references
- Only reads receiving reference
- Doesn't mention order of operations

---

## Scenario 2: Automation That Sounds Like AI

**Tests:** Distinguishing inbound email processing from the `agent-email-inbox` skill

```
A user says: "I want to build a system that receives customer emails,
automatically extracts invoice numbers from the body, looks up the order
in our database, and updates the status. It should also auto-reply with
the current order status."

What reference(s) do you consult?
```

**Expected:** This is ambiguous. The system "understands" email content and "takes actions" — but it could be rule-based parsing (regex for invoice numbers) or AI-driven. Agent should either:
- Ask whether this is rule-based or AI-driven processing
- Navigate to receiving reference if simple parsing, but flag that if AI is involved, the `agent-email-inbox` skill is needed for security
- Recommend the `agent-email-inbox` skill if they assume AI involvement

**Failure indicators:**
- Routes confidently to one reference without acknowledging the ambiguity
- Uses receiving reference with no mention of security implications if AI is involved

---

## Scenario 3: Domain Setup Ambiguity

**Tests:** Navigation when "domain" could mean sending domain or receiving domain

```
A user says: "I need to configure my domain for Resend."

How do you handle this?
```

**Expected:** Agent should clarify because "configure domain" means different things:
- Sending domain: DNS records (SPF, DKIM, DMARC) for email authentication → `references/sending/overview.md`
- Receiving domain: MX records for inbound email → `references/receiving.md`
- Both: common for apps that send and receive

**Failure indicators:**
- Assumes sending or receiving without asking
- Doesn't know that domain setup differs between sending and receiving

---

## Scenario 4: Webhook Setup Confusion

**Tests:** Navigation when user mentions webhooks (both sending and receiving use them)

```
A user says: "I need to set up webhooks for Resend."

How do you clarify what they need?
```

**Expected:** Agent should clarify the use case because webhooks cover multiple purposes:
- Delivery status webhooks (`email.delivered`, `email.bounced`) → `references/webhooks.md`
- Received email webhooks (`email.received`) → `references/receiving.md` and `references/webhooks.md`
- Agent inbox webhooks with security → recommend `agent-email-inbox` skill

**Failure indicators:**
- Assumes one type of webhook without asking
- Navigates to a single reference without clarifying

---

## Scenario 5: Forwarding Trap

**Tests:** Recognizing that "forwarding" requires both receiving and sending

```
A user says: "When someone emails helpdesk@myapp.com, I want to forward
it to our team Slack channel and also forward it as an email to
manager@company.com with any attachments."

Which reference(s) do you need?
```

**Expected:** Both `references/receiving.md` (to receive the email) and `references/sending/overview.md` (to forward as email with attachments). The Slack part is outside Resend scope. Key detail: forwarding with attachments requires single sends (batch doesn't support attachments).

**Failure indicators:**
- Only reads sending references (misses that you need to receive first)
- Only reads receiving reference (misses that email forwarding uses the send API)
- Doesn't note that attachments require single sends

---

## Scenario 6: Security Without AI Keywords

**Tests:** Recognizing security risk when "AI" is never mentioned but the system processes untrusted input and takes actions

```
A user says: "Customers will email returns@shop.com and my system will
automatically process refunds based on what they write. If they include
an order number and say they want a refund, it initiates the refund in
our payment system."

What do you recommend?
```

**Expected:** This should recommend the `agent-email-inbox` skill (or at minimum flag security concerns) because:
- Untrusted external senders are triggering financial actions (refunds)
- The system interprets freeform email content to make decisions
- Without security, anyone could email "refund order #X" and trigger unauthorized refunds

**Failure indicators:**
- Only uses receiving reference without mentioning security risks
- Treats this as simple email receiving + database lookup
- Doesn't flag that untrusted input triggering financial actions needs security

---

## Scenario 7: Broadcast / Audience Red Herring

**Tests:** Handling a request the skill doesn't cover

```
A user says: "I want to send a monthly newsletter to my 10,000 subscribers
with unsubscribe links and engagement tracking."

What do you recommend?
```

**Expected:** Agent should note this is a marketing/broadcast use case, not covered by transactional sending. Should recommend Resend Broadcasts as the appropriate feature.

**Failure indicators:**
- Navigates to sending references without caveats (those are for transactional, not marketing)
- Suggests batch sending 10,000 emails (wrong approach for newsletters)
- Doesn't mention that marketing emails have different requirements

---

## Scenario 8: "Just Send an Email"

**Tests:** Simple navigation baseline (control scenario)

```
A user says: "I need to send a welcome email when a user signs up."
```

**Expected:** Uses the quick send example in the main SKILL.md or navigates to `references/sending/overview.md`. Single transactional email, straightforward case.

**Failure indicators:**
- Over-navigates to multiple references
- Suggests batch when single is appropriate
- Recommends agent-email-inbox

---

## Scoring

| Scenario | Pass Criteria |
|----------|---------------|
| 1 - Ambiguous | Navigates to BOTH correct references in correct order |
| 2 - Automation vs AI | Acknowledges ambiguity, asks or flags security if AI-driven |
| 3 - Domain Setup | Clarifies sending vs receiving domain before navigating |
| 4 - Webhooks | Clarifies use case before navigating |
| 5 - Forwarding | Navigates to BOTH references, notes attachment constraint |
| 6 - Security no AI | Flags security risk for untrusted input triggering actions |
| 7 - Broadcast | Notes this isn't covered by transactional references |
| 8 - Simple send | Uses quick send example or navigates to sending overview directly |

**Pass threshold:** 6/8 correct navigation decisions
