import React from 'react';
import { View } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useColorMode } from '@/src/hooks/useColorMode';

interface NotificationSkeletonProps {
  count?: number;
}

export const NotificationSkeleton: React.FC<NotificationSkeletonProps> = ({ count = 5 }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Skeleton colors based on theme
  const skeletonColor = isDark ? '#1A1A1A' : '#E1E9EE';
  const highlightColor = isDark ? '#2A2A2A' : '#F2F8FC';

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonPlaceholder
          key={index}
          backgroundColor={skeletonColor}
          highlightColor={highlightColor}
          speed={800}
        >
          <View style={{ marginBottom: 16 }}>
            {/* Notification Row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              {/* Avatar */}
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  marginRight: 12,
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
                  }}
                />

                {/* Notification Message - 2 lines */}
                <View
                  style={{
                    width: '100%',
                    height: 10,
                    borderRadius: 4,
                    marginBottom: 6,
                  }}
                />
                <View
                  style={{
                    width: '80%',
                    height: 10,
                    borderRadius: 4,
                    marginBottom: 8,
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
                  }}
                />
              </View>
            </View>
          </View>
        </SkeletonPlaceholder>
      ))}
    </View>
  );
};
