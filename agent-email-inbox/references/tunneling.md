# Local Development Tunneling Options

Your local server isn't accessible from the internet. Use tunneling to expose it for webhook delivery.

> **Critical: Persistent URLs Required**
>
> Webhook URLs are registered with Resend via the API. If your tunnel URL changes (e.g., ngrok restart on the free tier), you must delete and recreate the webhook registration via the API. For anything persistent, use either:
> - A **permanent tunnel** with stable URLs (Tailscale Funnel, paid ngrok, Cloudflare named tunnels)
> - **Production deployment** to a real server

## Tailscale Funnel (Recommended)

Permanent, stable HTTPS URL with valid certificates — completely free, no timeouts or session limits.

```bash
# 1. Install Tailscale (one-time)
curl -fsSL https://tailscale.com/install.sh | sh

# 2. Authenticate (one-time - opens browser)
sudo tailscale up

# 3. Enable Funnel (one-time approval in browser)
sudo tailscale funnel 3000

# Your permanent URL (never changes):
# https://<machine-name>.tail<hash>.ts.net
```

**Running in background:**
```bash
# Runs as a systemd service automatically - survives reboots
sudo tailscale funnel status   # Check status
sudo tailscale funnel off      # Stop
```

**Why Tailscale Funnel over ngrok:**
- Permanent URL — never changes, even across restarts
- No timeouts — free tier has no 8-hour session limits
- Auto-reconnects via systemd service
- Valid HTTPS certificates (not self-signed)
- Free forever

## ngrok (Alternative)

**Free tier:** Random URLs that change on every restart. Must delete and recreate webhook via API after each restart.

**Paid tier ($8/mo):** Static subdomain that persists across restarts.

```bash
brew install ngrok  # macOS
ngrok config add-authtoken <your-token>
ngrok http 3000                                  # Free - random URL
ngrok http --domain=myagent.ngrok.io 3000        # Paid - static URL
```

## Cloudflare Tunnel (Alternative)

Use **named tunnels** for persistent URLs (quick tunnels are ephemeral).

```bash
brew install cloudflared
cloudflared tunnel login
cloudflared tunnel create my-agent-webhook

# Create config file ~/.cloudflared/config.yml
# tunnel: <tunnel-id>
# credentials-file: /path/to/.cloudflared/<tunnel-id>.json
# ingress:
#   - hostname: webhook.yourdomain.com
#     service: http://localhost:3000
#   - service: http_status:404

cloudflared tunnel route dns my-agent-webhook webhook.yourdomain.com
cloudflared tunnel run my-agent-webhook
```

**Pros:** Free, persistent URLs, uses your own domain
**Cons:** Requires owning a domain on Cloudflare, more setup

## VS Code Port Forwarding

Good for quick testing during development sessions. Open Ports panel (View → Ports) → Forward a Port → Enter 3000 → Set visibility to "Public". URL changes each session — not suitable for persistent webhooks.

## localtunnel

Simple but ephemeral:
```bash
npx localtunnel --port 3000
```
URLs change on restart. Same limitations as free ngrok.
