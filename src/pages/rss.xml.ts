import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { squarespaceGuidFromArchivedBody } from '../lib/squarespace-guid';

export async function GET(context: APIContext) {
  const publications = await getCollection('publications');

  const sortedPublications = publications
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .slice(0, 50);

  const siteUrl = context.site ?? new URL('https://mikebagwell.me');

  return rss({
    title: 'Mike Bagwell',
    description: 'Poetry and creative work by Mike Bagwell',
    site: siteUrl,
    items: sortedPublications.map((pub) => {
      const url =
        pub.data.url && pub.data.url.trim() !== ''
          ? pub.data.url.startsWith('http')
            ? pub.data.url
            : `https://${pub.data.url}`
          : `${siteUrl}writing#${pub.id}`;

      const squarespaceGuid = squarespaceGuidFromArchivedBody(pub.data.archivedBody);

      return {
        title: pub.data.title,
        pubDate: pub.data.pubDate,
        description: `Published in ${pub.data.publisher}`,
        link: url,
        // Override Astro's default link-based guid so existing Squarespace subscribers
        // don't get a flood of "new" items after cutover.
        ...(squarespaceGuid
          ? { customData: `<guid isPermaLink="false">${squarespaceGuid}</guid>` }
          : {}),
      };
    }),
    customData: `<language>en-us</language>`,
  });
}
