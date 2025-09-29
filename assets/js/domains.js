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
   */
  healthCheckPath: '/health.txt',

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
  timeoutMs: 2500
};
