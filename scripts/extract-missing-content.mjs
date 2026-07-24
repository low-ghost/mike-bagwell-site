#!/usr/bin/env node

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = 'https://www.mikebagwell.me';

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(dest);
      });
    }).on('error', err => {
      file.close();
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

function getImageExtension(url) {
  const match = url.match(/\.([a-z]+)(\?|$)/i);
  if (match) return match[1].toLowerCase();
  return 'jpg';
}

function sanitizeFilename(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function extractPage(urlPath, outputName) {
  console.log(`\n📄 Extracting ${outputName}...`);
  
  const jsonUrl = `${baseUrl}${urlPath}?format=json`;
  const jsonData = await fetch(jsonUrl);
  const data = JSON.parse(jsonData);
  
  // Save raw JSON
  const rawPath = path.join(__dirname, '_raw', `${outputName}.json`);
  fs.writeFileSync(rawPath, JSON.stringify(data, null, 2));
  console.log(`   Saved raw JSON: ${rawPath}`);
  
  return data;
}

function findImages(obj, images = [], path = '') {
  if (!obj || typeof obj !== 'object') return images;
  
  if (obj.assetUrl) {
    images.push({
      url: obj.assetUrl,
      title: obj.title || obj.filename || '',
      originalSize: obj.originalSize || {},
      path: path
    });
  }
  
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      value.forEach((item, i) => findImages(item, images, `${path}.${key}[${i}]`));
    } else if (typeof value === 'object' && value !== null) {
      findImages(value, images, `${path}.${key}`);
    }
  }
  
  return images;
}

async function main() {
  console.log('🔍 Extracting missing content from mikebagwell.me\n');
  
  // Extract each page
  const homeData = await extractPage('/', 'home');
  const booksData = await extractPage('/books', 'books');
  const designData = await extractPage('/design', 'design');
  const musicData = await extractPage('/music', 'music');
  
  // Find all images in each page
  console.log('\n\n🖼️  Finding images...');
  
  const homeImages = findImages(homeData);
  const booksImages = findImages(booksData);
  const designImages = findImages(designData);
  const musicImages = findImages(musicData);
  
  console.log(`   Home: ${homeImages.length} images`);
  console.log(`   Books: ${booksImages.length} images`);
  console.log(`   Design: ${designImages.length} images`);
  console.log(`   Music: ${musicImages.length} images`);
  
  // Download author portrait (likely on homepage)
  console.log('\n\n👤 Downloading author portrait...');
  const authorImage = homeImages.find(img => 
    img.title?.toLowerCase().includes('portrait') || 
    img.title?.toLowerCase().includes('headshot') ||
    img.title?.toLowerCase().includes('mike') ||
    img.title?.toLowerCase().includes('author') ||
    img.path.includes('profilePhoto') ||
    img.path.includes('authorImage')
  );
  
  if (authorImage) {
    const ext = getImageExtension(authorImage.url);
    const dest = path.join(__dirname, '..', 'src', 'assets', 'author', `portrait.${ext}`);
    const fullUrl = authorImage.url.includes('?') 
      ? authorImage.url.replace(/\?.*/, '?format=original')
      : authorImage.url + '?format=original';
    
    try {
      await downloadFile(fullUrl, dest);
      console.log(`   ✓ Downloaded: ${dest}`);
    } catch (err) {
      console.error(`   ✗ Failed to download portrait: ${err.message}`);
    }
  } else {
    // If not found by metadata, try to find the largest image on homepage
    const largestHomeImage = homeImages
      .filter(img => img.originalSize?.width)
      .sort((a, b) => b.originalSize.width - a.originalSize.width)[0];
    
    if (largestHomeImage) {
      const ext = getImageExtension(largestHomeImage.url);
      const dest = path.join(__dirname, '..', 'src', 'assets', 'author', `portrait.${ext}`);
      const fullUrl = largestHomeImage.url.includes('?') 
        ? largestHomeImage.url.replace(/\?.*/, '?format=original')
        : largestHomeImage.url + '?format=original';
      
      try {
        await downloadFile(fullUrl, dest);
        console.log(`   ✓ Downloaded (largest image): ${dest}`);
      } catch (err) {
        console.error(`   ✗ Failed to download portrait: ${err.message}`);
      }
    } else {
      console.log('   ⚠️  No portrait image found');
    }
  }
  
  // Download book covers
  console.log('\n\n📚 Downloading book covers...');
  
  const bookTitles = [
    'a-collision-of-soul-in-midair',
    'poem-of-thanks-a-court-of-wands',
    'poem-of-thanks-the-high-priestess',
    'or-else-they-are-trees',
    'when-we-look-at-things'
  ];
  
  for (const img of booksImages) {
    const filename = sanitizeFilename(img.title || 'book-cover');
    const ext = getImageExtension(img.url);
    const dest = path.join(__dirname, '..', 'src', 'assets', 'books', `${filename}.${ext}`);
    const fullUrl = img.url.includes('?') 
      ? img.url.replace(/\?.*/, '?format=original')
      : img.url + '?format=original';
    
    try {
      await downloadFile(fullUrl, dest);
      console.log(`   ✓ Downloaded: ${filename}.${ext}`);
    } catch (err) {
      console.error(`   ✗ Failed to download ${filename}: ${err.message}`);
    }
  }
  
  // Download design images
  console.log('\n\n🎨 Downloading design images...');
  
  for (const img of designImages) {
    const filename = sanitizeFilename(img.title || `design-${designImages.indexOf(img)}`);
    const ext = getImageExtension(img.url);
    const dest = path.join(__dirname, '..', 'src', 'assets', 'design', `${filename}.${ext}`);
    const fullUrl = img.url.includes('?') 
      ? img.url.replace(/\?.*/, '?format=original')
      : img.url + '?format=original';
    
    try {
      await downloadFile(fullUrl, dest);
      console.log(`   ✓ Downloaded: ${filename}.${ext}`);
    } catch (err) {
      console.error(`   ✗ Failed to download ${filename}: ${err.message}`);
    }
  }
  
  // Download music images
  console.log('\n\n🎵 Downloading music images...');
  
  for (const img of musicImages) {
    const filename = sanitizeFilename(img.title || `music-${musicImages.indexOf(img)}`);
    const ext = getImageExtension(img.url);
    const dest = path.join(__dirname, '..', 'src', 'assets', 'music', `${filename}.${ext}`);
    const fullUrl = img.url.includes('?') 
      ? img.url.replace(/\?.*/, '?format=original')
      : img.url + '?format=original';
    
    try {
      await downloadFile(fullUrl, dest);
      console.log(`   ✓ Downloaded: ${filename}.${ext}`);
    } catch (err) {
      console.error(`   ✗ Failed to download ${filename}: ${err.message}`);
    }
  }
  
  console.log('\n\n✅ Extraction complete!');
  console.log('\nSummary:');
  console.log(`   - Raw JSON saved to scripts/_raw/`);
  console.log(`   - Images saved to src/assets/{author,books,design,music}/`);
  
  // Log what we found
  console.log('\n📊 Content discovered:');
  console.log('\n   Books page:');
  if (booksData.item) {
    console.log(`      Title: ${booksData.item.title}`);
    console.log(`      Body: ${booksData.item.body ? 'Yes' : 'No'}`);
  }
  
  console.log('\n   Design page:');
  if (designData.collection) {
    console.log(`      Type: ${designData.collection.typeName}`);
    console.log(`      Items: ${designData.collection.itemCount || 0}`);
  }
  
  console.log('\n   Music page:');
  if (musicData.item) {
    console.log(`      Title: ${musicData.item.title}`);
    console.log(`      Body: ${musicData.item.body ? 'Yes' : 'No'}`);
  }
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
