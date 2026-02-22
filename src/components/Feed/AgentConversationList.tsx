/** MSG-5: 房仲側欄的客戶對話列表 */
import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import type { ConversationListItem } from '../../types/messaging.types';
import { ROUTES } from '../../constants/routes';
import { ConversationItem } from './ConversationItem';

const MAX_VISIBLE_CONVERSATIONS = 5;

interface AgentConversationListProps {
  conversations: ConversationListItem[];
  className?: string;
}

export const AgentConversationList = memo(function AgentConversationList({
  conversations,
  className = '',
}: AgentConversationListProps): React.ReactElement {
  const conversationItems = useMemo(
    () =>
      conversations
        .slice(0, MAX_VISIBLE_CONVERSATIONS)
        .map((conv) => <ConversationItem key={conv.id} conv={conv} />),
    [conversations]
  );

  if (conversations.length === 0) {
    return (
      <div
        className={`rounded-[14px] border border-brand-100 bg-white p-[14px] shadow-card ${className}`}
      >
        <div className="mb-2.5 flex items-center gap-2">
          <MessageCircle className="size-4 text-brand-600" />
          <h4 className="m-0 text-[14px] font-bold text-brand-700">我的客戶</h4>
        </div>
        <p className="text-xs text-gray-400">尚無客戶對話</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-[14px] border border-brand-100 bg-white p-[14px] shadow-card ${className}`}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-4 text-brand-600" />
          <h4 className="m-0 text-[14px] font-bold text-brand-700">我的客戶</h4>
        </div>
        {conversations.length > 0 && (
          <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-600">
            {conversations.length}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {conversationItems}

        {conversations.length > MAX_VISIBLE_CONVERSATIONS && (
          <Link
            to={ROUTES.HOME_CONVERSATIONS}
            className="mt-1 text-center text-[12px] text-brand-600 hover:underline"
          >
            查看全部 {conversations.length} 位客戶
          </Link>
        )}
      </div>
    </div>
  );
});
