import React from 'react';
import { View } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';

interface NotificationSkeletonProps {
  count?: number;
}

export const NotificationSkeleton: React.FC<NotificationSkeletonProps> = ({ count = 5 }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const shimmerColor = isDark ? '#2A2A2A' : '#E1E9EE';

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={{ marginBottom: 16 }}>
          {/* Notification Row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
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

            {/* Content */}
            <View style={{ flex: 1, paddingTop: 4 }}>
              {/* Username */}
              <View
                style={{
                  width: 120,
                  height: 12,
                  borderRadius: 4,
                  marginBottom: 8,
                  backgroundColor: shimmerColor,
                }}
              />

              {/* Notification Message - 2 lines */}
              <View
                style={{
                  width: '100%',
                  height: 10,
                  borderRadius: 4,
                  marginBottom: 6,
                  backgroundColor: shimmerColor,
                }}
              />
              <View
                style={{
                  width: '80%',
                  height: 10,
                  borderRadius: 4,
                  marginBottom: 8,
                  backgroundColor: shimmerColor,
                }}
              />

              {/* Post Preview (only for some items) */}
              {index % 2 === 0 && (
                <View
                  style={{
                    width: '100%',
                    height: 120,
                    borderRadius: 12,
                    marginTop: 8,
                    backgroundColor: shimmerColor,
                  }}
                />
              )}

              {/* Timestamp */}
              <View
                style={{
                  width: 60,
                  height: 9,
                  borderRadius: 4,
                  marginTop: 8,
                  backgroundColor: shimmerColor,
                }}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};
