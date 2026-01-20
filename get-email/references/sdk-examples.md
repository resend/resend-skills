# SDK Examples for Retrieve Email

## Node.js

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function getEmail(emailId: string) {
  const { data, error } = await resend.emails.get(emailId);

  if (error) {
    throw new Error(`Failed to retrieve email: ${error.message}`);
  }

  return data;
}
```

## Python

```python
import resend
import os

resend.api_key = os.environ["RESEND_API_KEY"]

def get_email(email_id: str) -> dict:
    try:
        email = resend.Emails.get(email_id)
        return email
    except resend.exceptions.ResendError as e:
        raise Exception(f"Failed to retrieve email: {e}")
```

## PHP

```php
use Resend\Resend;

$resend = Resend::client('re_xxxxxxxxx');

try {
    $email = $resend->emails->get('email_id');
} catch (Exception $e) {
    error_log('Failed to retrieve email: ' . $e->getMessage());
    throw $e;
}
```

## Ruby

```ruby
require 'resend'

Resend.api_key = ENV['RESEND_API_KEY']

def get_email(email_id)
  Resend::Emails.get(email_id)
rescue Resend::Error => e
  raise "Failed to retrieve email: #{e.message}"
end
```

## Go

```go
package main

import (
    "context"
    "fmt"
    "os"

    "github.com/resend/resend-go/v2"
)

func getEmail(emailID string) (*resend.Email, error) {
    client := resend.NewClient(os.Getenv("RESEND_API_KEY"))

    email, err := client.Emails.Get(context.TODO(), emailID)
    if err != nil {
        return nil, fmt.Errorf("failed to retrieve email: %w", err)
    }

    return email, nil
}
```

## Rust

```rust
use resend_rs::{Resend, Result};

async fn get_email(email_id: &str) -> Result<resend_rs::Email> {
    let resend = Resend::new(std::env::var("RESEND_API_KEY")?);

    resend.emails.get(email_id).await
}
```

## Java

```java
import com.resend.Resend;
import com.resend.services.emails.model.Email;

public class EmailService {
    private final Resend resend;

    public EmailService() {
        this.resend = new Resend(System.getenv("RESEND_API_KEY"));
    }

    public Email getEmail(String emailId) throws Exception {
        try {
            return resend.emails().get(emailId);
        } catch (Exception e) {
            throw new Exception("Failed to retrieve email: " + e.getMessage(), e);
        }
    }
}
```

## .NET (C#)

```csharp
using Resend;

public class EmailService
{
    private readonly ResendClient _resend;

    public EmailService()
    {
        _resend = new ResendClient(Environment.GetEnvironmentVariable("RESEND_API_KEY"));
    }

    public async Task<Email> GetEmailAsync(string emailId)
    {
        try
        {
            return await _resend.Emails.GetAsync(emailId);
        }
        catch (ResendException ex)
        {
            throw new Exception($"Failed to retrieve email: {ex.Message}", ex);
        }
    }
}
```

## cURL

```bash
curl -X GET "https://api.resend.com/emails/EMAIL_ID" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json"
```

With error handling in a script:

```bash
#!/bin/bash
EMAIL_ID="$1"

response=$(curl -s -w "\n%{http_code}" -X GET "https://api.resend.com/emails/$EMAIL_ID" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -ne 200 ]; then
  echo "Error: Failed to retrieve email (HTTP $http_code)" >&2
  echo "$body" >&2
  exit 1
fi

echo "$body"
```
