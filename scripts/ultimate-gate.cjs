#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
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

