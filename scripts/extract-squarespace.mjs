#!/usr/bin/env node

/**
 * Extract publications from Squarespace JSON API
 * Usage: node scripts/extract-squarespace.mjs [--force]
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://www.mikebagwell.me';
const COLLECTION_PATH = '/writing';
const FORCE_DOWNLOAD = process.argv.includes('--force');

// Helper to fetch with error handling
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Helper to download binary data
async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buffer);
}

// Get file extension from URL
function getExtension(url) {
  const match = url.match(/\.([a-z0-9]+)(?:\?|$)/i);
  return match ? match[1] : 'jpg';
}

// Fetch all publications with pagination
async function fetchAllPublications() {
  const items = [];
  let offset = 0;
  let hasMore = true;

  console.log('Fetching publications from Squarespace...');

  while (hasMore) {
    const url = offset === 0 
      ? `${BASE_URL}${COLLECTION_PATH}?format=json`
      : `${BASE_URL}${COLLECTION_PATH}?format=json&offset=${offset}`;
    
    console.log(`  Fetching: ${url}`);
    const data = await fetchJSON(url);
    
    if (data.items && data.items.length > 0) {
      items.push(...data.items);
      console.log(`  Found ${data.items.length} items (total: ${items.length})`);
    }
    
    hasMore = data.pagination && data.pagination.nextPage === true;
    if (hasMore) {
      offset = data.pagination.nextPageOffset;
    }
  }

  console.log(`\nTotal publications found: ${items.length}\n`);
  return items;
}

// Enumerate other top-level pages
async function enumeratePages() {
  console.log('\nEnumerating site pages...');
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/about', name: 'About' },
    { path: '/bio', name: 'Bio' },
    { path: '/book', name: 'Book' },
    { path: '/design', name: 'Design' },
    { path: '/publication-work', name: 'Publication Work' },
  ];

  const rawDir = join(__dirname, '_raw');
  await mkdir(rawDir, { recursive: true });

  for (const page of pages) {
    try {
      const url = `${BASE_URL}${page.path}?format=json`;
      console.log(`  Checking ${page.name} (${url})...`);
      const data = await fetchJSON(url);
      
      // Save raw page data
      await writeFile(
        join(rawDir, `${page.name.toLowerCase().replace(/\s+/g, '-')}.json`),
        JSON.stringify(data, null, 2)
      );
      
      console.log(`    ✓ Found and saved ${page.name}`);
    } catch (error) {
      console.log(`    ✗ Not found or error: ${page.name}`);
    }
  }
}

// Process and save a single publication
async function processPublication(item, stats) {
  const urlId = item.urlId;
  
  if (!urlId) {
    console.warn(`  ⚠ Skipping item without urlId: ${item.title}`);
    stats.skipped++;
    return;
  }

  try {
    // Determine publisher - try multiple fields
    let publisher = item.categories?.[0] || item.tags?.[0] || 'Unknown';
    
    // Download image
    const assetUrl = item.assetUrl;
    let imagePath = null;
    
    if (assetUrl) {
      const ext = getExtension(assetUrl);
      const imageFileName = `${urlId}.${ext}`;
      const imageOutputPath = join(__dirname, '..', 'src', 'assets', 'publications', imageFileName);
      imagePath = `../../assets/publications/${imageFileName}`;
      
      if (!existsSync(imageOutputPath) || FORCE_DOWNLOAD) {
        // Request original quality
        const originalUrl = assetUrl.includes('?') 
          ? `${assetUrl}&format=original` 
          : `${assetUrl}?format=original`;
        
        await downloadFile(originalUrl, imageOutputPath);
        console.log(`  ✓ Downloaded image: ${imageFileName}`);
        stats.downloaded++;
      } else {
        console.log(`  → Image exists: ${imageFileName}`);
        stats.skipped_images++;
      }
    }

    // Create publication JSON
    const publication = {
      title: item.title || 'Untitled',
      publisher: publisher,
      url: item.sourceUrl || '',
      pubDate: item.publishOn ? new Date(item.publishOn).toISOString() : new Date().toISOString(),
      featured: item.starred || false,
      image: imagePath,
      archivedBody: item.body || undefined,
    };

    // Write publication JSON
    const jsonOutputPath = join(__dirname, '..', 'src', 'content', 'publications', `${urlId}.json`);
    await mkdir(dirname(jsonOutputPath), { recursive: true });
    await writeFile(jsonOutputPath, JSON.stringify(publication, null, 2));
    
    console.log(`✓ ${urlId}: "${item.title}"`);
    stats.saved++;
    
  } catch (error) {
    console.error(`✗ Error processing ${urlId}:`, error.message);
    stats.errors++;
  }
}

// Main execution
async function main() {
  const stats = {
    saved: 0,
    downloaded: 0,
    skipped_images: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Fetch all publications
    const items = await fetchAllPublications();
    
    // Process each publication
    console.log('Processing publications...\n');
    for (const item of items) {
      await processPublication(item, stats);
    }

    // Enumerate other pages
    await enumeratePages();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('EXTRACTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Publications saved:     ${stats.saved}`);
    console.log(`Images downloaded:      ${stats.downloaded}`);
    console.log(`Images skipped:         ${stats.skipped_images}`);
    console.log(`Items skipped:          ${stats.skipped}`);
    console.log(`Errors:                 ${stats.errors}`);
    console.log('='.repeat(60));
    
    if (stats.errors > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n✗ Fatal error:', error);
    process.exit(1);
  }
}

main();
