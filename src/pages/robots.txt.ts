import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const isPreview = (process.env.SITE_PREVIEW ?? 'true') !== 'false';

  const lines = isPreview
    ? ['User-agent: *', 'Disallow: /']
    : ['User-agent: *', 'Allow: /', `Sitemap: ${new URL('sitemap-index.xml', site).toString()}`];

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
