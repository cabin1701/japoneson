import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { deriveExcerpt } from './excerpt';

// エッセイの RSS は言語ごとに別のファイル（en: /en/rss.xml、es: /es/rss.xml）。新しい順に全部（en 14、es 14）。
export const FEEDS = {
  en: {
    title: 'JAPONÉSON Essays',
    description: 'Oral histories, cultural archives, and personal essays by Seina.',
    href: '/en/rss.xml',
    linkPrefix: '/en/essay/',
  },
  es: {
    title: 'JAPONÉSON Ensayos',
    description: 'Historias orales, archivos culturales y ensayos personales de Seina.',
    href: '/es/rss.xml',
    linkPrefix: '/es/essay/',
  },
} as const;

export type FeedLang = keyof typeof FEEDS;

export async function buildFeed(lang: FeedLang, site: URL | undefined) {
  const f = FEEDS[lang];
  const posts = (await getCollection('essay', ({ data }) => data.lang === lang && !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: f.title,
    description: f.description,
    site: site ?? 'https://japoneson.com',
    customData: `<language>${lang}</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt ?? deriveExcerpt(post.body) ?? '',
      link: `${f.linkPrefix}${post.id.replace(/^(en|es)\//, '')}/`,
      categories: post.data.category,
    })),
  });
}
