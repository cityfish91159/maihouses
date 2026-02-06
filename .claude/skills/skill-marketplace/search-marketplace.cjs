#!/usr/bin/env node
/**
 * Skill Marketplace Search API (Fixed Version)
 *
 * 從 skillsmp.com 搜尋真實的 skills
 *
 * Usage: node search-marketplace.cjs "testing" [category] [limit]
 */

const https = require('https');

/**
 * 從 skillsmp.com URL 解析出 GitHub raw URL
 *
 * skillsmp URL: anthropics-claude-code-plugins-plugin-dev-skills-hook-development-skill-md
 * GitHub path: anthropics/claude-code/main/plugins/plugin-dev/skills/hook-development/SKILL.md
 */
function skillsmpToGithubRaw(skillsmpSlug) {
  // 解析 slug: owner-repo-path-skill-md
  // Example: anthropics-claude-code-plugins-plugin-dev-skills-hook-development-skill-md

  const parts = skillsmpSlug.replace(/-skill-md$/, '').split('-');

  // 找到 owner 和 repo（通常是前兩個部分）
  // 但有些 repo 名稱包含連字號，需要特殊處理

  // 常見模式：{owner}-{repo}-{path...}
  // anthropics-claude-code-plugins-...
  // pytorch-pytorch-claude-skills-...
  // metabase-metabase-claude-skills-...

  if (parts.length < 3) return null;

  const owner = parts[0];
  const repo = parts[1];
  const pathParts = parts.slice(2);
  const path = pathParts.join('/');

  return {
    owner,
    repo,
    path,
    rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}/SKILL.md`,
    githubUrl: `https://github.com/${owner}/${repo}/tree/main/${path}`,
  };
}

/**
 * 使用 skillsmp.com 的 API 搜尋（如果有）或解析頁面
 */
async function searchSkillsmpApi(query, options = {}) {
  const { category = null, limit = 10 } = options;

  // skillsmp.com 的搜尋 API endpoint
  const baseUrl = 'https://skillsmp.com';
  const searchPath = category
    ? `/api/skills?category=${encodeURIComponent(category)}&q=${encodeURIComponent(query)}&limit=${limit}`
    : `/api/skills?q=${encodeURIComponent(query)}&limit=${limit}`;

  return new Promise((resolve, reject) => {
    const url = new URL(searchPath, baseUrl);

    https
      .get(
        url.toString(),
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Claude-Code-Skill-Marketplace/1.0',
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json);
            } catch (e) {
              // API 可能不存在，返回空
              resolve({ skills: [] });
            }
          });
        }
      )
      .on('error', (e) => {
        resolve({ skills: [] });
      });
  });
}

/**
 * 從已知的熱門 repos 搜尋 skills（備用方案）
 */
async function searchGithubSkills(query, options = {}) {
  const { limit = 10 } = options;

  // 已知有 skills 的 repos
  const knownRepos = [
    { owner: 'anthropics', repo: 'claude-code', path: 'plugins' },
    { owner: 'anthropics', repo: 'skills', path: '' },
  ];

  const results = [];

  for (const repo of knownRepos) {
    const apiUrl = `https://api.github.com/search/code?q=${encodeURIComponent(query)}+filename:SKILL.md+repo:${repo.owner}/${repo.repo}`;

    try {
      const response = await new Promise((resolve, reject) => {
        https
          .get(
            apiUrl,
            {
              headers: {
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'Claude-Code-Skill-Marketplace/1.0',
              },
            },
            (res) => {
              let data = '';
              res.on('data', (chunk) => (data += chunk));
              res.on('end', () => {
                try {
                  resolve(JSON.parse(data));
                } catch (e) {
                  resolve({ items: [] });
                }
              });
            }
          )
          .on('error', () => resolve({ items: [] }));
      });

      if (response.items) {
        for (const item of response.items.slice(0, limit)) {
          const pathParts = item.path.split('/');
          pathParts.pop(); // 移除 SKILL.md
          const skillPath = pathParts.join('/');
          const skillName = pathParts[pathParts.length - 1] || 'unknown';

          results.push({
            name: skillName,
            description: `Skill from ${repo.owner}/${repo.repo}`,
            owner: repo.owner,
            repo: repo.repo,
            path: skillPath,
            rawUrl: `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/main/${skillPath}/SKILL.md`,
            githubUrl: `https://github.com/${repo.owner}/${repo.repo}/tree/main/${skillPath}`,
            stars: 0,
            updated: new Date().toISOString().split('T')[0],
          });
        }
      }
    } catch (e) {
      console.error(`Error searching ${repo.owner}/${repo.repo}:`, e.message);
    }
  }

  return results.slice(0, limit);
}

