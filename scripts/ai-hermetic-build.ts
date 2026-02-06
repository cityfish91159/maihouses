// scripts/ai-hermetic-build.ts
// 9. Hermetic Build - 寫死強制執行
import fs from 'fs';
import { execSync } from 'child_process';

interface HermeticResult {
  nodeVersion: { expected: string; actual: string; match: boolean };
  lockfile: { exists: boolean; frozen: boolean };
  noLocalCache: boolean;
  dockerReady: boolean;
  pass: boolean;
}

// 9-1: Docker build - 固定 node 版本
export function checkNodeVersion(): { expected: string; actual: string; match: boolean } {
  const expected = '20'; // 專案要求的 Node 版本
  
  // 檢查 package.json 中的 engines
  let packageEngines = '';
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    packageEngines = pkg.engines?.node || '';
  }

  // 取得實際 Node 版本
  let actual = '';
  try {
    actual = execSync('node --version', { encoding: 'utf-8' }).trim().replace('v', '');
  } catch {
    actual = 'unknown';
  }

  const majorActual = actual.split('.')[0];
  const match = majorActual === expected || packageEngines.includes(expected);

  return { expected, actual, match };
}

// 9-2: frozen-lockfile
export function checkLockfile(): { exists: boolean; frozen: boolean } {
  const npmLock = fs.existsSync('package-lock.json');
  const pnpmLock = fs.existsSync('pnpm-lock.yaml');
  const yarnLock = fs.existsSync('yarn.lock');

  const exists = npmLock || pnpmLock || yarnLock;
  
  // 檢查 lockfile 是否有未提交的變更
  let frozen = true;
  try {
    const diff = execSync('git diff --name-only HEAD 2>/dev/null || true', { encoding: 'utf-8' });
    if (diff.includes('package-lock.json') || diff.includes('pnpm-lock.yaml') || diff.includes('yarn.lock')) {
      frozen = false;
    }
  } catch {
    frozen = true;
  }

  return { exists, frozen };
}

// 9-3: 禁止本地 cache
export function checkNoLocalCache(): boolean {
  // 檢查是否有 node_modules 被加入 git
  try {
    const trackedNodeModules = execSync('git ls-files node_modules 2>/dev/null || true', { encoding: 'utf-8' });
    if (trackedNodeModules.trim()) {
      return false;
    }
  } catch {
    // ignore
  }

  // 檢查 .gitignore 是否正確忽略
  if (fs.existsSync('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf-8');
    if (!gitignore.includes('node_modules')) {
      return false;
    }
  }

  return true;
}

// 檢查是否有 Dockerfile
export function checkDockerReady(): boolean {
  return fs.existsSync('Dockerfile') || fs.existsSync('docker-compose.yml');
}

// 建立 Dockerfile（如果不存在）
export function createDockerfile(): void {
  const dockerfile = `# Hermetic Build - 固定 Node 版本
FROM node:20-alpine

WORKDIR /app

# 複製 lockfile 先安裝依賴
COPY package*.json ./
COPY pnpm-lock.yaml* ./
COPY yarn.lock* ./

# 使用 frozen lockfile 安裝
RUN npm ci --frozen-lockfile || pnpm install --frozen-lockfile || yarn install --frozen-lockfile

# 複製原始碼
COPY . .

# 建置
RUN npm run build

# 執行
CMD ["npm", "start"]
`;

  if (!fs.existsSync('Dockerfile')) {
    fs.writeFileSync('Dockerfile', dockerfile);
    console.log('📦 已建立 Dockerfile');
  }
}

// 主執行函數
export function enforceHermeticBuild(taskId: string): void {
  console.log('🐳 執行 Hermetic Build 檢查...');

  const result: HermeticResult = {
    nodeVersion: checkNodeVersion(),
    lockfile: checkLockfile(),
    noLocalCache: checkNoLocalCache(),
    dockerReady: checkDockerReady(),
    pass: true
  };

  console.log(`
═══════════════════════════════════════════════════════════════
🐳 Hermetic Build 結果
═══════════════════════════════════════════════════════════════
9-1 Node 版本：
    期望：v${result.nodeVersion.expected}.x
    實際：v${result.nodeVersion.actual}
    狀態：${result.nodeVersion.match ? '✅ 符合' : '❌ 不符'}

9-2 Lockfile：
    存在：${result.lockfile.exists ? '✅ 是' : '❌ 否'}
    凍結：${result.lockfile.frozen ? '✅ 是' : '❌ 有變更'}

9-3 本地 Cache：
    狀態：${result.noLocalCache ? '✅ 無污染' : '❌ 有 node_modules 被追蹤'}

Docker Ready：${result.dockerReady ? '✅ 是' : '⚠️ 建議建立 Dockerfile'}
  `);

  // 判斷是否通過
  const errors: string[] = [];
  
  if (!result.nodeVersion.match) {
    errors.push('Node 版本不符合要求');
  }
  if (!result.lockfile.exists) {
    errors.push('缺少 lockfile (package-lock.json / pnpm-lock.yaml / yarn.lock)');
  }
  if (!result.lockfile.frozen) {
    errors.push('Lockfile 有未提交的變更');
  }
  if (!result.noLocalCache) {
    errors.push('node_modules 被 git 追蹤');
  }

  if (errors.length > 0) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║ ❌ Hermetic Build 失敗                                       ║
╠══════════════════════════════════════════════════════════════╣
${errors.map(e => `║ • ${e.padEnd(56)}║`).join('\n')}
╠══════════════════════════════════════════════════════════════╣
║ 「我本地可以過」= 無效                                       ║
║ 請確保 CI 環境可以重現建置                                   ║
╚══════════════════════════════════════════════════════════════╝
    `);
    result.pass = false;
  } else {
    console.log(`
───────────────────────────────────────────────────────────────
狀態：✅ 通過
═══════════════════════════════════════════════════════════════
    `);
  }

  // 如果沒有 Dockerfile，建議建立
  if (!result.dockerReady) {
    createDockerfile();
  }
}

// CLI
const taskId = process.argv[2] || 'default';
enforceHermeticBuild(taskId);
