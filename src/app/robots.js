export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: 'https://www.zacharymays.com/sitemap.xml',
    host: 'https://www.zacharymays.com',
  };
}
