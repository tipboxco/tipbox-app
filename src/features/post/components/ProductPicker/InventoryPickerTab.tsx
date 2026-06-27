import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FlatList } from 'react-native';
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
  Input,
  InputField,
  Spinner,
} from '@gluestack-ui/themed';
import { Search, ChevronRight } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useAppStore } from '@/src/store/appStore';
import { useInventory } from '@/src/features/profile/api/hooks';
import { CachedImage } from '@/src/components/CachedImage';
import type { InventoryItem } from '@/src/features/profile/types';

/** Picker seçim callback'i — ProductPickerScreen üzerinden flow store'a yazılır. */
export type PickedProduct = {
  productId: string;
  title: string;
  image: string | null;
  subName?: string;
  /** Ürünün ait olduğu ürün grubu (kategori) ID'si — benchmark 2. ürün filtresi için. */
  productGroupId?: string;
  /** Envanter sekmesinden seçildiyse true (kullanıcı bu ürüne sahip). Tip-gating için. */
  isOwned?: boolean;
};

type Props = {
  onSelect: (product: PickedProduct) => void;
  /** Verilirse: yalnızca bu ürün grubuna ait envanter ürünleri gösterilir (benchmark karşılaştırma). */
  restrictProductGroupId?: string;
};

/** "Unknown" değerlerini eleyerek marka + model başlığı kurar. */
const buildTitle = (item: InventoryItem): string =>
  [item.brand?.name, item.brand?.model]
    .filter(v => v && v.toLowerCase() !== 'unknown')
    .join(' ')
    .trim() ||
  (item.brand?.name ?? '');

/**
 * Envanter sekmesi — kullanıcının envanterindeki ürünleri listeler ve seçtirir.
 * Seçim, post bağlamı olarak üst ekrana iletilir.
 */
export const InventoryPickerTab: React.FC<Props> = ({
  onSelect,
  restrictProductGroupId,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('post');
  const userId = useAppStore(state => state.user?.id);

  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue.trim()), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInventory(userId ?? '', 20);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    const flat = data.pages.flatMap(page => page.items);
    const seen = new Set<string>();
    return flat.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [data]);

  const filtered = useMemo(() => {
    // Benchmark karşılaştırma: yalnızca 1. ürünle aynı ürün grubundaki ürünler
    const scoped = restrictProductGroupId
      ? items.filter(i => i.productGroupId === restrictProductGroupId)
      : items;
    const q = debouncedQuery.toLowerCase();
    if (!q) return scoped;
    return scoped.filter(
      i =>
        i.brand.name.toLowerCase().includes(q) ||
        i.brand.model.toLowerCase().includes(q) ||
        i.brand.specs.toLowerCase().includes(q)
    );
  }, [items, debouncedQuery, restrictProductGroupId]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Theme colors — sibling katalog/post ekranlarıyla tutarlı
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const inputBg = isDark ? '#2A2A2A' : '#F2F2F2';
  const inputBorder = isDark ? '#333333' : '#E9E9E9';
  const cardBg = isDark ? '#222222' : '#FFFFFF';
  const dividerColor = isDark ? '#333333' : '#E5E7EB';
  const thumbBg = isDark ? '#2A2A2A' : '#F1F1F1';
  const accentColor = isDark ? '#818CF8' : '#6366F1';

  const renderItem = useCallback(
    ({ item }: { item: InventoryItem }) => {
      const title = buildTitle(item);
      return (
        <Pressable
          onPress={() =>
            onSelect({
              productId: item.productId,
              title,
              image: item.image,
              subName: item.brand?.model,
              productGroupId: item.productGroupId,
              isOwned: true, // Envanter sekmesi → kullanıcı bu ürüne sahip
            })
          }
        >
          <HStack alignItems='center' px='$4' py='$3'>
            <CachedImage
              source={item.image}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: thumbBg,
                marginRight: 12,
              }}
              contentFit='cover'
            />
            <VStack flex={1} space='xs'>
              <Text fontSize='$md' color={textColor} numberOfLines={1}>
                {title}
              </Text>
              {item.brand?.specs ? (
                <Text fontSize='$2xs' color={subTextColor} numberOfLines={1}>
                  {item.brand.specs}
                </Text>
              ) : null}
            </VStack>
            <ChevronRight size={18} color={subTextColor} />
          </HStack>
        </Pressable>
      );
    },
    [onSelect, textColor, subTextColor, thumbBg]
  );

  return (
    <Box flex={1}>
      {/* Search */}
      <Box px='$4' py='$3'>
        <HStack
          alignItems='center'
          bg={inputBg}
          borderWidth={1}
          borderColor={inputBorder}
          borderRadius={12}
          px={12}
          space='sm'
        >
          <Search size={16} color={subTextColor} />
          <Input flex={1} borderWidth={0} bg='transparent' h={40}>
            <InputField
              placeholder={t('create.productPicker.inventorySearch')}
              placeholderTextColor={subTextColor}
              color={textColor}
              fontSize='$sm'
              value={inputValue}
              onChangeText={setInputValue}
              returnKeyType='search'
            />
          </Input>
        </HStack>
      </Box>

      {isLoading ? (
        <Box flex={1} alignItems='center' justifyContent='center'>
          <Spinner color={accentColor} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box flex={1} alignItems='center' justifyContent='center' px='$8'>
          <Text fontSize='$sm' textAlign='center' color={subTextColor}>
            {t('create.productPicker.emptyInventory')}
          </Text>
        </Box>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => (
            <Box height={1} bg={dividerColor} ml={68} />
          )}
          contentContainerStyle={{
            marginHorizontal: 16,
            marginTop: 4,
            marginBottom: 24,
            backgroundColor: cardBg,
            borderRadius: 12,
            overflow: 'hidden',
          }}
          keyboardShouldPersistTaps='handled'
          keyboardDismissMode='on-drag'
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
        />
      )}
    </Box>
  );
};
