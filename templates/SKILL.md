---
name: templates
description: Use when creating, updating, publishing, deleting, or listing Resend email templates via the API, or when defining template variables, understanding draft vs published state, or managing template lifecycle programmatically.
---

# Resend Templates

## Overview

Templates are reusable email structures stored on Resend. Define HTML and variables once; reference the template ID when sending instead of passing `html` each time.

**Use templates when:**
- The same email structure is reused across many sends
- Non-engineers need to edit copy without touching code
- You want version history and rollback for email content

**Use inline `html` when:**
- The email structure changes per send
- You need more than 50 dynamic variables
- You want tighter rendering control

## Template Lifecycle

```
Create (draft) → Edit → Publish → Send
                   ↑         |
                   └─────────┘ (edit draft, republish to update live template)
```

| State | Can send? | Notes |
|-------|-----------|-------|
| **Draft** | No | Default after create or unpublished edit |
| **Published** | Yes | Active version used for all sends |

Editing a published template creates a new draft — the published version keeps sending until you publish again.

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

## Create Template

**Required:** `name`, `html` (or `react` in Node.js)

```typescript
const { data, error } = await resend.templates.create({
  name: 'order-confirmation',
  subject: 'Your Order #{{{ORDER_ID}}}',   // variables work in subject too
  html: '<p>Hi {{{CUSTOMER_NAME}}}, your order #{{{ORDER_ID}}} has shipped!</p>',
  // text: auto-generated from html if omitted (recommended for deliverability)
  variables: [
    { key: 'CUSTOMER_NAME', type: 'string', fallbackValue: 'Customer' },
    { key: 'ORDER_ID', type: 'string' },
  ],
});
// Returns: { id: 'tmpl_abc123', object: 'template' }
```

**Optional create params:** `alias`, `from`, `subject`, `reply_to`, `text`, `react`, `variables`

**Note:** `text` is auto-generated from `html` if omitted. Providing an explicit `text` gives you control over the plain-text version, which improves deliverability.

## Get / List / Update / Delete

```typescript
// Get by ID or alias
// Response includes has_unpublished_versions: true if edits exist that haven't been published
await resend.templates.get('tmpl_abc123');
await resend.templates.get('order-confirmation'); // by alias

// List (cursor-based pagination)
const { data } = await resend.templates.list({ limit: 100 });
// data.has_more === true → fetch next page with after
await resend.templates.list({ limit: 100, after: data.data[data.data.length - 1].id });

// Update (partial — only fields provided are changed)
await resend.templates.update('tmpl_abc123', { name: 'order-confirmed' });

// Delete
await resend.templates.remove('tmpl_abc123'); // returns { deleted: true }
```

**`has_unpublished_versions`:** The get response includes this flag. Useful in CI/CD pipelines to detect templates with pending edits that haven't been published yet.

## Publish

```typescript
await resend.templates.publish('tmpl_abc123');
// Template is now live. Subsequent sends use this version.
```

**Publishing is synchronous** — there is no processing delay after create or publish. If a send fails immediately after publishing, the cause is something else (wrong ID, wrong alias, API key issue).

## Variables

### Syntax

Use triple mustache in HTML and subject: `{{{VARIABLE_NAME}}}`

```html
<!-- ✅ Correct — triple braces -->
<p>Hi {{{CUSTOMER_NAME}}}, your total is ${{{ORDER_TOTAL}}}</p>

<!-- ❌ Wrong — double braces (Handlebars default, not Resend) -->
<p>Hi {{CUSTOMER_NAME}}</p>

<!-- ❌ Wrong — JS template literal syntax -->
<p>Hi ${CUSTOMER_NAME}</p>
```

**Resend templates are plain variable substitution only.** There is no support for loops (`{{#each}}`), conditionals (`{{#if}}`), or other Handlebars/Liquid control flow. For dynamic lists (e.g., order line items), pre-render the HTML server-side and pass it as a single string variable.

### Variable definition

```typescript
{ key: 'ORDER_TOTAL', type: 'number', fallbackValue: 0 }
{ key: 'CUSTOMER_NAME', type: 'string', fallbackValue: 'Customer' }
{ key: 'ORDER_ID', type: 'string' }  // no fallback = required at send time
```

### Constraints

| Constraint | Limit |
|-----------|-------|
| Max variables per template | 50 |
| Key characters | ASCII letters, numbers, underscores only |
| Key max length | 50 characters |
| String value max | 2,000 characters |
| Number value max | 2^53 − 1 |

### Reserved names (cannot be used as variable keys)

`FIRST_NAME` · `LAST_NAME` · `EMAIL` · `UNSUBSCRIBE_URL` · `RESEND_UNSUBSCRIBE_URL` · `contact` · `this`

Rename to `USER_FIRST_NAME`, `USER_EMAIL`, etc.

### Missing variables at send time

- Variable **with** `fallbackValue` → uses the fallback, send succeeds
- Variable **without** `fallbackValue` and not provided → send **fails** (422)

## Sending with a Template

```typescript
const { data, error } = await resend.emails.send(
  {
    from: 'Acme <orders@acme.com>',
    to: ['customer@example.com'],
    // subject and from come from the template, or override them here
    template: {
      id: 'order-confirmation',  // pass alias value in the id field (or use the auto-generated ID)
      variables: {
        CUSTOMER_NAME: 'Alice',
        ORDER_ID: '12345',
      },
    },
  },
  { idempotencyKey: `order-confirmation/${orderId}` }  // prevents duplicate sends on retry
);
```

**Cannot combine template with:** `html`, `text`, or `react` — these are mutually exclusive.

`subject` and `from` defined on the template can be overridden per-send by including them in the send call.

For full send options, error handling, and retry logic, see the `send-email` skill.

## Version History

Every template maintains full version history. Reverting creates a new draft from a previous version without affecting the published version. Accessible via the Resend dashboard template editor.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `{{VAR}}` instead of `{{{VAR}}}` | Triple braces required — double braces don't render variables |
| Sending with draft template | Call `.publish()` first — draft templates cannot send |
| Adding a delay after create/publish before sending | Publishing is synchronous — no delay needed; send failure has another cause |
| Using `{{#each}}` or `{{#if}}` in template HTML | Resend has no loop/conditional support — pre-render dynamic lists server-side into a single HTML variable |
| `html` + `template` in same send call | Mutually exclusive — remove `html` when using template |
| Using `FIRST_NAME`, `EMAIL` etc. as custom variable keys | Reserved by Resend — rename to `USER_FIRST_NAME`, `USER_EMAIL` |
| Variable without fallback missing at send time | Add `fallbackValue` or always provide the variable at send time |
| Calling `.delete()` | SDK method is `.remove()` |
| Expecting alias = name | `alias` is a separate, referenceable slug; `name` is display-only |
| Over-designing with 60+ variables | Max 50 — pre-render complex content server-side into a single HTML variable |
| Omitting idempotency key on template sends | Template sends use the same endpoint as regular sends — always pass `idempotencyKey` for retryable operations |
