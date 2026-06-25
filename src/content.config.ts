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
  }),
});

export const collections = { en };
