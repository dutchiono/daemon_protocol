# DNS and SSL Setup for daemon.bushleague.xyz

## Step 1: Add DNS Record in Namecheap

1. **Log into Namecheap**
   - Go to https://www.namecheap.com
   - Sign in to your account

2. **Navigate to Domain List**
   - Click "Domain List" from the left sidebar
   - Find `bushleague.xyz` and click "Manage"

3. **Add A Record for Subdomain**
   - Go to the "Advanced DNS" tab
   - In the "Host Records" section, click "Add New Record"
   - Select **Type: A Record**
   - **Host:** `daemon` (this creates `daemon.bushleague.xyz`)
   - **Value:** `50.21.187.69` (your server IP)
   - **TTL:** Automatic (or 30 min)
   - Click the checkmark to save

4. **Verify the Record**
   - You should see a new row like:
     ```
     Type: A Record
     Host: daemon
     Value: 50.21.187.69
     TTL: Automatic
     ```

## Step 2: Wait for DNS Propagation

DNS changes can take a few minutes to several hours to propagate. You can check if it's working:

```bash
# Check DNS resolution
dig daemon.bushleague.xyz
# or
nslookup daemon.bushleague.xyz
# or
host daemon.bushleague.xyz
```

You should see `50.21.187.69` as the IP address.

**Online DNS Checkers:**
- https://dnschecker.org/#A/daemon.bushleague.xyz
- https://www.whatsmydns.net/#A/daemon.bushleague.xyz

## Step 3: Set Up SSL Certificate

Once DNS is working, run:

```bash
sudo certbot --nginx -d daemon.bushleague.xyz
```

This will:
- Verify you own the domain
- Get an SSL certificate from Let's Encrypt
- Automatically update your nginx config to use HTTPS

**If certbot asks questions:**
- Redirect HTTP to HTTPS? **Yes** (recommended)
- Email for renewal notices? (optional, but recommended)

## Step 4: Verify Everything Works

After DNS and SSL are set up:

```bash
# Test the site
curl -I https://daemon.bushleague.xyz

# Test API endpoint
curl https://daemon.bushleague.xyz/api/v1/profile/1

# Check nginx status
sudo systemctl status nginx

# Check PM2 services
pm2 list
pm2 logs daemon-gateway
pm2 logs daemon-pds
```

## Troubleshooting

### DNS Not Working After 30 Minutes

1. **Double-check the DNS record in Namecheap:**
   - Make sure Host is `daemon` (not `daemon.bushleague.xyz`)
   - Make sure Value is `50.21.187.69`
   - Make sure it's an A record (not CNAME)

2. **Clear your DNS cache:**
   ```bash
   # On your local machine
   # Windows:
   ipconfig /flushdns

   # Mac:
   sudo dscacheutil -flushcache

   # Linux:
   sudo systemd-resolve --flush-caches
   ```

3. **Try a different DNS server:**
   ```bash
   # Use Google DNS
   nslookup daemon.bushleague.xyz 8.8.8.8
   ```

### SSL Certificate Fails

If certbot fails with "Domain not found" or "DNS not resolving":
- Wait longer for DNS propagation (can take up to 48 hours, usually much less)
- Double-check the DNS record is correct
- Make sure port 80 is open (certbot needs it for verification)

### Nginx 502 Bad Gateway

If you get 502 errors:
- Check if Gateway and PDS are running: `pm2 list`
- Check logs: `pm2 logs daemon-gateway` and `pm2 logs daemon-pds`
- Make sure ports 4002 and 4003 are listening: `sudo netstat -tulpn | grep -E "4002|4003"`

## Quick Checklist

- [ ] DNS A record added in Namecheap (Host: `daemon`, Value: `50.21.187.69`)
- [ ] DNS propagated (check with `dig` or online checker)
- [ ] SSL certificate obtained (`sudo certbot --nginx -d daemon.bushleague.xyz`)
- [ ] Gateway running (`pm2 list` shows `daemon-gateway`)
- [ ] PDS running (`pm2 list` shows `daemon-pds`)
- [ ] Nginx reloaded (`sudo systemctl reload nginx`)
- [ ] Site accessible at `https://daemon.bushleague.xyz`

