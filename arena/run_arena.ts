#!/usr/bin/env npx tsx
/**
 * 🏟️ ARENA RUNNER（強度 5x 版）
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { performance } from "perf_hooks";
import log from "./logger";
import { ARENA_CONFIG, RANKING_WEIGHTS, ELIMINATION_RULES, TaskConfig, HELL_MODE } from "./arena.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CandidateResult {
  name: string;
  status: "PASS" | "ELIMINATED";
  eliminationReason?: string;
  testsPassed: boolean;
  fuzzFailRate: number;
  stressPassed: boolean;
  avgRuntimeMs: number;
  codeLines: number;
  score: number;
}

interface ArenaResult {
  task: string;
  timestamp: string;
  candidates: CandidateResult[];
  champion: string | null;
  leaderboard: CandidateResult[];
}

// ============================================================================
// Code Analysis
// ============================================================================

function countLines(filePath: string): number {
  const content = fs.readFileSync(filePath, "utf-8");
  return content.split("\n").filter(l => l.trim() && !l.trim().startsWith("//") && !l.trim().startsWith("/*") && !l.trim().startsWith("*")).length;
}

function checkFunctionLength(filePath: string, maxLines: number): { valid: boolean; longest: number } {
  const content = fs.readFileSync(filePath, "utf-8");
  const fnPattern = /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*\w+)?\s*=>|(?:async\s+)?function\s*\()/g;
  let longest = 0, current = 0, inFunction = false, braceCount = 0;

  for (const line of content.split("\n")) {
    if (fnPattern.test(line)) { inFunction = true; current = 0; braceCount = 0; }
    if (inFunction) {
      current++;
      braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      if (braceCount <= 0 && current > 1) { longest = Math.max(longest, current); inFunction = false; }
    }
  }
  return { valid: longest <= maxLines, longest };
}

// ============================================================================
// Test Runner
// ============================================================================

async function runTests(candidatePath: string, testPath: string, entryFn: string): Promise<{ passed: boolean; errors: string[] }> {
  const errors: string[] = [];
  try {
    const mod = await import(candidatePath);
    const fn = mod[entryFn];
    if (typeof fn !== "function") return { passed: false, errors: [`Entry '${entryFn}' not found`] };

    const testMod = await import(testPath);
    const tests = testMod.default || testMod.tests || [];

    for (const test of tests) {
      try {
        const result = await fn(test.input);
        if (JSON.stringify(result) !== JSON.stringify(test.expected)) {
          errors.push(`Test '${test.name}': expected ${JSON.stringify(test.expected)}, got ${JSON.stringify(result)}`);
        }
      } catch (e) {
        errors.push(`Test '${test.name}' threw: ${e}`);
      }
    }
  } catch (e) {
    errors.push(`Load error: ${e}`);
  }
  return { passed: errors.length === 0, errors };
}

// ============================================================================
// Performance
// ============================================================================

async function runPerformance(candidatePath: string, entryFn: string, rounds: number): Promise<number> {
  const mod = await import(candidatePath);
  const fn = mod[entryFn];
  const testInput = { hasVerifiedOwner: true, hasRealPhotos: true, avgRating: 4.5, responseTimeHours: 2, reviewCount: 10 };

  const times: number[] = [];
  for (let i = 0; i < rounds; i++) {
    const start = performance.now();
    await fn(testInput);
    times.push(performance.now() - start);
  }
  return times.reduce((a, b) => a + b, 0) / times.length;
}

// ============================================================================
// Main Arena
// ============================================================================

async function runArena(taskName: string): Promise<ArenaResult> {
  const config = ARENA_CONFIG[taskName];
  if (!config) throw new Error(`Task '${taskName}' not found`);

  const hellMode = process.env.ARENA_HELL_MODE === "1";
  const effectiveConfig = hellMode ? {
    ...config,
    fuzzRounds: config.fuzzRounds * HELL_MODE.fuzzMultiplier,
    stressDataSize: config.stressDataSize * HELL_MODE.stressMultiplier,
    perfRounds: config.perfRounds * HELL_MODE.perfMultiplier,
    maxRunMs: config.maxRunMs / HELL_MODE.timeoutDivisor,
  } : config;

  const tasksDir = path.join(__dirname, "tasks", taskName);
  const candidatesDir = path.join(__dirname, "candidates", taskName);

  if (!fs.existsSync(candidatesDir)) throw new Error(`No candidates: ${candidatesDir}`);

  const testPath = path.join(tasksDir, "reference_tests.ts");
  const candidateFiles = fs.readdirSync(candidatesDir).filter(f => f.endsWith(".ts"));

  log.header(`🏟️ ARENA: ${taskName.toUpperCase()}${hellMode ? " [HELL MODE]" : ""}`);
  log.info(`📋 Candidates: ${candidateFiles.length}`);
  log.info(`⚙️ Config: maxRunMs=${effectiveConfig.maxRunMs}, fuzzRounds=${effectiveConfig.fuzzRounds}`);

  const results: CandidateResult[] = [];

  for (const file of candidateFiles) {
    const name = file.replace(".ts", "");
    const candidatePath = path.join(candidatesDir, file);
    log.divider();
    log.info(`━━━ ${name} ━━━`);

    const result: CandidateResult = { name, status: "PASS", testsPassed: false, fuzzFailRate: 0, stressPassed: true, avgRuntimeMs: 0, codeLines: 0, score: 0 };

    // Line count
    result.codeLines = countLines(candidatePath);
    log.info(`  📏 Lines: ${result.codeLines}`);

    // Function length check
    const fnCheck = checkFunctionLength(candidatePath, effectiveConfig.maxFunctionLines);
    if (!fnCheck.valid) {
      result.status = "ELIMINATED";
      result.eliminationReason = `Function too long: ${fnCheck.longest} > ${effectiveConfig.maxFunctionLines}`;
      log.error(`  ${result.eliminationReason}`);
      results.push(result);
      continue;
    }

    // Run tests
    const testResult = await runTests(candidatePath, testPath, config.entryFunction);
    result.testsPassed = testResult.passed;
    if (!testResult.passed) {
      result.status = "ELIMINATED";
      result.eliminationReason = `Tests failed: ${testResult.errors[0]}`;
      log.error(`  ${result.eliminationReason}`);
      results.push(result);
      continue;
    }
    log.success(`  Tests passed`);

    // Performance
    result.avgRuntimeMs = await runPerformance(candidatePath, config.entryFunction, effectiveConfig.perfRounds);
    log.info(`  ⚡ Avg runtime: ${result.avgRuntimeMs.toFixed(3)}ms`);

    if (result.avgRuntimeMs > effectiveConfig.maxRunMs) {
      result.status = "ELIMINATED";
      result.eliminationReason = `Too slow: ${result.avgRuntimeMs.toFixed(2)}ms > ${effectiveConfig.maxRunMs}ms`;
      log.error(`  ${result.eliminationReason}`);
      results.push(result);
      continue;
    }

    results.push(result);
  }

  // Calculate scores
  const survivors = results.filter(r => r.status === "PASS");
  if (survivors.length > 0) {
    const minTime = Math.min(...survivors.map(s => s.avgRuntimeMs));
    const maxTime = Math.max(...survivors.map(s => s.avgRuntimeMs));
    const minLines = Math.min(...survivors.map(s => s.codeLines));
    const maxLines = Math.max(...survivors.map(s => s.codeLines));

    for (const s of survivors) {
      const timeRange = maxTime - minTime || 1;
      const lineRange = maxLines - minLines || 1;
      const perfScore = 100 * (1 - (s.avgRuntimeMs - minTime) / timeRange);
      const sizeScore = 100 * (1 - (s.codeLines - minLines) / lineRange);
      s.score = Math.round(RANKING_WEIGHTS.performance * perfScore + RANKING_WEIGHTS.codeSize * sizeScore);
    }
  }

  const leaderboard = [...survivors].sort((a, b) => b.score - a.score);
  const champion = leaderboard[0]?.name || null;

  // Print leaderboard
  log.blank();
  log.header("🏆 LEADERBOARD");
  if (leaderboard.length > 0) {
    leaderboard.forEach((c, i) => {
      log.rank(i + 1, c.name, `${c.avgRuntimeMs.toFixed(2)}ms | ${c.codeLines} lines | score=${c.score}`);
    });
    log.blank();
    log.success(`CHAMPION: ${champion}`);
  } else {
    log.error("無人存活");
  }

  const eliminated = results.filter(r => r.status === "ELIMINATED");
  if (eliminated.length > 0) {
    log.blank();
    log.error("ELIMINATED:");
    eliminated.forEach(e => log.info(`   ${e.name}: ${e.eliminationReason}`));
  }

  return { task: taskName, timestamp: new Date().toISOString(), candidates: results, champion, leaderboard };
}

// ============================================================================
// CLI
// ============================================================================

const taskName = process.argv[2];
if (!taskName) {
  log.info("Usage: npx tsx arena/run_arena.ts <task_name>");
  log.info("Tasks: " + Object.keys(ARENA_CONFIG).join(", "));
  process.exit(1);
}

runArena(taskName)
  .then(result => {
    const outputPath = path.join(__dirname, "results", `${taskName}-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    log.blank();
    log.info(`📁 Results: ${outputPath}`);
    process.exit(result.champion ? 0 : 1);
  })
  .catch(err => {
    log.error(`Arena failed: ${err}`);
    process.exit(1);
  });
