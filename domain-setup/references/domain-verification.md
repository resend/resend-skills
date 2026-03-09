# Domain Verification Reference

## Step-by-Step: Adding and Verifying a Domain

### Step 1: Create the Domain

Choose your subdomain and region, then create via API.

#### cURL

```bash
curl -X POST https://api.resend.com/domains \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "send.yourdomain.com",
    "region": "us-east-1"
  }'
```

#### Node.js

```javascript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.domains.create({
  name: "send.yourdomain.com",
  region: "us-east-1",
});

if (error) {
  console.error(error);
  process.exit(1);
}

console.log("Domain created:", data.id);
console.log("DNS records to add:", data.records);
```

#### Python

```python
import resend
import os

resend.api_key = os.environ["RESEND_API_KEY"]

domain = resend.Domains.create(
    name="send.yourdomain.com",
    region="us-east-1",
)

print(f"Domain created: {domain.id}")
for record in domain.records:
    print(f"  {record.type} {record.name} → {record.value}")
```

#### Go

```go
package main

import (
    "fmt"
    "os"

    "github.com/resend/resend-go/v3"
)

func main() {
    client := resend.NewClient(os.Getenv("RESEND_API_KEY"))

    domain, err := client.Domains.Create(&resend.CreateDomainRequest{
        Name:   "send.yourdomain.com",
        Region: "us-east-1",
    })
    if err != nil {
        panic(err)
    }

    fmt.Printf("Domain created: %s\n", domain.Id)
    for _, record := range domain.Records {
        fmt.Printf("  %s %s → %s\n", record.Type, record.Name, record.Value)
    }
}
```

### Step 2: Add DNS Records

The API response contains the exact records to add. Typically:

| # | Type | Name | Value | Purpose |
|---|------|------|-------|---------|
| 1 | MX | `send.yourdomain.com` | `feedback-smtp.us-east-1.amazonses.com` (priority 10) | SPF / bounce handling |
| 2 | TXT | `send.yourdomain.com` | `v=spf1 include:amazonses.com ~all` | SPF authorization |
| 3 | CNAME | `resend._domainkey.send.yourdomain.com` | *(provided by Resend)* | DKIM key 1 |
| 4 | CNAME | `resend2._domainkey.send.yourdomain.com` | *(provided by Resend)* | DKIM key 2 |
| 5 | CNAME | `resend3._domainkey.send.yourdomain.com` | *(provided by Resend)* | DKIM key 3 |

**Important:** Copy the exact values from the API response. The DKIM CNAME values are unique to your domain.

### Step 3: Verify

After adding DNS records, trigger verification:

#### cURL

```bash
curl -X POST https://api.resend.com/domains/{domain_id}/verify \
  -H "Authorization: Bearer $RESEND_API_KEY"
```

#### Node.js

```javascript
const { data, error } = await resend.domains.verify(domainId);
```

#### Python

```python
resend.Domains.verify(domain_id)
```

#### Go

```go
_, err := client.Domains.Verify(domainId)
```

### Step 4: Check Status

Poll the domain details to see verification status:

```bash
curl https://api.resend.com/domains/{domain_id} \
  -H "Authorization: Bearer $RESEND_API_KEY"
```

The response includes a `status` field and per-record verification status. Each record shows `verified`, `pending`, or `failed`.

## Custom Return Path

Set during domain creation to customize the bounce address:

```javascript
const { data } = await resend.domains.create({
  name: "send.yourdomain.com",
  region: "us-east-1",
  customReturnPath: "bounce", // bounce@send.yourdomain.com
});
```

Benefits:
- Better DMARC alignment (return path matches From domain)
- Professional appearance in email headers
- Easier bounce processing if you inspect headers

## Region Selection Guide

| Region | Code | Best For |
|--------|------|----------|
| US East (Virginia) | `us-east-1` | North America, default choice |
| EU West (Ireland) | `eu-west-1` | Europe, GDPR compliance |
| South America (São Paulo) | `sa-east-1` | Latin America |
| Asia Pacific (Tokyo) | `ap-northeast-1` | Asia-Pacific |

**Note:** Region affects:
- MX record values (region code is embedded in the hostname)
- Data residency (where email content is processed)
- Latency for API calls

Choose one region per domain. You cannot change it after creation — delete and recreate if needed.

## List and Manage Domains

### List All Domains

```javascript
const { data } = await resend.domains.list();
for (const domain of data.data) {
  console.log(`${domain.name}: ${domain.status}`);
}
```

### Get Domain Details

```javascript
const { data } = await resend.domains.get(domainId);
console.log(data.records); // Shows each DNS record and its verification status
```

### Update Domain Settings

```javascript
const { data } = await resend.domains.update(domainId, {
  openTracking: true,
  clickTracking: true,
});
```

### Delete a Domain

```javascript
await resend.domains.remove(domainId);
```
