import React from 'react';
import { View } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';

interface MessageSkeletonProps {
  count?: number;
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ count = 5 }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const shimmerColor = isDark ? '#2A2A2A' : '#E1E9EE';

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: index < count - 1 ? 1 : 0,
            borderBottomColor: isDark ? '#333' : '#E9E9E9',
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              marginRight: 12,
              backgroundColor: shimmerColor,
            }}
          />

          {/* Message Content */}
          <View style={{ flex: 1 }}>
            {/* Sender Name */}
            <View
              style={{
                width: 120,
                height: 11,
                borderRadius: 4,
                marginBottom: 8,
                backgroundColor: shimmerColor,
              }}
            />

            {/* Last Message - 2 lines */}
            <View
              style={{
                width: '100%',
                height: 9,
                borderRadius: 4,
                marginBottom: 6,
                backgroundColor: shimmerColor,
              }}
            />
            <View
              style={{
                width: '75%',
                height: 9,
                borderRadius: 4,
                backgroundColor: shimmerColor,
              }}
            />
          </View>

          {/* Timestamp & Unread Badge */}
          <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
            <View
              style={{
                width: 40,
                height: 9,
                borderRadius: 4,
                marginBottom: 8,
                backgroundColor: shimmerColor,
              }}
            />
            {/* Unread Badge (randomly show) */}
            {index % 3 === 0 && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: shimmerColor,
                }}
              />
            )}
          </View>
        </View>
      ))}
    </View>
  );
};
