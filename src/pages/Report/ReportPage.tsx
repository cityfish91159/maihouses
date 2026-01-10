import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Phone, MessageCircle, MapPin, Home } from "lucide-react";
import { notify } from "../../lib/notify";
import { logger } from "../../lib/logger";
import styles from "./ReportPage.module.css";

// 報告資料類型
interface ReportPropertyData {
  id: string;
  title: string;
  address: string;
  district: string;
  price: number;
  pricePerPing: number;
  size: number;
  rooms: string;
  floor: string;
  floorTotal: number;
  age: number;
  direction: string;
  parking: string;
  managementFee: number;
  community: string;
  communityYear: number;
  communityUnits: number;
  propertyType: string;
  description: string;
  images: string[];
}

interface ReportAgentData {
  name: string;
  phone?: string;
  company: string;
}

// 預設物件資料
const DEFAULT_PROPERTY: ReportPropertyData = {
  id: "demo-001",
  title: "12F 高樓層｜3房2廳2衛｜平面車位",
  address: "台中市南屯區惠文路 168 號",
  district: "南屯區",
  price: 32880000,
  pricePerPing: 521000,
  size: 67.3,
  rooms: "3房2廳2衛",
  floor: "12",
  floorTotal: 15,
  age: 5,
  direction: "南",
  parking: "平面車位",
  managementFee: 3500,
  community: "惠宇上晴",
  communityYear: 2019,
  communityUnits: 280,
  propertyType: "電梯大樓",
  description:
    "高樓層景觀戶，採光通風極佳。格局方正實用，三面採光無暗房。社區管理完善，24小時警衛駐守。步行5分鐘至捷運市政府站，生活機能完善。屋況維護良好，可隨時交屋。",
  images: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
  ],
};

const DEFAULT_AGENT: ReportAgentData = {
  name: "專屬顧問",
  company: "MaiHouses 邁房子",
};

// 價格格式化
function formatPrice(price: number): string {
  if (price >= 100000000) {
    return `${(price / 100000000).toFixed(2)}`;
  }
  return `${(price / 10000).toFixed(0)}`;
}

