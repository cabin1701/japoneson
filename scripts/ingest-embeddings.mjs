// Japoneson の AI窓（Llamaじぃ）用 embedding。
// 対象：
//  1. ⚠️2026-08-23、船長判断で一時停止中（main()内でコメントアウト）。blog の ja-source から、
//     カテゴリが Cabin1701（全部）または指定した CRYSTALLIZE カテゴリに
//     一致する記事だけを core（背景知識、リンクなし）として embedding する
//     — カテゴリ名で判定するので、後から記事のカテゴリが変われば次回実行時に拾い直される
//  2. 自分の src/content/ai-context/{ja,en,es}/{story,timeline}.md（Seinaのストーリー・年表、3言語）
//  3. crew-context.md（Cabin1701クルー体制、core・ja固定）
//  4. Cupie Danny 関連（llama-jii.md の関係性テキスト・adopted-at CSV、core・ja固定）
//  5. 自サイトの固定ページ（about/cupie/japoneson/murakami/mystery/swing、type:'page'、en/es）
//  5b. cuba配下の.astro直書きページ（rip-papi/al-rojo-vivo gallery・videos、type:'article'、en/es）
//     — content collectionじゃないので本文はスクリプト内に手打ち。ページ本文を変えたらここも直す
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
  'site-overview.md': { ja: 'このサイトは何？', en: 'What is this website?', es: '¿Qué es este sitio?' },
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
  { slug: 'cuba', title: { en: 'JAPONÉSON', es: 'JAPONÉSON' } },
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

