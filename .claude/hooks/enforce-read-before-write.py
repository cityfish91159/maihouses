#!/usr/bin/env python3
"""
強制執行「先讀後寫」規範
- 在 Edit 或 Write 之前必須先 Read 該文件
- 檢查 transcript 中的工具調用歷史

使用方式：
  在 .claude/settings.json 的 PreToolUse hook 中配置此腳本
"""
import json
import sys
import os
from pathlib import Path

# Windows 編碼問題修復
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')


def normalize_path(path: str) -> str:
    """標準化路徑以便比較"""
    if not path:
        return ""
    # 統一使用正斜線，轉換為小寫（Windows 不區分大小寫）
    normalized = Path(path).resolve()
    return str(normalized).replace("\\", "/").lower()


def check_file_read_in_transcript(transcript_path: str, target_file: str) -> bool:
    """檢查 transcript 中是否已經 Read 過該文件"""
    if not transcript_path or not os.path.exists(transcript_path):
        return False

    target_normalized = normalize_path(target_file)

    try:
        with open(transcript_path, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    entry = json.loads(line)

                    # 檢查是否是 Read 工具調用
                    # 支援多種 transcript 格式
                    tool_name = entry.get("name") or entry.get("tool_name") or ""
                    tool_type = entry.get("type", "")

                    if tool_name == "Read" and tool_type in ["tool_use", "tool_result", ""]:
                        # 獲取輸入參數
                        input_data = entry.get("input", {}) or entry.get("tool_input", {})
                        read_file = input_data.get("file_path", "")

                        if read_file:
                            read_normalized = normalize_path(read_file)
                            if read_normalized == target_normalized:
                                return True

                except json.JSONDecodeError:
                    continue

        return False
    except Exception as e:
        # 發生錯誤時，輸出到 stderr 但不阻止操作
        print(f"Warning: Error reading transcript: {e}", file=sys.stderr)
        return False


def main():
    # 讀取 stdin 的 JSON 輸入
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")
    transcript_path = input_data.get("transcript_path", "")

    # 只檢查 Edit 和 Write 工具
    if tool_name not in ["Edit", "Write"]:
        sys.exit(0)

    # 如果沒有 file_path，跳過檢查
    if not file_path:
        sys.exit(0)

    # 檢查是否已經 Read 過該文件
    if check_file_read_in_transcript(transcript_path, file_path):
        # 已讀取，允許操作
        sys.exit(0)

    # 未讀取，阻止操作
    file_name = os.path.basename(file_path)
    output = {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": (
                f"🚫 違反「先讀後寫」規範！\n\n"
                f"必須先 Read `{file_name}` 才能進行 {tool_name}。\n\n"
                f"請先執行：\n"
                f"  Read: file_path=\"{file_path}\"\n\n"
                f"了解現有代碼結構後再進行修改。這是強制規則，不能跳過。"
            )
        }
    }
    print(json.dumps(output, ensure_ascii=False))
    sys.exit(0)


if __name__ == "__main__":
    main()
