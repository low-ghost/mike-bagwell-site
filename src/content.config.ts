import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const publications = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/publications' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      publisher: z.string(),
      image: image(),
      url: z.string(),
      pubDate: z.coerce.date(),
      featured: z.boolean().default(false),
      excerpt: z.string().optional(),
      archivedBody: z.string().optional(),
    }),
});

const design = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/design' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      description: z.string(),
      body: z.string().optional(),
      coverImage: image().nullable(),
      images: z.array(
        z.object({
          path: image(),
          title: z.string(),
        })
      ),
      externalUrl: z.string().nullable(),
      publishDate: z.coerce.date().nullable(),
      order: z.number(),
    }),
});

export const collections = { publications, design };
