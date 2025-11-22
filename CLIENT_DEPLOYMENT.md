# Client Deployment Guide

## Building the Client

The client is a Vite React app that builds to static files.

### Build from Root:
```bash
npm run build:client
```

### Or Build Manually:
```bash
cd daemon-client
npm run build
```

This creates a `dist/` folder with all the static files.

## Serving the Client

### Option 1: Using Nginx (Recommended for Production)

1. **Build the client:**
   ```bash
   cd daemon-client
   npm run build
   ```

2. **Copy dist folder to web server:**
   ```bash
   sudo cp -r daemon-client/dist /var/www/daemon-client
   ```

3. **Create Nginx config** (`/etc/nginx/sites-available/daemon-client`):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # or your server IP

       root /var/www/daemon-client;
       index index.html;

       # Serve static files
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Proxy API requests to gateway
       location /api/ {
           proxy_pass http://localhost:4003;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Proxy PDS requests
       location /xrpc/ {
           proxy_pass http://localhost:4002;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
       }
   }
   ```

4. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/daemon-client /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Option 2: Using Vite Preview (Development/Testing)

```bash
cd daemon-client
npm run build
npm run preview
```

This serves the built files on port 4173 (default).

### Option 3: Using a Simple HTTP Server

```bash
cd daemon-client
npm run build
cd dist
# Python 3
python3 -m http.server 8080
# Or Node.js
npx serve -s . -p 8080
```

## Environment Variables

Make sure your `.env` file in `daemon-client/` has:
```
VITE_GATEWAY_URL=http://50.21.187.69:4003
VITE_PDS_URL=http://50.21.187.69:4002
```

These are baked into the build, so rebuild if you change them.

## Accessing the Client

Once deployed:
- **Local dev:** `http://localhost:5174` (vite dev server)
- **Built & served:** `http://your-server-ip` or `http://your-domain.com`
- **Vite preview:** `http://localhost:4173`

## Notes

- The client is a Single Page Application (SPA), so all routes should serve `index.html`
- API requests go to the Gateway (port 4003)
- PDS requests go to the PDS (port 4002)
- Make sure CORS is enabled on both Gateway and PDS

