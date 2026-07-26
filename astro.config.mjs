// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://japoneson.com',
  integrations: [sitemap()],
  redirects: {
    // 旧 WordPress サイトの /ryu/* URL を新 Murakami ハブへ集約
    // （検索エンジンに残る古いリンクの受け皿。旧スラッグは新構造と 1:1 一致しないため
    //   スラッグ保持せずハブに寄せる。個別に正確に飛ばしたいページは下に追加する）
    '/es/ryu': '/es/murakami/',
    '/es/ryu/cuba': '/es/murakami/',
    '/en/ryu': '/en/murakami/',
  },
});