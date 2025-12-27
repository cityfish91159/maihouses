// scripts/ai-laziness-detector.ts
// 4. 兩次偷懶機制 - 寫死強制執行
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface LazyBehavior {
  type: string;
  file: string;
  detail: string;
}

interface TaskStatus {
  taskId: string;
  lastUpdate: string;
  completed: number[];
  inProgress: number | null;
  score: number;
  lazyCount: number;
  lazyHistory: LazyBehavior[];
}

// 4-1: 寫了組件沒整合
function checkUnintegratedComponents(changedFiles: string[]): LazyBehavior[] {
  const lazy: LazyBehavior[] = [];
  
  for (const file of changedFiles) {
    if (!file.endsWith('.tsx') || !file.includes('components/')) continue;
    
    const componentName = path.basename(file, '.tsx');
    
    // 搜尋是否有 import 這個組件
    try {
      const grep = execSync(
        `grep -r "import.*${componentName}" src/ --include="*.tsx" 2>/dev/null | grep -v "${file}"`,
        { encoding: 'utf-8' }
      );
      if (!grep.trim()) {
        lazy.push({
          type: '寫了組件沒整合',
          file,
          detail: `${componentName} 沒有被任何檔案 import`
        });
      }
    } catch {
      lazy.push({
        type: '寫了組件沒整合',
        file,
        detail: `${componentName} 沒有被任何檔案 import`
      });
    }
  }
  
  return lazy;
}

// 4-2: import 錯誤路徑
function checkWrongImports(changedFiles: string[]): LazyBehavior[] {
  const lazy: LazyBehavior[] = [];
  
  for (const file of changedFiles) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf-8');
    
    // 找所有 import
    const imports = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
    for (const imp of imports) {
      const importPath = imp.match(/from\s+['"]([^'"]+)['"]/)?.[1];
      if (!importPath) continue;
      
      // 跳過 node_modules
      if (!importPath.startsWith('.') && !importPath.startsWith('@/')) continue;
      
      // 檢查相對路徑
      if (importPath.startsWith('.')) {
        const resolvedPath = path.resolve(path.dirname(file), importPath);
        const possiblePaths = [
          resolvedPath,
          resolvedPath + '.ts',
          resolvedPath + '.tsx',
          resolvedPath + '/index.ts',
          resolvedPath + '/index.tsx'
        ];
        
        const exists = possiblePaths.some(p => fs.existsSync(p));
        if (!exists) {
          lazy.push({
            type: 'import 錯誤路徑',
            file,
            detail: `找不到 ${importPath}`
          });
        }
      }
    }
  }
  
  return lazy;
}

// 4-3: 只寫 UI 不寫邏輯
function checkUIOnlyComponents(changedFiles: string[]): LazyBehavior[] {
  const lazy: LazyBehavior[] = [];
  
  for (const file of changedFiles) {
    if (!file.endsWith('.tsx')) continue;
    if (!fs.existsSync(file)) continue;
    
    const content = fs.readFileSync(file, 'utf-8');
    
    // 如果有 onClick, onSubmit, onChange 但沒有實際邏輯
    const hasHandlers = /on(Click|Submit|Change)\s*=\s*\{/.test(content);
    const hasEmptyHandlers = /on(Click|Submit|Change)\s*=\s*\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/.test(content);
    const hasConsoleOnly = /on(Click|Submit|Change)\s*=\s*\{\s*\(\)\s*=>\s*console\.log/.test(content);
    
    if (hasHandlers && (hasEmptyHandlers || hasConsoleOnly)) {
      lazy.push({
        type: '只寫 UI 不寫邏輯',
        file,
        detail: '事件處理器是空的或只有 console.log'
      });
    }
  }
  
  return lazy;
}

// 4-4: 寫了沒用的代碼
function checkUnusedCode(changedFiles: string[]): LazyBehavior[] {
  const lazy: LazyBehavior[] = [];
  
  for (const file of changedFiles) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf-8');
    
    // 檢查未使用的 import
    const importMatches = content.match(/import\s+\{([^}]+)\}/g) || [];
    for (const imp of importMatches) {
      const names = imp.match(/import\s+\{([^}]+)\}/)?.[1];
      if (!names) continue;
      
      const importedNames = names.split(',').map(n => n.trim().split(' as ')[0].trim());
      for (const name of importedNames) {
        // 計算在檔案中出現的次數（排除 import 行）
        const contentWithoutImports = content.replace(/import\s+.*from.*/g, '');
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        const count = (contentWithoutImports.match(regex) || []).length;
        
        if (count === 0) {
          lazy.push({
            type: '寫了沒用的代碼',
            file,
            detail: `import 了 ${name} 但沒使用`
          });
        }
      }
    }
  }
  
  return lazy;
}

