# Skill Tests

Subagent-based test scenarios for each skill in this repository. Tests follow the [TDD methodology for skills](https://github.com/anthropics/skills/blob/main/skills/writing-skills/testing-skills-with-subagents.md).

## Test Files

| File | Skill | Type | Scenarios |
|------|-------|------|-----------|
| `resend-router.test.md` | `resend` (root) | Retrieval | 6 routing accuracy scenarios |
| `send-email.test.md` | `send-email` | Application | 8 technique application scenarios |
| `resend-inbound.test.md` | `resend-inbound` | Application | 7 technique application scenarios |
| `agent-email-inbox.test.md` | `agent-email-inbox` | Pressure + Application | 5 security pressure + 5 application scenarios |

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
Can the agent find and route to the correct sub-skill?

### Application scenarios (send-email, resend-inbound)
Can the agent correctly apply techniques from the reference material?

### Pressure scenarios (agent-email-inbox)
Does the agent enforce security rules even under time, authority, sunk cost, and exhaustion pressure?
