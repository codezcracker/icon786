import { useEffect } from 'react';

/**
 * Optional analytics — enabled only when env vars are set at build time.
 * VITE_PLAUSIBLE_DOMAIN=icon786.com  OR  VITE_GA_MEASUREMENT_ID=G-XXXXXXXX
 */
export default function Analytics() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim();
    if (plausibleDomain) {
      const script = document.createElement('script');
      script.defer = true;
      script.dataset.domain = plausibleDomain;
      script.src = 'https://plausible.io/js/script.js';
      document.head.appendChild(script);
      return () => script.remove();
    }

    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
    if (gaId) {
      const loader = document.createElement('script');
      loader.async = true;
      loader.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(loader);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args) {
        window.dataLayer.push(args);
      }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', gaId);

      return () => loader.remove();
    }
  }, []);

  return null;
}
