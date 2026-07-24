import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

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
      const url = pub.data.url && pub.data.url.trim() !== '' 
        ? (pub.data.url.startsWith('http') ? pub.data.url : `https://${pub.data.url}`)
        : `${siteUrl}writing#${pub.id}`;
      
      return {
        title: pub.data.title,
        pubDate: pub.data.pubDate,
        description: `Published in ${pub.data.publisher}`,
        link: url,
      };
    }),
    customData: `<language>en-us</language>`,
  });
}
