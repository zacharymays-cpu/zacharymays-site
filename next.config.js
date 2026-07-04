/** @type {import('next').NextConfig} */

// Baseline security headers.
//
// The CSP ships as Content-Security-Policy-Report-Only first: it reports violations
// without blocking, so we can confirm nothing breaks in production before flipping it
// to the enforcing `Content-Security-Policy` header. The other five headers are
// behaviour-safe and enforce immediately.
//
// The dataset app (Supabase, MapTiler/Carto maps) was extracted to the
// Organizational Coercion Index site — this author site no longer talks to
// those origins, so their CSP entries were removed with the routes that used them.
const ContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Next.js injects inline hydration scripts; no external script origins are loaded.
  "script-src 'self' 'unsafe-inline'",
  // Inline styles are used throughout.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
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
  // The shared Research System content package ships raw JSX (not precompiled),
  // so Next must run it through the same SWC/JSX transform as local source.
  transpilePackages: ['@zacharymays-cpu/oci-research-system'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
