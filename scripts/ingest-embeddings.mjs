// Japoneson の AI窓（Llamaじぃ）用 embedding。
// 対象：
//  1. blog の ja-source から、カテゴリが Cabin1701（全部）または指定した CRYSTALLIZE カテゴリに
//     一致する記事だけを core（背景知識、リンクなし）として embedding する
//     — カテゴリ名で判定するので、後から記事のカテゴリが変われば次回実行時に拾い直される
//  2. 自分の src/content/ai-context/{ja,en,es}/{story,timeline}.md（Seinaのストーリー・年表、3言語）
//  3. crew-context.md（Cabin1701クルー体制、core・ja固定）
//  4. Cupie Danny 関連（llama-jii.md の関係性テキスト・adopted-at CSV、core・ja固定）
//  5. 自サイトの固定ページ（about/cupie/japoneson/murakami/mystery/swing、type:'page'、en/es）
//  6. Essay記事（en/es、type:'article'）
//  7. Vegapedia（site正本、ja/en/es、type:'vegapedia'）
// blog記事・crew-context・Cupie Dannyはcore・ja固定（CRYSTALLIZE側に翻訳が無いため）。
// Story/Timelineは3言語版が揃っているのでlang別にcore投入する（2026-08-19）。
// 実行: node scripts/ingest-embeddings.mjs
// 生成物: scripts/vectors.ndjson → `npx wrangler vectorize insert japoneson-2026 --file=scripts/vectors.ndjson`
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ACCOUNT_ID = '009d2f3b104a624e78aafe0516533530';
const BLOG_DIR = fileURLToPath(new URL('../../blog/src/content/blog/ja-source', import.meta.url));
const AI_CONTEXT_DIR = fileURLToPath(new URL('../src/content/ai-context', import.meta.url));
const AI_WINDOW_DIR = fileURLToPath(new URL('../../cabin1701/01a-WEBSITE/AI窓用', import.meta.url));
// Vegapediaはsiteリポジトリが正本。重複を避けるため複製せず、隣のリポジトリを直接読む
const VEGAPEDIA_DIR = fileURLToPath(new URL('../../site/src/content', import.meta.url));
const SITE_ROOT = 'https://cabin1701.com';
const VEGAPEDIA_URL_PREFIX = { ja: '/ja/', en: '/', es: '/es/' };
const OUT_FILE = fileURLToPath(new URL('./vectors.ndjson', import.meta.url));
const EMBED_BATCH = 5;
const CHUNK_SIZE = 1500;

// Cabin1701 は全部対象。CRYSTALLIZE はこのカテゴリだけ対象（2026-08-19、船長と確定）。
const CRYSTALLIZE_CATEGORIES = [
  'スピリチュアル',
  '心いろいろ',
  '日本の暮らし',
  '日記・雑記',
  '歴史',
  '海外の旅・暮らし',
  '音楽',
  '感情解放',
];

function getToken() {
  const configPath = join(process.env.HOME, 'Library/Preferences/.wrangler/config/default.toml');
  return readFile(configPath, 'utf-8').then((text) => {
    const m = text.match(/^oauth_token\s*=\s*"([^"]+)"/m);
    if (!m) throw new Error('oauth_token not found in wrangler config');
    return m[1];
  });
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('frontmatter not found');
  const [, fm, body] = m;
  const data = {};
  for (const line of fm.split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawVal] = kv;
    data[key] = rawVal.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');
  }
  return { data, body: body.trim() };
}

