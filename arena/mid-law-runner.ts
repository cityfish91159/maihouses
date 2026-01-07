#!/usr/bin/env npx tsx
/**
 * 🔥 MID-LAW RUNNER - 即時檢查器（強度 5x 版）
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import log from "./logger";
import {
  ANTI_REGRESSION,
  FORCE_EXPLORE,
  TaskTrace,
  VersionRecord,
  MidLawViolation,
  MidLawCheckResult,
} from "./mid-law.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Hook 1: pre-write
// ============================================================================

export function preWriteCheck(taskName: string): MidLawCheckResult {
  const violations: MidLawViolation[] = [];
  const recommendations: string[] = [];
  const tracePath = path.join(__dirname, "traces", `${taskName}.json`);
  const candidatesDir = path.join(__dirname, "candidates", taskName);

  if (!fs.existsSync(candidatesDir)) {
    fs.mkdirSync(candidatesDir, { recursive: true });
    recommendations.push(`已建立 candidates/${taskName}/ 目錄`);
  }

  if (!fs.existsSync(tracePath)) {
    const initialTrace: TaskTrace = {
      taskName,
      startTime: Date.now(),
      attempts: 0,
      failed: 0,
      versions: [],
    };
    fs.mkdirSync(path.dirname(tracePath), { recursive: true });
    fs.writeFileSync(tracePath, JSON.stringify(initialTrace, null, 2));
    recommendations.push(`已建立 traces/${taskName}.json`);
  }

  const existingVersions = fs.existsSync(candidatesDir)
    ? fs.readdirSync(candidatesDir).filter((f) => f.endsWith(".ts")).length
    : 0;
  if (existingVersions < FORCE_EXPLORE.minVersions) {
    recommendations.push(
      `📝 需要至少 ${FORCE_EXPLORE.minVersions} 個版本，目前 ${existingVersions} 個`,
    );
  }

  return {
    passed: violations.length === 0,
    violations,
    totalPenalty: 0,
    recommendations,
  };
}

// ============================================================================
// Hook 2: during-write
// ============================================================================

export function duringWriteCheck(taskName: string): MidLawCheckResult {
  const violations: MidLawViolation[] = [];
  const recommendations: string[] = [];
  const tracePath = path.join(__dirname, "traces", `${taskName}.json`);
  const candidatesDir = path.join(__dirname, "candidates", taskName);

  if (!fs.existsSync(tracePath)) return preWriteCheck(taskName);

  const candidates = fs.existsSync(candidatesDir)
    ? fs.readdirSync(candidatesDir).filter((f) => f.endsWith(".ts"))
    : [];
  const stats: Array<{ name: string; lines: number }> = [];

  for (const file of candidates) {
    const content = fs.readFileSync(path.join(candidatesDir, file), "utf-8");
    const lines = content
      .split("\n")
      .filter((l) => l.trim() && !l.trim().startsWith("//")).length;
    stats.push({ name: file, lines });
  }

  stats.sort((a, b) => a.lines - b.lines);

  if (stats.length > 0) {
    log.info("\n╔════════════════════════════════════════╗");
    log.info("║ 📊 即時排名（按行數）                    ║");
    log.info("╠════════════════════════════════════════╣");
    stats.forEach((s, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
      log.info(
        `║ ${medal} #${i + 1} ${s.name.padEnd(20)} ${String(s.lines).padStart(4)} 行 ║`,
      );
    });
    log.info("╚════════════════════════════════════════╝\n");
  }

  if (candidates.length < FORCE_EXPLORE.minVersions) {
    violations.push({
      law: 7,
      severity: "warning",
      message: `只有 ${candidates.length} 個版本`,
      penalty: FORCE_EXPLORE.singleVersionPenalty,
    });
  }

  return {
    passed: violations.filter((v) => v.severity === "fatal").length === 0,
    violations,
    totalPenalty: violations.reduce((s, v) => s + v.penalty, 0),
    recommendations,
  };
}

// ============================================================================
// Hook 3: finish
// ============================================================================

export function finishCheck(taskName: string): MidLawCheckResult {
  const violations: MidLawViolation[] = [];
  const recommendations: string[] = [];
  const tracePath = path.join(__dirname, "traces", `${taskName}.json`);

  if (!fs.existsSync(tracePath)) {
    return {
      passed: false,
      violations: [
        { law: 0, severity: "fatal", message: "沒有 trace", penalty: -100 },
      ],
      totalPenalty: -100,
      recommendations,
    };
  }

  const trace: TaskTrace = JSON.parse(fs.readFileSync(tracePath, "utf-8"));

  if (trace.failed < ANTI_REGRESSION.minFailedAttempts) {
    violations.push({
      law: 1,
      severity: "warning",
      message: `只有 ${trace.failed} 次失敗`,
      penalty: ANTI_REGRESSION.onePassPenalty,
    });
    recommendations.push("⚠️ 一次就成功 = 高風險投機標記");
  }

  if (trace.versions.length < FORCE_EXPLORE.minVersions) {
    violations.push({
      law: 7,
      severity: "error",
      message: `只有 ${trace.versions.length} 個版本`,
      penalty: FORCE_EXPLORE.singleVersionPenalty,
    });
  }

  return {
    passed:
      violations.filter((v) => v.severity === "fatal" || v.severity === "error")
        .length === 0,
    violations,
    totalPenalty: violations.reduce((s, v) => s + v.penalty, 0),
    recommendations,
  };
}

// ============================================================================
// 記錄嘗試
// ============================================================================

export function recordAttempt(
  taskName: string,
  versionName: string,
  success: boolean,
  metrics: Partial<VersionRecord>,
): void {
  const tracePath = path.join(__dirname, "traces", `${taskName}.json`);
  let trace: TaskTrace = fs.existsSync(tracePath)
    ? JSON.parse(fs.readFileSync(tracePath, "utf-8"))
    : { taskName, startTime: Date.now(), attempts: 0, failed: 0, versions: [] };

  trace.attempts++;
  if (!success) trace.failed++;

  const existing = trace.versions.find((v) => v.name === versionName);
  if (existing) {
    Object.assign(existing, metrics);
    existing.testsPassed = success;
    existing.fixRounds++;
  } else {
    trace.versions.push({
      name: versionName,
      createdAt: Date.now(),
      lines: metrics.lines || 0,
      avgRuntimeMs: metrics.avgRuntimeMs,
      testsPassed: success,
      eliminated: !success,
      eliminationReason: metrics.eliminationReason,
      writeDurationMs: metrics.writeDurationMs || 0,
      testRuns: 1,
      fixRounds: 0,
    });
  }

  fs.mkdirSync(path.dirname(tracePath), { recursive: true });
  fs.writeFileSync(tracePath, JSON.stringify(trace, null, 2));
}

// ============================================================================
// Graveyard
// ============================================================================

export function moveToGraveyard(taskName: string, versionName: string): void {
  const candidatesDir = path.join(__dirname, "candidates", taskName);
  const graveyardDir = path.join(__dirname, "graveyard", taskName);
  const sourcePath = path.join(candidatesDir, versionName);
  if (fs.existsSync(sourcePath)) {
    fs.mkdirSync(graveyardDir, { recursive: true });
    fs.renameSync(
      sourcePath,
      path.join(graveyardDir, `${Date.now()}-${versionName}`),
    );
    log.info(`☠️ ${versionName} → graveyard`);
  }
}

// ============================================================================
// CLI
// ============================================================================

function printResult(result: MidLawCheckResult): void {
  log.blank();
  if (result.violations.length > 0) {
    log.info("⚠️ 違規：");
    result.violations.forEach((v) => {
      const icon =
        v.severity === "fatal" ? "🔴" : v.severity === "error" ? "🟠" : "🟡";
      log.info(`  ${icon} 天條 ${v.law}: ${v.message} (${v.penalty} 分)`);
    });
  }
  if (result.recommendations.length > 0) {
    log.blank();
    log.info("💡 建議：");
    result.recommendations.forEach((r) => log.info(`  ${r}`));
  }
  log.blank();
  log.info(`📊 總扣分: ${result.totalPenalty}`);
  log.info(result.passed ? "✅ 檢查通過" : "❌ 檢查失敗");
}

const [, , command, taskName] = process.argv;

if (!command) {
  log.info("Usage: npx tsx arena/mid-law-runner.ts <command> <task>");
  log.info("Commands: pre-write, during, finish, check-code");
  process.exit(0);
}

switch (command) {
  case "pre-write":
    if (!taskName) {
      log.error("需要 task name");
      process.exit(1);
    }
    printResult(preWriteCheck(taskName));
    break;
  case "during":
    if (!taskName) {
      log.error("需要 task name");
      process.exit(1);
    }
    printResult(duringWriteCheck(taskName));
    break;
  case "finish":
    if (!taskName) {
      log.error("需要 task name");
      process.exit(1);
    }
    const r = finishCheck(taskName);
    printResult(r);
    process.exit(r.passed ? 0 : 1);
  default:
    log.error(`Unknown: ${command}`);
    process.exit(1);
}
