#!/usr/bin/env node
/**
 * Skill Installer
 *
 * 從市集下載並安裝 skills
 *
 * Usage: node install-skill.js <skill-url> [--temp]
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * 安裝 skill
 * @param {string} skillUrl - SKILL.md 的 URL
 * @param {object} options - 安裝選項
 * @returns {Promise<object>} - 安裝結果
 */
async function installSkill(skillUrl, options = {}) {
  const { temporary = false, targetDir = null, force = false } = options;

  console.log(`📥 開始安裝 skill...`);
  console.log(`   URL: ${skillUrl}`);
  console.log(`   模式: ${temporary ? '臨時' : '永久'}\n`);

  try {
    // 1. 下載 SKILL.md
    console.log('⏳ 下載 SKILL.md...');
    const content = await downloadFile(skillUrl);

    // 2. 解析 frontmatter
    console.log('🔍 解析 frontmatter...');
    const { metadata, body } = parseFrontmatter(content);

    if (!metadata.name) {
      throw new Error('SKILL.md 缺少 name 欄位');
    }

    console.log(`✅ Skill name: ${metadata.name}`);
    console.log(`   Description: ${metadata.description}`);
    console.log(`   Allowed tools: ${metadata['allowed-tools'] || 'N/A'}\n`);

    // 3. 安全檢查
    console.log('🛡️  執行安全檢查...');
    const safetyCheck = performSafetyCheck(metadata, body);

    if (!safetyCheck.safe) {
      console.warn('⚠️  安全檢查警告:');
      safetyCheck.warnings.forEach((w) => console.warn(`   - ${w}`));

      if (!force && safetyCheck.critical) {
        throw new Error('安全檢查失敗，使用 --force 強制安裝');
      }
    } else {
      console.log('✅ 安全檢查通過\n');
    }

    // 4. 決定安裝目錄
    const skillsDir = path.join(process.cwd(), '.claude', 'skills');
    const installDir =
      targetDir ||
      path.join(skillsDir, temporary ? 'marketplace-temp' : 'marketplace', metadata.name);

    // 5. 檢查是否已存在
    if (fs.existsSync(installDir) && !force) {
      console.log(`⚠️  Skill 已存在: ${installDir}`);
      console.log('   使用 --force 覆蓋安裝\n');
      return {
        success: false,
        reason: 'already_exists',
        path: installDir,
      };
    }

    // 6. 創建目錄並寫入檔案
    console.log(`📁 安裝到: ${installDir}`);
    fs.mkdirSync(installDir, { recursive: true });

    const skillPath = path.join(installDir, 'SKILL.md');
    fs.writeFileSync(skillPath, content, 'utf8');

    console.log('✅ 安裝成功！\n');

    // 7. 返回結果
    return {
      success: true,
      name: metadata.name,
      path: installDir,
      skillPath: skillPath,
      temporary: temporary,
      metadata: metadata,
    };
  } catch (error) {
    console.error('❌ 安裝失敗:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 下載檔案
 */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          // 處理重定向
          return downloadFile(res.headers.location).then(resolve).catch(reject);
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

/**
 * 解析 YAML frontmatter
 */
function parseFrontmatter(content) {
  const lines = content.split('\n');

  if (lines[0] !== '---') {
    return { metadata: {}, body: content };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { metadata: {}, body: content };
  }

  const frontmatter = lines.slice(1, endIndex).join('\n');
  const body = lines.slice(endIndex + 1).join('\n');

  // 簡單的 YAML 解析
  const metadata = {};
  frontmatter.split('\n').forEach((line) => {
    const match = line.match(/^(\S+):\s*(.+)$/);
    if (match) {
      metadata[match[1]] = match[2].trim();
    }
  });

  return { metadata, body };
}

/**
 * 安全檢查
 */
function performSafetyCheck(metadata, body) {
  const warnings = [];
  let critical = false;

  // 檢查 allowed-tools
  const allowedTools = metadata['allowed-tools'] || '';
  const dangerousTools = ['Bash(rm', 'Bash(sudo', 'Write(/etc', 'Write(/sys'];

  dangerousTools.forEach((tool) => {
    if (allowedTools.includes(tool)) {
      warnings.push(`包含危險工具: ${tool}`);
      critical = true;
    }
  });

  // 檢查 body 是否有可疑內容
  const suspiciousPatterns = [
    /curl.*\|\s*bash/i,
    /eval\(/i,
    /process\.env\[['"]PASSWORD['"]\]/i,
    /rm\s+-rf\s+\//,
  ];

  suspiciousPatterns.forEach((pattern) => {
    if (pattern.test(body)) {
      warnings.push(`包含可疑模式: ${pattern}`);
      critical = true;
    }
  });

  // 檢查是否有外部連結
  const externalLinks = body.match(/https?:\/\/[^\s)]+/g) || [];
  const suspiciousDomains = externalLinks.filter(
    (link) =>
      !link.includes('github.com') &&
      !link.includes('skillsmp.com') &&
      !link.includes('anthropic.com')
  );

  if (suspiciousDomains.length > 0) {
    warnings.push(`包含外部連結: ${suspiciousDomains.join(', ')}`);
  }

  return {
    safe: warnings.length === 0,
    warnings: warnings,
    critical: critical,
  };
}

/**
 * 移除 skill
 */
function uninstallSkill(skillName) {
  const skillsDir = path.join(process.cwd(), '.claude', 'skills');
  const paths = [
    path.join(skillsDir, 'marketplace-temp', skillName),
    path.join(skillsDir, 'marketplace', skillName),
  ];

  for (const skillPath of paths) {
    if (fs.existsSync(skillPath)) {
      fs.rmSync(skillPath, { recursive: true, force: true });
      console.log(`🗑️  已移除: ${skillPath}`);
      return true;
    }
  }

  console.log(`⚠️  未找到: ${skillName}`);
  return false;
}

// CLI 模式
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === 'uninstall') {
    const skillName = args[1];
    if (!skillName) {
      console.error('Usage: node install-skill.js uninstall <skill-name>');
      process.exit(1);
    }
    uninstallSkill(skillName);
  } else {
    const skillUrl = args[0];
    if (!skillUrl) {
      console.error('Usage: node install-skill.js <skill-url> [--temp] [--force]');
      process.exit(1);
    }

    const options = {
      temporary: args.includes('--temp'),
      force: args.includes('--force'),
    };

    installSkill(skillUrl, options).then((result) => {
      if (result.success) {
        console.log('🎉 Skill 安裝完成！');
        console.log(`\n使用方式:`);
        console.log(`  在對話中提到 "${result.name}" 相關的任務`);
        console.log(`  或明確呼叫: /skill ${result.name}\n`);
      } else {
        console.error(`\n安裝失敗: ${result.reason || result.error}`);
        process.exit(1);
      }
    });
  }
}

module.exports = { installSkill, uninstallSkill, performSafetyCheck };
