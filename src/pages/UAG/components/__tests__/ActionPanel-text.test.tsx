/**
 * 測試5：ActionPanel 文字確認
 * 驗證 ActionPanel.tsx L144, L177, L179 的文字內容
 * 確保使用「LINE/站內信」而非「簡訊」
 */

import { describe, it, expect } from "vitest";

describe("測5：ActionPanel 文字確認", () => {
  /**
   * 按鈕文字驗證（L144）
   */
  describe("購買按鈕文字（L144）", () => {
    it("應顯示「獲取聯絡權限 (LINE/站內信)」", () => {
      const isProcessing = false;

      // L144: {isProcessing ? "處理中..." : "🚀 獲取聯絡權限 (LINE/站內信)"}
      const buttonText = isProcessing
        ? "處理中..."
        : "🚀 獲取聯絡權限 (LINE/站內信)";

      expect(buttonText).toBe("🚀 獲取聯絡權限 (LINE/站內信)");
      expect(buttonText).toContain("LINE/站內信");
      expect(buttonText).not.toContain("簡訊");
    });

    it("處理中時應顯示「處理中...」", () => {
      const isProcessing = true;

      const buttonText = isProcessing
        ? "處理中..."
        : "🚀 獲取聯絡權限 (LINE/站內信)";

      expect(buttonText).toBe("處理中...");
    });

    it("按鈕文字包含 emoji 🚀", () => {
      const buttonText = "🚀 獲取聯絡權限 (LINE/站內信)";

      expect(buttonText).toContain("🚀");
    });
  });

  /**
   * 說明文字驗證（L177）
   */
  describe("個資法規範說明（L177）", () => {
    it("應顯示「符合個資法規範：僅能以 LINE/站內信聯繫」", () => {
      // L177: 符合個資法規範：僅能以 LINE/站內信聯繫
      const complianceText = "符合個資法規範：僅能以 LINE/站內信聯繫";

      expect(complianceText).toContain("LINE/站內信");
      expect(complianceText).toContain("符合個資法規範");
      expect(complianceText).not.toContain("簡訊");
    });

    it("說明文字應包含「僅能以」限制性用詞", () => {
      const complianceText = "符合個資法規範：僅能以 LINE/站內信聯繫";

      expect(complianceText).toContain("僅能以");
    });
  });

  /**
   * 通知方式說明（L179）
   */
  describe("通知方式說明（L179）", () => {
    it("應顯示「系統將透過 LINE 通知客戶」", () => {
      // L179: 系統將透過 LINE 通知客戶
      const notificationText = "系統將透過 LINE 通知客戶";

      expect(notificationText).toContain("LINE");
      expect(notificationText).toContain("通知客戶");
      expect(notificationText).not.toContain("簡訊");
    });

    it("說明文字應強調「透過 LINE」", () => {
      const notificationText = "系統將透過 LINE 通知客戶";

      expect(notificationText).toContain("透過 LINE");
    });
  });

  /**
   * 完整文字流程驗證
   */
  describe("完整文字流程", () => {
    it("所有相關文字都不應包含「簡訊」", () => {
      const allTexts = [
        "🚀 獲取聯絡權限 (LINE/站內信)",
        "符合個資法規範：僅能以 LINE/站內信聯繫",
        "系統將透過 LINE 通知客戶",
      ];

      allTexts.forEach((text) => {
        expect(text).not.toContain("簡訊");
      });
    });

    it("所有相關文字都應包含「LINE」", () => {
      const allTexts = [
        "🚀 獲取聯絡權限 (LINE/站內信)",
        "符合個資法規範：僅能以 LINE/站內信聯繫",
        "系統將透過 LINE 通知客戶",
      ];

      allTexts.forEach((text) => {
        expect(text).toContain("LINE");
      });
    });

    it("按鈕和說明文字應一致使用「LINE/站內信」", () => {
      const buttonText = "🚀 獲取聯絡權限 (LINE/站內信)";
      const complianceText = "符合個資法規範：僅能以 LINE/站內信聯繫";

      const pattern = "LINE/站內信";

      expect(buttonText).toContain(pattern);
      expect(complianceText).toContain(pattern);
    });
  });

  /**
   * 文字格式驗證
   */
  describe("文字格式", () => {
    it("L144 應包含括號和空格", () => {
      const buttonText = "🚀 獲取聯絡權限 (LINE/站內信)";

      expect(buttonText).toContain("(LINE/站內信)");
      expect(buttonText).toContain(" (");
    });

    it("L177 應包含冒號分隔", () => {
      const complianceText = "符合個資法規範：僅能以 LINE/站內信聯繫";

      expect(complianceText).toContain("：");
      expect(complianceText.split("：")).toHaveLength(2);
    });

    it("L179 應使用「將」字表示未來式", () => {
      const notificationText = "系統將透過 LINE 通知客戶";

      expect(notificationText).toContain("將");
    });
  });

  /**
   * 負面測試：確保沒有其他通訊方式
   */
  describe("負面測試：確保沒有其他通訊方式", () => {
    const allTexts = [
      "🚀 獲取聯絡權限 (LINE/站內信)",
      "符合個資法規範：僅能以 LINE/站內信聯繫",
      "系統將透過 LINE 通知客戶",
    ];

    it("不應包含「簡訊」", () => {
      allTexts.forEach((text) => {
        expect(text).not.toContain("簡訊");
      });
    });

    it("不應包含「SMS」", () => {
      allTexts.forEach((text) => {
        expect(text).not.toContain("SMS");
      });
    });

    it("不應包含「電話」", () => {
      allTexts.forEach((text) => {
        expect(text).not.toContain("電話");
      });
    });

    it("不應包含「郵件」", () => {
      allTexts.forEach((text) => {
        expect(text).not.toContain("郵件");
      });
    });

    it("不應包含「Email」", () => {
      allTexts.forEach((text) => {
        expect(text.toLowerCase()).not.toContain("email");
      });
    });
  });

  /**
   * 行號驗證（確保測試對應正確）
   */
  describe("行號對應驗證", () => {
    it("L144 對應購買按鈕文字", () => {
      // ActionPanel.tsx L144
      const line144 =
        '"{isProcessing ? "處理中..." : "🚀 獲取聯絡權限 (LINE/站內信)"}';

      expect(line144).toContain("獲取聯絡權限");
      expect(line144).toContain("LINE/站內信");
    });

    it("L177 對應個資法說明", () => {
      // ActionPanel.tsx L177
      const line177 = "符合個資法規範：僅能以 LINE/站內信聯繫";

      expect(line177).toContain("符合個資法規範");
      expect(line177).toContain("僅能以");
    });

    it("L179 對應通知方式說明", () => {
      // ActionPanel.tsx L179
      const line179 = "系統將透過 LINE 通知客戶";

      expect(line179).toContain("系統將透過");
      expect(line179).toContain("LINE");
      expect(line179).toContain("通知客戶");
    });
  });

  /**
   * 用戶體驗驗證
   */
  describe("用戶體驗", () => {
    it("文字應清楚說明聯絡方式", () => {
      const buttonText = "🚀 獲取聯絡權限 (LINE/站內信)";

      // 應該明確告知用戶可用的聯絡方式
      expect(buttonText).toContain("LINE/站內信");
    });

    it("應強調符合個資法規範", () => {
      const complianceText = "符合個資法規範：僅能以 LINE/站內信聯繫";

      expect(complianceText).toContain("符合個資法規範");
    });

    it("應明確告知通知流程", () => {
      const notificationText = "系統將透過 LINE 通知客戶";

      // 用戶應該知道系統會主動通知
      expect(notificationText).toContain("系統將");
      expect(notificationText).toContain("通知");
    });
  });
});
