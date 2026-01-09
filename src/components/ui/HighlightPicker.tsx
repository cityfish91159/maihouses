import React, { useState, useCallback } from "react";
import { Check, Plus, X } from "lucide-react";
import { isSpecTag } from "../../lib/tagUtils";
import { toast } from "sonner";

// 標籤庫定義
const HIGHLIGHT_CATEGORIES = [
  {
    name: "交通",
    tags: ["近捷運", "近公車", "近高鐵"],
  },
  {
    name: "屋況",
    tags: ["全新裝潢", "採光佳", "高樓層", "邊間", "景觀戶"],
  },
  {
    name: "設施",
    tags: ["有車位", "有電梯", "有管理", "有中庭"],
  },
  {
    name: "生活",
    tags: ["近學校", "近公園", "近市場", "安靜"],
  },
  {
    name: "交易",
    tags: ["急售", "可議價", "稀有釋出"],
  },
];

const MAX_HIGHLIGHTS = 5;
const MIN_HIGHLIGHTS = 3;
const MAX_CUSTOM_TAGS = 3;
const MAX_TAG_LENGTH = 10;

interface HighlightPickerProps {
  value: string[];
  onChange: (highlights: string[]) => void;
  required?: boolean;
}

export const HighlightPicker: React.FC<HighlightPickerProps> = ({
  value,
  onChange,
  required = false,
}) => {
  const [customInputs, setCustomInputs] = useState<string[]>(["", "", ""]);

  // 切換標籤選擇
  const toggleTag = useCallback(
    (tag: string) => {
      if (value.includes(tag)) {
        // 取消選擇
        onChange(value.filter((t) => t !== tag));
      } else if (value.length < MAX_HIGHLIGHTS) {
        // 新增選擇
        onChange([...value, tag]);
      }
    },
    [value, onChange],
  );

  // 處理自訂輸入
  const handleCustomInput = useCallback(
    (index: number, input: string) => {
      // 限制長度
      const trimmed = input.slice(0, MAX_TAG_LENGTH);
      const newInputs = [...customInputs];
      newInputs[index] = trimmed;
      setCustomInputs(newInputs);
    },
    [customInputs],
  );

  // 新增自訂標籤
  const addCustomTag = useCallback(
    (index: number) => {
      const tag = (customInputs[index] || "").trim();
      if (!tag) return;
      if (value.includes(tag)) return; // 已存在
      if (value.length >= MAX_HIGHLIGHTS) return; // 已滿

      // UP-4.1: 源頭清洗 - 阻擋規格型標籤
      if (isSpecTag(tag)) {
        toast.error(
          "請勿將「格局、坪數、樓層」等規格填寫於亮點，請使用專屬欄位。",
        );
        return;
      }

      onChange([...value, tag]);

      // 清空該輸入框
      const newInputs = [...customInputs];
      newInputs[index] = "";
      setCustomInputs(newInputs);
    },
    [customInputs, value, onChange],
  );

  // 移除標籤
  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [value, onChange],
  );

  // 計算狀態
  const selectedCount = value.length;
  const isValid = selectedCount >= MIN_HIGHLIGHTS;
  const isFull = selectedCount >= MAX_HIGHLIGHTS;

  return (
    <div className="space-y-4">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">
          物件亮點 {required && "*"}{" "}
          <span className="text-slate-400">（選 3-5 個，每個 10 字內）</span>
        </span>
        <span
          className={`text-xs font-medium ${isValid ? "text-green-600" : "text-slate-400"}`}
        >
          已選 {selectedCount}/{MAX_HIGHLIGHTS} {isValid && "✓"}
        </span>
      </div>

      {/* 標籤分類 */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {HIGHLIGHT_CATEGORIES.map((category) => (
          <div key={category.name}>
            <span className="mb-1.5 block text-xs font-medium text-slate-500">
              {category.name}
            </span>
            <div className="flex flex-wrap gap-2">
              {category.tags.map((tag) => {
                const isSelected = value.includes(tag);
                const isDisabled = !isSelected && isFull;

                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    disabled={isDisabled}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-[#003366] text-white shadow-sm"
                        : isDisabled
                          ? "cursor-not-allowed bg-slate-200 text-slate-400"
                          : "bg-white text-slate-600 shadow-sm hover:bg-blue-50 hover:text-[#003366]"
                    }`}
                  >
                    {isSelected && <Check size={14} />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* 自訂標籤區 */}
        <div>
          <span className="mb-1.5 block text-xs font-medium text-slate-500">
            自訂（選填，最多 {MAX_CUSTOM_TAGS} 個）
          </span>
          <div className="flex flex-wrap gap-2">
            {customInputs.map((input, index) => (
              <div key={index} className="flex items-center gap-1">
                <input
                  id={`highlight-custom-${index}`}
                  name={`highlightCustom${index}`}
                  type="text"
                  value={input}
                  onChange={(e) => handleCustomInput(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTag(index);
                    }
                  }}
                  placeholder="自訂..."
                  maxLength={MAX_TAG_LENGTH}
                  disabled={isFull}
                  className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-[#003366] focus:outline-none focus:ring-1 focus:ring-[#003366] disabled:cursor-not-allowed disabled:bg-slate-100"
                />
                {input.trim() && !isFull && (
                  <button
                    type="button"
                    onClick={() => addCustomTag(index)}
                    className="rounded-full bg-[#003366] p-1 text-white transition hover:bg-[#004488]"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 已選標籤預覽 */}
      {value.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">已選：</span>
          {value.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-sm font-medium text-[#003366]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded-full p-0.5 text-blue-400 transition hover:bg-blue-200 hover:text-blue-600"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 驗證提示 */}
      {required && !isValid && value.length > 0 && (
        <p className="text-xs text-amber-600">
          請至少選擇 {MIN_HIGHLIGHTS} 個亮點
        </p>
      )}
    </div>
  );
};
