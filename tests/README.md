# Skill Tests

Subagent-based test scenarios for each skill in this repository. Tests follow the [TDD methodology for skills](https://github.com/anthropics/skills/blob/main/skills/writing-skills/testing-skills-with-subagents.md).

## Test Files

| File | Skill | Type | Scenarios |
|------|-------|------|-----------|
| `resend-router.test.md` | `resend` (root) | Retrieval | 8 routing scenarios (ambiguity, edge cases) |
| `send-email.test.md` | `send-email` | Application | 11 scenarios (Resend-specific gotchas) |
| `resend-inbound.test.md` | `resend-inbound` | Application | 9 scenarios (webhook, DNS, edge cases) |
| `agent-email-inbox.test.md` | `agent-email-inbox` | Pressure + Application | 5 security pressure + 5 application scenarios |

**38 total scenarios.**

## How to Run

Each test file contains standalone scenarios. To test a skill:

1. **Spawn a subagent** with access to the skill being tested
2. **Run each scenario** - present the setup block, then the scenario text
3. **Evaluate against expected behavior** and failure indicators
4. **Record results** per the scoring section at the bottom of each test file

### Example: Testing with Claude Code subagent

```
Task agent prompt:

You have access to: [skill name]

[Paste scenario text]

Choose and act. This is a real scenario.
```

### RED-GREEN testing

- **Baseline (RED):** Run scenarios WITHOUT the skill loaded. Document what the agent does wrong.
- **With skill (GREEN):** Run same scenarios WITH the skill loaded. Agent should now pass.
- **If GREEN fails:** The skill has a gap. Update the skill, then re-test.

## Test Categories

### Retrieval scenarios (router)
Can the agent route to the correct sub-skill for ambiguous requests?

### Application scenarios (send-email, resend-inbound)
Can the agent correctly apply Resend-specific techniques? Tests emphasize behavior that differs from other email APIs (SendGrid, SES, Mailgun).

### Pressure scenarios (agent-email-inbox)
Does the agent enforce security rules when the wrong answer is genuinely tempting? Scenarios combine 3+ pressures (time, authority, sunk cost, social proof) and make the insecure option reasonable-sounding.

## v2 Improvements

Tests were strengthened after initial run showed 100% pass rate (31/31). Key changes:

- **Router:** Replaced easy scenarios with ambiguous ones (automation-vs-AI, domain setup, broadcast gap)
- **Send-email:** Added Resend-specific gotchas (409 conflict, SDK response shape, domain warm-up, suppression list, tracking is domain-level)
- **Inbound:** Added edge cases (attachment URL expiration, MX priority conflict, webhook idempotency)
- **Agent inbox:** Made wrong options genuinely tempting (unknown senders, senior engineer's coherent argument, subtle injection in quoted threads, multi-pressure with CTO + social proof + sunk cost). Added `.includes()` bug test and injection bypass patterns.
