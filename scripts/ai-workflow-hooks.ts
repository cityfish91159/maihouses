#!/usr/bin/env npx ts-node

/**
 * AI Workflow Hooks v1.0
 * 強制執行工具搜尋和品質檢查
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// 定義顏色輸出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// 日誌輸出
function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logBox(title: string, content: string[]): void {
  const width = 60;
  const border = '═'.repeat(width);
  
  log(`╔${border}╗`, 'cyan');
  log(`║ ${title.padEnd(width - 1)}║`, 'cyan');
  log(`╠${border}╣`, 'cyan');
  
  content.forEach(line => {
    log(`║ ${line.padEnd(width - 1)}║`, 'cyan');
  });
  
  log(`╚${border}╝`, 'cyan');
}

// 檢查 SkillsMP MCP 是否可用
function checkSkillsMPAvailable(): boolean {
  const mcpConfigPath = path.join(process.cwd(), '.mcp.json');
  
  if (!fs.existsSync(mcpConfigPath)) {
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
    return !!config.mcpServers?.skillsmp;
  } catch {
    return false;
  }
}

// 前置任務檢查
function preTaskCheck(taskDescription: string): void {
  log('\n🔍 AI Workflow Pre-Task Hook', 'bold');
  log('═'.repeat(50), 'cyan');
  
  // 檢查 SkillsMP
  const skillsmpAvailable = checkSkillsMPAvailable();
  
  if (!skillsmpAvailable) {
    logBox('⚠️ 警告', [
      'SkillsMP MCP 伺服器未配置！',
      '',
      '請確保 .mcp.json 包含 skillsmp 配置',
      '並重新載入 VS Code 視窗',
    ]);
    return;
  }
  
  // 顯示任務檢查清單
  logBox('📋 任務開始前必須完成', [
    '□ 使用 search_skills 或 ai_search_skills 搜尋工具',
    '□ 閱讀所有相關的代碼檔案',
    '□ 閱讀相關的文件和規格',
    '□ 列出完整的工作清單',
    '',
    `📝 任務：${taskDescription}`,
    '',
    '⚠️ 沒有完成以上步驟 = 任務失敗',
  ]);
  
  // 提供搜尋關鍵字建議
  const keywords = suggestKeywords(taskDescription);
  if (keywords.length > 0) {
    log('\n💡 建議搜尋的關鍵字:', 'yellow');
    keywords.forEach(kw => log(`   • ${kw}`, 'cyan'));
  }
}

// 根據任務描述建議關鍵字
function suggestKeywords(taskDescription: string): string[] {
  const keywords: string[] = [];
  const lowerTask = taskDescription.toLowerCase();
  
  // 前端相關
  if (lowerTask.includes('component') || lowerTask.includes('組件') || lowerTask.includes('ui')) {
    keywords.push('react', 'component', 'tailwind');
  }
  
  // API 相關
  if (lowerTask.includes('api') || lowerTask.includes('端點') || lowerTask.includes('endpoint')) {
    keywords.push('api', 'rest', 'fetch');
  }
  
  // 資料庫相關
  if (lowerTask.includes('database') || lowerTask.includes('資料庫') || lowerTask.includes('supabase')) {
    keywords.push('database', 'supabase', 'postgres');
  }
  
  // 測試相關
  if (lowerTask.includes('test') || lowerTask.includes('測試')) {
    keywords.push('test', 'jest', 'playwright');
  }
  
  // AI 相關
  if (lowerTask.includes('ai') || lowerTask.includes('llm') || lowerTask.includes('chat')) {
    keywords.push('openai', 'claude', 'llm');
  }
  
  // 認證相關
  if (lowerTask.includes('auth') || lowerTask.includes('認證') || lowerTask.includes('登入')) {
    keywords.push('auth', 'authentication', 'jwt');
  }
  
  // 預設
  if (keywords.length === 0) {
    keywords.push('utility', 'helper');
  }
  
  return [...new Set(keywords)];
}

// 後置任務檢查
async function postTaskCheck(): Promise<boolean> {
  log('\n🔍 AI Workflow Post-Task Hook', 'bold');
  log('═'.repeat(50), 'cyan');
  
  let allPassed = true;
  
  // TypeScript 類型檢查
  log('\n📋 執行 TypeScript 類型檢查...', 'yellow');
  try {
    execSync('npm run typecheck', { stdio: 'inherit' });
    log('✓ TypeScript 類型檢查通過', 'green');
  } catch {
    log('✗ TypeScript 類型檢查失敗', 'red');
    allPassed = false;
  }
  
  // ESLint 檢查
  log('\n📋 執行 ESLint 檢查...', 'yellow');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    log('✓ ESLint 檢查通過', 'green');
  } catch {
    log('✗ ESLint 檢查失敗', 'red');
    allPassed = false;
  }
  
  // Build 檢查
  log('\n📋 執行 Build 檢查...', 'yellow');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('✓ Build 檢查通過', 'green');
  } catch {
    log('✗ Build 檢查失敗', 'red');
    allPassed = false;
  }
  
  // 總結
  if (allPassed) {
    logBox('✅ 任務完成', [
      '所有檢查都已通過！',
      '',
      '✓ TypeScript 類型檢查',
      '✓ ESLint 代碼風格',
      '✓ Build 構建檢查',
    ]);
  } else {
    logBox('❌ 任務未完成', [
      '部分檢查未通過！',
      '',
      '請修復所有錯誤後再提交。',
    ]);
  }
  
  return allPassed;
}

// 檢查代碼品質
function checkCodeQuality(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    log(`⚠️ 檔案不存在: ${filePath}`, 'yellow');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues: string[] = [];
  
  // 檢查 any 類型
  if (/:\s*any\b/.test(content)) {
    issues.push('發現 "any" 類型，請使用明確類型');
  }
  
  // 檢查空的 catch
  if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(content)) {
    issues.push('發現空的 catch 區塊，請處理錯誤');
  }
  
  // 檢查硬編碼密鑰
  if (/['"`](sk-|api_key|secret)[^'"`]*['"`]/i.test(content)) {
    issues.push('可能有硬編碼的密鑰，請使用環境變數');
  }
  
  // 檢查 console.log
  if (/console\.log\(/.test(content) && !filePath.includes('test')) {
    issues.push('發現 console.log，請移除或改用 console.error');
  }
  
  if (issues.length > 0) {
    log(`\n⚠️ 代碼品質問題 (${filePath}):`, 'yellow');
    issues.forEach(issue => log(`   • ${issue}`, 'red'));
  } else {
    log(`✓ ${filePath} 品質檢查通過`, 'green');
  }
}

// 主入口
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'pre-task':
      preTaskCheck(args.slice(1).join(' ') || '未指定任務');
      break;
      
    case 'post-task':
      const passed = await postTaskCheck();
      process.exit(passed ? 0 : 1);
      break;
      
    case 'check-code':
      const files = args.slice(1);
      files.forEach(file => checkCodeQuality(file));
      break;
      
    case 'check-skillsmp':
      const available = checkSkillsMPAvailable();
      if (available) {
        log('✓ SkillsMP MCP 伺服器已配置', 'green');
      } else {
        log('✗ SkillsMP MCP 伺服器未配置', 'red');
        process.exit(1);
      }
      break;
      
    default:
      log('AI Workflow Hooks v1.0', 'bold');
      log('\n使用方式:', 'cyan');
      log('  npx ts-node scripts/ai-workflow-hooks.ts pre-task "任務描述"', 'reset');
      log('  npx ts-node scripts/ai-workflow-hooks.ts post-task', 'reset');
      log('  npx ts-node scripts/ai-workflow-hooks.ts check-code <file1> <file2>', 'reset');
      log('  npx ts-node scripts/ai-workflow-hooks.ts check-skillsmp', 'reset');
      break;
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});