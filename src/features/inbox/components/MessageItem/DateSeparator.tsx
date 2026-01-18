import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { formatDateHeader } from '../../utils/messageHelpers';

interface DateSeparatorProps {
  timestamp: string;
  isDark: boolean;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ timestamp, isDark }) => {
  return (
    <Box py="$3" alignItems="center" width="100%">
      <Box
        bg={isDark ? '#2A2A2A' : '#E5E5E5'}
        px="$3"
        py="$1"
        borderRadius={12}
      >
        <Text
          color={isDark ? '#8C8C8C' : '#8C8C8C'}
          fontSize="$xs"
          fontWeight="$medium"
        >
          {formatDateHeader(timestamp)}
        </Text>
      </Box>
    </Box>
  );
};
