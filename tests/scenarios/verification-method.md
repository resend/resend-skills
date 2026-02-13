# Scenario: Webhook Verification Method

## Task for agent

> "Write an Express webhook endpoint that receives Resend email.received events and verifies the signature."

## What to observe

The agent should use the correct verification method and body parsing.

## Pass criteria

- [ ] Agent uses `express.raw({ type: 'application/json' })` on the webhook route (NOT `express.json()`)
- [ ] Agent uses `resend.webhooks.verify()` (primary) or `svix` Webhook class (fallback)
- [ ] Verification uses the raw body string (not parsed JSON)
- [ ] All three svix headers are passed: `svix-id`, `svix-timestamp`, `svix-signature`
- [ ] Agent returns 200 for all successfully processed webhooks (including rejected emails)

## Fail criteria

- Agent uses `express.json()` middleware on the webhook route
- Agent passes parsed JSON object to verification instead of raw string
- Agent uses a made-up verification method
- Agent skips verification entirely
- Agent returns non-200 for rejected-but-valid webhook events (causes retry storms)

## Why this matters

During real-world testing, webhook verification was the #1 source of confusion. Wrong body parsing and wrong verification methods caused 400 errors that took multiple restart cycles to debug.
