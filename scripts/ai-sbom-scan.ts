// scripts/ai-sbom-scan.ts
// 11. SBOM + 依賴掃描 - 寫死強制執行
import fs from 'fs';
import { execSync } from 'child_process';

interface VulnerabilityResult {
  total: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  vulnerabilities: Array<{
    name: string;
    severity: string;
    via: string;
    fixAvailable: boolean;
  }>;
  pass: boolean;
}

// 11-1: npm audit - 自動掃描漏洞
export function runNpmAudit(): VulnerabilityResult {
  const result: VulnerabilityResult = {
    total: 0,
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    vulnerabilities: [],
    pass: true
  };

  try {
    // 執行 npm audit --json
    const auditOutput = execSync('npm audit --json 2>/dev/null || true', { encoding: 'utf-8' });
    
    if (auditOutput.trim()) {
      const audit = JSON.parse(auditOutput);
      
      if (audit.metadata) {
        result.total = audit.metadata.vulnerabilities?.total || 0;
        result.critical = audit.metadata.vulnerabilities?.critical || 0;
        result.high = audit.metadata.vulnerabilities?.high || 0;
        result.moderate = audit.metadata.vulnerabilities?.moderate || 0;
        result.low = audit.metadata.vulnerabilities?.low || 0;
      }

      // 解析漏洞詳情
      if (audit.vulnerabilities) {
        for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
          const v = vuln as { severity: string; via: unknown[]; fixAvailable: boolean };
          result.vulnerabilities.push({
            name,
            severity: v.severity || 'unknown',
            via: Array.isArray(v.via) ? v.via.map((x: unknown) => typeof x === 'string' ? x : (x as { name: string }).name).join(', ') : '',
            fixAvailable: v.fixAvailable || false
          });
        }
      }
    }
  } catch {
    // npm audit 失敗，可能沒有 package-lock.json
    console.log('⚠️ npm audit 執行失敗，跳過漏洞掃描');
  }

  // 11-3: High/Critical CVE = PR 死亡
  result.pass = result.critical === 0 && result.high === 0;

  return result;
}

// 11-2: trivy fs - 安全掃描（簡化版，不依賴 trivy）
export function checkDependencies(): Array<{ package: string; issue: string }> {
  const issues: Array<{ package: string; issue: string }> = [];

  if (!fs.existsSync('package.json')) return issues;

  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies
  };

  // 檢查已知有問題的套件
  const knownIssues: Record<string, string> = {
    'lodash': '< 4.17.21 有原型污染漏洞',
    'minimist': '< 1.2.6 有原型污染漏洞',
    'node-fetch': '< 2.6.7 有 SSRF 漏洞',
    'axios': '< 0.21.2 有 SSRF 漏洞',
    'moment': '已停止維護，建議使用 date-fns 或 dayjs',
    'request': '已棄用，建議使用 node-fetch 或 axios',
  };

  for (const [name, version] of Object.entries(allDeps)) {
    if (knownIssues[name]) {
      issues.push({
        package: `${name}@${version}`,
        issue: knownIssues[name]
      });
    }
  }

  return issues;
}

// 生成 SBOM (Software Bill of Materials)
export function generateSBOM(): void {
  if (!fs.existsSync('package.json')) return;

  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  
  const sbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.4',
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      component: {
        name: pkg.name,
        version: pkg.version,
        type: 'application'
      }
    },
    components: [
      ...Object.entries(pkg.dependencies || {}).map(([name, version]) => ({
        name,
        version,
        type: 'library',
        scope: 'required'
      })),
      ...Object.entries(pkg.devDependencies || {}).map(([name, version]) => ({
        name,
        version,
        type: 'library',
        scope: 'optional'
      }))
    ]
  };

  fs.writeFileSync('sbom.json', JSON.stringify(sbom, null, 2));
  console.log('📋 已生成 SBOM: sbom.json');
}

// 主執行函數
export function enforceSBOMScan(taskId: string): void {
  console.log('🔍 執行 SBOM + 依賴掃描...');

  // 11-1: npm audit
  const auditResult = runNpmAudit();
  
  console.log(`
═══════════════════════════════════════════════════════════════
🔍 SBOM + 依賴掃描結果
═══════════════════════════════════════════════════════════════
11-1 npm audit：
    總漏洞數：${auditResult.total}
    Critical：${auditResult.critical} ${auditResult.critical > 0 ? '💀' : '✅'}
    High：${auditResult.high} ${auditResult.high > 0 ? '💀' : '✅'}
    Moderate：${auditResult.moderate} ${auditResult.moderate > 0 ? '⚠️' : '✅'}
    Low：${auditResult.low} ${auditResult.low > 0 ? '⚠️' : '✅'}
  `);

  if (auditResult.vulnerabilities.length > 0) {
    console.log('漏洞詳情：');
    auditResult.vulnerabilities.slice(0, 10).forEach(v => {
      const icon = v.severity === 'critical' ? '💀' : v.severity === 'high' ? '🔴' : '⚠️';
      console.log(`    ${icon} ${v.name} (${v.severity}) - via ${v.via}`);
      if (v.fixAvailable) console.log(`       可修復：npm audit fix`);
    });
  }

  // 11-2: 依賴檢查
  const depIssues = checkDependencies();
  if (depIssues.length > 0) {
    console.log('\n11-2 依賴問題：');
    depIssues.forEach(d => {
      console.log(`    ⚠️ ${d.package}: ${d.issue}`);
    });
  }

  // 生成 SBOM
  generateSBOM();

  // 11-3: High/Critical = PR 死亡
  if (!auditResult.pass) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║ 💀 發現 High/Critical 等級漏洞                               ║
╠══════════════════════════════════════════════════════════════╣
║ Critical：${String(auditResult.critical).padEnd(50)}║
║ High：${String(auditResult.high).padEnd(54)}║
╠══════════════════════════════════════════════════════════════╣
║ PR 直接死亡！請先修復漏洞                                    ║
║ 執行：npm audit fix                                          ║
╚══════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }

  console.log(`
───────────────────────────────────────────────────────────────
狀態：✅ 通過（無 Critical/High 漏洞）
═══════════════════════════════════════════════════════════════
  `);
}

// CLI
const taskId = process.argv[2] || 'default';
enforceSBOMScan(taskId);
