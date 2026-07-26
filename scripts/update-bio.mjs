#!/usr/bin/env node
/**
 * Update src/content/site/bio.md from the system clipboard.
 *
 * Usage:
 *   npm run bio
 *   node scripts/update-bio.mjs
 *   node scripts/update-bio.mjs --dry-run
 *
 * Clipboard should be markdown body only (paragraphs, _italics_, [links](url)).
 * Frontmatter is preserved/rewritten automatically.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { platform } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bioPath = join(__dirname, '../src/content/site/bio.md');
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

function stripFrontmatter(text) {
  if (!text.startsWith('---')) return text;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return text;
  return text.slice(end + 4).replace(/^\n+/, '');
}

function normalizeBio(text) {
  const body =
    text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .trim() + '\n';
  return `---\ntitle: Bio\n---\n\n${stripFrontmatter(body)}`;
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
  console.log('Bio unchanged (clipboard matches src/content/site/bio.md).');
  process.exit(0);
}

console.log('--- bio preview ---');
console.log(stripFrontmatter(next).trimEnd());
console.log('-------------------');

if (dryRun) {
  console.log('Dry run: not writing.');
  process.exit(0);
}

writeFileSync(bioPath, next, 'utf8');
console.log(`Updated ${bioPath}`);
