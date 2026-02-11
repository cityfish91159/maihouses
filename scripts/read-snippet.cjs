#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function fail(message) {
  console.error(message);
  process.exit(1);
}

const [, , rawPath, rawSkip = '0', rawFirst = '0'] = process.argv;

if (!rawPath) {
  fail('Usage: node scripts/read-snippet.cjs <file> [skip] [first]');
}

const skip = Number.parseInt(rawSkip, 10);
const first = Number.parseInt(rawFirst, 10);

if (Number.isNaN(skip) || skip < 0) {
  fail(`Invalid skip value: ${rawSkip}`);
}

if (Number.isNaN(first) || first < 0) {
  fail(`Invalid first value: ${rawFirst}`);
}

const target = path.resolve(process.cwd(), rawPath);
if (!fs.existsSync(target)) {
  fail(`File not found: ${rawPath}`);
}

let content;
try {
  content = fs.readFileSync(target, 'utf8');
} catch (error) {
  fail(`Failed to read file as UTF-8: ${error.message}`);
}

if (content.charCodeAt(0) === 0xfeff) {
  content = content.slice(1);
}

const lines = content.split(/\r?\n/);
const start = Math.min(skip, lines.length);
const end = first > 0 ? Math.min(start + first, lines.length) : lines.length;
process.stdout.write(lines.slice(start, end).join('\n'));
