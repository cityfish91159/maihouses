import { useState, useRef, useEffect } from "react";
import { notify } from "../../lib/notify";
import { STRINGS } from "../../constants/strings";
import { Image, X } from "lucide-react";
import { logger } from "../../lib/logger";

interface InlineComposerProps {
  onSubmit: (content: string, images?: File[]) => Promise<void>;
  disabled?: boolean;
  userInitial: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function InlineComposer({
  onSubmit,
  disabled,
  userInitial,
}: InlineComposerProps) {
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // D1: Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);

      // D3: Frontend Validation
      const validFiles = newFiles.filter((file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          notify.error(`檔案格式不支援: ${file.name}`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          notify.error(`檔案過大 (超過 5MB): ${file.name}`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      // Limit to 4 images
      if (selectedFiles.length + validFiles.length > 4) {
        notify.error("最多只能上傳 4 張圖片");
        return;
      }

      const newUrls = validFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    const url = previewUrls[index];
    if (url) URL.revokeObjectURL(url);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if ((!content.trim() && selectedFiles.length === 0) || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const trimmed = content.trim();
      if (selectedFiles.length > 0) {
        await onSubmit(trimmed, selectedFiles);
      } else {
        await onSubmit(trimmed);
      }
      setContent("");
      // Cleanup old URLs handled by Effect
      setSelectedFiles([]);
      setIsExpanded(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      notify.success(STRINGS.COMPOSER.SUCCESS);
    } catch (err) {
      logger.error("[InlineComposer] Failed to create post", { error: err });
      notify.error(STRINGS.COMPOSER.ERROR_TITLE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border bg-white p-3 shadow-sm transition-all ${
        isExpanded ? "border-brand-200 shadow-md" : "border-brand-100"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 ring-1 ring-brand-100">
          {userInitial}
        </div>
        <div className="flex-1 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder={STRINGS.COMPOSER.PLACEHOLDER_FEED}
            disabled={disabled}
            className="focus:ring-brand-200 min-h-[40px] w-full resize-none rounded-xl border-0 bg-brand-50 px-3 py-2 text-sm leading-relaxed text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2"
            rows={isExpanded ? 3 : 1}
          />

          {/* Image Previews */}
          {previewUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previewUrls.map((url, i) => (
                <div
                  key={url}
                  className="relative size-16 overflow-hidden rounded-lg border border-gray-200"
                >
                  <img
                    src={url}
                    alt="Preview"
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions Toolbar */}
          {isExpanded && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  disabled={disabled || isSubmitting}
                >
                  <Image size={14} />
                  <span>圖片</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  disabled ||
                  isSubmitting ||
                  (!content.trim() && selectedFiles.length === 0)
                }
                className="rounded-full bg-brand-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? STRINGS.COMPOSER.SUBMITTING
                  : STRINGS.COMPOSER.SUBMIT}
              </button>
            </div>
          )}
        </div>
        {!isExpanded && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || isSubmitting || !content.trim()}
            className="shrink-0 rounded-full bg-brand-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? STRINGS.COMPOSER.SUBMITTING
              : STRINGS.COMPOSER.SUBMIT}
          </button>
        )}
      </div>
    </div>
  );
}
