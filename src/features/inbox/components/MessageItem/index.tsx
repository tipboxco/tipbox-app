import React from 'react';
import { MessageBubble } from './MessageBubble';
import { ImageMessage } from './ImageMessage';
import { TipsMessage } from './TipsMessage';
import { SupportRequestMessage } from './SupportRequestMessage';
import { DateSeparator } from './DateSeparator';
import { getMessageGroup, shouldShowDateSeparator } from '../../utils/messageHelpers';
import type { MessageItemProps } from './types';

export const MessageItem: React.FC<MessageItemProps> = ({
  item,
  index,
  messages,
  isDark,
  params,
  onDelete,
  onEdit,
  onReply,
  onReact,
  expandedSupportRequests,
  onToggleSupportRequest,
  onAcceptSupportRequest,
  onRejectSupportRequest,
  onCancelSupportRequest,
  onGoToSupportChat,
  currentUserId,
}) => {
  const { isFirstInGroup, isLastInGroup } = getMessageGroup(messages, index);
  const prevMessage = index > 0 ? messages[index - 1] : null;
  const showDateSeparator = shouldShowDateSeparator(item, prevMessage);

  return (
    <>
      {showDateSeparator && <DateSeparator timestamp={item.timestamp} isDark={isDark} />}
      
      {item.type === 'image' && item.mediaUrl ? (
        <ImageMessage
          item={item}
          isDark={isDark}
          params={params}
          isFirstInGroup={isFirstInGroup}
          onDelete={onDelete}
        />
      ) : item.type === 'tips' ? (
        <TipsMessage
          item={item}
          isDark={isDark}
          params={params}
          isFirstInGroup={isFirstInGroup}
        />
      ) : item.type === 'support_request' && item.supportRequest ? (
        <SupportRequestMessage
          item={item}
          isDark={isDark}
          expandedSupportRequests={expandedSupportRequests}
          onToggleSupportRequest={onToggleSupportRequest}
          onAcceptSupportRequest={onAcceptSupportRequest}
          onRejectSupportRequest={onRejectSupportRequest}
          onCancelSupportRequest={onCancelSupportRequest}
          onGoToSupportChat={onGoToSupportChat}
          currentUserId={currentUserId}
        />
      ) : (
        <MessageBubble
          item={item}
          isDark={isDark}
          params={params}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          onDelete={onDelete}
          onEdit={onEdit}
          onReply={onReply}
        />
      )}
    </>
  );
};
