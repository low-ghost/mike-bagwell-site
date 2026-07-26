import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { squarespaceGuidFromArchivedBody } from '../lib/squarespace-guid';
import { normalizeHttpUrl } from '../lib/urls';

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
      const external = normalizeHttpUrl(pub.data.url ?? '');
      const url = external || `${siteUrl}writing#${pub.id}`;
      const squarespaceGuid = squarespaceGuidFromArchivedBody(pub.data.archivedBody);

      return {
        title: pub.data.title,
        pubDate: pub.data.pubDate,
        description: `Published in ${pub.data.publisher}`,
        link: url,
        // Keep Squarespace guids so existing subscribers don't see a flood of "new" items.
        ...(squarespaceGuid
          ? { customData: `<guid isPermaLink="false">${squarespaceGuid}</guid>` }
          : {}),
      };
    }),
    customData: `<language>en-us</language>`,
  });
}
