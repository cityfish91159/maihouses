import React from "react";
import { Home } from "lucide-react";
import { CommunityPicker } from "../ui/CommunityPicker";
import { useUploadForm } from "./UploadContext";

const inputClass =
  "w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-maihouses-dark focus:border-transparent outline-none text-sm transition-all";

export const BasicInfoSection: React.FC = () => {
  const { form, setForm, validation, setSelectedCommunityId } = useUploadForm();

  const onInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onCommunityChange = (name: string, id?: string) => {
    setForm((prev) => ({ ...prev, communityName: name }));
    setSelectedCommunityId(id);
  };

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-maihouses-dark">
        <Home size={20} className="text-maihouses-light" /> 基本資料
      </h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="upload-title"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            物件標題 *
          </label>
          <input
            id="upload-title"
            name="title"
            value={form.title}
            onChange={onInput}
            className={`${inputClass} font-bold ${!validation.title.valid && form.title.length > 0 ? "border-red-300 bg-red-50" : ""}`}
            placeholder="例如：信義區101景觀全新裝潢大三房"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="upload-price"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              價格 (萬) *
            </label>
            <input
              id="upload-price"
              name="price"
              type="number"
              value={form.price}
              onChange={onInput}
              className={`${inputClass} ${!validation.price.valid && form.price.length > 0 ? "border-red-300 bg-red-50" : ""}`}
              placeholder="0"
            />
          </div>
          <div>
            <label
              htmlFor="upload-address"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              地址 *
            </label>
            <input
              id="upload-address"
              name="address"
              value={form.address}
              onChange={onInput}
              className={`${inputClass} ${!validation.address.valid && form.address.length > 0 ? "border-red-300 bg-red-50" : ""}`}
              placeholder="台北市信義區..."
            />
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            社區名稱 *{" "}
            <span className="font-normal text-slate-400">
              (透天/店面請選「無社區」)
            </span>
          </span>
          <CommunityPicker
            value={form.communityName}
            address={form.address}
            onChange={onCommunityChange}
            required={true}
          />
          {!validation.communityValid && form.communityName.length > 0 && (
            <p className="mt-1.5 text-[11px] font-medium text-red-500">
              請輸入完整社區名稱（至少2字）
            </p>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="upload-size"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              坪數
            </label>
            <input
              id="upload-size"
              name="size"
              type="number"
              value={form.size}
              onChange={onInput}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label
              htmlFor="upload-age"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              屋齡
            </label>
            <input
              id="upload-age"
              name="age"
              type="number"
              value={form.age}
              onChange={onInput}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div className="col-span-2">
            <label
              htmlFor="upload-type"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              類型
            </label>
            <select
              id="upload-type"
              name="type"
              value={form.type}
              onChange={onInput}
              className={inputClass}
            >
              <option>電梯大樓</option>
              <option>公寓</option>
              <option>透天</option>
              <option>套房</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="upload-rooms"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              房
            </label>
            <input
              id="upload-rooms"
              name="rooms"
              type="number"
              value={form.rooms}
              onChange={onInput}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="upload-halls"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              廳
            </label>
            <input
              id="upload-halls"
              name="halls"
              type="number"
              value={form.halls}
              onChange={onInput}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="upload-bathrooms"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              衛
            </label>
            <input
              id="upload-bathrooms"
              name="bathrooms"
              type="number"
              value={form.bathrooms}
              onChange={onInput}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
