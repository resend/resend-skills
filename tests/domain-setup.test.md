# Domain Setup Skill — Test Scenarios

## Test 1: Basic Domain Creation
**Prompt:** "I need to set up a domain to send emails with Resend"
**Expected:** Agent reads `domain-setup/SKILL.md`, recommends a subdomain (e.g., `send.yourdomain.com`), walks through domain creation via API, lists DNS records to add, and explains verification.

## Test 2: Subdomain vs Root Domain Advice
**Prompt:** "Should I use my root domain or a subdomain for Resend?"
**Expected:** Agent recommends subdomain, explains MX conflict avoidance, reputation isolation, and flexibility benefits.

## Test 3: DMARC Setup
**Prompt:** "How do I set up DMARC for my domain that sends through Resend?"
**Expected:** Agent reads `references/dmarc-bimi.md`, explains progressive rollout (none → quarantine → reject), provides DNS record examples, mentions alignment with Resend's sending subdomain.

## Test 4: BIMI Setup
**Prompt:** "I want my logo to show up next to my emails in Gmail"
**Expected:** Agent explains BIMI prerequisites (DMARC at quarantine/reject, VMC certificate, SVG Tiny P/S logo), provides DNS record format, links to verification tools.

## Test 5: MX Conflict with Google Workspace
**Prompt:** "I use Google Workspace for email. Will adding Resend's MX record break my email?"
**Expected:** Agent explains that using a subdomain avoids conflicts entirely, shows that MX records on different subdomains are independent, provides the specific setup.

## Test 6: Domain Not Verifying
**Prompt:** "I added the DNS records but my domain won't verify in Resend"
**Expected:** Agent reads `references/troubleshooting.md`, walks through checklist: correct subdomain, auto-appending issues, region mismatch, DKIM truncation, propagation delay. Suggests `dig` commands to verify.

## Test 7: Cloudflare-Specific Issues
**Prompt:** "I'm using Cloudflare and my Resend domain DKIM records won't verify"
**Expected:** Agent identifies Cloudflare proxy mode as likely cause, instructs to set records to "DNS only" (gray cloud).

## Test 8: API Domain Management
**Prompt:** "Show me how to create and verify a domain using the Resend API in Node.js"
**Expected:** Agent reads `references/domain-verification.md`, provides Node.js code for domain creation, DNS record output, and verification trigger.

## Test 9: Custom Return Path
**Prompt:** "What is a custom return path and should I set one up?"
**Expected:** Agent explains return path purpose (bounce handling, DMARC alignment), shows how to set it during domain creation.

## Test 10: Region Selection
**Prompt:** "Which Resend region should I choose for my domain?"
**Expected:** Agent lists available regions with use cases, explains that region affects MX record values and data residency, notes region cannot be changed after creation.

## Test 11: Router Routes Correctly
**Prompt:** "How do I add a domain to Resend?"
**Expected:** Root skill routes to `domain-setup` skill (matches "domain" + "add/setup/verify" intent).

## Test 12: Multiple Sending Services
**Prompt:** "I already use SendGrid, can I add Resend too?"
**Expected:** Agent recommends separate subdomains for each service, explains SPF lookup limits, shows how to avoid conflicts.
