import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ScrollView, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, Search, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useCreatePostFlowStore } from '@/src/features/post/store/createPostFlowStore';
import {
  useSubCategorySearch,
  useProductGroupSearch,
  useGlobalProductSearch,
  useCatalogCategories,
  useCatalogSubCategories,
  useCatalogProductGroups,
} from '@/src/features/catalog/api/hooks';
import { ProductInfoType } from '@/src/types/common';
import type {
  CatalogSubCategory,
  CatalogProductGroup,
  CatalogProduct,
} from '@/src/features/catalog/types';
import { CachedImage } from '@/src/components/CachedImage';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import type { PostStackParamList } from '../navigation';

type CategorySearchNavigationProp =
  NativeStackNavigationProp<PostStackParamList>;
type CategorySearchRouteProp = RouteProp<PostStackParamList, 'CategorySearch'>;

/** Uniform row shape: title + breadcrumb path subtitle, shared by one renderer */
type RowItem = {
  id: string;
  name: string;
  breadcrumb: string;
  onPress: () => void;
};

/** Kategori gezgini düğümü (drill-down yolundaki bir seviye). */
type BrowseNode = { id: string; name: string; image: string | null };
/** Mevcut seviyede listelenen öğe; kind, tıklamada iniş mi seçim mi olacağını belirler. */
type BrowseKind = 'category' | 'subCategory' | 'productGroup';
type BrowseItem = {
  id: string;
  name: string;
  image: string | null;
  kind: BrowseKind;
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Debug log için güvenli, kırpılmış JSON serileştirme (büyük response'larda ekranı şişirmemek için). */
const safeStringify = (value: unknown): string => {
  try {
    const json = JSON.stringify(value);
    return json.length > 1500 ? `${json.slice(0, 1500)}…` : json;
  } catch {
    return String(value);
  }
};

/**
 * Renders text with every case-insensitive occurrence of `query` rendered in bold.
 * Designed to be used as a child of a parent <Text>.
 */
const HighlightedText: React.FC<{
  text: string;
  query: string;
  color: string;
}> = ({ text, query, color }) => {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, 'gi'));
  const lowerQuery = trimmed.toLowerCase();

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === lowerQuery ? (
          <Text key={`${part}-${index}`} fontWeight='$bold' color={color}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </>
  );
};

