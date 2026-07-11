import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { slug as githubSlug } from 'github-slugger';

function generateEssayId({ entry }: { entry: string }) {
  const parts = entry.split('/');
  const top = parts[0];
  const filename = parts[parts.length - 1].replace(/\.md$/, '');
  return `${top}/${githubSlug(filename)}`;
}

const en = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/en' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    wp_id: z.union([z.string(), z.number()]).optional(),
    wp_parent: z.union([z.string(), z.number()]).optional(),
    date: z.union([z.string(), z.date()]).optional(),
    source_url: z.string().optional(),
    // Optional hero block — set hero_image to enable.
    hero_image: z.string().optional(),
    hero_kicker: z.string().optional(),
    hero_subtitle: z.string().optional(),
    hero_height: z.number().optional(),
    hero_fit: z.enum(['cover', 'contain']).optional(),
    hero_video: z.string().optional(), // YouTube video ID for background video
    hero_video_start: z.number().optional(), // start time in seconds
    hero_title_font: z.string().optional(), // CSS font-family override
    hero_title_weight: z.union([z.string(), z.number()]).optional(),
    hero_title_italic: z.boolean().optional(),
    hero_title_size: z.string().optional(), // CSS font-size, e.g. "72px" or "4rem"
    hero_title_color: z.string().optional(), // CSS color, e.g. "#a5c5dd"
    hero_slideshow: z.array(z.string()).optional(), // background slideshow images (cross-fade)
    hero_slideshow_duration: z.number().optional(), // ms per slide (default 5000)
  }),
});

const es = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/es' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    wp_id: z.union([z.string(), z.number()]).optional(),
    wp_parent: z.union([z.string(), z.number()]).optional(),
    date: z.union([z.string(), z.date()]).optional(),
    source_url: z.string().optional(),
    hero_image: z.string().optional(),
    hero_kicker: z.string().optional(),
    hero_subtitle: z.string().optional(),
    hero_height: z.number().optional(),
    hero_fit: z.enum(['cover', 'contain']).optional(),
    hero_video: z.string().optional(),
    hero_video_start: z.number().optional(),
    hero_title_font: z.string().optional(),
    hero_title_weight: z.union([z.string(), z.number()]).optional(),
    hero_title_italic: z.boolean().optional(),
    hero_title_size: z.string().optional(),
    hero_title_color: z.string().optional(),
    hero_slideshow: z.array(z.string()).optional(),
    hero_slideshow_duration: z.number().optional(),
  }),
});

const essay = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/essay', generateId: generateEssayId }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    lang: z.enum(['en', 'es']),
    excerpt: z.string().optional(),
    hero: z.string().optional(),
    category: z.array(z.string()).min(1).max(2).optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

export const collections = { en, es, essay };
