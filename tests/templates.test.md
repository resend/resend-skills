# Test: Templates Skill

**Skill under test:** `templates`
**Skill type:** Reference/Technique
**Test approach:** Application scenarios - can the agent correctly manage Resend templates, understand variable syntax, and avoid Resend-specific gotchas?

## Setup

```
[Test scaffold] For each scenario below, commit to a specific answer and write actual code — not pseudocode. Use the templates skill as your reference.
```

---

## Scenario 1: Variable Syntax Gotcha

**Tests:** Correct mustache syntax for template variables

```
You're creating a Resend email template. The template should say:
"Hi Sarah, your order #1234 has shipped!"

The variable parts are the name and order number.
Write the HTML content with the correct variable syntax for Resend templates.
```

**Expected:**
- Uses triple mustache syntax: `{{{CUSTOMER_NAME}}}` and `{{{ORDER_NUMBER}}}`
- NOT double mustache `{{CUSTOMER_NAME}}` (that's standard Mustache but wrong for Resend)
- NOT `${CUSTOMER_NAME}` or `{CUSTOMER_NAME}` (wrong syntax)
- Variable names are CAPITALIZED (recommended convention)

**Failure indicators:**
- Uses `{{CUSTOMER_NAME}}` (double mustache)
- Uses `${CUSTOMER_NAME}` or `{CUSTOMER_NAME}`
- Doesn't know the correct variable syntax

---

## Scenario 2: Publishing Requirement

**Tests:** Understanding that templates must be published before use

```
You created a template via the API and have its ID: tmpl_abc123.
You try to send an email with it immediately:

const { data, error } = await resend.emails.send({
  from: 'Acme <orders@acme.com>',
  to: ['customer@example.com'],
  subject: 'Your Order',
  template: {
    id: 'tmpl_abc123',
    variables: { ORDER_ID: '1234' }
  }
});

It fails. What is the most likely cause?
```

**Expected:**
- Template was created but not published
- Draft/unpublished templates cannot be used for sending
- Must call `POST /templates/{id}/publish` (or use SDK equivalent) before sending
- Cannot send with draft templates

**Failure indicators:**
- Blames the API key or wrong template ID without mentioning published state
- Doesn't know about the draft/published distinction
- Says to just retry the send

---

## Scenario 3: Template + HTML Mutual Exclusivity

**Tests:** Understanding that template and html/text/react cannot be combined

```
[Test scaffold] Commit to a specific answer.

A developer writes this send call. Find all the bugs:

const { data, error } = await resend.emails.send({
  from: 'Acme <hello@acme.com>',
  to: ['user@example.com'],
  subject: 'Welcome!',
  html: '<p>Fallback HTML in case template fails</p>',
  react: <WelcomeEmail />,
  template: {
    id: 'tmpl_welcome',
    variables: { USER_NAME: 'Alice' }
  }
});
```

**Expected bugs found:**
1. **`html` and `template` are mutually exclusive** — cannot use both
2. **`react` and `template` are mutually exclusive** — cannot use both
3. (Bonus) `html` and `react` are ALSO mutually exclusive — cannot use both
4. No idempotency key

**Failure indicators:**
- Misses the mutual exclusivity of template + html/react
- Only finds one or two conflicts
- Suggests keeping html as a "fallback" (doesn't work)

---

## Scenario 4: Reserved Variable Names

**Tests:** Knowledge of variables that cannot be overridden by callers

```
You're building a template for a user profile email. You want to
include the user's first name, last name, email, and a custom
field called "plan_tier".

You define these variables:
FIRST_NAME, LAST_NAME, EMAIL, PLAN_TIER

Are there any problems with this variable list?
```

**Expected:**
- `FIRST_NAME`, `LAST_NAME`, and `EMAIL` are **reserved variable names**
- Reserved variables cannot be overridden — Resend auto-populates them from contact data
- `RESEND_UNSUBSCRIBE_URL`, `contact`, and `this` are also reserved
- `PLAN_TIER` is fine
- Solution: rename to `USER_FIRST_NAME`, `USER_LAST_NAME`, `USER_EMAIL` or similar

**Failure indicators:**
- Doesn't know these names are reserved
- Says it'll work fine
- Only knows about one or two of the reserved names

---

## Scenario 5: Missing Variable at Send Time

**Tests:** Understanding failure modes when variables are missing

```
You have a template with two variables defined:
- ORDER_ID (no fallback value set)
- CUSTOMER_NAME (fallback value: "Valued Customer")

You send an email without providing ORDER_ID:

resend.emails.send({
  ...
  template: {
    id: 'tmpl_order',
    variables: { CUSTOMER_NAME: 'Alice' }
  }
})

What happens?
```

**Expected:**
- The send **fails** — ORDER_ID has no fallback value and wasn't provided
- Variables without fallback values are **required** at send time
- CUSTOMER_NAME would use "Alice" (provided)
- If ORDER_ID had a fallback, send would succeed using the fallback
- 422 error is returned

**Failure indicators:**
- Says send succeeds (wrong — missing required variable fails the send)
- Doesn't distinguish between variables with and without fallbacks
- Says the variable is just omitted/blank in the email

---

## Scenario 6: Variable Count Limit

**Tests:** Awareness of the 50-variable cap

```
You're building a rich order confirmation template. You list out
all the fields you want to personalize:

ORDER_ID, ORDER_DATE, CUSTOMER_NAME, CUSTOMER_EMAIL,
ITEM_1_NAME, ITEM_1_QTY, ITEM_1_PRICE,
ITEM_2_NAME, ITEM_2_QTY, ITEM_2_PRICE,
ITEM_3_NAME, ITEM_3_QTY, ITEM_3_PRICE,
...continuing for 20 line items (60 variables total)...
SUBTOTAL, TAX, SHIPPING, TOTAL, DELIVERY_DATE,
TRACKING_NUMBER, SHIPPING_ADDRESS_LINE1, SHIPPING_ADDRESS_LINE2,
CITY, STATE, ZIP, COUNTRY, PAYMENT_LAST4

This approach won't work. Why not, and what should you do instead?
```

**Expected:**
- Resend templates support a max of **50 variables per template**
- 60 variables exceeds the limit
- Solution options:
  - Pre-render the line items server-side into HTML/text and use a single variable (e.g., `ORDER_ITEMS_HTML`)
  - Reduce variable count by combining related fields
  - For highly dynamic content, consider sending `html` directly instead of using a template

**Failure indicators:**
- Doesn't know the 50-variable limit
- Says to just add all 60 variables (won't work)
- Doesn't suggest alternatives

---

## Scenario 7: Template CRUD Workflow

**Tests:** Complete template management workflow

```
Walk through creating, updating, and deleting a template in Node.js:
1. Create a template named "order-confirmation" with an ORDER_ID variable
2. Update the template's name to "order-confirmed"
3. Publish the template
4. Delete the template
```

**Expected:**
- **Create:** `resend.templates.create({ name: 'order-confirmation', html: '<p>Order {{{ORDER_ID}}}</p>', variables: [{ key: 'ORDER_ID', type: 'string' }] })`
- **Update:** `resend.templates.update('tmpl_id', { name: 'order-confirmed' })`
- **Publish:** `resend.templates.publish('tmpl_id')` or equivalent
- **Delete:** `resend.templates.remove('tmpl_id')` or equivalent
- Returns `{ id, object: 'template' }` on create/update

**Failure indicators:**
- Uses wrong HTTP methods (e.g., PUT instead of PATCH for update)
- Doesn't know the SDK methods for template management
- Skips publishing before use in an example send call
- Confuses template ID with alias

---

## Scenario 8: Alias vs ID

**Tests:** Understanding that templates can be referenced by alias

```
Your team wants to reference templates by a human-readable name
instead of an auto-generated ID like "tmpl_a1b2c3".
How do you set this up, and how do you use it?
```

**Expected:**
- Templates have an optional `alias` field set during create or update
- Aliases can be used anywhere a template ID is used (in sends, gets, updates, deletes)
- Useful for: deploy pipelines, environment parity (dev/staging/prod have same alias)
- Example: create with `alias: 'welcome-email'`, then send with `template: { id: 'welcome-email' }`

**Failure indicators:**
- Doesn't know about the alias feature
- Says you can't use human-readable names
- Confuses alias with template name (name is display-only, alias is referenceable)

---

## Scenario 9: Pagination

**Tests:** Correct use of cursor-based pagination

```
You have 200 templates in your Resend account. Write code to
fetch all of them.
```

**Expected:**
- Use `resend.templates.list({ limit: 100 })` to get first page
- Check `data.has_more` — if `true`, pass the last item's ID as `after` to fetch the next page
- Continue until `data.has_more` is `false`
- Max limit is 100 per page

**Failure indicators:**
- Doesn't handle pagination at all (only gets first page)
- Uses offset-based pagination instead of cursor-based
- Looks for a `next_cursor` field (doesn't exist — use `has_more` + last item's ID)

---

## Scoring

| Scenario | Pass Criteria |
|----------|---------------|
| 1 - Variable Syntax | Correct triple mustache `{{{VAR}}}` syntax |
| 2 - Publishing | Identifies draft state as cause, knows publish step |
| 3 - Mutual Exclusivity | Finds all conflicts (template+html, template+react, html+react) |
| 4 - Reserved Names | Identifies FIRST_NAME/LAST_NAME/EMAIL as reserved |
| 5 - Missing Variable | Knows send fails without fallback, distinguishes with/without fallback |
| 6 - Variable Limit | Knows 50-variable cap, suggests pre-rendering as solution |
| 7 - CRUD Workflow | Correct methods for create/update/publish/delete |
| 8 - Alias | Knows alias feature and how to use it for referencing |
| 9 - Pagination | Cursor-based pagination, max 100 per page |

**Pass threshold:** 7/9 scenarios correct