export const CategorySearchScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = useMemo(() => colorMode === 'dark', [colorMode]);
  const navigation = useNavigation<CategorySearchNavigationProp>();
  const route = useRoute<CategorySearchRouteProp>();
  const { t } = useTranslation('post');
  const { setFlowContext } = useCreatePostFlowStore();

  // returnTo='CreatePostScreen' ise: bağlamı flow store'a yaz ve geri dön (attach mekaniği).
  // Aksi halde (varsayılan giriş akışı) ileri doğru CreatePostScreen'e git.
  const returnTo = route.params?.returnTo;
  const finishWithContext = useCallback(
    (contextType: ProductInfoType, contextId: string) => {
      if (returnTo === 'CreatePostScreen') {
        navigation.goBack();
        return;
      }
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreatePostScreen',
        params: { contextType, contextId },
      });
    },
    [returnTo, navigation]
  );

  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const {
    data: subCatSearchData,
    isLoading: subCatSearchLoading,
    error: subCatSearchError,
  } = useSubCategorySearch(debouncedQuery);
  const {
    data: pgSearchData,
    isLoading: pgSearchLoading,
    error: pgSearchError,
  } = useProductGroupSearch(debouncedQuery);
  const {
    data: productSearchData,
    isLoading: productSearchLoading,
    error: productSearchError,
  } = useGlobalProductSearch(debouncedQuery);
  // Kategori gezgini (arama yokken): Ana kategori → Alt kategori → Ürün grubu drill-down.
  // browsePath uzunluğu mevcut seviyeyi belirler: 0=ana kategoriler, 1=alt kategoriler, 2=ürün grupları.
  const [browsePath, setBrowsePath] = useState<BrowseNode[]>([]);
  const browseDepth = browsePath.length;
  const currentCategory = browsePath[0];
  const currentSubCategory = browsePath[1];

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    fetchNextPage: fetchMoreCategories,
    hasNextPage: hasMoreCategories,
  } = useCatalogCategories(50);
  const {
    data: browseSubCatsData,
    isLoading: browseSubCatsLoading,
    fetchNextPage: fetchMoreSubCats,
    hasNextPage: hasMoreSubCats,
  } = useCatalogSubCategories(
    browseDepth >= 1 ? currentCategory?.id : undefined,
    50
  );
  const {
    data: browsePGsData,
    isLoading: browsePGsLoading,
    fetchNextPage: fetchMorePGs,
    hasNextPage: hasMorePGs,
  } = useCatalogProductGroups(
    browseDepth >= 2 ? currentSubCategory?.id : undefined,
    50
  );

  const isSearching = !!debouncedQuery && debouncedQuery.trim().length > 0;
  const isSearchLoading =
    subCatSearchLoading || pgSearchLoading || productSearchLoading;

  // ───────────────────────────────────────────────────────────────────────────
  // DEBUG: Arama API request/response verilerini ekrana log olarak bas (__DEV__).
  // Üretim derlemesinde render edilmez; geçici inceleme amaçlıdır.
  // ───────────────────────────────────────────────────────────────────────────
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const pushLog = useCallback((line: string) => {
    const stamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
    setDebugLogs(prev => [`${stamp}  ${line}`, ...prev].slice(0, 60));
  }, []);

  // Request: debouncedQuery değiştiğinde 3 arama API'sine atılan istekleri logla.
  useEffect(() => {
    if (!__DEV__ || !debouncedQuery) return;
    const q = encodeURIComponent(debouncedQuery);
    pushLog(
      `▶ REQ subcategories   GET /catalog/subcategories/search?q=${q}&limit=20`
    );
    pushLog(
      `▶ REQ product-groups  GET /catalog/product-groups/search?q=${q}&limit=20`
    );
    pushLog(
      `▶ REQ products        GET /catalog/products/search?search=${q}&limit=20`
    );
  }, [debouncedQuery, pushLog]);

  // Response: subcategory araması
  useEffect(() => {
    if (!__DEV__ || !isSearching || subCatSearchLoading) return;
    if (subCatSearchError) {
      pushLog(`✖ RES subcategories   ERROR: ${subCatSearchError.message}`);
    } else if (subCatSearchData) {
      const items = subCatSearchData.pages.flatMap(p => p.items);
      pushLog(
        `◀ RES subcategories   ${items.length} item ${safeStringify(items)}`
      );
    }
  }, [
    subCatSearchData,
    subCatSearchError,
    subCatSearchLoading,
    isSearching,
    pushLog,
  ]);

  // Response: product-group araması
  useEffect(() => {
    if (!__DEV__ || !isSearching || pgSearchLoading) return;
    if (pgSearchError) {
      pushLog(`✖ RES product-groups  ERROR: ${pgSearchError.message}`);
    } else if (pgSearchData) {
      const items = pgSearchData.pages.flatMap(p => p.items);
      pushLog(
        `◀ RES product-groups  ${items.length} item ${safeStringify(items)}`
      );
    }
  }, [pgSearchData, pgSearchError, pgSearchLoading, isSearching, pushLog]);

  // Response: global product araması
  useEffect(() => {
    if (!__DEV__ || !isSearching || productSearchLoading) return;
    if (productSearchError) {
      pushLog(`✖ RES products        ERROR: ${productSearchError.message}`);
    } else if (productSearchData) {
      const groups = productSearchData.pages.flatMap(p => p.items);
      pushLog(
        `◀ RES products        ${groups.length} grup ${safeStringify(groups)}`
      );
    }
  }, [
    productSearchData,
    productSearchError,
    productSearchLoading,
    isSearching,
    pushLog,
  ]);

  // Per-type result lists (alt kategori + ürün grubu); ürünler aşağıda doğrudan satıra dönüştürülür
  const subCatResults = useMemo<CatalogSubCategory[]>(() => {
    if (!isSearching) return [];
    return (subCatSearchData?.pages ?? []).flatMap(p => p.items);
  }, [isSearching, subCatSearchData]);

  const pgResults = useMemo<CatalogProductGroup[]>(() => {
    if (!isSearching) return [];
    return (pgSearchData?.pages ?? []).flatMap(p => p.items);
  }, [isSearching, pgSearchData]);

  const handleSelectSubCategory = useCallback(
    (item: CatalogSubCategory) => {
      setFlowContext(ProductInfoType.SUB_CATEGORY, item.subCategoryId, {
        title: item.name,
        image: item.image,
      });
      finishWithContext(ProductInfoType.SUB_CATEGORY, item.subCategoryId);
    },
    [setFlowContext, finishWithContext]
  );

  const handleSelectProductGroup = useCallback(
    (item: CatalogProductGroup) => {
      setFlowContext(ProductInfoType.PRODUCT_GROUP, item.productGroupId, {
        title: item.name,
        image: item.image,
      });
      finishWithContext(ProductInfoType.PRODUCT_GROUP, item.productGroupId);
    },
    [setFlowContext, finishWithContext]
  );

  const handleSelectProduct = useCallback(
    (item: CatalogProduct) => {
      setFlowContext(ProductInfoType.PRODUCT, item.productId, {
        title: item.name,
        image: item.image,
      });
      finishWithContext(ProductInfoType.PRODUCT, item.productId);
    },
    [setFlowContext, finishWithContext]
  );

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Gezgin: satıra dokunma. Ana kategori/alt kategori → bir alt seviyeye in; ürün grubu → seç ve bitir.
  const handleBrowsePress = useCallback(
    (item: BrowseItem) => {
      if (item.kind === 'category') {
        setBrowsePath([{ id: item.id, name: item.name, image: item.image }]);
      } else if (item.kind === 'subCategory') {
        setBrowsePath(prev => [
          ...prev,
          { id: item.id, name: item.name, image: item.image },
        ]);
      } else {
        handleSelectProductGroup({
          productGroupId: item.id,
          name: item.name,
          image: item.image,
          subCategoryId: currentSubCategory?.id ?? '',
        });
      }
    },
    [handleSelectProductGroup, currentSubCategory]
  );

  // Gezgin: bir seviye geri (üst kategoriye).
  const handleBrowseBack = useCallback(() => {
    setBrowsePath(prev => prev.slice(0, -1));
  }, []);

  // Gezgin: ürün gruplarını listelerken, bulunulan alt kategoriyi context olarak seç (başlıktaki 'Seç').
  const handleSelectCurrentSubCategory = useCallback(() => {
    if (!currentSubCategory) return;
    handleSelectSubCategory({
      subCategoryId: currentSubCategory.id,
      name: currentSubCategory.name,
      image: currentSubCategory.image,
      categoryId: currentCategory?.id ?? '',
    });
  }, [currentSubCategory, currentCategory, handleSelectSubCategory]);

  // Mevcut seviyenin öğeleri (arama yokken). Seviyeye göre kategori/alt kategori/ürün grubu.
  const browseItems = useMemo<BrowseItem[]>(() => {
    if (isSearching) return [];
    if (browseDepth === 0) {
      return (categoriesData?.pages ?? [])
        .flatMap(p => p.items)
        .map(c => ({
          id: c.categoryId,
          name: c.name,
          image: c.image,
          kind: 'category' as const,
        }));
    }
    if (browseDepth === 1) {
      return (browseSubCatsData?.pages ?? [])
        .flatMap(p => p.items)
        .map(s => ({
          id: s.subCategoryId,
          name: s.name,
          image: s.image,
          kind: 'subCategory' as const,
        }));
    }
    return (browsePGsData?.pages ?? [])
      .flatMap(p => p.items)
      .map(g => ({
        id: g.productGroupId,
        name: g.name,
        image: g.image,
        kind: 'productGroup' as const,
      }));
  }, [
    isSearching,
    browseDepth,
    categoriesData,
    browseSubCatsData,
    browsePGsData,
  ]);

  const browseLoading =
    browseDepth === 0
      ? categoriesLoading
      : browseDepth === 1
        ? browseSubCatsLoading
        : browsePGsLoading;

  const handleBrowseEndReached = useCallback(() => {
    if (browseDepth === 0 && hasMoreCategories) fetchMoreCategories();
    else if (browseDepth === 1 && hasMoreSubCats) fetchMoreSubCats();
    else if (browseDepth === 2 && hasMorePGs) fetchMorePGs();
  }, [
    browseDepth,
    hasMoreCategories,
    hasMoreSubCats,
    hasMorePGs,
    fetchMoreCategories,
    fetchMoreSubCats,
    fetchMorePGs,
  ]);

  // Theme colors — kept as explicit values to stay consistent with sibling catalog screens
  const bgColor = isDark ? '#1A1A1A' : '#FAFAFA';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const inputBg = isDark ? '#2A2A2A' : '#F2F2F2';
  const inputBorder = isDark ? '#333333' : '#E9E9E9';
  const resultItemBg = isDark ? '#222222' : '#FFFFFF';
  const resultItemBorder = isDark ? '#333333' : '#EFEFEF';
  const accentColor = isDark ? '#818CF8' : '#6366F1';
  // iOS inset-grouped liste renkleri
  const dividerColor = isDark ? '#333333' : '#E5E7EB';
  const thumbBg = isDark ? '#2A2A2A' : '#F1F1F1';

  // Gezgin satırı — iOS tarzı: thumbnail + başlık + (inişli ise) disclosure chevron'u.
  const renderBrowseRow = useCallback(
    ({ item }: { item: BrowseItem }) => (
      <Pressable onPress={() => handleBrowsePress(item)}>
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
          <Text flex={1} fontSize='$md' color={textColor} numberOfLines={1}>
            {item.name}
          </Text>
          {item.kind !== 'productGroup' && (
            <ChevronRight size={18} color={subTextColor} />
          )}
        </HStack>
      </Pressable>
    ),
    [handleBrowsePress, textColor, subTextColor, thumbBg]
  );

  // Header durumları
  const showBack = !isSearching && browseDepth > 0;
  const showSelect = !isSearching && browseDepth === 2;
  const headerTitle =
    !isSearching && browseDepth > 0
      ? browsePath[browseDepth - 1].name
      : t('categorySearch.title');

  // Tüm sonuçlar tek düz listede: her satır başlık + breadcrumb path alt başlığı içerir.
  // Breadcrumb, item'ın katalog ağacındaki yolunu gösterir (geniş → özel sırayla birleştirilir).
  const subCatRows = useMemo<RowItem[]>(
    () =>
      subCatResults.map(i => ({
        id: `sub-${i.subCategoryId}`,
        name: i.name,
        breadcrumb: i.categoryName ?? '',
        onPress: () => handleSelectSubCategory(i),
      })),
    [subCatResults, handleSelectSubCategory]
  );

  const pgRows = useMemo<RowItem[]>(
    () =>
      pgResults.map(i => ({
        id: `pg-${i.productGroupId}`,
        name: i.name,
        breadcrumb: [i.categoryName, i.subCategoryName]
          .filter(Boolean)
          .join(' › '),
        onPress: () => handleSelectProductGroup(i),
      })),
    [pgResults, handleSelectProductGroup]
  );

  // Ürün satırları: global ürün araması sonuçları ürün grubuna göre gruplu gelir;
  // her grubun breadcrumb'ını (Kategori › Alt Kategori › Ürün Grubu) ürünlere taşıyarak düzleştir.
  const productRows = useMemo<RowItem[]>(() => {
    if (!isSearching) return [];
    return (productSearchData?.pages ?? [])
      .flatMap(p => p.items)
      .flatMap(group => {
        const breadcrumb = [
          group.categoryName,
          group.subCategoryName,
          group.productGroupName,
        ]
          .filter(Boolean)
          .join(' › ');
        return group.products.map<RowItem>(prod => ({
          id: `prod-${prod.productId}`,
          name: prod.name,
          breadcrumb,
          onPress: () => handleSelectProduct(prod),
        }));
      });
  }, [isSearching, productSearchData, handleSelectProduct]);

  // Sekme yok: alt kategori → ürün grubu → ürün sırasıyla tek listede birleştir.
  const combinedRows = useMemo<RowItem[]>(
    () => [...subCatRows, ...pgRows, ...productRows],
    [subCatRows, pgRows, productRows]
  );

  const renderRow = useCallback(
    ({ item }: { item: RowItem }) => (
      <Pressable onPress={item.onPress} mb='$2'>
        <HStack
          alignItems='center'
          justifyContent='space-between'
          bg={resultItemBg}
          borderWidth={1}
          borderColor={resultItemBorder}
          borderRadius={12}
          px='$4'
          py='$3'
          space='sm'
        >
          <VStack flex={1} space='xs'>
            <Text
              fontSize='$sm'
              fontWeight='$medium'
              color={textColor}
              numberOfLines={1}
            >
              <HighlightedText
                text={item.name}
                query={debouncedQuery}
                color={textColor}
              />
            </Text>
            {item.breadcrumb ? (
              <Text fontSize='$2xs' color={subTextColor} numberOfLines={1}>
                {item.breadcrumb}
              </Text>
            ) : null}
          </VStack>
          <ChevronRight size={18} color={subTextColor} />
        </HStack>
      </Pressable>
    ),
    [resultItemBg, resultItemBorder, textColor, subTextColor, debouncedQuery]
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: bgColor }}
    >
      <Box flex={1}>
        {/* Header — başlık ortada; sol/sağ aksiyonlar absolute konumlu (başlığı kaydırmaz).
            Sol: drill-down içindeyken geri, kökte kapat. Sağ: alt kategori seçilebilir durumda 'Seç'. */}
        <Box h={48} justifyContent='center' px='$4'>
          <Text
            textAlign='center'
            fontSize='$md'
            fontWeight='$semibold'
            color={textColor}
            numberOfLines={1}
            mx={56}
          >
            {headerTitle}
          </Text>
          <Pressable
            position='absolute'
            left={16}
            top={0}
            bottom={0}
            justifyContent='center'
            onPress={showBack ? handleBrowseBack : handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {showBack ? (
              <ChevronLeft size={26} color={textColor} />
            ) : (
              <X size={22} color={textColor} />
            )}
          </Pressable>
          {showSelect && (
            <Pressable
              position='absolute'
              right={16}
              top={0}
              bottom={0}
              justifyContent='center'
              onPress={handleSelectCurrentSubCategory}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text fontSize='$sm' fontWeight='$semibold' color={accentColor}>
                {t('categorySearch.selectThisCategory')}
              </Text>
            </Pressable>
          )}
        </Box>

        {/* Search Input */}
        <Box px='$4' pb='$3'>
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
                placeholder={t('categorySearch.placeholder')}
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

        {/* DEBUG: Arama API request/response log paneli — arama kutusunun altında,
            klavyenin üstünde kalır; her zaman görünür. Sadece __DEV__. */}
        {__DEV__ && (
          <Box
            mx='$4'
            mb='$2'
            maxHeight={200}
            bg='rgba(0,0,0,0.9)'
            borderWidth={1}
            borderColor='#444'
            borderRadius={8}
          >
            <HStack
              alignItems='center'
              justifyContent='space-between'
              px='$3'
              py='$2'
            >
              <Text fontSize={11} fontWeight='$bold' color='#BBFF4E'>
                SEARCH API LOG ({debugLogs.length})
              </Text>
              <Pressable onPress={() => setDebugLogs([])} hitSlop={8}>
                <Text fontSize={11} fontWeight='$bold' color='#818CF8'>
                  TEMİZLE
                </Text>
              </Pressable>
            </HStack>
            <ScrollView
              nestedScrollEnabled
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingBottom: 10,
              }}
            >
              {debugLogs.length === 0 ? (
                <Text fontSize={10} color='#9CA3AF'>
                  Arama yapın; istek/yanıt logları burada görünecek…
                </Text>
              ) : (
                debugLogs.map((line, index) => (
                  <Text
                    key={`${index}-${line.slice(0, 12)}`}
                    fontSize={10}
                    color='#E5E7EB'
                    mb='$1'
                  >
                    {line}
                  </Text>
                ))
              )}
            </ScrollView>
          </Box>
        )}

        {/* Content */}
        {isSearching ? (
          /* Sekme yok: tüm sonuçlar tek düz listede, her satırda breadcrumb path alt başlığı */
          isSearchLoading ? (
            <Box flex={1} alignItems='center' justifyContent='center'>
              <Spinner color={accentColor} />
            </Box>
          ) : combinedRows.length === 0 ? (
            <Box flex={1} alignItems='center' justifyContent='center' px='$8'>
              <Text fontSize='$sm' textAlign='center' color={subTextColor}>
                {t('categorySearch.noResults')}
              </Text>
            </Box>
          ) : (
            <FlatList
              data={combinedRows}
              keyExtractor={item => item.id}
              renderItem={renderRow}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: 24,
              }}
              keyboardShouldPersistTaps='handled'
              keyboardDismissMode='on-drag'
              showsVerticalScrollIndicator={false}
            />
          )
        ) : browseLoading && browseItems.length === 0 ? (
          /* Kategori gezgini: ilk yükleme */
          <Box flex={1} alignItems='center' justifyContent='center'>
            <Spinner color={accentColor} />
          </Box>
        ) : browseItems.length === 0 ? (
          <Box flex={1} alignItems='center' justifyContent='center' px='$8'>
            <Text fontSize='$sm' textAlign='center' color={subTextColor}>
              {t('categorySearch.noResults')}
            </Text>
          </Box>
        ) : (
          /* Kategori gezgini: iOS inset-grouped, divider'lı, thumbnail'li liste */
          <FlatList
            data={browseItems}
            keyExtractor={item => `${item.kind}-${item.id}`}
            renderItem={renderBrowseRow}
            ItemSeparatorComponent={() => (
              <Box
                height={StyleSheet.hairlineWidth}
                bg={dividerColor}
                ml={68}
              />
            )}
            contentContainerStyle={{
              marginHorizontal: 16,
              marginTop: 12,
              marginBottom: 24,
              backgroundColor: resultItemBg,
              borderRadius: 12,
              overflow: 'hidden',
            }}
            keyboardShouldPersistTaps='handled'
            keyboardDismissMode='on-drag'
            showsVerticalScrollIndicator={false}
            onEndReached={handleBrowseEndReached}
            onEndReachedThreshold={0.4}
          />
        )}
      </Box>
    </SafeAreaView>
  );
};
