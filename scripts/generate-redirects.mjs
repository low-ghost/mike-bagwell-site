#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONTENT_DIR = join(__dirname, '../src/content/publications');
const OUTPUT_FILE = join(__dirname, '../public/_redirects');

async function generateRedirects() {
  const files = await readdir(CONTENT_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  const redirects = [];

  for (const file of jsonFiles) {
    const slug = file.replace('.json', '');
    const content = await readFile(join(CONTENT_DIR, file), 'utf-8');
    const data = JSON.parse(content);

    if (data.url && data.url.trim() !== '') {
      const normalizedUrl = data.url.startsWith('http') 
        ? data.url 
        : `https://${data.url}`;
      
      redirects.push(`/writing/${slug} ${normalizedUrl} 301`);
    } else {
      redirects.push(`/writing/${slug} /writing 301`);
    }
  }

  redirects.sort();

  const redirectsContent = [
    '# Redirects for old Squarespace URLs',
    '# Format: /old-path /new-path status-code',
    '',
    ...redirects,
    '',
    '# Catch-all fallback',
    '/writing/* /writing 301',
  ].join('\n');

  await writeFile(OUTPUT_FILE, redirectsContent);
  console.log(`Generated ${redirects.length} redirects to ${OUTPUT_FILE}`);
}

generateRedirects().catch(console.error);
