---
description: 安裝 code-review-excellence 和 type-checker MCP 工具
---

# MCP 工具安裝指南

## 1. VS Code MCP Server (Type Checker)

1. 開啟 VS Code
2. 按 `Ctrl+Shift+X` 開啟擴充功能
3. 搜尋 `VS Code MCP Server`
4. 點擊「安裝」
5. 重新載入 VS Code

## 2. Code Review Excellence Skill

在您的 MCP 配置檔案中添加以下內容:

**配置檔案位置**: `~/.gemini/antigravity/mcp_config.json`

```json
{
  "mcpServers": {
    "code-review-excellence": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-skill-code-review-excellence"]
    }
  }
}
```

// turbo-all
## 3. 驗證安裝

```powershell
# 檢查 npx 是否可用
npx --version
```

完成後請告知 AI 繼續 AUTH-1 實作。
