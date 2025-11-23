# Nginx /xrpc/ Proxy Configuration

## Problem
The Gateway needs to make requests to PDS, but in production it should use the Nginx proxy at `/xrpc/` instead of direct `http://localhost:4002`.

## Solution
Add this location block to your Nginx config at `/etc/nginx/sites-available/daemon.bushleague.xyz`:

```nginx
location /xrpc/ {
    proxy_pass http://localhost:4002;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Important Notes
- This block should come BEFORE the main `location /` block
- After adding, test with: `sudo nginx -t`
- Reload with: `sudo systemctl reload nginx`
- Test the proxy: `curl https://daemon.bushleague.xyz/xrpc/com.atproto.server.describeServer`

