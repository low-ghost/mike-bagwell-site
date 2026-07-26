import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { legacyRssGuidFromArchivedBody } from '../lib/legacy-rss-guid';
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
      const legacyGuid = legacyRssGuidFromArchivedBody(pub.data.archivedBody);

      return {
        title: pub.data.title,
        pubDate: pub.data.pubDate,
        description: `Published in ${pub.data.publisher}`,
        link: url,
        // Preserve legacy guids so existing subscribers don't see a flood of "new" items.
        ...(legacyGuid ? { customData: `<guid isPermaLink="false">${legacyGuid}</guid>` } : {}),
      };
    }),
    customData: `<language>en-us</language>`,
  });
}
