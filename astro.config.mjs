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
    // 2026-07-31: スペイン語検索でこの旧 URL が引用されていたが 404 を返していた。
    // 人間は 404.astro の JS で飛べるが、GitHub Pages はステータスを 404 で返すため
    // クローラーには「ページ無し」に見える。個別に受け皿を置いて 200 にする。
    '/en/ryu/cuba/tosco/bio': '/en/murakami/tosco/',
  },
});