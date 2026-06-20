/** @type {import('next').NextConfig} */

// Baseline security headers. Ported from the (now-retired) cultiness-spectrum/site
// config, then widened for this app's real client-side origins so the CSP does not
// break the maps or photo features:
//   - Supabase REST + realtime (wss) + edge functions
//   - MapTiler + Carto basemap styles / vector tiles / glyphs / sprites
//   - maplibre-gl CSS from jsdelivr, and its blob: web workers
//   - next/font self-hosts the Google fonts at build time, so font-src 'self' is enough
//
// The CSP ships as Content-Security-Policy-Report-Only first: it reports violations
// without blocking, so we can confirm nothing breaks in production before flipping it
// to the enforcing `Content-Security-Policy` header. The other five headers are
// behaviour-safe and enforce immediately.
const SUPABASE_HOST = 'shgdrkrqjnwtlyxcdayp.supabase.co';
const SUPABASE_FUNCTIONS_HOST = 'shgdrkrqjnwtlyxcdayp.functions.supabase.co';

const ContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Next.js injects inline hydration scripts; no external script origins are loaded.
  "script-src 'self' 'unsafe-inline'",
  // Inline styles are used throughout; maplibre-gl CSS is loaded from jsdelivr.
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  // data:/blob: for inline + maplibre canvas/markers; https: covers raster map tiles.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // maplibre-gl runs its renderer in a blob: web worker.
  "worker-src 'self' blob:",
  [
    'connect-src',
    "'self'",
    `https://${SUPABASE_HOST}`,
    `wss://${SUPABASE_HOST}`,
    `https://${SUPABASE_FUNCTIONS_HOST}`,
    'https://api.maptiler.com',
    'https://basemaps.cartocdn.com',
    'https://*.basemaps.cartocdn.com',
    'https://*.cartocdn.com',
  ].join(' '),
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  // Report-only for now — see note above. Flip the key to 'Content-Security-Policy'
  // once production logs/console show no legitimate violations.
  { key: 'Content-Security-Policy-Report-Only', value: ContentSecurityPolicy },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
];

const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