// 6a2. cuba配下の.astro直書きページ（content collectionじゃないので collectSitePages/collectSubpages では拾えない）。
// 本文はページのソースからコピーして手打ち——ページの本文を変えたらここも直す（2026-08-23、rip-papi新設時に追加）。
const CUBA_ASTRO_PAGES = {
  'rip-papi': {
    url: { en: 'cuba/rip-papi/', es: 'cuba/rip-papi/' },
    title: { en: 'RIP Papi - Cuban Spirit', es: 'RIP Papi - Cuban Spirit' },
    body: {
      en: `Papi (Antonio Rojo) was the father of Danny Rojo, a real person in Cuba — not to be confused with "Cupie Danny," the small cartoon doll character on this site, or with "Shoko-chan," the little sister character in the Cupie Danny Theater. This page is Seina's remembrance of Papi, her father figure during her years in Cuba.

"I think that's what music is all about. It's something that naturally lives within daily life. Not about being good or bad at it. It's about having feelings inside—wanting to share them, wanting to sing, wanting to enjoy." — Seina

Danny Rojo told me to take the "Cupie Danny" to "Papi," who lives in Cuba, and hand it to him. He also told me that Papi and his sister live together, and that they live in difficult circumstances.

Gradually, it began to make sense to me: Papi and Danny's mother had divorced when Danny was a child, and this sister was a half-sister born after Danny left Cuba. Danny left Cuba in the 1990s and has never returned. It seemed he hadn't spoken to Papi in years, either.

Since Cupie Danny was so cute, ridiculous, and funny, I figured that's why Danny said to give one to Papi too.

Papi would often strum a beat-up guitar, look right into my eyes, say "Listen," and sing. He was an annoying old geezer. His singing was Rojo's living words.

Papi always made meals for me. Even if he didn't eat, even if he hardly ate himself. Maybe it was for economic reasons. So I would say "Thank you" and eat. Sometimes tears welled up. But I ate. Because I knew that was Papi's feeling, his love.

There is a wall between Cubans and foreigners. Different values, different histories, economic disparities and positions. Even when I felt isolated in Cuba, Papi believed in me fiercely. He protected me.

He was a skinny, child-like, pure old man.

A long time ago, when I traveled to India, I fell ill in Dharamshala and stayed in that town and guesthouse for a while. Dharamshala was a town for people who had fled from Tibet, and the Dalai Lama lived there.

Located in northern India, I could see the Himalayan mountains right from my window. The air was clear, and it was there that I saw the Milky Way for the very first time.

In the morning, when I went to the restroom, I heard singing from somewhere below. It sounded like a young woman's voice, incredibly clear. It blended with the women's chatter and the air, sinking straight into my ears and my cells. The restroom had a high window, through which nothing could be seen except the Himalayan mountain range.

Whether it was part of her daily chores, or whether she was soothing a child, I didn't know.

That was the singing that dissolved into daily life—the most beautiful song I had ever felt in my life.

Papi's singing is rough around the edges, sometimes pushy, and annoying. But that's Papi. And perhaps, Papi's singing is essentially the same as the song that drifted in from that restroom in Dharamshala.

At the end of the page, two more sections continue Papi's story: AL ROJO, a photo gallery of 48 pictures from his life in Cuba, and VIVO, a page for videos of him (coming soon).`,
      es: `Papi (Antonio Rojo) era el padre de Danny Rojo, una persona real en Cuba — no confundir con "Cupie Danny", el pequeño personaje de dibujo animado de este sitio, ni con "Shoko-chan", la hermanita del Cupie Danny Theater. Esta página es el recuerdo que Seina escribió de Papi, su figura paterna durante sus años en Cuba.

"Creo que de eso se trata la música. Es algo que vive naturalmente dentro de la vida cotidiana. No se trata de cantar bien o mal. Se trata de tener sentimientos por dentro—querer compartirlos, querer cantar, querer gozar." — Seina

Danny Rojo me dijo que le llevara el "Cupie Danny" a "Papi", que vive en Cuba, y que se lo entregara. También me contó que Papi y su hermana viven juntos, y que se encuentran en una situación difícil.

Poco a poco, todo empezó a cobrar sentido: Papi y la madre de Danny se habían divorciado cuando Danny era niño, y esta hermana era una hermanastra nacida después de que Danny se fuera de Cuba. Danny se fue de Cuba en la década de 1990 y nunca ha vuelto. Parecía que tampoco había hablado con Papi en años.

Como el "Cupie Danny" era tan tierno, ridículo y divertido, supuse que por eso Danny había dicho que le diera uno a Papi también.

Papi a menudo tocaba una guitarra destartalada, me miraba fijamente a los ojos, decía "Escucha" y cantaba. Era un viejo pesado. Cantar era el lenguaje vivo de Rojo.

Papi siempre me preparaba la comida. Aunque él no comiera, aunque casi no comiera nada. Tal vez por razones económicas. Así que yo decía "Gracias" y comía. A veces se me salían las lágrimas. Pero comía. Porque sabía que eso era el sentimiento de Papi, su amor.

Hay un muro entre los cubanos y los extranjeros. Diferentes valores, diferentes historias, disparidades económicas y posiciones. Incluso cuando me sentí aislada en Cuba, Papi creyó firmemente en mí. Me protegió.

Era un viejito flaco, parecido a un niño, puro.

Hace mucho tiempo, cuando viajé a la India, me puse enferma en Dharamshala y me quedé en ese pueblo y en esa casa de huéspedes por un tiempo. Dharamshala era un pueblo para personas que habían huido del Tíbet, y el Dalái Lama vivía allí.

Situada en el norte de la India, podía ver las montañas del Himalaya justo desde mi ventana. El aire era puro, y fue allí donde vi la Vía Láctea por primera vez en mi vida.

Por la mañana, cuando fui al baño, escuché un canto que venía de alguna parte de abajo. Sonaba como la voz de una mujer joven, increíblemente clara. Se mezclaba con las charlas de las mujeres y el aire, penetrando directamente en mis oídos y en mis células. El baño tenía una ventana alta, a través de la cual no se veía nada excepto la cordillera del Himalaya.

Si era parte de sus tareas diarias, o si estaba consolando a un niño, no lo sabía.

Ese fue el canto fundido en la vida cotidiana: la canción más hermosa que jamás había sentido en mi vida.

El canto de Papi es áspero, a veces insistente y molesto. Pero así es Papi. Y tal vez, el canto de Papi sea esencialmente el mismo que el canto que flotaba desde aquel baño en Dharamshala.

Al final de la página, dos secciones más continúan la historia de Papi: AL ROJO, una galería de 48 fotos de su vida en Cuba, y VIVO, una página de videos de él (próximamente).`,
    },
  },
  'al-rojo-vivo-gallery': {
    url: { en: 'cuba/al-rojo-vivo/gallery/', es: 'cuba/al-rojo-vivo/gallery/' },
    title: { en: 'AL ROJO — Papi Photo Gallery', es: 'AL ROJO — Galería de fotos de Papi' },
    body: {
      en: `A gallery of 48 photos of Papi (Antonio Rojo)'s life in Cuba, part of the RIP Papi - Cuban Spirit page. Papi was the father of Danny Rojo, a real person — not "Cupie Danny," the cartoon doll character on this site (though the doll does appear in some photos, given as a gift). Highlights include: Papi as a young cadet at the Escuela de Cadetes "General Antonio Maceo"; his 1979 certificate for internationalist military service in Ethiopia, signed by Fidel Castro — the origin of the name "Rojo" behind the wall graffiti "AL ROJO VIVO"; his wedding day; his mother; family visits with his daughter Daniela and grandchildren Tania and Erik; everyday cooking; a Santería priest and museum in Guanabacoa; his refrigerator covered in photos with a welcome sign for Shoko, Cupie, and Danny; his ration book with photos of Danny; wearing the white shirt Cupie Danny sent him; being seen off at José Martí International Airport; and appearing on a radio show in Havana.`,
      es: `Una galería de 48 fotos de la vida de Papi (Antonio Rojo) en Cuba, parte de la página RIP Papi - Cuban Spirit. Papi era el padre de Danny Rojo, una persona real — no "Cupie Danny", el personaje de muñeco de dibujo animado de este sitio (aunque el muñeco sí aparece en algunas fotos, como regalo). Destacan: Papi de joven cadete en la Escuela de Cadetes "General Antonio Maceo"; su certificado de 1979 por su misión militar internacionalista en Etiopía, firmado por Fidel Castro — el origen del nombre "Rojo" detrás del grafiti "AL ROJO VIVO"; el día de su boda; su madre; visitas familiares con su hija Daniela y sus nietos Tania y Erik; la cocina cotidiana; un sacerdote y un museo de la Santería en Guanabacoa; su refrigerador cubierto de fotos con un cartel de bienvenida para Shoko, Cupie y Danny; su libreta de racionamiento con fotos de Danny; la camisa blanca que le regaló Cupie Danny; su despedida en el Aeropuerto Internacional José Martí; y su aparición en un programa de radio en La Habana.`,
    },
  },
  'al-rojo-vivo-videos': {
    url: { en: 'cuba/al-rojo-vivo/videos/', es: 'cuba/al-rojo-vivo/videos/' },
    title: { en: 'VIVO — Papi in Motion', es: 'VIVO — Papi en movimiento' },
    body: {
      en: `A page for videos of Papi (Antonio Rojo), part of the RIP Papi - Cuban Spirit page. Coming soon — no videos posted yet.`,
      es: `Una página de videos de Papi (Antonio Rojo), parte de la página RIP Papi - Cuban Spirit. Próximamente — todavía no hay videos publicados.`,
    },
  },
};
async function collectCubaAstroPages() {
  const records = [];
  for (const [key, page] of Object.entries(CUBA_ASTRO_PAGES)) {
    for (const lang of ['en', 'es']) {
      const body = page.body[lang];
      if (!body) continue;
      const url = `https://japoneson.com/${lang}/${page.url[lang]}`;
      const title = page.title[lang];
      const chunks = chunkText(body, CHUNK_SIZE);
      chunks.forEach((chunk, i) => {
        const id = createHash('sha1').update(`astro-page:${lang}:${key}:${i}`).digest('hex').slice(0, 32);
        records.push({
          id,
          embedText: `${title}\n\n${chunk}`,
          metadata: { lang, title, url, excerpt: chunk.slice(0, 300), type: 'article' },
        });
      });
    }
  }
  console.log(`cuba astro pages: ${records.length} chunks`);
  return records;
}

