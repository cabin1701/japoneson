// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://japoneson.com',
  integrations: [sitemap()],
  redirects: {
    '/es/ryu/cuba': '/es/murakami/',
  },
});