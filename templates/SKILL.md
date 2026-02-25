---
name: templates
description: Use when creating, updating, publishing, deleting, or listing Resend email templates via the API, or when defining template variables, understanding draft vs published state, or managing template lifecycle programmatically.
---

# Resend Templates

## Overview

Templates are reusable email structures stored on Resend. Define HTML and variables once; reference the template ID or alias when sending.

**Use templates when:** the same structure is reused across many sends, non-engineers need to edit copy without touching code, or you want version history.

**Use inline `html` when:** the structure changes per send, you need more than 50 dynamic variables, or you want tighter rendering control.

## Template Lifecycle

```
Create (draft) → Publish → Send
      ↑ edit                 |
      └─────────────────────┘
```

Editing a published template creates a new draft — the published version keeps sending until you publish again.

| State | Can send? |
|-------|-----------|
| **Draft** | No |
| **Published** | Yes |

## SDK Methods (Node.js)

| Operation | Method |
|-----------|--------|
| Create | `resend.templates.create(params)` |
| Get | `resend.templates.get(id)` |
| List | `resend.templates.list(params)` |
| Update | `resend.templates.update(id, params)` |
| Delete | `resend.templates.remove(id)` ← not `.delete()` |
| Publish | `resend.templates.publish(id)` |
| Duplicate | `resend.templates.duplicate(id)` |

### Chainable Create → Publish

The SDK supports chaining `.publish()` after `.create()` or `.duplicate()`:

```typescript
const { data, error } = await resend.templates.create({
  name: 'Welcome',
  html: '<p>Hi {{{NAME}}}</p>',
}).publish();
// Template is created AND published in one call
```

## Aliases

An alias is a stable, human-readable slug you set at create time. Pass it in the `id` field anywhere you'd use the auto-generated template ID.

```typescript
// Set alias at create time
await resend.templates.create({
  name: 'Order Confirmation',   // display-only
  alias: 'order-confirmation',  // referenceable slug
  html: '<p>Hi {{{CUSTOMER_NAME}}}</p>',
});

// Reference by alias — no need to store the generated tmpl_ ID
template: { id: 'order-confirmation', variables: { CUSTOMER_NAME: 'Alice' } }
```

## Variable Syntax

Use **triple mustache** in HTML and subject: `{{{VARIABLE_NAME}}}`

```html
<!-- ✅ Correct -->
<p>Hi {{{CUSTOMER_NAME}}}, your order #{{{ORDER_ID}}} has shipped!</p>

<!-- ❌ Wrong — double braces don't render in Resend -->
<p>Hi {{CUSTOMER_NAME}}</p>
```

Plain substitution only — no `{{#each}}`, `{{#if}}`, or other Handlebars control flow. Pre-render dynamic lists server-side into a single HTML variable.

Variable key casing is arbitrary (`ORDER_ID`, `orderId`, `order_id` all work) but must be consistent: whatever casing you use in the template definition must match exactly in the send call.

## Sending with a Template

```typescript
const { data, error } = await resend.emails.send(
  {
    from: 'Acme <orders@acme.com>',
    to: ['customer@example.com'],
    template: {
      id: 'order-confirmation',  // alias or auto-generated ID
      variables: { CUSTOMER_NAME: 'Alice', ORDER_ID: '12345' },
    },
  },
  { idempotencyKey: `order-confirm/${orderId}` }
);
```

Cannot combine `template` with `html`, `text`, or `react` — mutually exclusive. `subject` and `from` from the template can be overridden per-send.

For variable constraints, reserved names, full CRUD examples, pagination, and version history, see [reference.md](reference.md).
