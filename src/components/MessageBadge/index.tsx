import React from 'react';
import { Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

/**
 * Message Badge Component
 * 
 * Bottom tab bar'da inbox iconunda gösterilecek badge (sadece nokta, count yok)
 */
interface MessageBadgeProps {
  hasUnread: boolean;
  size?: number;
}

export const MessageBadge: React.FC<MessageBadgeProps> = ({
  hasUnread,
  size = 10,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Unread mesaj yoksa gösterilmez
  if (!hasUnread) {
    return null;
  }

  return (
    <Box
      position="absolute"
      top={-2}
      right={-2}
      width={size}
      height={size}
      borderRadius={size / 2}
      bg="#FF3B30" // iOS red badge color
      borderWidth={2}
      borderColor={isDark ? '#000000' : '#FAFAFA'}
    />
  );
};

export default MessageBadge;






