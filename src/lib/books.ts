import { getImage } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import { getCollection, render } from 'astro:content';
import { BOOK_WIKIDATA, bookSchema } from './seo-schema';

export type BookEntry = CollectionEntry<'books'>;

export function sortBooksByDate(books: BookEntry[]): BookEntry[] {
  return books.slice().sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** All books, newest first. */
export async function getSortedBooks(): Promise<BookEntry[]> {
  return sortBooksByDate(await getCollection('books'));
}

/** Home shelf — excludes hideFromMain. */
export async function getShelfBooks(): Promise<BookEntry[]> {
  return (await getSortedBooks()).filter((b) => !b.data.hideFromMain);
}

export async function getBooksWithContent(): Promise<
  { book: BookEntry; Content: Awaited<ReturnType<typeof render>>['Content'] }[]
> {
  const books = await getSortedBooks();
  return Promise.all(
    books.map(async (book) => {
      const { Content } = await render(book);
      return { book, Content };
    })
  );
}

export async function bookCoverUrl(
  book: BookEntry,
  site: URL | string | undefined,
  width = 800
): Promise<string> {
  const optimized = await getImage({
    src: book.data.image,
    width,
    format: 'jpg',
  });
  return new URL(optimized.src, site).href;
}

export async function bookJsonLd(book: BookEntry, site: URL | string | undefined) {
  const href = book.data.url.trim();
  return bookSchema({
    title: book.data.title,
    press: book.data.press,
    pubDate: book.data.pubDate,
    url: href || undefined,
    image: await bookCoverUrl(book, site),
    sameAs: BOOK_WIKIDATA[book.data.title],
  });
}

/** JSON-LD Book nodes for titles with Wikidata IDs (home schema graph). */
export async function notableBookJsonLd(books: BookEntry[], site: URL | string | undefined) {
  return Promise.all(
    books.filter((b) => BOOK_WIKIDATA[b.data.title]).map((b) => bookJsonLd(b, site))
  );
}

/** ItemList payload for /books schema. */
export async function bookListItems(books: BookEntry[], site: URL | string | undefined) {
  return Promise.all(
    books.map(async (book) => {
      const href = book.data.url.trim();
      return {
        title: book.data.title,
        press: book.data.press,
        pubDate: book.data.pubDate,
        url: href || undefined,
        image: await bookCoverUrl(book, site),
        sameAs: BOOK_WIKIDATA[book.data.title],
      };
    })
  );
}
