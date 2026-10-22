// Facebook (Meta) and TikTok pixel settings. The pixels themselves run in public/assets/pixels.js.

// Pixel IDs from the admin, kept only when they look valid (Meta: digits; TikTok: letters and digits).
export function pixelConfig(settings) {
  const meta = String(settings.meta_pixel_id || '').trim();
  const tiktok = String(settings.tiktok_pixel_id || '').trim().toUpperCase();
  return { meta: /^\d{8,20}$/.test(meta) ? meta : '', tiktok: /^[A-Z0-9]{10,30}$/.test(tiktok) ? tiktok : '' };
}

// Extra Content-Security-Policy sources each pixel needs, added only when that pixel is set.
export function pixelCsp(csp, settings) {
  const px = pixelConfig(settings);
  const scripts = [];
  const connect = [];
  if (px.meta) {
    scripts.push('https://connect.facebook.net');
    connect.push('https://www.facebook.com', 'https://connect.facebook.net');
  }
  if (px.tiktok) {
    scripts.push('https://analytics.tiktok.com');
    connect.push('https://analytics.tiktok.com', 'https://*.tiktok.com', 'https://*.tiktokw.us');
  }
  if (!scripts.length) return csp;
  return csp.replace("script-src 'self'", `script-src 'self' ${scripts.join(' ')}`).replace("connect-src 'self'", `connect-src 'self' ${connect.join(' ')}`);
}
