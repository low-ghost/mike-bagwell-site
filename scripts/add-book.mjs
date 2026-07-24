#!/usr/bin/env node

/**
 * Add a book from the CLI.
 * Usage: npm run book
 *    or: node scripts/add-book.mjs [path/to/cover.jpg]
 *
 * Moves the cover into src/assets/books/ and writes src/content/books/<slug>.json.
 */

import { writeFile, mkdir, rename, copyFile, unlink } from 'fs/promises';
import { join, extname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'src/content/books');
const ASSETS_DIR = join(ROOT, 'src/assets/books');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function createRl() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question) {
  return new Promise((resolveAnswer) => {
    rl.question(question, (answer) => resolveAnswer(answer));
  });
}

/** Read markdown until a blank line (or EOF). */
async function askMultiline(rl, intro) {
  console.log(intro);
  const lines = [];
  while (true) {
    const line = await ask(rl, lines.length === 0 ? '> ' : '  ');
    if (line === '') break;
    lines.push(line);
  }
  return lines.join('\n\n').trim();
}

/** Accept YYYY, YYYY-MM, or YYYY-MM-DD → ISO date string (UTC midnight). */
function parseReleaseDate(raw) {
  const s = raw.trim();
  let iso;
  if (/^\d{4}$/.test(s)) {
    iso = `${s}-01-01`;
  } else if (/^\d{4}-\d{2}$/.test(s)) {
    iso = `${s}-01`;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    iso = s;
  } else {
    throw new Error('Release date must be YYYY, YYYY-MM, or YYYY-MM-DD');
  }
  const d = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${raw}`);
  return d.toISOString().slice(0, 10);
}

/** Move file; fall back to copy+unlink across devices. */
async function moveFile(from, to) {
  try {
    await rename(from, to);
  } catch (err) {
    if (err && (err.code === 'EXDEV' || err.code === 'EPERM')) {
      await copyFile(from, to);
      await unlink(from);
      return;
    }
    throw err;
  }
}

async function addBook() {
  const rl = createRl();
  console.log('Add a new book\n');

  try {
    const title = (await ask(rl, 'Title: ')).trim();
    if (!title) throw new Error('Title is required');

    const shortTitle = (await ask(rl, 'Short title for home shelf (optional): ')).trim();
    const press = (await ask(rl, 'Press / year (e.g. "Thirty West, 2026"): ')).trim();
    if (!press) throw new Error('Press is required');

    const pubDateRaw = (await ask(rl, 'Release date (YYYY or YYYY-MM-DD): ')).trim();
    if (!pubDateRaw) throw new Error('Release date is required');
    const pubDate = parseReleaseDate(pubDateRaw);

    const description = await askMultiline(
      rl,
      'Description (markdown: paragraphs, _italics_, [links](url).\nEnd with a blank line):'
    );
    if (!description) throw new Error('Description is required');

    const url = (await ask(rl, 'URL (purchase / info link, optional): ')).trim();
    const linkLabel = url
      ? (await ask(rl, 'Link label (e.g. "Available from Thirty West"): ')).trim()
      : '';

    const hideRaw = (await ask(rl, 'Hide from home shelf? (y/N): ')).trim().toLowerCase();
    const hideFromMain = hideRaw.startsWith('y');

    let imagePath = process.argv[2]?.trim() || '';
    if (!imagePath) {
      imagePath = (await ask(rl, 'Path to cover image: ')).trim();
    }
    if (!imagePath) throw new Error('Image path is required');

    const sourceImage = resolve(imagePath);
    if (!existsSync(sourceImage)) {
      throw new Error(`Image not found: ${sourceImage}`);
    }

    const customSlug = (await ask(rl, 'Custom slug (optional): ')).trim();
    const slug = customSlug || slugify(title);
    const imageExt = extname(sourceImage).toLowerCase() || '.jpg';
    const imageFilename = `${slug}${imageExt}`;

    await mkdir(CONTENT_DIR, { recursive: true });
    await mkdir(ASSETS_DIR, { recursive: true });

    const contentPath = join(CONTENT_DIR, `${slug}.json`);
    const targetImagePath = join(ASSETS_DIR, imageFilename);

    if (existsSync(contentPath)) {
      throw new Error(`Book already exists: ${contentPath}`);
    }
    if (existsSync(targetImagePath)) {
      throw new Error(`Cover already exists: ${targetImagePath}`);
    }

    await moveFile(sourceImage, targetImagePath);
    console.log(`✓ Moved cover → ${targetImagePath}`);

    const contentData = {
      title,
      ...(shortTitle ? { shortTitle } : {}),
      press,
      pubDate,
      description,
      url,
      ...(linkLabel ? { linkLabel } : {}),
      image: `../../assets/books/${imageFilename}`,
      hideFromMain,
    };

    await writeFile(contentPath, JSON.stringify(contentData, null, 2) + '\n');
    console.log(`✓ Wrote ${contentPath}`);

    console.log('\nDone. Review, then:');
    console.log(`  git add src/content/books src/assets/books`);
    console.log(`  git commit -m "Add book: ${title}"`);
  } finally {
    rl.close();
  }
}

addBook().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
