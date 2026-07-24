#!/usr/bin/env node

import { writeFile, copyFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONTENT_DIR = join(__dirname, '../src/content/publications');
const ASSETS_DIR = join(__dirname, '../src/assets/publications');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function addPublication() {
  console.log('Add a new publication\n');

  const title = await prompt('Title: ');
  const publisher = await prompt('Publisher: ');
  const url = await prompt('URL (external link, optional): ');
  const pubDate = await prompt('Publication date (YYYY-MM-DD): ');
  const featuredInput = await prompt('Featured? (y/n): ');
  const imagePath = await prompt('Path to image file: ');
  const customSlug = await prompt('Custom slug (optional, leave blank to auto-generate): ');

  const featured = featuredInput.toLowerCase().startsWith('y');
  const slug = customSlug || slugify(title);
  const imageExt = extname(imagePath);
  const imageFilename = `${slug}${imageExt}`;

  await mkdir(CONTENT_DIR, { recursive: true });
  await mkdir(ASSETS_DIR, { recursive: true });

  const targetImagePath = join(ASSETS_DIR, imageFilename);
  await copyFile(imagePath, targetImagePath);
  console.log(`✓ Copied image to ${targetImagePath}`);

  const contentData = {
    title,
    publisher,
    url: url || '',
    pubDate: new Date(pubDate).toISOString(),
    featured,
    image: `../../assets/publications/${imageFilename}`,
  };

  const contentPath = join(CONTENT_DIR, `${slug}.json`);
  await writeFile(contentPath, JSON.stringify(contentData, null, 2));
  console.log(`✓ Created content file at ${contentPath}`);

  console.log('\nNext steps:');
  console.log('1. Review the generated files');
  console.log('2. git add src/content/publications src/assets/publications');
  console.log('3. git commit -m "Add publication: ' + title + '"');
  console.log('4. git push');
  console.log('\nThe site will automatically rebuild and deploy on Cloudflare Pages.');
}

addPublication().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
