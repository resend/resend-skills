# Resend Templates — Full Reference

## Create Template

**Required:** `name`, `html` (or `react`)
**Optional:** `alias`, `from`, `subject`, `reply_to`, `text`, `react`, `variables`

```typescript
const { data, error } = await resend.templates.create({
  name: 'Order Confirmation',
  alias: 'order-confirmation',
  subject: 'Your Order #{{{ORDER_ID}}}',
  html: '<p>Hi {{{CUSTOMER_NAME}}}, your order #{{{ORDER_ID}}} has shipped!</p>',
  // text: auto-generated from html if omitted — provide explicit text for better deliverability
  variables: [
    { key: 'CUSTOMER_NAME', type: 'string', fallbackValue: 'Customer' },
    { key: 'ORDER_ID', type: 'string' },  // no fallbackValue = required at send time
  ],
});
// Returns: { id: 'tmpl_abc123', object: 'template' }
```

## Get, List, Update, Delete

```typescript
// Get by ID or alias
// has_unpublished_versions: true if edits exist that haven't been published
await resend.templates.get('tmpl_abc123');
await resend.templates.get('order-confirmation');  // by alias

// List — cursor-based pagination, max 100 per page
const { data } = await resend.templates.list({ limit: 100 });
// data.has_more === true → fetch next page
await resend.templates.list({ limit: 100, after: data.data[data.data.length - 1].id });

// Update (partial — only provided fields change)
await resend.templates.update('tmpl_abc123', { name: 'Order Confirmed' });

// Delete
await resend.templates.remove('tmpl_abc123');  // returns { deleted: true }
```

See `fetch-all-templates.mjs` for a complete pagination loop.

## Publish

```typescript
await resend.templates.publish('tmpl_abc123');
// Template is now live. Publishing is synchronous — no delay needed before sending.
```

Editing a published template creates a new draft. `has_unpublished_versions: true` in the get response indicates pending edits.

## Variables

### Definition

```typescript
{ key: 'ORDER_TOTAL', type: 'number', fallbackValue: 0 }
{ key: 'CUSTOMER_NAME', type: 'string', fallbackValue: 'Customer' }
{ key: 'ORDER_ID', type: 'string' }  // no fallbackValue = required at send time
```

- Variable **with** `fallbackValue` and missing at send → uses fallback, send succeeds
- Variable **without** `fallbackValue` and missing at send → send **fails** (422)

### Constraints

| Constraint | Limit |
|------------|-------|
| Max variables per template | 50 |
| Key characters | ASCII letters, numbers, underscores only |
| Key max length | 50 characters |
| String value max | 2,000 characters |
| Number value max | 2^53 − 1 |

### Reserved Names

`FIRST_NAME` · `LAST_NAME` · `EMAIL` · `UNSUBSCRIBE_URL` · `RESEND_UNSUBSCRIBE_URL` · `contact` · `this`

These cannot be used as custom variable keys — rename to `USER_FIRST_NAME`, `USER_EMAIL`, etc.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `{{VAR}}` instead of `{{{VAR}}}` | Triple braces required — double braces don't render variables |
| Sending with draft template | Call `.publish()` first — draft templates cannot send |
| Adding delay after create/publish | Publishing is synchronous — send failure has another cause |
| `{{#each}}` or `{{#if}}` in template HTML | No loop/conditional support — pre-render dynamic lists server-side |
| `html` + `template` in same send call | Mutually exclusive — remove `html` when using template |
| Using `FIRST_NAME`, `EMAIL` as variable keys | Reserved — rename to `USER_FIRST_NAME`, `USER_EMAIL` |
| Variable without fallback missing at send | Add `fallbackValue` or always provide the variable |
| Calling `.delete()` | SDK method is `.remove()` |
| Expecting alias = name | `alias` is a separate referenceable slug; `name` is display-only |
| 60+ variables | Max 50 — pre-render complex content as a single HTML variable |
| No idempotency key on sends | Template sends use the same endpoint — pass `idempotencyKey` for retryable operations |

## Duplicate

```typescript
// Duplicate a template — returns a new draft copy
const { data, error } = await resend.templates.duplicate('tmpl_abc123');
// Returns: { id: 'tmpl_new456', object: 'template' }

// Chainable — duplicate and publish in one call
const { data, error } = await resend.templates.duplicate('tmpl_abc123').publish();
```

Useful for creating variants (e.g., A/B testing subject lines) or bootstrapping new templates from an existing one.

## Version History

Every template maintains full version history. Reverting creates a new draft from a previous version without affecting the published version. Accessible via the Resend dashboard template editor.
