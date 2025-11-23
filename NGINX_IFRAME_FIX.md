# Fix Nginx Iframe Embedding for daemon.bushleague.xyz

## On the server, run these commands:

1. **Edit the Nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/daemon.bushleague.xyz
```

2. **Find the `server` block for daemon.bushleague.xyz and add these headers:**

Add these lines inside the `server { }` block (preferably right after the `server_name` line):

```nginx
# Allow iframe embedding
add_header X-Frame-Options "ALLOWALL" always;
add_header Content-Security-Policy "frame-ancestors *;" always;
```

**OR** if you want to remove any existing restrictive headers, find and remove/comment out:
- Any `add_header X-Frame-Options "DENY"` or `"SAMEORIGIN"` lines
- Any `Content-Security-Policy` lines that include `frame-ancestors 'none'`

3. **Test the configuration:**
```bash
sudo nginx -t
```

4. **If test passes, reload Nginx:**
```bash
sudo systemctl reload nginx
```

## Example Nginx configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name daemon.bushleague.xyz;

    # SSL configuration...

    # Allow iframe embedding
    add_header X-Frame-Options "ALLOWALL" always;
    add_header Content-Security-Policy "frame-ancestors *;" always;

    root /var/www/daemon-client;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # ... rest of config
}
```

## About the Daemon Image Embed

The `daemon.jpg` file is located at `daemon-client/public/daemon.jpg` and is used as the logo in the UI (Sidebar, TopBar).

If you want to use this as a default embed image for posts, you would need to:
1. Ensure the image is accessible at `https://daemon.bushleague.xyz/daemon.jpg`
2. Configure the embed system to use this as a default image when no embed is provided

Is that what you're asking about, or do you need help with something else regarding embeds?

