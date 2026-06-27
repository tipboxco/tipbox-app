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
import { Search, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import {
  useGlobalProductSearch,
  useCatalogCategories,
  useCatalogSubCategories,
  useCatalogProductGroups,
  useCatalogProducts,
} from '@/src/features/catalog/api/hooks';
import { CachedImage } from '@/src/components/CachedImage';
import type { PickedProduct } from './InventoryPickerTab';

type Props = {
  onSelect: (product: PickedProduct) => void;
  /** Verilirse: kategori drill-down yerine yalnızca bu ürün grubundaki ürünler listelenir (benchmark karşılaştırma). */
  restrictProductGroupId?: string;
};

/** Gezgin yolundaki bir seviye (ana kategori / alt kategori / ürün grubu). */
type BrowseNode = { id: string; name: string; image: string | null };

/** Listede gösterilen normalize edilmiş satır. drill=true ise alt seviyeye iner, değilse seçer. */
type Row = {
  key: string;
  title: string;
  subtitle?: string;
  image: string | null;
  drill: boolean;
  onPress: () => void;
};

/**
 * Katalog sekmesi — iki kullanım:
 *  1) Üstteki arama kutusuyla doğrudan ürün arama (global product search).
 *  2) Arama boşsa: Ana kategori → Alt kategori → Ürün grubu → Ürün drill-down.
 * En alt katmandaki ürün seçilince post bağlamı olarak üst ekrana iletilir.
 */
export const CatalogPickerTab: React.FC<Props> = ({
  onSelect,
  restrictProductGroupId,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('post');

  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue.trim()), 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const isSearching = debouncedQuery.length > 0;

  // Gezgin yolu: 0=ana kategoriler, 1=alt kategoriler, 2=ürün grupları, 3=ürünler
  const [path, setPath] = useState<BrowseNode[]>([]);
  const depth = path.length;

  // Ürün araması (arama kutusu doluyken)
  const productSearch = useGlobalProductSearch(
    isSearching ? debouncedQuery : undefined
  );

  // Gezgin sorguları — her biri ilgili seviyede aktif
  const categories = useCatalogCategories(50);
  const subCategories = useCatalogSubCategories(
    depth >= 1 ? path[0]?.id : undefined,
    50
  );
  const productGroups = useCatalogProductGroups(
    depth >= 2 ? path[1]?.id : undefined,
    50
  );
  const products = useCatalogProducts(
    depth >= 3 ? path[2]?.id : undefined,
    undefined,
    30
  );

  // Benchmark karşılaştırma: drill-down yerine doğrudan 1. ürünün grubundaki ürünleri listele
  // (arama kutusu bu grup içinde filtreler). restrictProductGroupId yoksa sorgu pasiftir.
  const restricted = !!restrictProductGroupId;
  const restrictedProducts = useCatalogProducts(
    restrictProductGroupId,
    isSearching ? debouncedQuery : undefined,
    30
  );

  const handleSelectProduct = useCallback(
    (p: {
      productId: string;
      name: string;
      image: string | null;
      subtitle?: string;
      productGroupId?: string;
    }) => {
      onSelect({
        productId: p.productId,
        title: p.name,
        image: p.image,
        subName: p.subtitle,
        productGroupId: p.productGroupId,
        isOwned: false, // Katalog sekmesi → sahiplik envanter kontrolüne bırakılır
      });
    },
    [onSelect]
  );

  // Kısıtlı (benchmark) modda gösterilen ürün satırları
  const restrictedRows = useMemo<Row[]>(() => {
    if (!restricted) return [];
    return (restrictedProducts.data?.pages ?? [])
      .flatMap(p => p.items)
      .map<Row>(prod => ({
        key: `prod-${prod.productId}`,
        title: prod.name,
        image: prod.image,
        drill: false,
        onPress: () => handleSelectProduct(prod),
      }));
  }, [restricted, restrictedProducts.data, handleSelectProduct]);

  // Arama sonucu ürün satırları (gruplu sonuç → düz ürün listesi + breadcrumb)
  const searchRows = useMemo<Row[]>(() => {
    if (!isSearching) return [];
    return (productSearch.data?.pages ?? [])
      .flatMap(p => p.items)
      .flatMap(group => {
        const breadcrumb = [
          group.categoryName,
          group.subCategoryName,
          group.productGroupName,
        ]
          .filter(Boolean)
          .join(' › ');
        return group.products.map<Row>(prod => ({
          key: `prod-${prod.productId}`,
          title: prod.name,
          subtitle: breadcrumb,
          image: prod.image,
          drill: false,
          onPress: () => handleSelectProduct({ ...prod, subtitle: breadcrumb }),
        }));
      });
  }, [isSearching, productSearch.data, handleSelectProduct]);

  // Gezgin satırları (mevcut seviyeye göre)
  const browseRows = useMemo<Row[]>(() => {
    if (isSearching) return [];
    if (depth === 0) {
      return (categories.data?.pages ?? [])
        .flatMap(p => p.items)
        .map<Row>(c => ({
          key: `cat-${c.categoryId}`,
          title: c.name,
          image: c.image,
          drill: true,
          onPress: () =>
            setPath([{ id: c.categoryId, name: c.name, image: c.image }]),
        }));
    }
    if (depth === 1) {
      return (subCategories.data?.pages ?? [])
        .flatMap(p => p.items)
        .map<Row>(s => ({
          key: `sub-${s.subCategoryId}`,
          title: s.name,
          image: s.image,
          drill: true,
          onPress: () =>
            setPath(prev => [
              ...prev,
              { id: s.subCategoryId, name: s.name, image: s.image },
            ]),
        }));
    }
    if (depth === 2) {
      return (productGroups.data?.pages ?? [])
        .flatMap(p => p.items)
        .map<Row>(g => ({
          key: `pg-${g.productGroupId}`,
          title: g.name,
          image: g.image,
          drill: true,
          onPress: () =>
            setPath(prev => [
              ...prev,
              { id: g.productGroupId, name: g.name, image: g.image },
            ]),
        }));
    }
    return (products.data?.pages ?? [])
      .flatMap(p => p.items)
      .map<Row>(prod => ({
        key: `prod-${prod.productId}`,
        title: prod.name,
        image: prod.image,
        drill: false,
        onPress: () => handleSelectProduct(prod),
      }));
  }, [
    isSearching,
    depth,
    categories.data,
    subCategories.data,
    productGroups.data,
    products.data,
    handleSelectProduct,
  ]);

  const rows = restricted
    ? restrictedRows
    : isSearching
      ? searchRows
      : browseRows;

  const loading = restricted
    ? restrictedProducts.isLoading
    : isSearching
      ? productSearch.isLoading
      : depth === 0
        ? categories.isLoading
        : depth === 1
          ? subCategories.isLoading
          : depth === 2
            ? productGroups.isLoading
            : products.isLoading;

  const handleEndReached = useCallback(() => {
    if (restricted) {
      if (
        restrictedProducts.hasNextPage &&
        !restrictedProducts.isFetchingNextPage
      )
        restrictedProducts.fetchNextPage();
      return;
    }
    if (isSearching) {
      if (productSearch.hasNextPage && !productSearch.isFetchingNextPage)
        productSearch.fetchNextPage();
      return;
    }
    const q =
      depth === 0
        ? categories
        : depth === 1
          ? subCategories
          : depth === 2
            ? productGroups
            : products;
    if (q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
  }, [
    restricted,
    restrictedProducts,
    isSearching,
    depth,
    categories,
    subCategories,
    productGroups,
    products,
    productSearch,
  ]);

  const handleBack = useCallback(() => setPath(prev => prev.slice(0, -1)), []);

  // Theme colors
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const inputBg = isDark ? '#2A2A2A' : '#F2F2F2';
  const inputBorder = isDark ? '#333333' : '#E9E9E9';
  const cardBg = isDark ? '#222222' : '#FFFFFF';
  const dividerColor = isDark ? '#333333' : '#E5E7EB';
  const thumbBg = isDark ? '#2A2A2A' : '#F1F1F1';
  const accentColor = isDark ? '#818CF8' : '#6366F1';

  const renderRow = useCallback(
    ({ item }: { item: Row }) => (
      <Pressable onPress={item.onPress}>
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
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text fontSize='$2xs' color={subTextColor} numberOfLines={1}>
                {item.subtitle}
              </Text>
            ) : null}
          </VStack>
          {item.drill && <ChevronRight size={18} color={subTextColor} />}
        </HStack>
      </Pressable>
    ),
    [textColor, subTextColor, thumbBg]
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
              placeholder={t('create.productPicker.catalogSearch')}
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

      {/* Breadcrumb / geri — yalnızca gezginde ve bir seviye içindeyken (kısıtlı modda drill yok) */}
      {!restricted && !isSearching && depth > 0 && (
        <Pressable onPress={handleBack}>
          <HStack alignItems='center' px='$4' pb='$2' space='xs'>
            <ChevronLeft size={20} color={accentColor} />
            <Text
              fontSize='$sm'
              fontWeight='$medium'
              color={accentColor}
              numberOfLines={1}
            >
              {path[depth - 1].name}
            </Text>
          </HStack>
        </Pressable>
      )}

      {loading && rows.length === 0 ? (
        <Box flex={1} alignItems='center' justifyContent='center'>
          <Spinner color={accentColor} />
        </Box>
      ) : rows.length === 0 ? (
        <Box flex={1} alignItems='center' justifyContent='center' px='$8'>
          <Text fontSize='$sm' textAlign='center' color={subTextColor}>
            {t('create.productPicker.noResults')}
          </Text>
        </Box>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => item.key}
          renderItem={renderRow}
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
