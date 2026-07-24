#!/usr/bin/env node
/**
 * Update src/content/bio.md from the system clipboard.
 *
 * Usage:
 *   npm run bio
 *   node scripts/update-bio.mjs
 *   node scripts/update-bio.mjs --dry-run
 *
 * Supports: paragraphs (blank line), _italics_, [links](url)
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bioPath = join(__dirname, '../src/content/bio.md');
const dryRun = process.argv.includes('--dry-run');

function readClipboard() {
  const os = platform();
  try {
    if (os === 'darwin') {
      return execFileSync('pbpaste', { encoding: 'utf8' });
    }
    if (os === 'linux') {
      try {
        return execFileSync('wl-paste', { encoding: 'utf8' });
      } catch {
        return execFileSync('xclip', ['-selection', 'clipboard', '-o'], {
          encoding: 'utf8',
        });
      }
    }
    if (os === 'win32') {
      return execFileSync('powershell.exe', ['-NoProfile', '-Command', 'Get-Clipboard'], {
        encoding: 'utf8',
      });
    }
  } catch (err) {
    console.error('Could not read clipboard:', err.message);
    process.exit(1);
  }
  console.error(`Unsupported platform: ${os}`);
  process.exit(1);
}

function normalizeBio(text) {
  return text.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim() + '\n';
}

const raw = readClipboard();
if (!raw.trim()) {
  console.error('Clipboard is empty. Copy your bio markdown first.');
  process.exit(1);
}

const next = normalizeBio(raw);
const prev = (() => {
  try {
    return readFileSync(bioPath, 'utf8');
  } catch {
    return '';
  }
})();

if (prev === next) {
  console.log('Bio unchanged (clipboard matches src/content/bio.md).');
  process.exit(0);
}

console.log('--- bio preview ---');
console.log(next.trimEnd());
console.log('-------------------');

if (dryRun) {
  console.log('Dry run: not writing.');
  process.exit(0);
}

writeFileSync(bioPath, next, 'utf8');
console.log(`Updated ${bioPath}`);
