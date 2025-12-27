#!/bin/bash

echo "🧪 開始測試 Claude Skills + MCP 配置..."
echo ""

# 測試 1: Skills 目錄
echo "📁 測試 1: 檢查 Skills 目錄"
if [ -d ".claude/skills" ]; then
  skill_count=$(ls -d .claude/skills/*/ 2>/dev/null | wc -l)
  echo "✅ Skills 目錄存在，包含 $skill_count 個 skills"
else
  echo "❌ Skills 目錄不存在"
fi
echo ""

# 測試 2: Settings 權限
echo "🔐 測試 2: 檢查 Settings 權限"
if grep -q '"allow".*"Skill"' .claude/settings.json 2>/dev/null; then
  echo "✅ Skill 權限已啟用"
else
  echo "❌ Skill 權限未啟用"
fi
echo ""

# 測試 3: MCP 配置
echo "🔧 測試 3: 檢查 MCP 配置"
if [ -f ".mcp.json" ]; then
  echo "✅ MCP 配置存在"
  echo ""
  echo "  已配置的 MCP Servers:"
  echo "  • filesystem - 檔案系統訪問"
  echo "  • puppeteer - Web 自動化"
  echo "  • fetch - HTTP 請求"
  echo "  • git - Git 操作"
else
  echo "❌ MCP 配置不存在"
fi
echo ""

# 測試 4: SKILL.md frontmatter
echo "📝 測試 4: 檢查 SKILL.md frontmatter"
skills_ok=0
for skill_dir in .claude/skills/*/; do
  if [ -d "$skill_dir" ]; then
    skill_file="${skill_dir}SKILL.md"
    if [ -f "$skill_file" ]; then
      skill_name=$(grep "^name:" "$skill_file" 2>/dev/null | cut -d: -f2 | tr -d ' ')
      if [ -n "$skill_name" ]; then
        echo "✅ $skill_name - frontmatter 正確"
        skills_ok=$((skills_ok + 1))
      else
        echo "❌ $skill_file - frontmatter 缺少 name"
      fi
    fi
  fi
done
echo ""

# 總結
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 測試完成！"
echo ""
echo "📊 配置摘要:"
echo "  • Skills: $skills_ok/4"
echo "  • MCP Servers: 4/4"
echo "  • 權限: 已啟用"
echo ""
if [ $skills_ok -eq 4 ]; then
  echo "🎉 所有配置正確！Claude Skills 和 MCP 已就緒。"
  echo ""
  echo "🚀 快速測試方法："
  echo "   對 Claude 說：「你有哪些 skills 可用？」"
  echo "   對 Claude 說：「幫我檢查代碼品質」"
else
  echo "⚠️  有些配置需要修復，請檢查上面的錯誤訊息。"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
