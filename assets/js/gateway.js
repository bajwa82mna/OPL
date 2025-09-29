import { domainConfig } from './domains.js';

const iconWrapper = document.getElementById('iconWrapper');
const titleEl = document.getElementById('title');
const messageEl = document.getElementById('message');
const detailsEl = document.getElementById('details');

const baseIconClasses = 'mx-auto flex h-20 w-20 items-center justify-center rounded-full';
const iconMeta = {
  spinner: {
    wrapper: 'bg-sky-500/10 text-sky-400',
    markup:
      '<span class="block h-12 w-12 animate-spin rounded-full border-[3px] border-current border-t-transparent"></span>'
  },
  browser: {
    wrapper: 'bg-emerald-500/10 text-emerald-400',
    markup:
      '<svg class="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H4V7z" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 9h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9z" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="7.5" cy="7" r="0.75" fill="currentColor"></circle><circle cx="10.5" cy="7" r="0.75" fill="currentColor"></circle><circle cx="13.5" cy="7" r="0.75" fill="currentColor"></circle></svg>'
  },
  error: {
    wrapper: 'bg-rose-500/10 text-rose-400',
    markup:
      '<svg class="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 8v4m0 4h.01" stroke-linecap="round" stroke-linejoin="round"></path><path d="M10.29 3.86 2.82 17a1 1 0 0 0 .86 1.5h16.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0z" stroke-linecap="round" stroke-linejoin="round"></path></svg>'
  }
};

const setView = ({ icon = 'spinner', title, message, details }) => {
  const meta = iconMeta[icon] || iconMeta.spinner;
  iconWrapper.className = baseIconClasses + ' ' + meta.wrapper;
  iconWrapper.innerHTML = meta.markup;
  titleEl.textContent = title;
  messageEl.textContent = message;
  if (details) {
    detailsEl.innerHTML = details;
    detailsEl.classList.remove('hidden');
  } else {
    detailsEl.innerHTML = '';
    detailsEl.classList.add('hidden');
  }
};

const progressHint =
  '<p class="text-xs uppercase tracking-widest text-slate-500/80">Please keep this tab open while we optimize your connection.</p>';

const isInAppBrowser = () => {
  const ua = navigator.userAgent || navigator.vendor || '';
  const blockedIdentifiers = [/MicroMessenger/i, /AlipayClient/i];
  return blockedIdentifiers.some((pattern) => pattern.test(ua));
};

const fetchWithTimeout = (resource, options = {}) => {
  const { timeoutMs } = domainConfig;
  const opts = { ...options };
  const controllerSupported = typeof AbortController === 'function';
  const controller = controllerSupported ? new AbortController() : null;

  if (controller) {
    opts.signal = controller.signal;
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (controller) {
        controller.abort();
      }
      reject(new Error('timeout'));
    }, timeoutMs);

    fetch(resource, opts)
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

const normalizeDomain = (domain) => domain.replace(/\/+$/, '');
const getTimestamp = () =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

const appendCacheBust = (url) => {
  const { cacheBustParam } = domainConfig;

  if (!cacheBustParam) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set(cacheBustParam, Date.now().toString(36));
    return urlObj.toString();
  } catch (error) {
    console.warn('[Gateway] Unable to append cache bust parameter:', error);
    return url;
  }
};

const checkDomain = async (domain) => {
  const normalizedDomain = normalizeDomain(domain);
  const { healthCheckPath, healthCheckOverrides, allowInsecureRedirects } = domainConfig;
  const probePath = healthCheckOverrides[normalizedDomain] || healthCheckPath;
  const probeUrl = appendCacheBust(normalizedDomain + probePath);
  const start = getTimestamp();

  if (
    allowInsecureRedirects &&
    window.location.protocol === 'https:' &&
    normalizedDomain.startsWith('http:')
  ) {
    console.info('[Gateway] Skipping probe for insecure domain from HTTPS page. Redirecting directly.');
    return { domain: normalizedDomain, insecureRedirect: true, duration: null };
  }

  try {
    const response = await fetchWithTimeout(probeUrl, {
      method: 'GET',
      cache: 'no-store',
      mode: 'no-cors',
      redirect: 'follow'
    });

    const duration = Math.round(getTimestamp() - start);

    if (!response) {
      return null;
    }

    if (response.type === 'opaque' || (response.status >= 200 && response.status < 400)) {
      console.info(`[Gateway] ${normalizedDomain} responded in ~${duration}ms`);
      return { domain: normalizedDomain, duration };
    }

    console.warn(`[Gateway] ${normalizedDomain} responded with status ${response.status}`);
    return null;
  } catch (error) {
    if (
      allowInsecureRedirects &&
      window.location.protocol === 'https:' &&
      normalizedDomain.startsWith('http:')
    ) {
      console.warn('[Gateway] Probe blocked by mixed-content policy. Redirecting anyway.');
      return { domain: normalizedDomain, insecureRedirect: true, duration: null };
    }

    console.warn(`[Gateway] ${normalizedDomain} check failed:`, error);
    return null;
  }
};

const runGateway = async () => {
  const { domainsToCheck } = domainConfig;

  if (!domainsToCheck.length) {
    setView({
      icon: 'error',
      title: 'No domains configured',
      message: 'Please update the bouncer configuration with at least one service endpoint.',
      details: ''
    });
    return;
  }

  if (isInAppBrowser()) {
    setView({
      icon: 'browser',
      title: 'Please open this page in your browser',
      message: 'We detected that this link is running inside an in-app browser (such as WeChat or Alipay).',
      details:
        '<div class="space-y-2 leading-relaxed"><p>Tap the menu in the corner of this app and choose <strong>“Open in Browser”</strong>.</p><p>Select Safari, Chrome, or your default browser to continue.</p></div>'
    });
    return;
  }

  setView({
    icon: 'spinner',
    title: 'Optimizing your connection...',
    message: 'Finding the fastest server for you. This will only take a moment.',
    details: progressHint
  });

  for (const domain of domainsToCheck) {
    let hostname;
    try {
      hostname = new URL(domain).hostname;
    } catch (_) {
      hostname = domain;
    }

    setView({
      icon: 'spinner',
      title: 'Optimizing your connection...',
      message: `Checking ${hostname}...`,
      details: progressHint
    });

    const result = await checkDomain(domain);
    if (result) {
      const message = result.insecureRedirect
        ? `Connecting through ${hostname}.`
        : `Connecting through ${hostname} (≈${result.duration} ms).`;

      setView({
        icon: 'spinner',
        title: 'Redirecting…',
        message,
        details: result.insecureRedirect
          ? '<p>The probe was skipped because browsers block testing HTTP sites from HTTPS pages.</p>'
          : ''
      });

      window.location.replace(result.domain);
      return;
    }
  }

  setView({
    icon: 'error',
    title: 'Unable to reach our services',
    message: 'We are sorry, but our services seem to be unavailable from your location at the moment.',
    details: '<p>Please try again later or contact our support team if the issue persists.</p>'
  });
};

runGateway();
