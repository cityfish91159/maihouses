import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Listing, FeedPost } from '../types/uag.types';
import styles from '../UAG.module.css';
import { notify } from '../../../lib/notify';
import { logger } from '../../../lib/logger';

// FEED-01 Phase 10: 社區選項類型
interface CommunityOption {
  id: string;
  name: string;
}

interface ListingFeedProps {
  listings: Listing[];
  feed: FeedPost[];
  // FEED-01 Phase 10: 發文功能
  onCreatePost?: (content: string, communityId: string) => Promise<void>;
  availableCommunities?: CommunityOption[];
}

// FEED-01 Phase 8 優化：提取 FeedPost 內容為共用元件
interface FeedPostContentProps {
  post: FeedPost;
}

function FeedPostContent({ post }: FeedPostContentProps) {
  return (
    <>
      <div className={styles['fp-title']}>{post.title}</div>
      <div className={styles['fp-meta']}>
        {post.meta}
        <span className={styles['fp-stats']}>
          <span role="img" aria-label="讚數">
            ❤️
          </span>{' '}
          {post.likesCount ?? 0} ·{' '}
          <span role="img" aria-label="留言數">
            💬
          </span>{' '}
          {post.commentsCount ?? 0}
        </span>
      </div>
      <div className={styles['fp-body']}>{post.body}</div>
    </>
  );
}

// 常數
const MAX_POST_CONTENT_LENGTH = 2000;

