#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const API_ROOT = 'api/';
const DEFAULT_PERMISSION_TAG =
  /@permission-strategy\s+(public|authenticated|system-key|service-role-only|hybrid)\b/i;
const HANDLER_PATTERN =
  /\bexport\s+default\s+(?:async\s+)?function\s+handler\b|\bmodule\.exports\s*=\s*(?:async\s+)?function\b/;

const HIGH_COST_MARKERS = [
  /https:\/\/api\.openai\.com/i,
  /https:\/\/api\.anthropic\.com/i,
  /https:\/\/api\.replicate\.com/i,
  /\bnew\s+OpenAI\s*\(/,
  /\bnew\s+Anthropic\s*\(/,
  /\bOPENAI_API_KEY\b/,
  /\bANTHROPIC_API_KEY\b/,
  /\bREPLICATE_API_TOKEN\b/,
];

const HIGH_COST_GUARDS = [/\bsecureEndpoint\s*\(/, /\brateLimitMiddleware\s*\(/];
const REQUEST_VALIDATION_HINTS = [/\bsafeParse\s*\(/, /\bparse\s*\(/];

function runGitCommand(command) {
  try {
    return execSync(command, {
      cwd: ROOT_DIR,
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

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function isApiSourceFile(filePath) {
  const normalized = toPosixPath(filePath);
  if (!normalized.startsWith(API_ROOT)) return false;
  if (!/\.(ts|js)$/.test(normalized)) return false;
  if (normalized.includes('/__tests__/')) return false;
  if (normalized.includes('/__test-utils__/')) return false;
  if (normalized.startsWith('api/lib/')) return false;
  if (normalized.startsWith('api/schemas/')) return false;
  if (normalized.includes('/services/')) return false;
  return true;
}

function getAddedApiFiles() {
  const baseRef = process.env.GITHUB_BASE_REF;

  if (baseRef) {
    try {
      execSync(`git fetch origin ${baseRef} --depth=1`, {
        cwd: ROOT_DIR,
        stdio: 'ignore',
      });
    } catch {
      // no-op: fallback below
    }
  }

  const diffAgainstBase = baseRef
    ? runGitCommand(`git diff --name-only --diff-filter=A origin/${baseRef}...HEAD`)
    : runGitCommand('git diff --name-only --diff-filter=A HEAD~1...HEAD');
  const fallbackHeadOnly = diffAgainstBase.length
    ? []
    : runGitCommand('git show --name-only --pretty="" --diff-filter=A HEAD');
  const untrackedFiles = runGitCommand('git ls-files --others --exclude-standard');

  const allCandidates = Array.from(
    new Set([...diffAgainstBase, ...fallbackHeadOnly, ...untrackedFiles])
  );
  return allCandidates.filter(isApiSourceFile);
}

function hasPermissionStrategyTag(content) {
  return DEFAULT_PERMISSION_TAG.test(content);
}

function hasCorsWildcard(content) {
  const wildcardByHeader = /Access-Control-Allow-Origin[\s\S]{0,120}['"`]\*['"`]/i;
  const wildcardOriginArray =
    /\b(ALLOWED_ORIGINS|allowedOrigins|originWhitelist|origin)\b[\s\S]{0,120}['"`]\*['"`]/i;
  return wildcardByHeader.test(content) || wildcardOriginArray.test(content);
}

function hasHighCostMarker(content) {
  return HIGH_COST_MARKERS.some((pattern) => pattern.test(content));
}

function hasHighCostGuard(content) {
  return HIGH_COST_GUARDS.some((pattern) => pattern.test(content));
}

function hasRequestValidation(content) {
  return REQUEST_VALIDATION_HINTS.some((pattern) => pattern.test(content));
}

function lineNumberFor(content, pattern) {
  const match = content.match(pattern);
  if (!match || typeof match.index !== 'number') return 1;
  return content.slice(0, match.index).split('\n').length;
}

function stripComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

function validateFile(filePath) {
  const absolutePath = path.join(ROOT_DIR, filePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');
  const contentWithoutComments = stripComments(content);

  if (!HANDLER_PATTERN.test(content)) {
    return [];
  }

  const violations = [];

  if (!hasPermissionStrategyTag(content)) {
    violations.push({
      filePath,
      line: 1,
      code: 'missing-permission-strategy',
      message:
        'Missing permission strategy annotation. Add: @permission-strategy public|authenticated|system-key|service-role-only|hybrid',
    });
  }

  if (hasCorsWildcard(contentWithoutComments)) {
    violations.push({
      filePath,
      line: lineNumberFor(content, /Access-Control-Allow-Origin|origin/i),
      code: 'cors-wildcard',
      message: 'Wildcard CORS is forbidden. Do not use Access-Control-Allow-Origin: *',
    });
  }

  if (hasHighCostMarker(contentWithoutComments)) {
    if (!hasHighCostGuard(contentWithoutComments)) {
      violations.push({
        filePath,
        line: lineNumberFor(
          content,
          /https:\/\/api\.openai\.com|https:\/\/api\.anthropic\.com|https:\/\/api\.replicate\.com|new OpenAI|new Anthropic/i
        ),
        code: 'high-cost-missing-guard',
        message:
          'High-cost API call requires endpoint guard. Add secureEndpoint(...) with rate limit and permission control.',
      });
    }

    if (!hasRequestValidation(contentWithoutComments)) {
      violations.push({
        filePath,
        line: 1,
        code: 'high-cost-missing-validation',
        message:
          'High-cost API call requires request validation (Zod safeParse/parse) before upstream invocation.',
      });
    }
  }

  return violations;
}

function main() {
  const addedApiFiles = getAddedApiFiles();

  if (addedApiFiles.length === 0) {
    console.log('[api-security-gate] No newly added API handler files. Skipped.');
    process.exit(0);
  }

  const violations = addedApiFiles.flatMap(validateFile);

  if (violations.length === 0) {
    console.log(
      `[api-security-gate] PASS. Checked ${addedApiFiles.length} newly added API file(s).`
    );
    process.exit(0);
  }

  console.error('[api-security-gate] FAIL. Security policy violations found:');
  violations.forEach((violation) => {
    console.error(
      `- ${violation.filePath}:${violation.line} [${violation.code}] ${violation.message}`
    );
  });
  process.exit(1);
}

main();
