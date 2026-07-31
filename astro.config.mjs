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

    // 2026-07-31: Search Console の 404 一覧（98本）から、実体のある記事だけを拾って
    // 受け皿を作った。旧サイトの /ryu/works/music/* は村上龍のレーベル作品のページで、
    // AI 検索に引用されている層。ja・接頭辞なしは英語版へ寄せる（新サイトに ja は無い）。
    //
    // 作らなかったもの（意図的）：
    //   remember/ angelsswing/ の画像ページ（WP が画像1枚ごとに自動生成したもので中身が無い）
    //   /archives/<ID>（まだ公開していないブログ記事。公開時に行き先が決まる）
    //   /archives/category/* /archives/date/*（一覧ページ。対応する概念が新サイトに無い）
    '/ryu/works/music/you-dont-know-what-love-is': '/en/murakami/music/you-dont-know-what-love-is/',
    '/ja/ryu/works/music/you-dont-know-what-love-is': '/en/murakami/music/you-dont-know-what-love-is/',
    '/ja/ryu/works/music/you-dont-know-what-love-is/letra': '/en/murakami/music/you-dont-know-what-love-is/',
    '/ryu/works/music/the-man-who-called-tosco': '/en/murakami/music/the-man-who-called-tosco/',
    '/ryu/works/music/1995-cuban-house-music': '/en/murakami/music/1995-cuban-house-music/',
    '/en/ryu/works/music/1993_live_in-japan': '/en/murakami/music/1993_live_in-japan/',
    '/en/ryu/works/music/1994-los-van-van-1974': '/en/murakami/music/1994-los-van-van-1974/',
    '/en/ryu/works/music/1993_cabaret_panoramico': '/en/murakami/music/cabaret_panoramico/',
    // 旧 URL は画像ファイル名（1993_Paulo.jpg / 1998_javier_sonalson.jpg）が
    // そのままスラッグになっていたため、記事名からは辿れなかった。
    '/ja/ryu/works/music/1993_paulo': '/en/murakami/music/1993_no-hace-falta/',
    '/ja/ryu/works/music/1998_javier_sonalson': '/en/murakami/music/son-al-son/',
    // jte が何を指すのか特定できなかったので、当てずっぽうで飛ばさずハブへ。
    '/ja/ryu/jte/01-2': '/en/murakami/',
  },
});