import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

/**
 * Notification Badge Component
 * 
 * Bottom tab bar'da bildirim iconunda gösterilecek count badge
 */
interface NotificationBadgeProps {
  count: number;
  size?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  size = 18,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // 0 ise gösterilmez
  if (count <= 0) {
    return null;
  }

  // 99+ formatı
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <Box
      position="absolute"
      top={-4}
      right={-4}
      minWidth={size}
      height={size}
      borderRadius={size / 2}
      bg="#FF3B30" // iOS red badge color
      justifyContent="center"
      alignItems="center"
      px={count > 9 ? 4 : 0}
      borderWidth={2}
      borderColor={isDark ? '#000000' : '#FAFAFA'}
    >
      <Text
        color="#FFFFFF"
        fontSize={10}
        fontWeight="$bold"
        lineHeight={12}
      >
        {displayCount}
      </Text>
    </Box>
  );
};

export default NotificationBadge;