/**
 * 主搜尋函數
 */
async function searchMarketplace(query, options = {}) {
  const { category = null, limit = 10 } = options;

  console.log(`\n🔍 搜尋市集: "${query}"`);
  console.log(`   分類: ${category || '全部'}`);
  console.log(`   結果數量: ${limit}\n`);

  // 方案 1: 嘗試 skillsmp.com API
  console.log('⏳ 嘗試 skillsmp.com API...');
  let results = [];

  const apiResults = await searchSkillsmpApi(query, options);
  if (apiResults.skills && apiResults.skills.length > 0) {
    console.log(`✅ 從 skillsmp.com API 找到 ${apiResults.skills.length} 個結果`);
    results = apiResults.skills.map((skill) => ({
      ...skill,
      ...skillsmpToGithubRaw(skill.slug || skill.id || ''),
    }));
  }

  // 方案 2: 如果 API 沒結果，使用 GitHub 搜尋
  if (results.length === 0) {
    console.log('⏳ API 無結果，嘗試 GitHub 搜尋...');
    results = await searchGithubSkills(query, options);
  }

  // 方案 3: 提供手動安裝指引
  if (results.length === 0) {
    console.log('\n⚠️  沒有找到自動化結果');
    console.log('\n📖 手動搜尋方式:');
    console.log('   1. 前往 https://skillsmp.com');
    console.log(`   2. 搜尋 "${query}"`);
    console.log('   3. 點擊想要的 skill');
    console.log('   4. 複製 GitHub URL 或下載 skill.zip');
    console.log('\n📥 手動安裝:');
    console.log('   node .claude/skills/skill-marketplace/install-skill.cjs <github-raw-url>');
    return [];
  }

  // 顯示結果
  console.log(`\n✅ 找到 ${results.length} 個相關 skills:\n`);
  results.forEach((skill, i) => {
    console.log(`${i + 1}. ${skill.name}`);
    console.log(`   ${skill.description || 'No description'}`);
    console.log(`   📦 ${skill.owner}/${skill.repo}`);
    console.log(`   🔗 ${skill.rawUrl}`);
    console.log('');
  });

  return results;
}

// CLI 模式
if (require.main === module) {
  const query = process.argv[2];
  if (!query) {
    console.log('Usage: node search-marketplace.cjs "<search query>" [category] [limit]');
    console.log('');
    console.log('Examples:');
    console.log('  node search-marketplace.cjs "testing"');
    console.log('  node search-marketplace.cjs "docker" devops 5');
    console.log('');
    console.log('Or visit https://skillsmp.com to browse 40,000+ skills');
    process.exit(1);
  }

  const category = process.argv[3] || null;
  const limit = parseInt(process.argv[4]) || 10;

  searchMarketplace(query, { category, limit })
    .then((results) => {
      if (results.length > 0) {
        console.log('\n📊 JSON 輸出:');
        console.log(JSON.stringify(results, null, 2));

        console.log('\n💡 安裝指令:');
        console.log(
          `   node .claude/skills/skill-marketplace/install-skill.cjs "${results[0].rawUrl}"`
        );
      }
    })
    .catch((err) => {
      console.error('❌ 搜尋失敗:', err.message);
      process.exit(1);
    });
}

module.exports = { searchMarketplace, skillsmpToGithubRaw };
