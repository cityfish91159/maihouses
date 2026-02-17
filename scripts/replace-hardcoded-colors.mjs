import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const INDEX_CSS = path.join(SRC_DIR, 'index.css');
const START_MARKER = '/* === Auto Generated Color Tokens (hardcoded hex replacement) === */';
const END_MARKER = '/* === End Auto Generated Color Tokens === */';
const HEX_PATTERN = /#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{3})\b/g;

function canonicalizeHex(raw) {
  const hex = raw.replace('#', '').toLowerCase();
  if (hex.length === 3 || hex.length === 4) {
    return hex
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (hex.length === 6 || hex.length === 8) {
    return hex;
  }
  return null;
}

function collectFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    if (
      fullPath.endsWith('.css') ||
      fullPath.endsWith('.ts') ||
      fullPath.endsWith('.tsx')
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function collectCanonicalColors(files) {
  const colors = new Set();
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(HEX_PATTERN) ?? [];
    for (const match of matches) {
      const canonical = canonicalizeHex(match);
      if (canonical) {
        colors.add(canonical);
      }
    }
  }
  return colors;
}

function findRootBlockEnd(content) {
  const rootStart = content.indexOf(':root');
  if (rootStart < 0) {
    return -1;
  }
  const braceStart = content.indexOf('{', rootStart);
  if (braceStart < 0) {
    return -1;
  }
  let depth = 0;
  for (let i = braceStart; i < content.length; i += 1) {
    const ch = content[i];
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function buildTokenBlock(colors) {
  const sorted = Array.from(colors).sort();
  const lines = [START_MARKER];
  for (const color of sorted) {
    lines.push(`    --mh-color-${color}: #${color};`);
  }
  lines.push(`    ${END_MARKER}`);
  return `${lines.join('\n')}\n`;
}

function upsertTokenBlock(indexCssContent, tokenBlock) {
  const startIdx = indexCssContent.indexOf(START_MARKER);
  const endIdx = indexCssContent.indexOf(END_MARKER);

  if (startIdx >= 0 && endIdx > startIdx) {
    const endLineIdx = indexCssContent.indexOf('\n', endIdx);
    const blockEnd = endLineIdx >= 0 ? endLineIdx + 1 : indexCssContent.length;
    return (
      indexCssContent.slice(0, startIdx) +
      tokenBlock +
      indexCssContent.slice(blockEnd)
    );
  }

  const rootEnd = findRootBlockEnd(indexCssContent);
  if (rootEnd < 0) {
    throw new Error('Cannot find :root block in src/index.css');
  }

  return (
    indexCssContent.slice(0, rootEnd) +
    `\n${tokenBlock}` +
    indexCssContent.slice(rootEnd)
  );
}

function replaceHexWithToken(content) {
  let replacements = 0;
  const next = content.replace(HEX_PATTERN, (match) => {
    const canonical = canonicalizeHex(match);
    if (!canonical) {
      return match;
    }
    replacements += 1;
    return `var(--mh-color-${canonical})`;
  });
  return { next, replacements };
}

function replaceOutsideTokenBlock(content) {
  const startIdx = content.indexOf(START_MARKER);
  const endIdx = content.indexOf(END_MARKER);
  if (startIdx < 0 || endIdx < startIdx) {
    return replaceHexWithToken(content);
  }

  const endLineIdx = content.indexOf('\n', endIdx);
  const blockEnd = endLineIdx >= 0 ? endLineIdx + 1 : content.length;

  const before = content.slice(0, startIdx);
  const block = content.slice(startIdx, blockEnd);
  const after = content.slice(blockEnd);

  const beforeResult = replaceHexWithToken(before);
  const afterResult = replaceHexWithToken(after);

  return {
    next: beforeResult.next + block + afterResult.next,
    replacements: beforeResult.replacements + afterResult.replacements,
  };
}

function main() {
  const files = collectFiles(SRC_DIR);
  const colors = collectCanonicalColors(files);
  const tokenBlock = buildTokenBlock(colors);

  const indexCssOriginal = fs.readFileSync(INDEX_CSS, 'utf8');
  const indexCssWithTokens = upsertTokenBlock(indexCssOriginal, tokenBlock);
  fs.writeFileSync(INDEX_CSS, indexCssWithTokens, 'utf8');

  let changedFiles = 0;
  let totalReplacements = 0;

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    const { next, replacements } =
      file === INDEX_CSS ? replaceOutsideTokenBlock(original) : replaceHexWithToken(original);

    if (next !== original) {
      fs.writeFileSync(file, next, 'utf8');
      changedFiles += 1;
      totalReplacements += replacements;
    }
  }

  console.log(`[replace-hardcoded-colors] files scanned: ${files.length}`);
  console.log(`[replace-hardcoded-colors] unique colors: ${colors.size}`);
  console.log(`[replace-hardcoded-colors] files changed: ${changedFiles}`);
  console.log(`[replace-hardcoded-colors] replacements: ${totalReplacements}`);
}

main();

