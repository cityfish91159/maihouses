// scripts/ai-contract-test.ts
// 8. Contract Test / Schema Lock - 寫死強制執行
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface ContractResult {
  totalApis: number;
  withSchema: number;
  withoutSchema: number;
  violations: Array<{ file: string; api: string; issue: string }>;
  pass: boolean;
}

// 8-1: 所有 API 有 schema.ts
export function checkApiSchemas(): ContractResult {
  const result: ContractResult = {
    totalApis: 0,
    withSchema: 0,
    withoutSchema: 0,
    violations: [],
    pass: true
  };

  const apiDir = 'api';
  if (!fs.existsSync(apiDir)) {
    console.log('⚠️ 沒有 api/ 目錄');
    return result;
  }

  // 找所有 API 檔案
  const apiFiles = fs.readdirSync(apiDir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .filter(f => !f.includes('schema') && !f.includes('.test.') && !f.includes('.spec.'));

  for (const file of apiFiles) {
    result.totalApis++;
    const filePath = path.join(apiDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 檢查是否有對應的 schema
    const baseName = file.replace(/\.(ts|js)$/, '');
    const schemaFile = path.join(apiDir, `${baseName}.schema.ts`);
    const hasSchema = fs.existsSync(schemaFile);
    
    // 檢查是否 import 了 zod 或 schema
    const hasZod = content.includes('from \'zod\'') || content.includes('from "zod"');
    const hasSchemaImport = content.includes('.schema') || content.includes('Schema');
    
    if (hasSchema || hasZod || hasSchemaImport) {
      result.withSchema++;
    } else {
      result.withoutSchema++;
      result.violations.push({
        file: filePath,
        api: baseName,
        issue: '沒有對應的 schema.ts 或 Zod 驗證'
      });
    }
  }

  result.pass = result.violations.length === 0;
  return result;
}

// 8-2: 自動驗證 response
export function validateApiResponses(): Array<{ api: string; valid: boolean; error?: string }> {
  const results: Array<{ api: string; valid: boolean; error?: string }> = [];
  
  const apiDir = 'api';
  if (!fs.existsSync(apiDir)) return results;

  const apiFiles = fs.readdirSync(apiDir)
    .filter(f => f.endsWith('.ts'))
    .filter(f => !f.includes('schema') && !f.includes('.test.'));

  for (const file of apiFiles) {
    const filePath = path.join(apiDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 檢查是否有 response 型別驗證
    const hasTypeCheck = 
      content.includes('as Response') ||
      content.includes(': Response') ||
      content.includes('.parse(') ||
      content.includes('.safeParse(') ||
      content.includes('z.object');
    
    results.push({
      api: file,
      valid: hasTypeCheck,
      error: hasTypeCheck ? undefined : '缺少 response 型別驗證'
    });
  }

  return results;
}

// 8-3: 禁止偷改 API 格式
export function detectSchemaChanges(): Array<{ file: string; change: string }> {
  const changes: Array<{ file: string; change: string }> = [];
  
  try {
    // 取得 schema 檔案的變更
    const diff = execSync('git diff HEAD -- "*.schema.ts" "*/schema.ts" 2>/dev/null || true', { encoding: 'utf-8' });
    
    if (diff.trim()) {
      // 分析是否有重大變更
      const lines = diff.split('\n');
      let currentFile = '';
      
      for (const line of lines) {
        if (line.startsWith('diff --git')) {
          currentFile = line.split(' b/')[1] || '';
        }
        // 檢查是否刪除了 required 欄位或改變型別
        if (line.startsWith('-') && !line.startsWith('---')) {
          if (line.includes('required') || line.includes(': z.') || line.includes(': string') || line.includes(': number')) {
            changes.push({
              file: currentFile,
              change: `刪除或修改: ${line.substring(1).trim()}`
            });
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return changes;
}

// 主執行函數
export function enforceContractTest(taskId: string): void {
  console.log('📋 執行 Contract Test / Schema Lock...');

  // 8-1: 檢查 API schemas
  const schemaResult = checkApiSchemas();
  
  console.log(`
═══════════════════════════════════════════════════════════════
🔒 Contract Test / Schema Lock 結果
═══════════════════════════════════════════════════════════════
API 總數：${schemaResult.totalApis}
有 Schema：${schemaResult.withSchema}
缺 Schema：${schemaResult.withoutSchema}
  `);

  if (schemaResult.violations.length > 0) {
    console.log('⚠️ 缺少 Schema 的 API：');
    schemaResult.violations.forEach(v => {
      console.log(`   • ${v.file}: ${v.issue}`);
    });
  }

  // 8-2: 驗證 response
  const responseResults = validateApiResponses();
  const invalidResponses = responseResults.filter(r => !r.valid);
  
  if (invalidResponses.length > 0) {
    console.log('\n⚠️ 缺少 Response 驗證的 API：');
    invalidResponses.forEach(r => {
      console.log(`   • ${r.api}: ${r.error}`);
    });
  }

  // 8-3: 檢查 Schema 變更
  const schemaChanges = detectSchemaChanges();
  
  if (schemaChanges.length > 0) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║ ❌ 偵測到 Schema 變更                                        ║
╠══════════════════════════════════════════════════════════════╣
${schemaChanges.map(c => `║ • ${c.file.padEnd(56)}║\n║   ${c.change.substring(0, 55).padEnd(55)}║`).join('\n')}
╠══════════════════════════════════════════════════════════════╣
║ 禁止偷改 API 格式！需要版本升級或明確核准                    ║
╚══════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }

  console.log(`
───────────────────────────────────────────────────────────────
狀態：${schemaResult.pass ? '✅ 通過' : '⚠️ 有警告'}
═══════════════════════════════════════════════════════════════
  `);
}

// CLI
const taskId = process.argv[2] || 'default';
enforceContractTest(taskId);