// 解碼 URL 參數中的報告資料
function decodeReportData(searchParams: URLSearchParams): {
  property: ReportPropertyData;
  agent: ReportAgentData;
} {
  try {
    const dataParam = searchParams.get("d");
    if (dataParam) {
      const decoded = JSON.parse(
        decodeURIComponent(escape(atob(decodeURIComponent(dataParam))))
      ) as {
        property: ReportPropertyData;
        agent: ReportAgentData;
      };
      return decoded;
    }
  } catch (e) {
    logger.debug("[ReportPage] Failed to decode report data", { error: e });
  }
  return { property: DEFAULT_PROPERTY, agent: DEFAULT_AGENT };
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] =
    useState<ReportPropertyData>(DEFAULT_PROPERTY);
  const [agent, setAgent] = useState<ReportAgentData>(DEFAULT_AGENT);

  useEffect(() => {
    const loadReport = () => {
      setIsLoading(true);
      try {
        const { property: decodedProperty, agent: decodedAgent } =
          decodeReportData(searchParams);
        setProperty(decodedProperty);
        setAgent(decodedAgent);

        // 記錄報告瀏覽
        fetch("/api/report/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId: id, userAgent: navigator.userAgent }),
        }).catch(() => {});
      } catch (e) {
        logger.error("[ReportPage] Load report failed", { error: e });
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [id, searchParams]);

  // LINE 諮詢
  const handleLineChat = () => {
    const message = encodeURIComponent(
      `【${property.title}】\n\n${formatPrice(property.price)}萬\n\n${window.location.href}`
    );
    window.open(`https://line.me/R/msg/text/?${message}`, "_blank");
  };

  // 撥打電話
  const handleCall = () => {
    if (agent.phone) {
      window.location.href = `tel:${agent.phone}`;
    } else {
      notify.info("請透過 LINE 聯繫顧問");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>載入報告中...</p>
      </div>
    );
  }

  return (
    <div className={styles.reportPage}>
      <div className={styles.reportContent}>
        {/* Hero 圖片 */}
        <div className={styles.hero}>
          <div className={styles.heroTag}>精選推薦</div>
          {property.images[0] ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className={styles.heroImg}
            />
          ) : (
            <div className={styles.heroPlaceholder}>
              <Home size={36} />
            </div>
          )}
          <div className={styles.heroOverlay}>
            <div className={styles.community}>{property.community}社區</div>
            <div className={styles.title}>{property.title}</div>
          </div>
        </div>

        {/* 價格區塊 */}
        <div className={styles.priceSection}>
          <div className={styles.priceMain}>
            <div className={styles.priceLabel}>開價總價</div>
            <div className={styles.priceTotal}>
              {formatPrice(property.price)}
              <small>{property.price >= 100000000 ? "億" : "萬"}</small>
            </div>
          </div>
          <div className={styles.priceUnit}>
            <div className={styles.priceUnitLabel}>單價</div>
            <div className={styles.priceUnitValue}>
              {(property.pricePerPing / 10000).toFixed(1)}
              <small>萬/坪</small>
            </div>
          </div>
        </div>

        {/* 核心規格 */}
        <div className={styles.specsGrid}>
          <div className={styles.specItem}>
            <div className={styles.specValue}>
              {property.size}
              <small>坪</small>
            </div>
            <div className={styles.specLabel}>權狀坪數</div>
          </div>
          <div className={styles.specItem}>
            <div className={styles.specValue}>
              {property.floor}
              <small>/{property.floorTotal}F</small>
            </div>
            <div className={styles.specLabel}>樓層</div>
          </div>
          <div className={styles.specItem}>
            <div className={styles.specValue}>
              {property.age}
              <small>年</small>
            </div>
            <div className={styles.specLabel}>屋齡</div>
          </div>
          <div className={styles.specItem}>
            <div className={styles.specValue}>{property.direction}</div>
            <div className={styles.specLabel}>座向</div>
          </div>
        </div>

        {/* 物件資訊 */}
        <div className={styles.details}>
          <div className={styles.sectionTitle}>物件資訊</div>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>格局</span>
              <span className={styles.detailValue}>{property.rooms}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>車位</span>
              <span className={styles.detailValue}>{property.parking}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>管理費</span>
              <span className={styles.detailValue}>
                {property.managementFee.toLocaleString()}/月
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>型態</span>
              <span className={styles.detailValue}>{property.propertyType}</span>
            </div>
          </div>
        </div>

        {/* 社區資訊 */}
        <div className={styles.communitySection}>
          <div className={styles.sectionTitle}>社區資訊</div>
          <div className={styles.communityInfo}>
            <div className={styles.communityStat}>
              <div className={styles.communityStatValue}>
                {property.communityYear}
              </div>
              <div className={styles.communityStatLabel}>建成年份</div>
            </div>
            <div className={styles.communityStat}>
              <div className={styles.communityStatValue}>
                {property.communityUnits}
              </div>
              <div className={styles.communityStatLabel}>總戶數</div>
            </div>
            <div className={styles.communityStat}>
              <div className={styles.communityStatValue}>
                {property.floorTotal}
              </div>
              <div className={styles.communityStatLabel}>總樓層</div>
            </div>
          </div>
        </div>

        {/* 物件說明 */}
        <div className={styles.description}>
          <div className={styles.sectionTitle}>物件說明</div>
          <div className={styles.descriptionText}>{property.description}</div>
        </div>

        {/* 地址位置 */}
        <div className={styles.location}>
          <div className={styles.locationIcon}>
            <MapPin size={16} />
          </div>
          <div className={styles.locationText}>
            {property.address}
            <small>{property.district}</small>
          </div>
        </div>

        {/* 業務資訊 */}
        <div className={styles.agent}>
          <div className={styles.agentAvatar} />
          <div className={styles.agentInfo}>
            <strong>{agent.name}</strong>
            <span>{agent.company}</span>
          </div>
          <div className={styles.agentCta}>
            <button
              className={`${styles.agentBtn} ${styles.secondary}`}
              onClick={handleLineChat}
            >
              <MessageCircle size={16} />
            </button>
            {agent.phone && (
              <button
                className={`${styles.agentBtn} ${styles.primary}`}
                onClick={handleCall}
              >
                <Phone size={16} />
              </button>
            )}
          </div>
        </div>

        {/* 品牌浮水印 */}
        <div className={styles.watermark}>
          由 <strong>MaiHouses 邁房子</strong> 提供
        </div>
      </div>
    </div>
  );
}