// 4-5: 改了檔案沒測試 (檢查是否有對應的 .test.ts 或 .spec.ts)
function checkNoTests(changedFiles: string[]): LazyBehavior[] {
  const lazy: LazyBehavior[] = [];
  
  for (const file of changedFiles) {
    if (file.includes('.test.') || file.includes('.spec.')) continue;
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
    if (file.includes('scripts/')) continue; // 跳過 scripts
    
    const testFile1 = file.replace(/\.(ts|tsx)$/, '.test.$1');
    const testFile2 = file.replace(/\.(ts|tsx)$/, '.spec.$1');
    
    if (!fs.existsSync(testFile1) && !fs.existsSync(testFile2)) {
      lazy.push({
        type: '改了檔案沒測試',
        file,
        detail: `沒有對應的測試檔案`
      });
    }
  }
  
  return lazy;
}

// 主檢測函數
export function detectLaziness(taskId: string): void {
  const statusPath = path.join('ai-tasks', taskId, 'status.json');
  
  if (!fs.existsSync(statusPath)) {
    console.error('❌ 找不到 status.json');
    process.exit(1);
  }
  
  const status: TaskStatus = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  if (!status.lazyHistory) status.lazyHistory = [];
  
  // 取得修改的檔案
  let changedFiles: string[] = [];
  try {
    const diff = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
    changedFiles = diff.split('\n').filter(Boolean);
  } catch {
    changedFiles = [];
  }
  
  if (changedFiles.length === 0) {
    console.log('⚠️ 沒有修改的檔案');
    return;
  }
  
  // 執行所有檢測
  const allLazy: LazyBehavior[] = [
    ...checkUnintegratedComponents(changedFiles),
    ...checkWrongImports(changedFiles),
    ...checkUIOnlyComponents(changedFiles),
    ...checkUnusedCode(changedFiles),
    // checkNoTests 暫時停用，因為專案可能沒有測試
    // ...checkNoTests(changedFiles),
  ];
  
  if (allLazy.length > 0) {
    status.lazyCount = (status.lazyCount || 0) + 1;
    status.lazyHistory.push(...allLazy);
    status.lastUpdate = new Date().toISOString();
    
    // 4-6: 第一次 = 警告
    if (status.lazyCount === 1) {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║ ⚠️ 偵測到偷懶行為（第 1 次警告）                             ║
╠══════════════════════════════════════════════════════════════╣
${allLazy.map(l => `║ • ${l.type}: ${l.file.substring(0, 40).padEnd(40)}║\n║   ${l.detail.substring(0, 55).padEnd(55)}║`).join('\n')}
╠══════════════════════════════════════════════════════════════╣
║ ⚠️ 再偷懶一次就清除所有代碼！                                ║
╚══════════════════════════════════════════════════════════════╝
      `);
      fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    }
    // 4-7: 第二次 = 清除所有代碼
    else if (status.lazyCount >= 2) {
      console.error(`
╔══════════════════════════════════════════════════════════════╗
║ 💀 第二次偷懶 - 執行清除                                     ║
╠══════════════════════════════════════════════════════════════╣
${allLazy.map(l => `║ • ${l.type}: ${l.file.substring(0, 40).padEnd(40)}║`).join('\n')}
╠══════════════════════════════════════════════════════════════╣
║ 執行：git checkout .                                         ║
║ 下次別他媽的偷懶！                                           ║
╚══════════════════════════════════════════════════════════════╝
      `);
      fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
      execSync('git checkout .', { stdio: 'inherit' });
      process.exit(1);
    }
  } else {
    console.log('✅ 沒有偵測到偷懶行為');
  }
}

// CLI
const taskId = process.argv[2];
if (!taskId) {
  console.error('用法: npx ts-node scripts/ai-laziness-detector.ts TASK-xxx');
  process.exit(1);
}
detectLaziness(taskId);
