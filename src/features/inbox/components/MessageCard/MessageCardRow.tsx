import React, { useState, useEffect } from 'react';
import MessageCard from './index';
import { inboxTypingStore } from '../../store/typingStore';
import type { InboxMessage } from '../../types';

interface MessageCardRowProps {
  item: InboxMessage;
  onPress: (messageId: string) => void;
}

/**
 * Wrapper that subscribes to typing store for this thread only.
 * Typing updates re-render only this row, not the entire list.
 */
export const MessageCardRow = React.memo<MessageCardRowProps>(function MessageCardRow({ item, onPress }) {
  const [typingInfo, setTypingInfo] = useState<{ userId: string; userName?: string } | null>(() =>
    inboxTypingStore.getTyping(item.id)
  );

  useEffect(() => {
    return inboxTypingStore.subscribe(item.id, setTypingInfo);
  }, [item.id]);

  const isTyping = !!typingInfo;
  const typingUserName = typingInfo?.userName;

  return (
    <MessageCard
      data={item}
      onPress={onPress}
      isTyping={isTyping}
      typingUserName={typingUserName}
    />
  );
});
