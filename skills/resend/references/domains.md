# Domains

## Overview

Domains must be verified before sending. The workflow is: create domain, add DNS records to your provider, call verify, then poll until verified.

```
Create → Add DNS records → Verify → Poll status → Send
```

## SDK Methods

### Node.js

| Operation | Method | Notes |
|-----------|--------|-------|
| Create | `resend.domains.create(params)` | Returns DNS records to configure |
| Get | `resend.domains.get(id)` | Returns domain with DNS records and status |
| List | `resend.domains.list({ limit?, offset? })` | Paginated list |
| Update | `resend.domains.update(params)` | Update tracking, TLS, capabilities |
| Delete | `resend.domains.remove(id)` | Permanent — not `.delete()` |
| Verify | `resend.domains.verify(id)` | Triggers async DNS verification |

### Python

`resend.Domains.create/get/list/update/remove/verify` — same operations with snake_case params (e.g., `custom_return_path`, `open_tracking`, `click_tracking`).

## Create Domain

```typescript
const { data, error } = await resend.domains.create({
  name: 'notifications.acme.com',
  region: 'us-east-1',
  openTracking: false,
  clickTracking: false,
});
if (error) {
  console.error(error);
  return;
}

// data.records contains DNS records to add:
// [{ type: 'MX', name: '...', value: '...' }, { type: 'TXT', ... }, ...]
console.log(data.id);      // domain ID for later calls
console.log(data.records);  // add these to your DNS provider
```

```python
domain = resend.Domains.create({
    "name": "notifications.acme.com",
    "region": "us-east-1",
    "open_tracking": False,
    "click_tracking": False,
})
# domain["records"] has the DNS entries to configure
```

## Verify Flow

After adding DNS records to your provider, trigger verification and poll:

```typescript
// Trigger verification (returns immediately)
await resend.domains.verify(data.id);

// Poll until verified (DNS propagation can take minutes to hours)
const { data: domain } = await resend.domains.get(data.id);
console.log(domain.status); // 'pending', 'verified', 'failed'
```

## Update Domain

```typescript
const { data, error } = await resend.domains.update({
  id: 'domain_abc123',
  clickTracking: true,
  openTracking: true,
  tls: 'enforced',
  capabilities: { sending: 'enabled', receiving: 'enabled' },
});
```

## Parameter Reference

| Parameter | Values | Default |
|-----------|--------|---------|
| `region` | `us-east-1`, `eu-west-1`, `sa-east-1`, `ap-northeast-1` | `us-east-1` |
| `tls` | `opportunistic`, `enforced` | `opportunistic` |
| `openTracking` | `true`, `false` | Domain default |
| `clickTracking` | `true`, `false` | Domain default |
| `capabilities` | `{ sending: 'enabled'\|'disabled', receiving: 'enabled'\|'disabled' }` | sending enabled |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Sending before DNS records are added | Create returns DNS records — add them to your provider first, then verify |
| Expecting `verify()` to be synchronous | Verify triggers async check — poll with `get()` to confirm status |
| Calling `.delete()` | SDK method is `.remove()` |
| Deleting a domain accidentally | Delete is permanent with no undo — verify intent before calling |
| Using `enforced` TLS with recipients that don't support it | Use `opportunistic` (default) unless you know all recipients support TLS |
| Not checking `error` in Node.js | SDK returns `{ data, error }`, does not throw — always destructure and check |
| Forgetting region on create | Defaults to `us-east-1` — set explicitly for EU/SA/AP data residency requirements |