// 6b. サイト全サブページ（Swing/Mystery/Murakami/Cupieの下の全記事）。type:'article'、lang別、URL付き
// SITE_PAGES（入り口の6ページ）は別扱いなので除外。utility系（contact/home/privacy/terms）も除外
const SUBPAGE_EXCLUDE = new Set([
  'about', 'contact', 'cuba', 'cupie', 'home', 'murakami', 'mystery',
  'privacy-policy', 'swing', 'terms-and-conditions',
]);
// [...slug].astro と同じロジック（src/lib/pageTree.ts の buildPath）：
// ファイルのフォルダ構造ではなく wp_id/wp_parent チェーンでURLを組み立てる。
// フォルダ構造とwp_parentチェーンがズレてるページがある（例：swing/brooklyn-bop.mdは
// フォルダ上はswing直下だが、wp_parentがleonard-gaskinを指すのでURLはswing/leonard-gaskin/brooklyn-bop/になる）。
function buildWpPath(entry, byWpId) {
  const segments = [];
  let current = entry;
  const guard = new Set();
  while (current) {
    segments.unshift(current.data.slug ?? '');
    const pid = String(current.data.wp_parent ?? '0');
    if (pid === '0' || guard.has(pid)) break;
    guard.add(pid);
    current = byWpId.get(pid);
  }
  return segments.join('/');
}

