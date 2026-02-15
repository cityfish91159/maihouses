import { ExternalLink, Building2, MapPin, Maximize, DollarSign } from 'lucide-react';
import { isSpecTag } from '../../../lib/tagUtils';
import { getChatPropertyMock, type ChatPropertyMock } from '../../../constants/mock';

/**
 * ============================================
 * 物件推薦卡片 (ChatPropertyCard)
 * ============================================
 *
 * 【功能說明】
 * 當 AI 偵測到用戶對社區有興趣（熱度 ≥75），
 * 會在聊天中插入這個卡片，引導用戶看物件。
 *
 * 【目前狀態】
 * ⚠️ MOCK 模式 - 物件資料尚未連接，目前使用假資料
 *
 * 【TODO: 接入真實物件】
 * 1. 建立物件 API：GET /api/properties/:propertyId
 * 2. 用 propertyId 查詢真實的：
 *    - 物件標題
 *    - 價格、坪數、格局
 *    - 社區名稱
 * 3. 修改連結為動態：/property.html?id={propertyId}
 *
 * 【觸發格式】
 * AI 在回覆中使用：[[物件:社區名稱:物件ID]]
 * ChatMessage.tsx 會解析並渲染此卡片
 *
 * @see ChatMessage.tsx - 解析物件標記
 * @see maimai-persona.ts - AI Prompt 設定
 */

type ChatPropertyCardProps = {
  community: string;
  propertyId: string;
};

export default function ChatPropertyCard({ community, propertyId }: ChatPropertyCardProps) {
  const property: ChatPropertyMock = getChatPropertyMock(propertyId);

  const propertyUrl = '/property.html';

  return (
    <a
      href={propertyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-3 block max-w-sm rounded-xl border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 transition-all hover:border-orange-300 hover:shadow-md"
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Building2 size={14} className="text-orange-500" />
            <span className="text-ink-500 text-[11px] font-medium">{community}</span>
          </div>
          <p className="text-ink-800 text-sm font-bold transition-colors group-hover:text-orange-600">
            {property.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {property.highlight && !isSpecTag(property.highlight) && (
            <span className="whitespace-nowrap rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-medium text-white">
              {property.highlight}
            </span>
          )}
          <ExternalLink
            size={14}
            className="text-orange-400 transition-colors group-hover:text-orange-600"
          />
        </div>
      </div>

      {/* 價格與坪數 */}
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1 text-sm">
          <DollarSign size={12} className="text-orange-400" />
          <span className="font-bold text-orange-600">{property.price}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-ink-600">
          <Maximize size={12} className="text-ink-400" />
          <span>{property.size}</span>
        </div>
      </div>

      {/* 地址 */}
      <div className="text-ink-500 flex items-center gap-1 text-[11px]">
        <MapPin size={11} />
        <span>{property.address}</span>
      </div>

      {/* 房型 */}
      <div className="mt-1 text-[11px] text-ink-400">{property.rooms}</div>

      {/* CTA */}
      <div className="mt-3 border-t border-orange-100 pt-2 text-center text-[11px] font-medium text-orange-500 opacity-0 transition-opacity group-hover:opacity-100">
        點擊查看詳情 →
      </div>
    </a>
  );
}
