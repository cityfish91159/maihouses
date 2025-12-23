import React from 'react';
import { LineShareButton } from 'react-share';
import { MessageCircle } from 'lucide-react';
import { notify } from '../../lib/notify';

interface ShareProps {
    url: string;
    title: string;
    onShareSuccess?: () => void;
    className?: string; // Support custom styling (button)
    btnText?: string;    // Custom button text
    showIcon?: boolean;  // Toggle icon
    wrapperClass?: string; // Class for the wrapper div
}

export const LineShareAction: React.FC<ShareProps> = ({
    url,
    title,
    onShareSuccess,
    className = '', // Default to empty string to fix undefined type error
    btnText = 'LINE 分享',
    showIcon = true,
    wrapperClass = 'inline-block' // Default to inline-block
}) => {
    const handleShare = () => {
        // 1. Trigger mascot celebration (Global Event)
        window.dispatchEvent(new CustomEvent('mascot:celebrate', { detail: { emoji: '🎉' } }));

        // 2. Notify user
        notify.success('✨ 準備分享至 LINE', 'MaiMai 已經幫您整理好物件摘要了！');

        // 3. Tracking callback
        if (onShareSuccess) {
            onShareSuccess();
        }
    };

    // NOTE: react-share's LineShareButton opens the window immediately on click.
    // We wrap it to intercept the click for tracking/notify before the window events take over.
    // However, LineShareButton onClick prop might be overridden or handled internally for the popup.
    // The 'beforeOnClick' or just 'onClick' usually works.

    return (
        <div onClick={handleShare} className={wrapperClass}>
            {/* 
         Wrapping in a div to capture the click event bubbling up 
         because react-share buttons might consume onClick for their window.open logic 
         but we want to track it "as it happens".
       */}
            <LineShareButton
                url={url}
                title={title}
                className={className}
            >
                <div className="flex items-center justify-center gap-2">
                    {showIcon && <MessageCircle size={18} />}
                    <span>{btnText}</span>
                </div>
            </LineShareButton>
        </div>
    );
};