async function collectSubpages() {
  const records = [];
  for (const lang of ['en', 'es']) {
    const dir = fileURLToPath(new URL(`../src/content/${lang}`, import.meta.url));
    const files = await walk(dir);
    const entries = [];
    for (const file of files) {
      const rel = file.slice(dir.length + 1).replace(/\.md$/, '');
      if (rel.startsWith('essay/')) continue; // essayは別関数で処理
      const raw = await readFile(file, 'utf-8');
      const { data, body } = parseFrontmatter(raw);
      entries.push({ rel, data, body });
    }
    const byWpId = new Map();
    for (const e of entries) {
      const id = String(e.data.wp_id ?? '');
      if (id) byWpId.set(id, e);
    }
    for (const entry of entries) {
      const { rel, data, body } = entry;
      const topSlug = rel.split('/')[0];
      if (SUBPAGE_EXCLUDE.has(topSlug) && !rel.includes('/')) continue; // 入り口ページ自体は除外
      if (!rel.includes('/')) continue; // サブページ判定：スラッシュを含むもののみ対象
      const wpPath = buildWpPath(entry, byWpId);
      const path = wpPath || rel;
      const title = (data.title ?? rel.split('/').pop()).replace(/^"(.*)"$/, '$1');
      const url = `https://japoneson.com/${lang}/${path}/`;
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
      // generateEssayId（content.config.ts）と同じ：日付フォルダを落としファイル名だけをslugにする
      const filename = rel.split('/').pop();
      const url = `https://japoneson.com/${lang}/essay/${filename}/`;
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
    // 2026-08-23、船長判断で一時停止：coreタイプ計1484件がblog由来で、他のcore
    // （Seinaのストーリー・クルー体制等、数件しかない）がtopK:4の抽選でほぼ埋もれる状態になっていた。
    // 既存のVectorize内のblogベクトルは未削除（別タイミングで判断）。再開する時はここを戻す。
    // ...(await collectBlogArticles()),
    ...(await collectOwnCore()),
    ...(await collectCrewContext()),
    ...(await collectCupieDanny()),
    ...(await collectSitePages()),
    ...(await collectCubaAstroPages()),
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
