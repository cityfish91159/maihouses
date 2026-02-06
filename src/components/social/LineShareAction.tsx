import React from 'react';
import { MessageCircle } from 'lucide-react';
import { notify } from '../../lib/notify';

interface ShareProps {
  url: string;
  title: string;
  onShareClick?: () => void;
  className?: string; // Support custom styling (button)
  btnText?: string; // Custom button text
  showIcon?: boolean; // Toggle icon
  wrapperClass?: string; // Class for the wrapper div
}

export const LineShareAction: React.FC<ShareProps> = ({
  url,
  title,
  onShareClick,
  className = '', // Default to empty string to fix undefined type error
  btnText = 'LINE 分享',
  showIcon = true,
  wrapperClass = 'inline-block', // Default to inline-block
}) => {
  const handleShare = () => {
    // 1. Trigger mascot celebration (Global Event)
    window.dispatchEvent(new CustomEvent('mascot:celebrate'));

    // 2. Notify user
    notify.success('✨ 準備分享至 LINE', 'MaiMai 已經幫您整理好物件摘要了！');

    // 3. Tracking callback (Intent only)
    if (onShareClick) {
      onShareClick();
    }

    // 4. Open LINE share window
    const shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  // NOTE: react-share's LineShareButton opens the window immediately on click.
  // We wrap it to intercept the click for tracking/notify before the window events take over.
  // However, LineShareButton onClick prop might be overridden or handled internally for the popup.
  // The 'beforeOnClick' or just 'onClick' usually works.

  return (
    <div
      onClick={handleShare}
      className={wrapperClass}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleShare();
        }
      }}
      aria-label={btnText}
    >
      {/* 
         Wrapping in a div to capture the click event bubbling up 
         because react-share buttons might consume onClick for their window.open logic 
         but we want to track it "as it happens".
       */}
      <button type="button" className={`flex items-center justify-center gap-2 ${className}`}>
        {showIcon && <MessageCircle size={18} />}
        <span>{btnText}</span>
      </button>
    </div>
  );
};
