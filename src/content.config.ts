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

const books = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/books' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Shorter label for the home shelf; falls back to title */
      shortTitle: z.string().optional(),
      press: z.string(),
      /** Markdown: paragraphs, _italics_, [links](url) */
      description: z.string(),
      image: image(),
      /** External purchase / info URL. Empty → shelf links to /books */
      url: z.string().default(''),
      linkLabel: z.string().optional(),
      /** Release date — newest first on / and /books */
      pubDate: z.coerce.date(),
      /** Hide from the home page shelf (still on /books) */
      hideFromMain: z.boolean().default(false),
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

export const collections = { publications, books, design };
