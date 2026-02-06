import React from 'react';
import { Home, MapPin, MessageCircle, Phone } from 'lucide-react';
import styles from '../pages/UAG/components/ReportGenerator/ReportGenerator.module.css';

interface PropertyData {
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

interface AgentData {
  name: string;
  phone?: string;
  company: string;
}

interface ReportPreviewProps {
  property: PropertyData;
  agent: AgentData;
}

function formatPrice(price: number): string {
  if (price >= 10000) {
    return (price / 10000).toFixed(0);
  }
  return price.toLocaleString();
}

export default function ReportPreview({ property, agent }: ReportPreviewProps) {
  return (
    <>
      {/* Hero 圖片 */}
      <div className={styles.reportPreviewHero}>
        <div className={styles.reportPreviewHeroTag}>精選推薦</div>
        {property.images?.[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className={styles.reportPreviewHeroImg}
          />
        ) : (
          <div className={styles.reportPreviewHeroPlaceholder}>
            <Home size={36} />
          </div>
        )}
        <div className={styles.reportPreviewHeroOverlay}>
          <div className={styles.reportPreviewCommunity}>{property.community}社區</div>
          <div className={styles.reportPreviewTitle}>{property.title}</div>
        </div>
      </div>

      {/* 價格區塊 */}
      <div className={styles.reportPreviewPriceSection}>
        <div className={styles.reportPreviewPriceMain}>
          <div className={styles.reportPreviewPriceLabel}>開價總價</div>
          <div className={styles.reportPreviewPriceTotal}>
            {formatPrice(property.price)}
            <small>萬</small>
          </div>
        </div>
        <div className={styles.reportPreviewPriceUnit}>
          <div className={styles.reportPreviewPriceUnitLabel}>單價</div>
          <div className={styles.reportPreviewPriceUnitValue}>
            {(property.pricePerPing / 10000).toFixed(1)}
            <small>萬/坪</small>
          </div>
        </div>
      </div>

      {/* 核心規格 */}
      <div className={styles.reportPreviewSpecsGrid}>
        <div className={styles.reportPreviewSpecItem}>
          <div className={styles.reportPreviewSpecValue}>
            {property.size}
            <small>坪</small>
          </div>
          <div className={styles.reportPreviewSpecLabel}>權狀坪數</div>
        </div>
        <div className={styles.reportPreviewSpecItem}>
          <div className={styles.reportPreviewSpecValue}>
            {property.floor}
            <small>/{property.floorTotal}F</small>
          </div>
          <div className={styles.reportPreviewSpecLabel}>樓層</div>
        </div>
        <div className={styles.reportPreviewSpecItem}>
          <div className={styles.reportPreviewSpecValue}>
            {property.age}
            <small>年</small>
          </div>
          <div className={styles.reportPreviewSpecLabel}>屋齡</div>
        </div>
        <div className={styles.reportPreviewSpecItem}>
          <div className={styles.reportPreviewSpecValue}>{property.direction}</div>
          <div className={styles.reportPreviewSpecLabel}>座向</div>
        </div>
      </div>

      {/* 物件資訊 */}
      <div className={styles.reportPreviewDetails}>
        <div className={styles.reportPreviewSectionTitle}>物件資訊</div>
        <div className={styles.reportPreviewDetailsGrid}>
          <div className={styles.reportPreviewDetailItem}>
            <span className={styles.reportPreviewDetailLabel}>格局</span>
            <span className={styles.reportPreviewDetailValue}>{property.rooms}</span>
          </div>
          <div className={styles.reportPreviewDetailItem}>
            <span className={styles.reportPreviewDetailLabel}>車位</span>
            <span className={styles.reportPreviewDetailValue}>{property.parking}</span>
          </div>
          <div className={styles.reportPreviewDetailItem}>
            <span className={styles.reportPreviewDetailLabel}>管理費</span>
            <span className={styles.reportPreviewDetailValue}>
              {property.managementFee.toLocaleString()}/月
            </span>
          </div>
          <div className={styles.reportPreviewDetailItem}>
            <span className={styles.reportPreviewDetailLabel}>型態</span>
            <span className={styles.reportPreviewDetailValue}>{property.propertyType}</span>
          </div>
        </div>
      </div>

      {/* 社區資訊 */}
      <div className={styles.reportPreviewCommunitySection}>
        <div className={styles.reportPreviewSectionTitle}>社區資訊</div>
        <div className={styles.reportPreviewCommunityInfo}>
          <div className={styles.reportPreviewCommunityStat}>
            <div className={styles.reportPreviewCommunityStatValue}>{property.communityYear}</div>
            <div className={styles.reportPreviewCommunityStatLabel}>建成年份</div>
          </div>
          <div className={styles.reportPreviewCommunityStat}>
            <div className={styles.reportPreviewCommunityStatValue}>{property.communityUnits}</div>
            <div className={styles.reportPreviewCommunityStatLabel}>總戶數</div>
          </div>
          <div className={styles.reportPreviewCommunityStat}>
            <div className={styles.reportPreviewCommunityStatValue}>{property.floorTotal}</div>
            <div className={styles.reportPreviewCommunityStatLabel}>總樓層</div>
          </div>
        </div>
      </div>

      {/* 物件說明 */}
      <div className={styles.reportPreviewDescription}>
        <div className={styles.reportPreviewSectionTitle}>物件說明</div>
        <div className={styles.reportPreviewDescriptionText}>{property.description}</div>
      </div>

      {/* 地址位置 */}
      <div className={styles.reportPreviewLocation}>
        <div className={styles.reportPreviewLocationIcon}>
          <MapPin size={16} />
        </div>
        <div className={styles.reportPreviewLocationText}>
          {property.address}
          <small>{property.district}</small>
        </div>
      </div>

      {/* 業務資訊 */}
      <div className={styles.reportPreviewAgent}>
        <div className={styles.reportPreviewAgentAvatar} />
        <div className={styles.reportPreviewAgentInfo}>
          <strong>{agent.name}</strong>
          <span>{agent.company}</span>
        </div>
        <div className={styles.reportPreviewAgentCta}>
          <button className={`${styles.reportPreviewAgentBtn} ${styles.secondary}`}>
            <MessageCircle size={16} />
          </button>
          {agent.phone && (
            <button className={`${styles.reportPreviewAgentBtn} ${styles.primary}`}>
              <Phone size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 品牌浮水印 */}
      <div className={styles.reportPreviewWatermark}>
        由 <strong>MaiHouses 邁房子</strong> 提供
      </div>
    </>
  );
}