function parseCategoryField(raw) {
  // category: ["CRYSTALLIZE", "心いろいろ"] という1行のJSON配列を素朴に取り出す
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function matchesTarget(categories) {
  if (categories.includes('Cabin1701')) return true;
  if (categories.includes('CRYSTALLIZE') && categories.some((c) => CRYSTALLIZE_CATEGORIES.includes(c))) return true;
  return false;
}

function stripMarkdown(text) {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/[*_#>`]/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function stripFrontmatter(raw) {
  const m = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return (m ? m[1] : raw).trim();
}

// 段落境界を尊重してsize文字前後で分割する
function chunkText(text, size) {
  const paragraphs = text.split(/\n/);
  const chunks = [];
  let current = '';
  for (const p of paragraphs) {
    if (current && current.length + p.length > size) {
      chunks.push(current.trim());
      current = '';
    }
    current += (current ? '\n\n' : '') + p;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function coreRecord(sourceTag, title, chunk, index, total, lang = 'ja') {
  const id = createHash('sha1').update(`core:${lang}:${sourceTag}:${index}`).digest('hex').slice(0, 32);
  return {
    id,
    embedText: `${title}\n\n${chunk}`,
    metadata: { lang, title: total > 1 ? `${title} (${index + 1}/${total})` : title, url: '', excerpt: chunk.slice(0, 500), type: 'core' },
  };
}

// 1件のテキストをチャンク化してcoreレコード配列にする共通処理
function buildCoreRecords(sourceTag, title, body, lang = 'ja') {
  const chunks = chunkText(stripMarkdown(body), CHUNK_SIZE);
  return chunks.map((chunk, i) => coreRecord(sourceTag, title, chunk, i, chunks.length, lang));
}

// 1. blog ja-source から Cabin1701全部 + 指定CRYSTALLIZEカテゴリの記事
async function collectBlogArticles() {
  const files = await walk(BLOG_DIR);
  const records = [];
  let matched = 0;
  for (const file of files) {
    const raw = await readFile(file, 'utf-8');
    const { data, body } = parseFrontmatter(raw);
    const categories = parseCategoryField(data.category ?? '[]');
    if (!matchesTarget(categories)) continue;
    matched++;
    const slug = createHash('sha1').update(file).digest('hex').slice(0, 16);
    records.push(...buildCoreRecords(`blog:${slug}`, data.title ?? '', body));
  }
  console.log(`blog ja-source: ${files.length} files scanned, ${matched} matched category filter, ${records.length} chunks`);
  return records;
}

// 2. 自分のai-context/{ja,en,es}（story.md, timeline.md）
const CORE_DOC_TITLES = {
  'story.md': { ja: 'Seinaのストーリー', en: "Seina's Story", es: 'La historia de Seina' },
  'timeline.md': { ja: 'Seina年表', en: 'Seina Timeline', es: 'Cronología de Seina' },
};
async function collectOwnCore() {
  const records = [];
  for (const lang of ['ja', 'en', 'es']) {
    const dir = join(AI_CONTEXT_DIR, lang);
    const files = await readdir(dir).catch(() => []);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const raw = await readFile(join(dir, file), 'utf-8');
      const title = CORE_DOC_TITLES[file]?.[lang] ?? file;
      records.push(...buildCoreRecords(`own:${lang}:${file}`, title, stripFrontmatter(raw), lang));
    }
  }
  console.log(`ai-context: ${records.length} chunks`);
  return records;
}

// 3. crew-context.md
async function collectCrewContext() {
  const raw = await readFile(join(AI_WINDOW_DIR, 'クルー体制', 'crew-context.md'), 'utf-8').catch(() => null);
  if (!raw) return [];
  const records = buildCoreRecords('crew-context', 'Cabin1701クルー体制', raw);
  console.log(`crew-context: ${records.length} chunks`);
  return records;
}

// 4. Cupie Danny（llama-jii.mdの関係性テキスト＋adopted-at CSV）
async function collectCupieDanny() {
  const records = [];
  const llamaJii = await readFile(join(AI_WINDOW_DIR, 'Llamaじぃ', 'llama-jii.md'), 'utf-8').catch(() => null);
  if (llamaJii) {
    const m = llamaJii.match(/## Cupie Dannyとの関係[\s\S]*?(?=\n---|\n##(?!#)|$)/);
    if (m) records.push(...buildCoreRecords('cupie-danny-relation', 'Cupie Dannyとの関係', m[0]));
  }
  const csv = await readFile(join(AI_WINDOW_DIR, 'Llamaじぃ', 'cupie-danny-adopted-at.csv'), 'utf-8').catch(() => null);
  if (csv) {
    const lines = csv.trim().split('\n').slice(1); // ヘッダー除く
    const body = lines.map((l) => l.replace(/,/, ': ')).join('\n');
    records.push(...buildCoreRecords('cupie-danny-adopted-at', 'Cupie Dannyのアダプト場所（QPD番号対応表）', body));
  }
  console.log(`cupie-danny: ${records.length} chunks`);
  return records;
}

// vegapedia-{lang}.mdの`## 用語｜Term {#anchor}`区切りをエントリごとに分ける（blogのingestと同じ正規表現）
function parseVegapediaEntries(raw) {
  const lines = raw.split('\n');
  const entries = [];
  let current = null;
  for (const line of lines) {
    const heading = line.match(/^## (.*?)\s*\{#([^}]+)\}/);
    if (heading) {
      if (current) entries.push(current);
      current = { term: heading[1].trim(), anchor: heading[2], bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    }
  }
  if (current) entries.push(current);
  return entries;
}

// 5. 自サイトの主要固定ページ。type:'page'、lang別、URL付きでリンク可能にする
const SITE_PAGES = [
  { slug: 'about', title: { en: 'About Seina', es: 'Sobre Seina' } },
  { slug: 'cupie', title: { en: 'Cupie Danny', es: 'Cupie Danny' } },
  { slug: 'japoneson', title: { en: 'JAPONÉSON', es: 'JAPONÉSON' } },
  { slug: 'murakami', title: { en: 'Murakami Mambo', es: 'Murakami Mambo' } },
  { slug: 'mystery', title: { en: 'The Mystery Entertainment', es: 'El Entretenimiento del Misterio' } },
  { slug: 'swing', title: { en: 'Angels Swing', es: 'Angels Swing' } },
];
async function collectSitePages() {
  const records = [];
  for (const page of SITE_PAGES) {
    for (const lang of ['en', 'es']) {
      const dir = fileURLToPath(new URL(`../src/content/${lang}`, import.meta.url));
      const raw = await readFile(join(dir, `${page.slug}.md`), 'utf-8').catch(() => null);
      if (!raw) continue;
      const body = stripMarkdown(stripFrontmatter(raw));
      const url = `https://japoneson.com/${lang}/${page.slug}/`;
      const title = page.title[lang];
      const chunks = chunkText(body, CHUNK_SIZE).slice(0, 1); // 最初のチャンクだけで十分（プロフィール導入部）
      chunks.forEach((chunk, i) => {
        const id = createHash('sha1').update(`page:${lang}:${page.slug}:${i}`).digest('hex').slice(0, 32);
        records.push({
          id,
          embedText: `${title}\n\n${chunk}`,
          metadata: { lang, title, url, excerpt: chunk.slice(0, 300), type: 'page' },
        });
      });
    }
  }
  console.log(`site pages: ${records.length} chunks`);
  return records;
}

// 6b. サイト全サブページ（Swing/Mystery/Murakami/Cupieの下の全記事）。type:'article'、lang別、URL付き
// SITE_PAGES（入り口の6ページ）は別扱いなので除外。utility系（contact/home/privacy/terms）も除外
const SUBPAGE_EXCLUDE = new Set([
  'about', 'contact', 'cupie', 'home', 'japoneson', 'murakami', 'mystery',
  'privacy-policy', 'swing', 'terms-and-conditions',
]);
async function collectSubpages() {
  const records = [];
  for (const lang of ['en', 'es']) {
    const dir = fileURLToPath(new URL(`../src/content/${lang}`, import.meta.url));
    const files = await walk(dir);
    for (const file of files) {
      const rel = file.slice(dir.length + 1).replace(/\.md$/, '');
      const topSlug = rel.split('/')[0];
      if (SUBPAGE_EXCLUDE.has(topSlug) && !rel.includes('/')) continue; // 入り口ページ自体は除外
      if (!rel.includes('/')) continue; // サブページ判定：スラッシュを含むもののみ対象
      if (rel.startsWith('essay/')) continue; // essayは別関数で処理
      const raw = await readFile(file, 'utf-8');
      const { data, body } = parseFrontmatter(raw);
      const title = (data.title ?? rel.split('/').pop()).replace(/^"(.*)"$/, '$1');
      const url = `https://japoneson.com/${lang}/${rel}/`;
      const excerpt = stripMarkdown(body).slice(0, 300);
      const embedText = `${title}\n\n${stripMarkdown(body)}`.slice(0, 6000);
      const id = createHash('sha1').update(`subpage:${lang}:${rel}`).digest('hex').slice(0, 32);
      records.push({ id, embedText, metadata: { lang, title, url, excerpt, type: 'article' } });
    }
  }
  console.log(`subpages: ${records.length} pages`);
  return records;
}

// 6. Essay記事（自サイト、en/es各13本）。type:'article'、lang別、URL付き
async function collectEssays() {
  const records = [];
  for (const lang of ['en', 'es']) {
    const dir = fileURLToPath(new URL(`../src/content/essay/${lang}`, import.meta.url));
    const files = await walk(dir);
    for (const file of files) {
      const raw = await readFile(file, 'utf-8');
      const { data, body } = parseFrontmatter(raw);
      const rel = file.slice(dir.length + 1).replace(/\.md$/, '');
      const url = `https://japoneson.com/${lang}/essay/${rel}/`;
      const excerpt = stripMarkdown(body).slice(0, 300);
      const embedText = `${data.title}\n\n${stripMarkdown(body)}`.slice(0, 6000);
      const id = createHash('sha1').update(`essay:${lang}:${rel}`).digest('hex').slice(0, 32);
      records.push({ id, embedText, metadata: { lang, title: data.title, url, excerpt, type: 'article' } });
    }
  }
  console.log(`essays: ${records.length} articles`);
  return records;
}

// 7. Vegapedia（site正本、ja/en/esそれぞれ持っているので言語ごとにembedding、リンク付きで返す）
async function collectVegapedia() {
  const records = [];
  for (const lang of ['ja', 'en', 'es']) {
    const raw = await readFile(join(VEGAPEDIA_DIR, `vegapedia-${lang}.md`), 'utf-8').catch(() => null);
    if (!raw) continue;
    const entries = parseVegapediaEntries(raw);
    for (const entry of entries) {
      const body = stripMarkdown(entry.bodyLines.join('\n'));
      const url = `${SITE_ROOT}${VEGAPEDIA_URL_PREFIX[lang]}vegapedia#${entry.anchor}`;
      const id = createHash('sha1').update(`vegapedia:${lang}:${entry.anchor}`).digest('hex').slice(0, 32);
      records.push({
        id,
        embedText: `${entry.term}\n\n${body}`.slice(0, 3000),
        metadata: { lang, title: entry.term, url, excerpt: body.slice(0, 300), type: 'vegapedia' },
      });
    }
    console.log(`vegapedia ${lang}: ${entries.length} entries`);
  }
  return records;
}

async function embedBatch(texts, token) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/baai/bge-m3`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texts }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(JSON.stringify(json.errors));
  return json.result.data;
}

async function main() {
  const token = await getToken();

  const records = [
    ...(await collectBlogArticles()),
    ...(await collectOwnCore()),
    ...(await collectCrewContext()),
    ...(await collectCupieDanny()),
    ...(await collectSitePages()),
    ...(await collectSubpages()),
    ...(await collectEssays()),
    ...(await collectVegapedia()),
  ];

  const vectors = [];
  for (let i = 0; i < records.length; i += EMBED_BATCH) {
    const batch = records.slice(i, i + EMBED_BATCH);
    const embeddings = await embedBatch(batch.map((r) => r.embedText), token);
    batch.forEach((r, j) => vectors.push({ id: r.id, values: embeddings[j], metadata: r.metadata }));
    console.log(`embedded ${Math.min(i + EMBED_BATCH, records.length)}/${records.length}`);
  }

  await writeFile(OUT_FILE, vectors.map((v) => JSON.stringify(v)).join('\n') + '\n');
  console.log(`wrote ${vectors.length} vectors to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
