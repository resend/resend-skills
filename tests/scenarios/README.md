# Subagent Scenario Tests

These are pressure scenarios for testing that agents correctly follow the resend-skills documentation. They follow the TDD approach from the writing-skills methodology.

## How to Run

Each scenario file describes a task to give to an agent **without** prior context. The agent should have the resend-skills installed but no other hints. Evaluate whether the agent follows the skill correctly.

### Manual testing

1. Start a fresh agent session with resend-skills installed
2. Give the agent the task described in the scenario file
3. Observe the agent's behavior against the expected outcomes
4. Record any deviations as test failures

### What to look for

- **Does the agent follow the documented order?** (security before webhooks)
- **Does the agent use the right SDK versions?** (not old/default versions)
- **Does the agent use the right verification method?** (resend.webhooks.verify or svix fallback)
- **Does the agent include security from the start?** (not bolted on after)

## Scenarios

| Scenario | Tests | File |
|----------|-------|------|
| Webhook setup order | Agent configures security before creating webhook endpoint | `webhook-setup-order.md` |
| SDK version check | Agent checks/upgrades SDK to meet minimum version requirements | `sdk-version-check.md` |
| Verification method | Agent uses correct webhook signature verification | `verification-method.md` |
