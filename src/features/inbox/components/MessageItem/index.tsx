import React from 'react';
import { MessageBubble } from './MessageBubble';
import { ImageMessage } from './ImageMessage';
import { TipsMessage } from './TipsMessage';
import { SupportRequestMessage } from './SupportRequestMessage';
import { SharedPostMessage } from './SharedPostMessage';
import { getMessageGroup } from '../../utils/messageHelpers';
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
  onContextMenuStateChange,
}) => {
  const { isFirstInGroup, isLastInGroup } = getMessageGroup(messages, index);

  return (
    <>
      {item.type === 'image' && item.mediaUrl ? (
        <>
          {__DEV__ && (() => {
            console.log('[MessageItem] 🖼️ Image message render ediliyor:', {
              id: item.id,
              type: item.type,
              mediaUrl: item.mediaUrl,
              uploadStatus: item.uploadStatus,
              uploadProgress: item.uploadProgress,
            });
            return null;
          })()}
          <ImageMessage
            item={item}
            isDark={isDark}
            params={params}
            isFirstInGroup={isFirstInGroup}
            onDelete={onDelete}
            onContextMenuStateChange={onContextMenuStateChange}
            currentUserId={currentUserId}
          />
        </>
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
      ) : item.type === 'sharedpost' && item.sharedPost ? (
        <SharedPostMessage
          item={item}
          isDark={isDark}
          params={params}
          isFirstInGroup={isFirstInGroup}
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
          onReact={onReact}
          onContextMenuStateChange={onContextMenuStateChange}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
};
