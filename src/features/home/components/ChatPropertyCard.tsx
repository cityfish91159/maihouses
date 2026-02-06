import { ExternalLink, Building2, MapPin, Maximize, DollarSign } from 'lucide-react';
import { isSpecTag } from '../../../lib/tagUtils';

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

// ============================================
// 🎭 MOCK 資料 - 之後替換為 API 查詢
// ============================================
interface MockProperty {
  title: string;
  price: string;
  size: string;
  rooms: string;
  address: string;
  highlight: string;
}

const MOCK_PROPERTIES: Record<string, MockProperty> = {
  'MH-2024-001': {
    title: '高樓層雙面採光 3房',
    price: '2,180萬',
    size: '35.8坪',
    rooms: '3房2廳2衛',
    address: '中正路168號12樓',
    highlight: '捷運3分鐘',
  },
  'MH-2024-002': {
    title: '景觀四房 附車位',
    price: '3,280萬',
    size: '52.6坪',
    rooms: '4房2廳2衛',
    address: '文化一路88號18樓',
    highlight: '河景第一排',
  },
  'MH-2024-003': {
    title: '精裝兩房 即可入住',
    price: '1,480萬',
    size: '26.2坪',
    rooms: '2房1廳1衛',
    address: '和平路66號8樓',
    highlight: '學區宅',
  },
  'MH-2024-004': {
    title: '邊間採光佳 視野好',
    price: '1,980萬',
    size: '32.1坪',
    rooms: '3房2廳1衛',
    address: '景平路188號15樓',
    highlight: '高樓層',
  },
  default: {
    title: '優質物件',
    price: '洽詢',
    size: '-',
    rooms: '-',
    address: '點擊查看詳情',
    highlight: '新上架',
  },
};

function getMockData(propertyId: string): MockProperty {
  return (
    MOCK_PROPERTIES[propertyId] ??
    MOCK_PROPERTIES['default'] ?? {
      title: '優質物件',
      price: '洽詢',
      size: '-',
      rooms: '-',
      address: '點擊查看詳情',
      highlight: '新上架',
    }
  );
}
// ============================================

export default function ChatPropertyCard({ community, propertyId }: ChatPropertyCardProps) {
  const property = getMockData(propertyId);

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
