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
  }),
});

export const collections = { en };
