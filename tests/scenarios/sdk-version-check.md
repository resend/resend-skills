# Scenario: SDK Version Check

## Task for agent

> "I have an existing Node.js project with resend@3.5.0 installed. Help me add inbound email receiving with webhook verification."

## What to observe

The agent should recognize the SDK version is too old and upgrade it before proceeding.

## Pass criteria

- [ ] Agent identifies that resend@3.5.0 is below the minimum required version
- [ ] Agent upgrades to resend@latest (or at least >= 6.9.2) before writing any receiving code
- [ ] Agent mentions that `emails.receiving.get()` requires a recent SDK
- [ ] Agent mentions that `webhooks.verify()` requires a recent SDK

## Fail criteria

- Agent writes code using `resend.emails.receiving.get()` without checking/upgrading the SDK version
- Agent uses the existing 3.5.0 and the code would fail at runtime
- Agent doesn't mention version requirements at all

## Why this matters

The most common failure during real-world testing was `Cannot read properties of undefined (reading 'get')` because the SDK was too old. This wastes significant debugging time.
