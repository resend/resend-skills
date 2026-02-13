# Test: Resend Router Skill

**Skill under test:** `resend` (root router)
**Skill type:** Reference (router)
**Test approach:** Retrieval scenarios - does the agent route to the correct sub-skill?

## Setup

```
IMPORTANT: This is a real scenario. You must choose and act.
You have access to: resend skill (router)
```

---

## Scenario 1: Ambiguous Send vs Receive

**Tests:** Correct routing when the request involves both sending and receiving

```
A user asks: "I need to set up a system where customers email support@acme.com
and get an automatic reply acknowledging their message."

Which sub-skill(s) do you need? What's the correct order of setup?
```

**Expected:** Agent identifies BOTH `resend-inbound` (to receive emails) AND `send-email` (to send auto-reply). Should set up inbound first, then sending.

**Failure indicators:**
- Routes only to `send-email`
- Routes only to `resend-inbound`
- Doesn't mention order of operations

---

## Scenario 2: AI Agent vs Plain Inbound

**Tests:** Distinguishing `resend-inbound` from `agent-email-inbox`

```
A user says: "I want my app to receive emails at billing@myapp.com
and store them in a database."

Which sub-skill do you route to?
```

**Expected:** Routes to `resend-inbound`. This is plain email receiving, not an AI agent inbox.

**Failure indicators:**
- Routes to `agent-email-inbox` / `moltbot`
- Suggests security levels or prompt injection protection (not relevant here)

---

## Scenario 3: AI Agent Inbox

**Tests:** Correct identification of AI agent use case

```
A user says: "I'm building an AI assistant that processes customer emails,
understands their intent, and takes actions like creating tickets or
updating orders."

Which sub-skill do you route to?
```

**Expected:** Routes to `agent-email-inbox` / `moltbot`. AI processing emails = agent inbox with security considerations.

**Failure indicators:**
- Routes to `resend-inbound` only (misses security implications)
- Doesn't mention security concerns for AI processing

---

## Scenario 4: Bulk Notifications

**Tests:** Routing for batch sending scenarios

```
A user says: "I need to send order confirmation emails to 500 customers
who placed orders today."

Which sub-skill and approach do you recommend?
```

**Expected:** Routes to `send-email`. Should mention batch endpoint with chunking (500 > 100 limit), idempotency keys per chunk.

**Failure indicators:**
- Suggests single sends in a loop without mentioning batch
- Doesn't mention the 100-per-batch limit requiring chunking
- Doesn't mention idempotency keys

---

## Scenario 5: Webhook Setup Confusion

**Tests:** Routing when user mentions webhooks (both sending and receiving use them)

```
A user says: "I need to set up webhooks for Resend."

How do you clarify what they need?
```

**Expected:** Agent should clarify the use case because webhooks appear in multiple sub-skills:
- `send-email` → delivery status webhooks (`email.delivered`, `email.bounced`)
- `resend-inbound` → received email webhooks (`email.received`)
- `agent-email-inbox` → received email webhooks with security layer

**Failure indicators:**
- Assumes one type of webhook without asking
- Routes to a single sub-skill without clarifying

---

## Scenario 6: "Just Send an Email"

**Tests:** Simple routing for the most common case

```
A user says: "I need to send a welcome email when a user signs up."
```

**Expected:** Routes directly to `send-email`. Single transactional email, straightforward case.

**Failure indicators:**
- Over-routes to multiple skills
- Suggests batch when single is appropriate
- Suggests agent-email-inbox

---

## Scoring

| Scenario | Pass Criteria |
|----------|---------------|
| 1 - Ambiguous | Routes to BOTH correct sub-skills in correct order |
| 2 - Plain inbound | Routes to `resend-inbound`, not agent inbox |
| 3 - AI agent | Routes to `agent-email-inbox`, mentions security |
| 4 - Bulk | Routes to `send-email`, mentions batch + chunking + idempotency |
| 5 - Webhooks | Clarifies use case before routing |
| 6 - Simple send | Routes to `send-email` directly |

**Pass threshold:** 5/6 correct routing decisions
