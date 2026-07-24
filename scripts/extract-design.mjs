#!/usr/bin/env node

/**
 * Extract design projects from Squarespace JSON API
 * Usage: node scripts/extract-design.mjs [--force]
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://www.mikebagwell.me';
const COLLECTION_PATH = '/design';
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

// Extract images from item blocks (gallery, body, etc.)
function extractImagesFromItem(item) {
  const images = [];
  
  // Main cover image
  if (item.assetUrl) {
    images.push({
      url: item.assetUrl,
      isCover: true,
      title: item.title || 'Cover',
    });
  }

  // Check for page sections that might contain gallery blocks
  if (item.recordType === 59 && item.id) {
    // Portfolio items have nested page sections - we'll need to fetch the detail page
    // This will be handled in processProject
  }

  return images;
}

// Fetch design collection list
async function fetchDesignProjects() {
  console.log('Fetching design projects from Squarespace...');
  
  const url = `${BASE_URL}${COLLECTION_PATH}?format=json`;
  console.log(`  Fetching: ${url}`);
  
  const data = await fetchJSON(url);
  
  // Save raw collection data
  const rawDir = join(__dirname, '_raw', 'design');
  await mkdir(rawDir, { recursive: true });
  await writeFile(
    join(rawDir, 'collection.json'),
    JSON.stringify(data, null, 2)
  );
  
  const items = data.items || [];
  console.log(`  Found ${items.length} design projects\n`);
  
  return items;
}

// Fetch detail page for a project to get all gallery images
async function fetchProjectDetail(urlId) {
  const url = `${BASE_URL}${COLLECTION_PATH}/${urlId}?format=json`;
  console.log(`  Fetching JSON metadata: ${url}`);
  
  const data = await fetchJSON(url);
  
  // Save raw detail data
  const rawDir = join(__dirname, '_raw', 'design');
  await writeFile(
    join(rawDir, `${urlId}.json`),
    JSON.stringify(data, null, 2)
  );
  
  return data;
}

// Scrape gallery images and description from HTML page
async function scrapeProjectContent(urlId) {
  const url = `${BASE_URL}${COLLECTION_PATH}/${urlId}`;
  console.log(`  Scraping content from HTML: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch HTML: ${response.status}`);
  }
  
  const html = await response.text();
  
  // Extract all Squarespace CDN image URLs from the HTML
  const imageRegex = /https:\/\/images\.squarespace-cdn\.com\/content\/[^"'\s)]+\.(jpg|jpeg|png|gif|webp)/gi;
  const matches = [...html.matchAll(imageRegex)];
  
  // Deduplicate images
  const uniqueUrls = [...new Set(matches.map(m => m[0]))];
  
  // Extract description text from the page
  // Look for the main content section (usually in a .sqs-block-content or similar)
  let description = '';
  let body = '';
  
  // Try to extract text from common Squarespace content blocks
  const textBlockRegex = /<div[^>]*class="[^"]*sqs-block-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  const textMatches = [...html.matchAll(textBlockRegex)];
  
  if (textMatches.length > 0) {
    // Get the first text block as description
    const firstBlock = textMatches[0][1];
    // Strip HTML tags and clean up
    description = firstBlock
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // If there are multiple text blocks, concatenate them as body
    if (textMatches.length > 1) {
      body = textMatches
        .map(m => m[1])
        .join('\n\n');
    }
  }
  
  console.log(`  Found ${uniqueUrls.length} unique images, ${description.length} chars description`);
  
  return {
    images: uniqueUrls.map((url, idx) => ({
      url: url,
      title: idx === 0 ? 'Cover' : `Image ${idx}`,
      isCover: idx === 0,
    })),
    description,
    body,
  };
}

// Extract all content from a project (JSON + HTML scraping)
async function extractProjectContent(detailData, urlId) {
  const images = [];
  
  // Main item from JSON
  const item = detailData.item || {};
  
  // First, add the main cover image from JSON
  if (item.assetUrl) {
    images.push({
      url: item.assetUrl,
      title: 'Cover',
      isCover: true,
    });
  }
  
  // Then scrape additional gallery images and text from HTML
  const scrapedContent = await scrapeProjectContent(urlId);
  
  // Add non-duplicate gallery images
  const existingUrls = new Set(images.map(img => img.url.split('?')[0]));
  
  scrapedContent.images.forEach(img => {
    const baseUrl = img.url.split('?')[0];
    if (!existingUrls.has(baseUrl)) {
      images.push(img);
      existingUrls.add(baseUrl);
    }
  });
  
  return {
    images,
    description: scrapedContent.description,
    body: scrapedContent.body,
  };
}

// Process and save a single design project
async function processProject(listItem, stats) {
  const urlId = listItem.urlId;
  
  if (!urlId) {
    console.warn(`  ⚠ Skipping project without urlId: ${listItem.title}`);
    stats.skipped++;
    return;
  }

  try {
    console.log(`\n📐 Processing: ${listItem.title} (${urlId})`);
    
    // Fetch detail page
    const detailData = await fetchProjectDetail(urlId);
    const item = detailData.item || listItem;
    
    // Extract all content (images + text, JSON + HTML scraping)
    const projectContent = await extractProjectContent(detailData, urlId);
    console.log(`  Found ${projectContent.images.length} images`);
    
    // Download images
    const downloadedImages = [];
    let imageIndex = 0;
    
    for (const imageInfo of projectContent.images) {
      const ext = getExtension(imageInfo.url);
      const imageFileName = imageInfo.isCover 
        ? `${urlId}.${ext}`
        : `${urlId}-${String(imageIndex).padStart(2, '0')}.${ext}`;
      
      const imageOutputPath = join(__dirname, '..', 'src', 'assets', 'design', urlId, imageFileName);
      const imagePath = `../../assets/design/${urlId}/${imageFileName}`;
      
      if (!existsSync(imageOutputPath) || FORCE_DOWNLOAD) {
        // Request original quality
        const originalUrl = imageInfo.url.includes('?') 
          ? `${imageInfo.url}&format=original` 
          : `${imageInfo.url}?format=original`;
        
        await downloadFile(originalUrl, imageOutputPath);
        console.log(`    ✓ Downloaded: ${imageFileName}`);
        stats.images_downloaded++;
      } else {
        console.log(`    → Exists: ${imageFileName}`);
      }
      
      downloadedImages.push({
        path: imagePath,
        title: imageInfo.title,
        isCover: imageInfo.isCover,
      });
      
      if (!imageInfo.isCover) {
        imageIndex++;
      }
    }
    
    // Find cover image
    const coverImage = downloadedImages.find(img => img.isCover) || downloadedImages[0];
    const galleryImages = downloadedImages.filter(img => !img.isCover);
    
    // Extract description/body (prefer scraped content over empty JSON)
    let description = projectContent.description || item.excerpt || '';
    const body = projectContent.body || item.body || '';
    
    // Extract external links if any
    let externalUrl = item.sourceUrl || null;
    
    // Create project JSON
    const project = {
      title: item.title || 'Untitled',
      slug: urlId,
      description: description,
      body: body,
      coverImage: coverImage?.path || null,
      images: galleryImages.map(img => ({
        path: img.path,
        title: img.title,
      })),
      externalUrl: externalUrl,
      publishDate: item.publishOn ? new Date(item.publishOn).toISOString() : null,
      order: listItem.displayIndex ?? 0,
    };

    // Write project JSON
    const jsonOutputPath = join(__dirname, '..', 'src', 'content', 'design', `${urlId}.json`);
    await mkdir(dirname(jsonOutputPath), { recursive: true });
    await writeFile(jsonOutputPath, JSON.stringify(project, null, 2));
    
    console.log(`  ✓ Saved project data`);
    stats.projects_saved++;
    stats.project_details.push({
      slug: urlId,
      title: item.title,
      imageCount: downloadedImages.length,
    });
    
  } catch (error) {
    console.error(`  ✗ Error processing ${urlId}:`, error.message);
    stats.errors++;
  }
}

// Main execution
async function main() {
  const stats = {
    projects_saved: 0,
    images_downloaded: 0,
    skipped: 0,
    errors: 0,
    project_details: [],
  };

  try {
    // Fetch all design projects
    const projects = await fetchDesignProjects();
    
    // Process each project
    console.log('Processing design projects...\n');
    for (const project of projects) {
      await processProject(project, stats);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('EXTRACTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Projects saved:         ${stats.projects_saved}`);
    console.log(`Images downloaded:      ${stats.images_downloaded}`);
    console.log(`Projects skipped:       ${stats.skipped}`);
    console.log(`Errors:                 ${stats.errors}`);
    console.log('\n' + 'PROJECT DETAILS:');
    console.log('='.repeat(60));
    
    stats.project_details.forEach(project => {
      console.log(`${project.slug.padEnd(50)} ${project.imageCount} images`);
    });
    
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
