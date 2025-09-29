# Smart Gateway Bouncer

This project delivers a lightweight smart gateway page that detects in-app browsers, probes multiple service domains, and redirects users to the first reachable endpoint. The solution is split into modular files to make configuration and customization straightforward.

## Project Structure

```
├── index.html              # Main HTML shell loading Tailwind CSS via CDN
├── assets
│   ├── css
│   │   └── styles.css      # Custom styles (color scheme, global tweaks)
│   └── js
│       ├── domains.js      # Domain list, timeout, and health-check configuration
│       └── gateway.js      # Core JavaScript controller for the bouncer
```

## Configuration

1. Open `assets/js/domains.js`.
2. Edit `domainsToCheck` with every domain or subdomain that hosts your primary service. Place the fastest or most reliable endpoints earlier in the list.
3. Ensure each domain exposes the path referenced by `healthCheckPath` (defaults to `/`, meaning the homepage). Point this to a lightweight status file if you prefer. Use the `healthCheckOverrides` object when a domain needs a custom probe path.
4. If your gateway runs on HTTPS but you need to redirect to HTTP-only services, leave `allowInsecureRedirects` enabled so the page can skip the browser-blocked probe and jump straight to the HTTP endpoint.
5. Adjust `timeoutMs` if you want faster or slower fallbacks (value is in milliseconds), and tweak `cacheBustParam` if you want to disable cache busting.

## Local Testing

You can serve the project locally with any static server. For example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

## Deploying with aaPanel

aaPanel is a popular hosting control panel that can serve static sites easily.

1. **Upload the files**
   - Log in to your aaPanel instance.
   - Open **Files** and create a new directory for the gateway (e.g., `/www/wwwroot/gateway`).
   - Upload the entire project folder (keeping the directory structure shown above).

2. **Configure the site**
   - Navigate to **Website** → **Add Site**.
   - Enter the domain or subdomain you want to use for the gateway.
   - Set the root directory to the folder where you uploaded the project (e.g., `/www/wwwroot/gateway`).
   - Choose **Static** or **Pure HTML** as the site type, and complete the wizard.

3. **Enable HTTPS (optional but recommended)**
   - In the newly created site entry, click **SSL**.
   - Apply a free Let’s Encrypt certificate or upload your existing certificate.

4. **Verify the deployment**
   - Open the configured domain in a browser.
   - Confirm that the loading screen appears and that redirection occurs when a reachable domain is found.

5. **Maintain the configuration**
   - When adding or removing service endpoints, update `assets/js/domains.js` and re-upload the file (or edit it directly from aaPanel’s file manager).

With these steps, the gateway should be fully operational and easy to maintain through aaPanel.