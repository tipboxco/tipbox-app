import React, { useMemo } from 'react';
import { ScrollView, View, Pressable, RefreshControl } from 'react-native';
import { PlusCircleIcon } from 'react-native-heroicons/outline';
import { Text } from '@/src/components/ui';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';

/** Tab keys that have their own dedicated empty-state copy in feed.json -> emptyCta */
const KNOWN_TAB_KEYS = ['trusting', 'forYou', 'tips', 'questions', 'reviews', 'benchmarks', 'updates'] as const;

interface FeedEmptyCtaProps {
  /** Active feed tab key, used to pick tab-specific CTA copy */
  tabKey: string;
  /** Triggers the post-create flow (same as the floating create button) */
  onCreatePress: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  /** Bottom padding to clear the floating tab bar */
  bottomPadding: number;
}

const FeedEmptyCtaComponent: React.FC<FeedEmptyCtaProps> = ({ tabKey, onCreatePress, refreshing, onRefresh, bottomPadding }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('feed');

  const ctaKey = (KNOWN_TAB_KEYS as readonly string[]).includes(tabKey) ? tabKey : 'default';

  const contentContainerStyle = useMemo(
    () => ({ flexGrow: 1, justifyContent: 'center' as const, alignItems: 'center' as const, paddingHorizontal: 32, paddingBottom: bottomPadding }),
    [bottomPadding]
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={isDark ? '#FFFFFF' : '#000000'}
          colors={isDark ? ['#FFFFFF'] : ['#000000']}
          progressBackgroundColor={isDark ? '#1A1A1A' : '#FFFFFF'}
        />
      }
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: isDark ? '#1A1A1A' : '#F4F4F2',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <PlusCircleIcon width={32} height={32} color={isDark ? '#C2E607' : '#596B00'} />
      </View>

      <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#F5F5F5' : '#1A1A1A', textAlign: 'center', marginBottom: 8 }}>
        {t(`emptyCta.${ctaKey}.title`)}
      </Text>

      <Text style={{ fontSize: 13, fontWeight: '400', color: isDark ? '#888888' : '#8C8C8C', textAlign: 'center', lineHeight: 19, marginBottom: 24 }}>
        {t(`emptyCta.${ctaKey}.description`)}
      </Text>

      <Pressable
        onPress={onCreatePress}
        style={{
          backgroundColor: '#C2E607',
          borderRadius: 12,
          paddingHorizontal: 24,
          paddingVertical: 12,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#596B00' }}>{t(`emptyCta.${ctaKey}.button`)}</Text>
      </Pressable>
    </ScrollView>
  );
};

export const FeedEmptyCta = React.memo(FeedEmptyCtaComponent);
FeedEmptyCta.displayName = 'FeedEmptyCta';
