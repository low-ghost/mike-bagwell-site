#!/usr/bin/env node

import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);

    client
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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
      })
      .on('error', (err) => {
        file.close();
        fs.unlinkSync(dest);
        reject(err);
      });
  });
}

async function main() {
  console.log('📥 Downloading missing assets...\n');

  const assets = [
    // Author portrait
    {
      url: 'https://images.squarespace-cdn.com/content/v1/64729d819da3551e36816423/3dbbe9f4-2c37-47b9-ba66-d9d4bc2cb6ec/PXL_20230528_195141171.jpg?format=original',
      dest: path.join(__dirname, '..', 'src', 'assets', 'author', 'portrait.jpg'),
      label: 'Author portrait',
    },

    // Book covers
    {
      url: 'https://images.squarespace-cdn.com/content/v1/64729d819da3551e36816423/3adb90e3-fb2a-4321-9a7a-c46838b1f073/collision+front.png?format=original',
      dest: path.join(__dirname, '..', 'src', 'assets', 'books', 'collision-in-midair.png'),
      label: 'A Collision of Soul in Midair',
    },
    {
      url: 'https://images.squarespace-cdn.com/content/v1/64729d819da3551e36816423/bd07320c-7463-470d-9c34-1f42b01607e7/1.png?format=original',
      dest: path.join(__dirname, '..', 'src', 'assets', 'books', 'high-priestess.png'),
      label: 'Poem of Thanks: The High Priestess',
    },
    {
      url: 'https://images.squarespace-cdn.com/content/v1/64729d819da3551e36816423/b0b437fa-b6b0-4260-a1a1-8e0085397f1a/Screenshot+2026-01-07+at+8.30.39%E2%80%AFAM.png?format=original',
      dest: path.join(__dirname, '..', 'src', 'assets', 'books', 'court-of-wands.png'),
      label: 'Poem of Thanks: A Court of Wands',
    },
    {
      url: 'https://images.squarespace-cdn.com/content/v1/64729d819da3551e36816423/c40de0bd-b697-429d-8a84-daaa5f4c7885/or-else.jpeg?format=original',
      dest: path.join(__dirname, '..', 'src', 'assets', 'books', 'or-else-they-are-trees.jpeg'),
      label: 'Or Else they are Trees',
    },
    {
      url: 'https://images.squarespace-cdn.com/content/v1/64729d819da3551e36816423/1fc07076-d754-4e3b-8148-fb6ad47d2268/transparent_text_image.png?format=original',
      dest: path.join(__dirname, '..', 'src', 'assets', 'books', 'when-we-look-at-things.png'),
      label: 'When We Look at Things We Steal their Color...',
    },

    // Ghost Harmonics image
    {
      url: 'https://images.squarespace-cdn.com/content/v1/64729d819da3551e36816423/1d97694d-7346-4376-9592-72cc0e53688c/13417432_cover.jpg?format=original',
      dest: path.join(__dirname, '..', 'src', 'assets', 'music', 'ghost-harmonics.jpg'),
      label: 'Ghost Harmonics',
    },
  ];

  for (const asset of assets) {
    try {
      await downloadFile(asset.url, asset.dest);
      console.log(`✓ ${asset.label}`);
      console.log(`  → ${path.relative(path.join(__dirname, '..'), asset.dest)}`);
    } catch (err) {
      console.error(`✗ ${asset.label}: ${err.message}`);
    }
  }

  console.log('\n✅ Download complete!');
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
