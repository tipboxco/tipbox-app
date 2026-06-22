import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, HStack, Input, InputField, Pressable } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { FeedSkeleton } from '@/src/components/Skeletons';
import { FeedItemCard } from '../components';
import { useSearchPosts } from '../api/hooks';
import { useBottomOffset } from '@/src/utils';
import type { FeedApiItem } from '@/src/features/feed/api/feedApi';
import type { RootStackParamList } from '@/src/navigation/navigation.types';

type ExploreSearchNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MIN_QUERY_LENGTH = 2;

/**
 * ExploreSearchScreen - Paylaşılan postlarda metin araması yapan tam sayfa ekran.
 * Kullanıcı metin girer, debounce sonrası backend'de post başlığı/içeriği aranır
 * ve eşleşen postlar feed kartları olarak listelenir (cursor pagination ile).
 */
export const ExploreSearchScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ExploreSearchNavigationProp>();
  const { t } = useTranslation('explore');
  const bottomPadding = useBottomOffset({ includeTabBar: false, extraPadding: 8 });

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const backgroundColor = isDark ? '#000000' : '#FFFFFF';
  const inputBg = isDark ? '#2A2A2A' : '#F2F2F2';

  // Debounce search input (500ms) - keşfet ekranıyla aynı gecikme
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const hasQuery = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    error,
  } = useSearchPosts(debouncedQuery);

  // Tüm sayfaları tek diziye indir + ID'ye göre tekilleştir
  const results = useMemo(() => {
    if (!data?.pages) return [];
    const allItems = data.pages.flatMap((page) => page.items);
    const uniqueItemsMap = new Map<string, FeedApiItem>();
    for (const item of allItems) {
      if (!uniqueItemsMap.has(item.data.id)) {
        uniqueItemsMap.set(item.data.id, item);
      }
    }
    return Array.from(uniqueItemsMap.values());
  }, [data?.pages]);

  const isLoadingMoreRef = useRef(false);
  useEffect(() => {
    isLoadingMoreRef.current = false;
  }, [results.length]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !hasNextPage || isFetchingNextPage) {
      return;
    }
    isLoadingMoreRef.current = true;
    fetchNextPage().finally(() => {
      setTimeout(() => {
        isLoadingMoreRef.current = false;
      }, 1000);
    });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getItemKey = useCallback((item: FeedApiItem) => `search-${item.data.id}`, []);

  const LoadingFooter = useMemo(() => {
    if (!isFetchingNextPage) return null;
    return (
      <Box py="$4" alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [isFetchingNextPage, isDark]);

  // İçerik durumuna göre gövde
  const renderBody = () => {
    // Henüz arama yapılmadıysa ipucu göster
    if (!hasQuery) {
      return (
        <Box flex={1} justifyContent="center" alignItems="center" px="$8" py="$20">
          <Search size={56} color={isDark ? '#48484A' : '#D1D1D6'} />
          <Text mt="$4" fontSize="$sm" color="#8E8E93" textAlign="center" fontWeight="$medium">
            {t('search.hint')}
          </Text>
        </Box>
      );
    }

    // İlk yükleme (cache yok)
    if ((isLoading || isFetching) && results.length === 0 && !error) {
      return <FeedSkeleton count={5} />;
    }

    // Hata
    if (error && results.length === 0) {
      return (
        <Box flex={1} justifyContent="center" alignItems="center" px="$4" py="$20">
          <Text fontSize="$sm" color="#CE4A4A" textAlign="center" fontWeight="$semibold">
            {t('search.error')}
          </Text>
        </Box>
      );
    }

    // Sonuç yok
    if (results.length === 0) {
      return (
        <Box flex={1} justifyContent="center" alignItems="center" px="$8" py="$20">
          <Search size={56} color={isDark ? '#48484A' : '#D1D1D6'} />
          <Text mt="$4" fontSize="$sm" color="#8E8E93" textAlign="center" fontWeight="$medium">
            {t('search.empty')}
          </Text>
          <Text mt="$2" fontSize="$xs" color="#8E8E93" textAlign="center">
            {t('search.emptyHint', { query: debouncedQuery })}
          </Text>
        </Box>
      );
    }

    // Sonuç listesi
    return (
      <FlatList
        data={results}
        renderItem={({ item }) => <FeedItemCard item={item} />}
        keyExtractor={getItemKey}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        removeClippedSubviews={true}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomPadding, paddingHorizontal: 16 }}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={LoadingFooter}
        showsVerticalScrollIndicator={true}
      />
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '#F5F5F5'}>
        {/* Header: geri butonu + arama input */}
        <HStack alignItems="center" px="$4" pt="$3" pb="$3" space="sm" bg={backgroundColor}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
          </Pressable>

          <HStack flex={1} alignItems="center" bg={inputBg} borderRadius={12} px={14} space="sm" h={48}>
            <Search size={20} color="#8E8E93" />
            <Input flex={1} borderWidth={0} bg="transparent">
              <InputField
                placeholder={t('search.placeholder')}
                placeholderTextColor="#8E8E93"
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize="$xs"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
            </Input>
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color="#8E8E93" />
              </Pressable>
            )}
          </HStack>
        </HStack>

        {renderBody()}
      </Box>
    </SafeAreaView>
  );
};

ExploreSearchScreen.displayName = 'ExploreSearchScreen';

export default ExploreSearchScreen;
