// ビルドのあとに動かす。固定ページ（.astro で作ったページ）の本文を、公開ページ（dist の HTML）から Markdown にして、
// dist/<パス>.md に書く。あわせて、そのページの <head> に <link rel="alternate" type="text/markdown"> を足す。
// エッセイの .md は、別に Astro が作る（src/pages/{en,es}/essay/[slug].md.ts）。ここでは触らない。
// 使い方：astro build のあとに node scripts/pages-md.mjs（package.json の build に入れてある）
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const ORIGIN = 'https://japoneson.com';

// 出さないページ：決まりのページ、404、旧 WordPress の転送（archives）、noindex・転送のページ
const EXCLUDE = [
  /^(en|es)\/(privacy-policy|terms-and-conditions|search)\/$/,
  /^contact\/$/,
  /^(en|es)\/contact\/$/,
];
// 試し用：ONLY="en/murakami/music/" のように、前方一致で絞れる（カンマで複数）
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (e.name === 'index.html') out.push(full);
  }
  return out;
}

const decode = (t) =>
  t.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });
td.remove(['script', 'style', 'noscript', 'svg', 'form', 'button', 'nav', 'header', 'footer', 'aside']);

// カード型のリンク（<a> の中に <div>・<p>・見出しが入っているもの）は、
// 「- [題](リンク) — 説明 / 説明」の 1 行にする。題は、見出し、無ければ class に label を含む要素、無ければ最初の文。
const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
td.addRule('card-link', {
  filter: (node) =>
    node.nodeName === 'A' && node.getAttribute('href') && node.querySelector('div, p, h1, h2, h3, h4, h5, h6, section'),
  replacement: (_content, node) => {
    const blocks = [...node.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div')].filter(
      (el) => !el.querySelector('h1, h2, h3, h4, h5, h6, p, div') && clean(el.textContent),
    );
    if (!blocks.length) return '';
    const heading = blocks.find((el) => /^H[1-6]$/.test(el.nodeName));
    const labelled = blocks.find((el) => /label/i.test(el.getAttribute('class') || ''));
    const titleEl = heading || labelled || blocks[0];
    const rest = blocks.filter((el) => el !== titleEl).map((el) => clean(el.textContent));
    const href = node.getAttribute('href');
    return `\n\n- [${clean(titleEl.textContent)}](${href})${rest.length ? ` — ${rest.join(' / ')}` : ''}\n\n`;
  },
});

// YouTube の埋め込みは、リンク1行（[Video](…)）にする。動画の説明は足さない。他の埋め込み（Facebook など）は出さない。
td.addRule('youtube-embed', {
  filter: (node) => node.nodeName === 'IFRAME' && /youtube(-nocookie)?\.com\/embed\//.test(node.getAttribute('src') || ''),
  replacement: (_content, node) => {
    const m = (node.getAttribute('src') || '').match(/embed\/([A-Za-z0-9_-]+)(?:\?([^#]*))?/);
    if (!m) return '';
    const start = new URLSearchParams(m[2] || '').get('start');
    return `\n\n[Video](https://www.youtube.com/watch?v=${m[1]}${start ? `&t=${parseInt(start, 10)}s` : ''})\n\n`;
  },
});

function toMarkdown(bodyHtml) {
  let md = td.turndown(bodyHtml);
  // 相対リンクと相対の画像を、絶対にする
  md = md.replace(/\]\((\/[^)\s]*)/g, `](${ORIGIN}$1`);
  return md.replace(/\n{3,}/g, '\n\n').trim();
}

const q = (v) => JSON.stringify(v);
let made = 0;
const skipped = [];
for (const file of await walk(DIST)) {
  const rel = relative(DIST, dirname(file)).replace(/\\/g, '/');
  const key = rel ? `${rel}/` : '';
  if (EXCLUDE.some((re) => re.test(key))) { skipped.push(`${key || '/'} (除外)`); continue; }
  if (/^(en|es)\/essay\/[^/]+\/$/.test(key)) { skipped.push(`${key} (エッセイ：別に作る)`); continue; }
  if (ONLY.length && !ONLY.some((o) => key.startsWith(o))) continue;
  let html = await readFile(file, 'utf-8');
  if (/http-equiv="refresh"/i.test(html) || /<meta name="robots" content="[^"]*noindex/i.test(html)) { skipped.push(`${key || '/'} (転送・noindex)`); continue; }
  const body = html.match(/<body[\s\S]*?<\/body>/)?.[0];
  if (!body) continue;
  const title = decode((html.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
  const description = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  const lang = (html.match(/<html[^>]*lang="([^"]+)"/) || [])[1] || 'en';
  const md = toMarkdown(body);
  const url = `${ORIGIN}/${key}`;
  const mdPath = key ? join(DIST, `${key.replace(/\/$/, '')}.md`) : join(DIST, 'index.md');
  const mdUrl = key ? `${ORIGIN}/${key.replace(/\/$/, '')}.md` : `${ORIGIN}/index.md`;
  const front = `---\ncanonical_url: ${q(url)}\ntitle: ${q(title)}\ndescription: ${q(description)}\nlang: ${q(lang)}\n---\n\n`;
  await writeFile(mdPath, `${front}${md}\n`);
  // <head> に知らせを足す
  if (!html.includes('type="text/markdown"')) {
    html = html.replace('</head>', `<link rel="alternate" type="text/markdown" href="${mdUrl}"></head>`);
    await writeFile(file, html);
  }
  made++;
}
console.log(`pages-md: ${made} 件の .md を作った`);
console.log(`スキップ ${skipped.length} 件：${skipped.slice(0, 12).join('、')}${skipped.length > 12 ? ' …' : ''}`);
