import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const httpUrl = z.string().refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), {
  message: 'Must be empty or an absolute http(s) URL',
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/publications' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      publisher: z.string().min(1),
      image: image(),
      /** Empty string = archived / no live link */
      url: httpUrl,
      pubDate: z.coerce.date(),
      featured: z.boolean().default(false),
      excerpt: z.string().min(1).optional(),
      archivedBody: z.string().min(1).optional(),
    }),
});

/**
 * Books are Markdown entries: YAML frontmatter (typed) + body (blurb).
 * Purchase CTA stays structured via url + linkLabel — not freeform body text.
 */
const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        /** Shorter label for the home shelf; falls back to title */
        shortTitle: z.string().min(1).optional(),
        press: z.string().min(1),
        image: image(),
        /** External purchase / info URL. Empty → shelf links to /books */
        url: httpUrl.default(''),
        /** Required when url is set (enforced below) */
        linkLabel: z.string().min(1).optional(),
        /** Release date — newest first on / and /books */
        pubDate: z.coerce.date(),
        /** Hide from the home page shelf (still on /books) */
        hideFromMain: z.boolean().default(false),
      })
      .superRefine((data, ctx) => {
        if (data.url && !data.linkLabel) {
          ctx.addIssue({
            code: 'custom',
            message: 'linkLabel is required when url is set',
            path: ['linkLabel'],
          });
        }
        if (!data.url && data.linkLabel) {
          ctx.addIssue({
            code: 'custom',
            message: 'url is required when linkLabel is set',
            path: ['url'],
          });
        }
      }),
});

/**
 * Design projects: Markdown body + gallery in frontmatter.
 * Route slug = filename (`entry.id`).
 */
const design = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/design' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      /** Short listing blurb; falls back to title when omitted */
      description: z.string().min(1).optional(),
      coverImage: image().optional(),
      images: z
        .array(
          z.object({
            path: image(),
            title: z.string().min(1),
          })
        )
        .default([]),
      externalUrl: httpUrl.nullable().optional(),
      publishDate: z.coerce.date().nullable().optional(),
      order: z.number().int().nonnegative(),
    }),
});

/** Site copy authored as Markdown (Astro renders via content collections). */
const site = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/site' }),
  schema: z.object({
    title: z.string().default(''),
  }),
});

export const collections = { publications, books, design, site };
