# Resend API Error Reference

Complete error code table for the Resend API.

| Status | Error Name | Message | Action |
|--------|-----------|---------|--------|
| 400 | `invalid_idempotency_key` | Idempotency key must be between 1 and 256 characters | Use a non-empty string ≤256 chars (UUIDs recommended) |
| 400 | `validation_error` | Field-level validation errors | Check response body for specific field errors |
| 401 | `missing_api_key` | No Authorization header provided | Add `Authorization: Bearer re_your_api_key` header |
| 401 | `restricted_api_key` | API key only has sending access | Create a full-access key at resend.com/api-keys |
| 403 | `invalid_api_key` | API key is invalid | Generate a new key at resend.com/api-keys |
| 403 | `validation_error` | Using resend.dev domain — can only send to your own email | Verify your own domain at resend.com/domains |
| 403 | `validation_error` | Domain not verified or from address doesn't match verified domain | Verify the domain matching your from address, or fix the from field |
| 404 | `not_found` | Invalid endpoint URL | Check the URL against docs (base: api.resend.com) |
| 405 | `method_not_allowed` | Wrong HTTP method for endpoint | Use correct method (POST for sending, GET for fetching) |
| 409 | `invalid_idempotent_request` | Same idempotency key used with different payload | Use unique keys per unique request |
| 409 | `concurrent_idempotent_requests` | Same key sent while original request still processing | Wait for first request to complete before retrying |
| 422 | `invalid_attachment` | Attachment must have either content or path | Provide `content` (base64) or `path` (URL) for each attachment |
| 422 | `invalid_from_address` | Invalid from field format | Use `email@domain.com` or `Name <email@domain.com>` |
| 422 | `invalid_access` | Invalid API key access level | Use `full_access` or `sending_access` |
| 422 | `invalid_parameter` | Parameter must be a valid UUID | Ensure IDs are valid UUIDs |
| 422 | `invalid_region` | Invalid region specified | Use `us-east-1`, `eu-west-1`, or `sa-east-1` |
| 422 | `missing_required_field` | Required fields missing from request body | Include `from`, `to`, and content (`html`/`text`/`react`) |
| 429 | `rate_limit_exceeded` | Too many requests per second (default: 2/s) | Throttle requests; use batch endpoint for bulk sends |
| 429 | `daily_quota_exceeded` | Daily sending limit reached | Wait for UTC reset or upgrade plan |
| 429 | `monthly_quota_exceeded` | Monthly sending limit reached | Upgrade plan at resend.com/pricing |
| 451 | `security_error` | Security issue detected with request | Review email content; contact support if false positive |
| 500 | `application_error` | Unexpected server error | Retry with exponential backoff (max 5 attempts) |
| 500 | `internal_server_error` | Unexpected server error | Retry with exponential backoff; check resend.com/status |
