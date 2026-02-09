#!/usr/bin/env node
const { execSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const binaryExts = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.pdf',
  '.zip',
  '.gz',
  '.tgz',
  '.bz2',
  '.7z',
  '.rar',
  '.mp4',
  '.mp3',
  '.wav',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.pyc',
]);

const skipDirs = new Set(['.git-rewrite']);

const decoder = new TextDecoder('utf-8', { fatal: true });

const list = execSync('git ls-files -z', { encoding: 'utf8' });
const files = list.split('\u0000').filter(Boolean);

const invalid = [];

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (binaryExts.has(ext)) {
    continue;
  }
  const topDir = file.split('/')[0];
  if (skipDirs.has(topDir)) {
    continue;
  }

  try {
    const buf = readFileSync(file);
    decoder.decode(buf);
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const errorCode = err.code;
      if (errorCode === 'ENOENT' || errorCode === 'ENOTDIR') {
        // File removed in working tree but still listed by git index before staging.
        continue;
      }
    }
    invalid.push(file);
  }
}

if (invalid.length) {
  console.error('Non-UTF-8 files detected:');
  for (const file of invalid) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('UTF-8 check passed.');
