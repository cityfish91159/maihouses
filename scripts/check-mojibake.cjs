#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = process.cwd();

const extraIgnoredPaths = ['src/pages/Admin/GodView.tsx'];
const skipPathPrefixes = ['.git-rewrite/', 'docs/assets/', 'dist/', 'build/', 'node_modules/'];
const allowedExts = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.cjs',
  '.mjs',
  '.json',
  '.md',
  '.css',
  '.scss',
  '.html',
  '.yml',
  '.yaml',
  '.txt',
]);

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
  '.exe',
  '.dll',
  '.so',
  '.dylib',
]);

// High-signal mojibake patterns only. We avoid broad CJK matching to reduce false positives.
const rules = [
  { id: 'replacement-char', regex: /\uFFFD/ },
  { id: 'private-use-char', regex: /[\uE000-\uF8FF]/ },
  { id: 'emoji-prefix-mojibake', regex: /馃/ },
  { id: 'cjk-question-break', regex: /[\u4E00-\u9FFF]\?[\u4E00-\u9FFFA-Za-z]/ },
  { id: 'punctuation-mojibake', regex: /(锛|銆|鈥)/ },
];

function shouldSkipFile(filePath) {
  const rel = toRel(filePath);
  if (skipPathPrefixes.some((prefix) => rel.startsWith(prefix))) return true;
  if (rel === 'scripts/check-mojibake.cjs') return true;

  const base = path.basename(filePath).toLowerCase();
  if (base === 'nul') return true;

  const ext = path.extname(base);
  if (ext && !allowedExts.has(ext)) return true;
  if (binaryExts.has(ext)) return true;

  return false;
}

function getGitFileList(command) {
  try {
    const out = execSync(command, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.split('\u0000').filter(Boolean);
  } catch {
    return [];
  }
}

function listCandidateFiles() {
  const tracked = getGitFileList('git ls-files -z');
  const untracked = getGitFileList('git ls-files -z --others --exclude-standard');
  const files = new Set([...tracked, ...untracked]);

  for (const rel of extraIgnoredPaths) {
    if (fs.existsSync(path.join(ROOT, rel))) {
      files.add(rel);
    }
  }

  return Array.from(files)
    .map((rel) => path.join(ROOT, rel))
    .filter((filePath) => fs.existsSync(filePath))
    .filter((filePath) => fs.statSync(filePath).isFile())
    .filter((filePath) => !shouldSkipFile(filePath));
}

function detectLineIssues(line) {
  const hits = [];
  for (const rule of rules) {
    if (rule.regex.test(line)) hits.push(rule.id);
  }
  return hits;
}

function toRel(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

const files = listCandidateFiles();
const violations = [];

for (const filePath of files) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    continue;
  }

  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const lineHits = detectLineIssues(lines[i]);
    if (lineHits.length === 0) continue;
    violations.push({
      file: toRel(filePath),
      line: i + 1,
      rules: lineHits.join(','),
    });
  }
}

if (violations.length > 0) {
  console.error(`Mojibake check failed: ${violations.length} issue(s) found.`);
  const preview = violations.slice(0, 300);
  for (const v of preview) {
    console.error(`- ${v.file}:${v.line} [${v.rules}]`);
  }
  if (violations.length > preview.length) {
    console.error(`...and ${violations.length - preview.length} more.`);
  }
  process.exit(1);
}

console.log('Mojibake check passed.');
