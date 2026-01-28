import React from "react";
import { Shield, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import { useUploadForm } from "./UploadContext";

const inputClass =
  "w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-maihouses-dark focus:border-transparent outline-none text-sm transition-all";

export const TwoGoodsSection: React.FC = () => {
  const { form, setForm, validation } = useUploadForm();

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section
      id="two-goods-section"
      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center gap-2">
        <Shield className="text-orange-500" size={22} />
        <div>
          <h2 className="text-lg font-bold text-maihouses-dark">兩好一公道</h2>
          <p className="text-xs text-slate-500">誠實揭露，建立買賣信任</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* 優點 1 */}
        <div>
          <label
            htmlFor="upload-advantage1"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-green-700"
          >
            <ThumbsUp size={14} /> 優點 1
          </label>
          <input
            id="upload-advantage1"
            name="advantage1"
            value={form.advantage1}
            onChange={onInput}
            className={`${inputClass} ${validation.advantage1.valid ? "border-green-200 bg-green-50/30" : ""} ${validation.advantage1.contentWarning ? "border-red-300" : ""}`}
            placeholder="例如：格局方正，採光極佳"
          />
          <div className="mt-1.5 flex items-center justify-between px-1">
            <span
              className={`text-[11px] font-medium ${validation.advantage1.valid ? "text-green-600" : "text-slate-400"}`}
            >
              {form.advantage1.length} 字{" "}
              {validation.advantage1.valid
                ? "✓"
                : `(需 ${validation.advantage1.message})`}
            </span>
            {validation.advantage1.contentWarning && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-red-500">
                <AlertTriangle size={12} />{" "}
                {validation.advantage1.contentWarning}
              </span>
            )}
          </div>
        </div>

        {/* 優點 2 */}
        <div>
          <label
            htmlFor="upload-advantage2"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-green-700"
          >
            <ThumbsUp size={14} /> 優點 2
          </label>
          <input
            id="upload-advantage2"
            name="advantage2"
            value={form.advantage2}
            onChange={onInput}
            className={`${inputClass} ${validation.advantage2.valid ? "border-green-200 bg-green-50/30" : ""} ${validation.advantage2.contentWarning ? "border-red-300" : ""}`}
            placeholder="例如：近捷運站，生活機能好"
          />
          <div className="mt-1.5 flex items-center justify-between px-1">
            <span
              className={`text-[11px] font-medium ${validation.advantage2.valid ? "text-green-600" : "text-slate-400"}`}
            >
              {form.advantage2.length} 字{" "}
              {validation.advantage2.valid
                ? "✓"
                : `(需 ${validation.advantage2.message})`}
            </span>
            {validation.advantage2.contentWarning && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-red-500">
                <AlertTriangle size={12} />{" "}
                {validation.advantage2.contentWarning}
              </span>
            )}
          </div>
        </div>

        {/* 公道話 */}
        <div>
          <label
            htmlFor="upload-disadvantage"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-700"
          >
            <ThumbsDown size={14} /> 誠實公道話
          </label>
          <input
            id="upload-disadvantage"
            name="disadvantage"
            value={form.disadvantage}
            onChange={onInput}
            className={`${inputClass} ${validation.disadvantage.valid ? "border-orange-200 bg-orange-50/30" : ""} ${validation.disadvantage.contentWarning ? "border-red-300" : ""}`}
            placeholder="例如：臨路有車流聲，建議加裝氣密窗"
          />
          <div className="mt-1.5 flex items-center justify-between px-1">
            <span
              className={`text-[11px] font-medium ${validation.disadvantage.valid ? "text-orange-600" : "text-slate-400"}`}
            >
              {form.disadvantage.length} 字{" "}
              {validation.disadvantage.valid
                ? "✓"
                : `(需 ${validation.disadvantage.message})`}
            </span>
            {validation.disadvantage.contentWarning && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-red-500">
                <AlertTriangle size={12} />{" "}
                {validation.disadvantage.contentWarning}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 敏感詞警告區塊 */}
      {validation.contentCheck.hasIssues && (
        <div
          className={`mt-5 flex items-start gap-3 rounded-xl p-4 ${validation.contentCheck.blockSubmit ? "border border-red-200 bg-red-50" : "border border-yellow-200 bg-yellow-50"}`}
        >
          <AlertTriangle
            className={
              validation.contentCheck.blockSubmit
                ? "text-red-500"
                : "text-yellow-600"
            }
            size={20}
          />
          <div>
            <p
              className={`text-sm font-bold ${validation.contentCheck.blockSubmit ? "text-red-700" : "text-yellow-700"}`}
            >
              {validation.contentCheck.blockSubmit
                ? "內容不符合發布規範"
                : "內容需要注意"}
            </p>
            <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
              {validation.contentCheck.warnings.map((w: string, i: number) => (
                <li key={i} className="flex items-center gap-1.5">
                  • {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};
