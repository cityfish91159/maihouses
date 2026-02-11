#!/usr/bin/env node
'use strict';

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m\x1b[37m',
};

const totalStart = Date.now();

function runStep(stepName, command, args, opts = {}) {
  const start = Date.now();
  console.log(`\n${C.cyan}=> [CHECK] ${stepName}...${C.reset}`);

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
    ...opts,
  });

  const duration = ((Date.now() - start) / 1000).toFixed(2);

  if (result.status !== 0) {
    console.log(`\n${C.bgRed} FAIL: ${stepName} failed. (${duration}s) ${C.reset}`);
    if (opts.fatal !== false) {
      process.exit(1);
    }
    return false;
  }

  console.log(`${C.green}PASS: ${stepName} (${duration}s)${C.reset}`);
  return true;
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function shouldScanSourceFile(filePath) {
  const normalized = toPosixPath(filePath);
  if (!normalized.startsWith('src/')) return false;
  if (!/\.(js|jsx|ts|tsx)$/.test(normalized)) return false;
  if (normalized.includes('/node_modules/')) return false;
  if (normalized.includes('/dist/')) return false;
  if (normalized.includes('/build/')) return false;
  if (normalized.endsWith('.d.ts')) return false;
  return true;
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function getGitFileList(command) {
  try {
    return execSync(command, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getChangedSourceFiles() {
  const addedLinesByFile = new Map();

  const diff = execSync('git diff --unified=0 --no-color -- src', {
    cwd: process.cwd(),
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  let currentFile = null;
  let currentNewLine = 0;

  diff.split(/\r?\n/).forEach((line) => {
    if (line.startsWith('+++ b/')) {
      currentFile = toPosixPath(line.slice('+++ b/'.length).trim());
      if (!addedLinesByFile.has(currentFile)) {
        addedLinesByFile.set(currentFile, new Set());
      }
      return;
    }

    if (line.startsWith('@@')) {
      const match = line.match(/\+(\d+)(?:,(\d+))?/);
      currentNewLine = match ? Number(match[1]) : 0;
      return;
    }

    if (!currentFile || currentNewLine <= 0) return;

    if (line.startsWith('+') && !line.startsWith('+++')) {
      addedLinesByFile.get(currentFile).add(currentNewLine);
      currentNewLine += 1;
      return;
    }

    if (line.startsWith('-') && !line.startsWith('---')) {
      return;
    }

    if (!line.startsWith('\\')) {
      currentNewLine += 1;
    }
  });

  const untrackedFiles = getGitFileList('git ls-files --others --exclude-standard');
  untrackedFiles.forEach((filePath) => {
    const normalized = toPosixPath(filePath);

    if (!normalized.startsWith('src/')) return;
    if (!/\.(js|jsx|ts|tsx)$/.test(normalized)) return;
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lineCount = content.split('\n').length;

    const lineSet = addedLinesByFile.get(normalized) ?? new Set();
    for (let i = 1; i <= lineCount; i += 1) {
      lineSet.add(i);
    }
    addedLinesByFile.set(normalized, lineSet);
  });

  return Array.from(addedLinesByFile.entries())
    .filter(([filePath, lineSet]) => {
      if (!lineSet || lineSet.size === 0) return false;

      if (!shouldScanSourceFile(filePath)) return false;

      return fs.existsSync(path.normalize(filePath));
    })
    .map(([filePath, lineSet]) => ({ filePath, lineSet }));
}

function getAllSourceFiles(rootDir = 'src') {
  const files = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (
          entry === 'node_modules' ||
          entry === 'dist' ||
          entry === 'build' ||
          entry === '.git' ||
          entry === '.next'
        ) {
          continue;
        }
        walk(fullPath);
        continue;
      }

      if (!shouldScanSourceFile(fullPath)) continue;
      files.push(fullPath);
    }
  }

  walk(rootDir);
  return files.map((filePath) => toPosixPath(filePath));
}

function collectInlineStyleViolations(filePath, content, lineFilter) {
  const violations = [];
  const inlineJsxRegex = /style\s*=\s*\{\{/g;
  const inlineHtmlRegex = /\bstyle\s*=\s*["'][^"']*["']/g;
  const interactiveEventRegex =
    /\bon(MouseEnter|MouseLeave|Focus|Blur|PointerEnter|PointerLeave|TouchStart|TouchEnd)\s*=/;
  const stateSignalRegex =
    /\b(hover|focus|active|pressed|selected|mobile|desktop|tablet|theme|dark|light|matchMedia|prefers-reduced-motion|innerWidth)\b/i;
  const conditionalInlineRegex = /style\s*=\s*\{\{[\s\S]{0,240}(?:\?|&&|\|\|)[\s\S]{0,240}\}\}/;

  function acceptLine(lineNumber) {
    return typeof lineFilter === 'function' ? lineFilter(lineNumber) : true;
  }

  let match;
  while ((match = inlineJsxRegex.exec(content)) !== null) {
    const line = getLineNumber(content, match.index);
    if (!acceptLine(line)) continue;

    violations.push({
      filePath,
      line,
      message:
        'Inline style is forbidden when class/CSS module/Tailwind can express the same style (style={{...}}).',
    });

    const contextStart = Math.max(0, match.index - 360);
    const contextEnd = Math.min(content.length, match.index + 640);
    const context = content.slice(contextStart, contextEnd);

    if (
      interactiveEventRegex.test(context) ||
      conditionalInlineRegex.test(context) ||
      stateSignalRegex.test(context)
    ) {
      violations.push({
        filePath,
        line,
        message:
          'Interactive/responsive/theme states (hover/focus/media-query/theme) must not be implemented via inline style. Use class + CSS state rules.',
      });
    }
  }

  while ((match = inlineHtmlRegex.exec(content)) !== null) {
    const line = getLineNumber(content, match.index);
    if (!acceptLine(line)) continue;

    violations.push({
      filePath,
      line,
      message:
        'Inline HTML style attribute is forbidden when class/CSS module/Tailwind can express the same style (style=\"...\").',
    });
  }

  return violations;
}

function failWithInlineViolations(violations, scopeLabel) {
  console.log(
    `\n${C.bgRed} FAIL: Inline style policy detected ${violations.length} violation(s) in ${scopeLabel}. ${C.reset}`
  );
  violations.slice(0, 160).forEach((violation) => {
    console.log(`${C.yellow}WARN ${violation.filePath}:${violation.line}${C.reset}`);
    console.log(`  ${C.red}${violation.message}${C.reset}`);
  });
  if (violations.length > 160) {
    console.log(`${C.yellow}...and ${violations.length - 160} more violation(s).${C.reset}`);
  }
  process.exit(1);
}

function checkInlineStylePolicyGlobal() {
  console.log(`\n${C.cyan}=> [CHECK] Inline style policy (full source scan)...${C.reset}`);
  const sourceFiles = getAllSourceFiles();
  const violations = [];

  sourceFiles.forEach((filePath) => {
    const content = fs.readFileSync(path.normalize(filePath), 'utf-8');
    violations.push(...collectInlineStyleViolations(filePath, content));
  });

  if (violations.length > 0) {
    failWithInlineViolations(violations, 'full source');
  }

  console.log(`${C.green}PASS: Inline style policy (full source)${C.reset}`);
}

function checkInlineStylePolicyChanged() {
  console.log(`\n${C.cyan}=> [CHECK] Inline style policy (changed files)...${C.reset}`);

  const targetFiles = getChangedSourceFiles();
  if (targetFiles.length === 0) {
    console.log(
      `${C.yellow}WARN: No changed source files detected. Inline style policy skipped.${C.reset}`
    );
    return;
  }

  const violations = [];

  targetFiles.forEach(({ filePath, lineSet }) => {
    const normalizedFilePath = path.normalize(filePath);
    const content = fs.readFileSync(normalizedFilePath, 'utf-8');
    violations.push(
      ...collectInlineStyleViolations(filePath, content, (lineNumber) => lineSet.has(lineNumber))
    );
  });

  if (violations.length > 0) {
    failWithInlineViolations(violations, 'changed files');
  }

  console.log(`${C.green}PASS: Inline style policy (${targetFiles.length} changed file(s))${C.reset}`);
}

function deepScan() {
  console.log(`\n${C.cyan}=> [SCAN] Source hygiene...${C.reset}`);
  console.log(
    `${C.gray}Info: Muse-related files are skipped. Analytics files are exempt from var rule.${C.reset}`
  );

  const forbidden = [
    { regex: /console\.log\(/, label: 'console.log is forbidden in src/' },
    { regex: /debugger/, label: 'debugger is forbidden in src/' },
    { regex: /\/\/ ?TODO:/, label: 'TODO comments are forbidden in src/' },
    { regex: /\/\/ ?FIXME:/, label: 'FIXME comments are forbidden in src/' },
    { regex: /@ts-ignore/, label: '@ts-ignore is forbidden' },
    { regex: /eslint-disable/, label: 'eslint-disable is forbidden' },
    { regex: /\bvar\s+/, label: 'var is forbidden (use let/const)' },
    { regex: /alert\(/, label: 'alert() is forbidden' },
    { regex: /window\.confirm\(/, label: 'window.confirm() is forbidden' },
    { regex: /AIza[0-9A-Za-z-_]{35}/, label: 'Possible Google API key detected' },
    { regex: /sk-[a-zA-Z0-9]{20,}/, label: 'Possible OpenAI key detected' },
  ];

  let errors = 0;

  function walkDir(dir) {
    if (
      dir.includes('node_modules') ||
      dir.includes('.next') ||
      dir.includes('.git') ||
      dir.includes('dist') ||
      dir.includes('build') ||
      dir.toLowerCase().includes('muse') ||
      dir.toLowerCase().includes('god-muse')
    ) {
      return;
    }

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);

      if (
        file.toLowerCase().includes('muse') ||
        file.toLowerCase().includes('god-muse') ||
        file.endsWith('.d.ts') ||
        file.endsWith('.map')
      ) {
        continue;
      }

      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
        continue;
      }

      if (!/\.(js|ts|tsx|jsx)$/.test(file)) {
        continue;
      }

      if (fullPath.includes(`${path.sep}scripts${path.sep}`)) {
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        const isComment = trimmed.startsWith('//') || trimmed.startsWith('/*');

        forbidden.forEach((rule) => {
          const isCommentRule =
            rule.label.includes('TODO') ||
            rule.label.includes('FIXME') ||
            rule.label.includes('ignore') ||
            rule.label.includes('disable');

          if (isComment && !isCommentRule) {
            return;
          }

          const isAnalyticsVarExempt =
            rule.label.startsWith('var') &&
            (file.toLowerCase().includes('analytics') ||
              fullPath.toLowerCase().includes('analytics'));

          if (isAnalyticsVarExempt) {
            return;
          }

          if (!rule.regex.test(line)) {
            return;
          }

          console.log(`${C.yellow}WARN ${fullPath}:${index + 1}${C.reset}`);
          console.log(`  ${C.red}${rule.label}${C.reset}`);
          console.log(`  ${C.gray}${trimmed.slice(0, 120)}${C.reset}`);
          errors += 1;
        });
      });
    }
  }

  if (fs.existsSync('src')) {
    walkDir('src');
  }

  if (errors > 0) {
    console.log(`\n${C.bgRed} FAIL: Source hygiene detected ${errors} violation(s). ${C.reset}`);
    process.exit(1);
  }

  console.log(`${C.green}PASS: Source hygiene${C.reset}`);
}

function checkBundleSize(limitMb = 50) {
  console.log(`\n${C.cyan}=> [CHECK] Build output size...${C.reset}`);

  const buildDir = fs.existsSync('dist') ? 'dist' : fs.existsSync('.next') ? '.next' : null;
  if (!buildDir) {
    console.log(`${C.yellow}WARN: No build directory found (dist/.next). Skipped.${C.reset}`);
    return;
  }

  let totalSize = 0;

  function getDirSize(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        getDirSize(filePath);
      } else {
        totalSize += stat.size;
      }
    }
  }

  getDirSize(buildDir);

  const sizeMb = totalSize / 1024 / 1024;
  console.log(`Size: ${C.bold}${sizeMb.toFixed(2)} MB${C.reset}`);

  if (sizeMb > limitMb) {
    console.log(
      `${C.yellow}WARN: Build size exceeds ${limitMb} MB. (Allowed exception if approved)${C.reset}`
    );
  } else {
    console.log(`${C.green}PASS: Build size is within limit${C.reset}`);
  }
}

console.log(
  `${C.bold}============================================================${C.reset}`
);
console.log(`${C.bold}ULTIMATE QUALITY GATE (95-point standard)${C.reset}`);
console.log(
  `${C.bold}============================================================${C.reset}`
);

deepScan();
runStep('Mojibake Check', 'node', ['scripts/check-mojibake.cjs']);
checkInlineStylePolicyGlobal();
checkInlineStylePolicyChanged();

runStep('Circular Dependency Check', 'npx', [
  'madge',
  '--circular',
  '--extensions',
  'ts,tsx,js,jsx',
  './src',
]);

runStep('TypeScript TypeCheck', 'npm', ['run', 'typecheck']);

runStep(
  'Prettier Format Check',
  'npx',
  ['prettier', '--check', 'src/**/*.{ts,tsx,js,css}', '!**/*muse*/**', '!**/*god-muse*/**'],
  { fatal: false }
);

runStep('ESLint (Zero Warnings)', 'npm', ['run', 'lint', '--', '--max-warnings=0']);

runStep('Unit/Integration Tests', 'npm', ['run', 'test']);

runStep('NPM Security Audit', 'npm', ['audit', '--audit-level=moderate']);

runStep('Production Build Verification', 'npm', ['run', 'build']);

checkBundleSize();

const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(2);
console.log(`\n${C.green}${C.bold}ALL CHECKS PASSED${C.reset}`);
console.log(`${C.gray}Total duration: ${totalDuration}s${C.reset}\n`);
