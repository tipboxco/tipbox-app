import React from 'react';
import { View } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useColorMode } from '@/src/hooks/useColorMode';

interface MessageSkeletonProps {
  count?: number;
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ count = 5 }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Skeleton colors based on theme
  const skeletonColor = isDark ? '#1A1A1A' : '#E1E9EE';
  const highlightColor = isDark ? '#2A2A2A' : '#F2F8FC';

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonPlaceholder
          key={index}
          backgroundColor={skeletonColor}
          highlightColor={highlightColor}
          speed={800}
        >
          <View
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
                }}
              />

              {/* Last Message - 2 lines */}
              <View
                style={{
                  width: '100%',
                  height: 9,
                  borderRadius: 4,
                  marginBottom: 6,
                }}
              />
              <View
                style={{
                  width: '75%',
                  height: 9,
                  borderRadius: 4,
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
                }}
              />
              {/* Unread Badge (randomly show) */}
              {index % 3 === 0 && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                  }}
                />
              )}
            </View>
          </View>
        </SkeletonPlaceholder>
      ))}
    </View>
  );
};
