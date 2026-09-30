import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const siteUrl = process.env.SITE_URL || 'https://example.github.io';
const siteBase = process.env.SITE_BASE || '/';

export default defineConfig({
  site: siteUrl,
  base: siteBase,
  output: 'static',
  trailingSlash: 'always',
  build: {
    inlineStylesheets: 'never',
  },
  compressHTML: true,
  integrations: [sitemap()],
  vite: {
    build: {
      // El chunk de three.js (renderer WebGL completo) supera el umbral por
      // defecto de 500 kB minificados; se mide el tamano real tras gzip en
      // el paso de verificacion del build.
      chunkSizeWarningLimit: 900,
      // Evita que Astro incruste scripts pequenos como <script type="module"> en
      // el HTML: la CSP del sitio no permite script-src 'unsafe-inline', asi que
      // todo el JS debe servirse como archivo externo.
      assetsInlineLimit: 0,
    },
  },
});
