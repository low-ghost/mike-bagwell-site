const SITE = 'https://mikebagwell.me';
const PERSON_ID = `${SITE}/#person`;
const WEBSITE_ID = `${SITE}/#website`;

export function personSchema() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: 'Mike Bagwell',
    alternateName: ['low_gh0st'],
    url: SITE,
    image: `${SITE}/author.jpg`,
    jobTitle: ['Poet', 'Writer', 'Software Engineer', 'Translator'],
    description:
      'Poet, fiction writer, visual artist, translator, and software engineer based in Philadelphia.',
    disambiguatingDescription:
      'American poet and writer in Philadelphia; author of Poem of Thanks chapbooks; runs Ghost Harmonics.',
    hasOccupation: [
      {
        '@type': 'Occupation',
        name: 'Poet',
        occupationLocation: {
          '@type': 'City',
          name: 'Philadelphia',
        },
      },
      {
        '@type': 'Occupation',
        name: 'Author',
      },
    ],
    sameAs: [
      'https://www.instagram.com/low_gh0st/',
      'https://twitter.com/low_gh0st',
      'https://lowgh0st.bandcamp.com',
      'https://ghostharmonics.com',
    ],
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: 'Sarah Lawrence College',
    },
    homeLocation: {
      '@type': 'Place',
      name: 'Philadelphia, PA',
    },
    knowsAbout: [
      'Poetry',
      'Creative writing',
      'Literary translation',
      'Publication design',
      'Software engineering',
    ],
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE}/`,
    name: 'Mike Bagwell',
    alternateName: ['Mike Bagwell Poet', 'mikebagwell.me'],
    description:
      'Official site for poet, writer, and software engineer Mike Bagwell — publications, books, design, and music.',
    inLanguage: 'en-US',
    publisher: { '@id': PERSON_ID },
    author: { '@id': PERSON_ID },
  };
}

export function profilePageSchema(url: string) {
  return {
    '@type': 'ProfilePage',
    '@id': `${url}#profile`,
    url,
    name: 'Mike Bagwell | Poet, Writer & Software Engineer',
    description:
      'Official profile for poet and writer Mike Bagwell — Philadelphia-based author of Poem of Thanks and related work.',
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': PERSON_ID },
    mainEntity: { '@id': PERSON_ID },
  };
}

export function collectionPageSchema(opts: {
  url: string;
  name: string;
  description: string;
}) {
  return {
    '@type': 'CollectionPage',
    '@id': `${opts.url}#webpage`,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': PERSON_ID },
    author: { '@id': PERSON_ID },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function bookListSchema(
  books: {
    title: string;
    press: string;
    url?: string;
    pubDate: Date;
    image?: string;
  }[]
) {
  return {
    '@type': 'ItemList',
    itemListElement: books.map((book, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Book',
        name: book.title,
        author: { '@id': PERSON_ID },
        publisher: {
          '@type': 'Organization',
          name: book.press,
        },
        datePublished: book.pubDate.toISOString().slice(0, 10),
        ...(book.url ? { url: book.url } : {}),
        ...(book.image ? { image: book.image } : {}),
      },
    })),
  };
}

export function creativeWorkSchema(opts: {
  url: string;
  name: string;
  description: string;
  image?: string;
  datePublished?: Date | null;
}) {
  return {
    '@type': 'CreativeWork',
    '@id': `${opts.url}#work`,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    author: { '@id': PERSON_ID },
    creator: { '@id': PERSON_ID },
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.datePublished
      ? { datePublished: opts.datePublished.toISOString().slice(0, 10) }
      : {}),
  };
}

export function jsonLdGraph(nodes: Record<string, unknown>[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}
