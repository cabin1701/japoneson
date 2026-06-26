import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
  }),
});

export const collections = { en };
