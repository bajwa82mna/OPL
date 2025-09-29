export const domainConfig = {
  /**
   * Update this list with every domain or subdomain that hosts the primary service.
   * Domains are checked in order and the first reachable entry wins.
   */
  domainsToCheck: [
    'https://www.service-a.com',
    'https://cdn.service-b.net',
    'https://eu.service-c.com'
  ],

  /**
   * Global fallback resource that should exist on every domain above.
   * Use '/' to probe the homepage, or point to a lightweight status file.
   */
  healthCheckPath: '/',

  /**
   * Optional per-domain overrides for probes that live at a different path.
   * Example:
   * {
   *   'https://cdn.service-b.net': '/status/ping'
   * }
   */
  healthCheckOverrides: {},

  /**
   * Adjust this value to balance accuracy vs. responsiveness (milliseconds).
   */
  timeoutMs: 4000,

  /**
   * Append a cache-busting query string to probes so CDNs do not cache 404s.
   */
  cacheBustParam: '_gateway_ping',

  /**
   * When the gateway runs on HTTPS but a candidate domain is HTTP, modern
   * browsers will block the probe request for mixed-content reasons. When this
   * flag is enabled, we will fall back to redirecting straight to the HTTP
   * domain instead of marking it unreachable.
   */
  allowInsecureRedirects: true
};