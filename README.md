# Smart Gateway Bouncer

This project provides a single-file smart gateway (or "bouncer") page that:

- blocks known in-app browsers such as WeChat (MicroMessenger) and Alipay by showing instructions to open the page in a real browser,
- probes a configurable list of service domains and redirects to the first reachable host, and
- presents polished loading and failure states for end users.

All HTML, CSS (via Tailwind CDN), and JavaScript live in `index.html` so you can upload exactly one file to any static host or aaPanel instance.

## Configuration

1. Open `index.html` in a text editor.
2. Locate the `domainConfig` object near the top of the `<script>` block.
3. Update `domainsToCheck` with every domain or subdomain that should be considered. You can provide either bare hostnames (e.g., `example.com`) or fully-qualified URLs (e.g., `https://example.com`). Bare hostnames are automatically promoted to HTTPS.
4. Ensure each domain exposes the resource referenced by `healthCheckPath` (defaults to `/`). Use `healthCheckOverrides` to point individual hosts to different probe paths when needed.
5. Leave `treatClientErrorsAsSuccess` set to `true` when the probe path may return a 403/404 but the domain is otherwise usable. Turn it off if you only want 2xx/3xx responses to count as success.
6. Adjust `timeoutMs`, `cacheBustParam`, or `allowInsecureRedirects` to tune how aggressively probes run and how HTTP-only domains are handled.

## Local Testing

Serve the file from any static web server. For example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in your browser to exercise the gateway logic.

## Deploying with aaPanel

1. Log in to aaPanel and open **Files**.
2. Create a directory such as `/www/wwwroot/gateway` and upload `index.html` into it.
3. Add a new **Website** in aaPanel, point the document root at the folder above, and choose **Static** (Pure HTML).
4. Enable HTTPS under the site’s **SSL** tab if desired.
5. Open the configured domain to confirm that the loader appears, in-app browsers are blocked, and working domains redirect immediately.

Whenever you need to update the domain list or timeouts, edit `index.html`, upload the new copy, and refresh the page.