export default function ListingFeed({
  listings,
  feed,
  onCreatePost,
  availableCommunities = [],
}: ListingFeedProps) {
  // FEED-01 Phase 10: Modal 狀態
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 當 availableCommunities 變化時，驗證 selectedCommunity 是否仍有效
  useEffect(() => {
    if (selectedCommunity) {
      const isValid = availableCommunities.some((c) => c.id === selectedCommunity);
      if (!isValid) {
        // 選擇的社區不再存在，重置為第一個或 null
        const firstCommunity = availableCommunities[0];
        setSelectedCommunity(firstCommunity?.id ?? null);
      }
    }
  }, [availableCommunities, selectedCommunity]);

  // Escape 鍵關閉 Modal
  useEffect(() => {
    if (!isComposerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsComposerOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isComposerOpen, isSubmitting]);

  // Focus trap
  useEffect(() => {
    if (!isComposerOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // 自動 focus 到第一個元素
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isComposerOpen]);

  // FEED-01 Phase 10: 開啟 Modal 時預設選擇第一個社區
  const handleOpenComposer = useCallback(() => {
    const firstCommunity = availableCommunities[0];
    // 每次開啟都重新選擇第一個社區（確保有效）
    setSelectedCommunity(firstCommunity?.id ?? null);
    setPostContent('');
    setIsComposerOpen(true);
  }, [availableCommunities]);

  // 點擊 overlay 關閉
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !isSubmitting) {
        setIsComposerOpen(false);
      }
    },
    [isSubmitting]
  );

  // FEED-01 Phase 10: 發文處理
  const handleSubmitPost = useCallback(async () => {
    if (!postContent.trim() || !selectedCommunity || !onCreatePost) return;

    // 驗證 selectedCommunity 是否在 availableCommunities 中
    const isValidCommunity = availableCommunities.some((c) => c.id === selectedCommunity);
    if (!isValidCommunity) {
      notify.error('發文失敗', '選擇的社區無效，請重新選擇');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreatePost(postContent.trim(), selectedCommunity);
      setPostContent('');
      setIsComposerOpen(false);
      notify.success('發文成功', '您的貼文已發佈到社區牆');
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知錯誤';
      logger.error('[ListingFeed] handleSubmitPost failed', { error: message });
      notify.error('發文失敗', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [postContent, selectedCommunity, onCreatePost, availableCommunities]);

  // 計算剩餘字數
  const remainingChars = MAX_POST_CONTENT_LENGTH - postContent.length;
  const isOverLimit = remainingChars < 0;

  return (
    <>
      {/* [3] Listings */}
      <section className={`${styles['uag-card']} ${styles['k-span-3']}`}>
        <div className={styles['uag-card-header']}>
          <div>
            <div className={styles['uag-card-title']}>我的房源總覽</div>
            <div className={styles['uag-card-sub']}>即時掌握曝光、點擊與收藏</div>
          </div>
          <div className={styles['uag-actions']}>
            <Link
              to="/property/upload"
              className={`${styles['uag-btn']} ${styles['uag-btn-link']}`}
            >
              <Plus size={14} />
              上傳房源
            </Link>
          </div>
        </div>
        <div id="listing-container">
          {listings.length === 0 ? (
            <div className={styles['empty-state']}>尚無房源資料。</div>
          ) : (
            listings.map((item) => (
              <article className={styles['listing-item']} key={item.public_id}>
                <Link to={`/property/${item.public_id}`} className={styles['listing-link']}>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className={styles['l-thumb']} />
                  ) : (
                    <div className={`${styles['l-thumb']} ${styles['l-thumb-placeholder']}`}>
                      無圖片
                    </div>
                  )}
                  <div>
                    <div className={styles['l-title']}>{item.title}</div>
                    <div className={styles['l-tags']}>
                      {item.tags?.map((t) => (
                        <span className={styles['l-tag']} key={`${item.public_id}-${t}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className={styles['l-kpi']}>
                      <span>
                        曝光 <b>{item.view ?? 0}</b>
                      </span>
                      <span>
                        點擊 <b>{item.click ?? 0}</b>
                      </span>
                      <span>
                        收藏 <b>{item.fav ?? 0}</b>
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))
          )}
        </div>
      </section>

      {/* [4] Feed */}
      <section className={`${styles['uag-card']} ${styles['k-span-3']}`}>
        <div className={styles['uag-card-header']}>
          <div>
            <div className={styles['uag-card-title']}>社區牆＆真實口碑</div>
            <div className={styles['uag-card-sub']}>用真實交流建立信任</div>
          </div>
          <div className={styles['uag-actions']}>
            <button
              type="button"
              className={styles['uag-btn']}
              onClick={handleOpenComposer}
              disabled={!onCreatePost || availableCommunities.length === 0}
            >
              貼文
            </button>
          </div>
        </div>
        <div id="feed-container">
          {feed.length === 0 ? (
            <div className={styles['empty-state']}>尚無社區牆互動。</div>
          ) : (
            feed.map((post) => (
              <article className={styles['feed-post']} key={post.id}>
                {post.communityId ? (
                  <Link
                    to={`/community/${post.communityId}/wall`}
                    className={styles['feed-post-link']}
                  >
                    <FeedPostContent post={post} />
                  </Link>
                ) : (
                  <FeedPostContent post={post} />
                )}
              </article>
            ))
          )}
        </div>
      </section>

      {/* FEED-01 Phase 10: 發文 Modal */}
      {isComposerOpen && (
        <div className={styles['modal-overlay']} onClick={handleOverlayClick} role="presentation">
          <div
            className={styles['modal-content']}
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="composer-modal-title"
          >
            <h3 id="composer-modal-title" className={styles['modal-title']}>
              發佈貼文
            </h3>

            {/* 社區選擇 */}
            <div className={styles['modal-field']}>
              <label htmlFor="community-select" className={styles['modal-label']}>
                選擇社區
              </label>
              <select
                id="community-select"
                value={selectedCommunity ?? ''}
                onChange={(e) => setSelectedCommunity(e.target.value || null)}
                className={styles['modal-select']}
                disabled={isSubmitting}
              >
                {availableCommunities.length === 0 ? (
                  <option value="" disabled>
                    無可用社區
                  </option>
                ) : (
                  availableCommunities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 內容輸入 */}
            <div className={styles['modal-field']}>
              <label htmlFor="post-content" className={styles['modal-label']}>
                貼文內容
              </label>
              <textarea
                id="post-content"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="分享您的想法..."
                rows={4}
                maxLength={MAX_POST_CONTENT_LENGTH + 100} // 允許超過一點再顯示警告
                className={styles['modal-textarea']}
                disabled={isSubmitting}
                aria-describedby="char-count"
              />
              <div
                id="char-count"
                className={styles['modal-char-count']}
                style={{ color: isOverLimit ? 'var(--uag-danger)' : undefined }}
              >
                {remainingChars} / {MAX_POST_CONTENT_LENGTH}
              </div>
            </div>

            {/* 按鈕 */}
            <div className={styles['modal-actions']}>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className={`${styles['uag-btn']} ${styles['btn-cancel']}`}
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmitPost}
                disabled={isSubmitting || !postContent.trim() || !selectedCommunity || isOverLimit}
                className={`${styles['uag-btn']} ${styles['primary']}`}
              >
                {isSubmitting ? '發佈中...' : '發佈'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
