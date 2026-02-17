#!/usr/bin/env node
'use strict';

/**
 * Hardcoded color checker
 *
 * Modes:
 * - default: scan staged src files with css/module.css/ts/tsx extensions
 * - --full: scan all src css files (report only, no failure)
 *
 * Exemptions:
 * - CSS token declarations like: --mh-color-xxxxxx: #xxxxxx;
 * - line contains "hardcolor-ok"
 * - #fff / #ffffff / #000 / #000000
 * - LINE brand colors: #06c755 / #00b900
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');

const HEX_RE = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
const ROOT_VAR_RE = /--mh-color-[0-9a-f]+\s*:/i;
const EXEMPT_COLORS = new Set([
  '#fff',
  '#ffffff',
  '#000',
  '#000000',
  '#06c755',
  '#00b900',
]);

function colorLog(msg, code) {
  process.stderr.write(`${code}${msg}\x1b[0m\n`);
}
const log = {
  red: (m) => colorLog(m, '\x1b[31m'),
  green: (m) => colorLog(m, '\x1b[32m'),
  yellow: (m) => colorLog(m, '\x1b[33m'),
  cyan: (m) => colorLog(m, '\x1b[36m'),
  bold: (m) => colorLog(m, '\x1b[1m'),
};

function isExemptLine(line) {
  if (/hardcolor-ok/i.test(line)) return true;
  if (ROOT_VAR_RE.test(line)) return true;
  return false;
}

function isExemptColor(hex) {
  return EXEMPT_COLORS.has(hex.toLowerCase());
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
    if (isExemptLine(line)) continue;

    HEX_RE.lastIndex = 0;
    let match;
    while ((match = HEX_RE.exec(line)) !== null) {
      const hex = match[0];
      if (!isExemptColor(hex)) {
        violations.push({
          line: i + 1,
          col: match.index + 1,
          color: hex,
          text: line.trim().slice(0, 120),
        });
      }
    }
  }

  return violations;
}

function getStagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACM', {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return out
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)
      .filter((f) => /^src\/.+\.(css|tsx|ts)$/.test(f))
      .map((f) => path.join(ROOT, f))
      .filter((f) => fs.existsSync(f));
  } catch {
    return [];
  }
}

function getAllCssFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllCssFiles(full));
      continue;
    }
    if (entry.isFile() && full.endsWith('.css')) {
      files.push(full);
    }
  }
  return files;
}

function runFullMode() {
  const cssFiles = getAllCssFiles(SRC_DIR);
  let total = 0;
  let affected = 0;

  for (const file of cssFiles) {
    const rel = path.relative(ROOT, file);
    const violations = scanFile(file);
    if (violations.length === 0) continue;
    affected += 1;
    total += violations.length;
    log.yellow(`\n${rel} (${violations.length})`);
    for (const v of violations.slice(0, 10)) {
      log.red(`  L${v.line}:${v.col} ${v.color} -> ${v.text}`);
    }
    if (violations.length > 10) {
      log.yellow(`  ... and ${violations.length - 10} more`);
    }
  }

  log.cyan(`\nFULL summary: ${affected} files, ${total} violations`);
  process.exit(0);
}

function runStagedMode() {
  const files = getStagedFiles();
  if (files.length === 0) {
    log.cyan('No staged src css/ts/tsx files. Skip hardcolor check.');
    process.exit(0);
  }

  let total = 0;
  let affected = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const violations = scanFile(file);
    if (violations.length === 0) continue;
    affected += 1;
    total += violations.length;
    log.red(`\n${rel} (${violations.length})`);
    for (const v of violations) {
      log.yellow(`  L${v.line}:${v.col} ${v.color} -> ${v.text}`);
    }
  }

  if (total > 0) {
    log.red(`\nFound ${total} hardcoded colors in ${affected} staged files.`);
    process.exit(1);
  }

  log.green('No new hardcoded colors in staged files.');
  process.exit(0);
}

log.cyan('\n========================================');
log.bold(`Hardcoded Color Check (${process.argv.includes('--full') ? 'FULL' : 'STAGED'})`);
log.cyan('========================================\n');

if (process.argv.includes('--full')) {
  runFullMode();
} else {
  runStagedMode();
}
