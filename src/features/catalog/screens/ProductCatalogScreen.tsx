import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, ScrollView, HStack, VStack, Text, Pressable, Image, Button, Spinner,
  Divider
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Filter as FilterIcon } from 'lucide-react-native';
import { BreadcrumbItem } from '@/src/types/breadcrumb';
import CategoryCard from '../components/CategoryCard';
import Breadcrumb from '@/src/components/Breadcrumb';
import ActionButtons from '../components/ActionButtons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CatalogStackParamList } from '../navigation';
import { RootStackParamList } from '@/src/navigation/navigation.types';
import { ProductInfoType } from '@/src/types/common';
import { useCreatePostFlowStore } from '@/src/features/post/store/createPostFlowStore';
import { useCatalogUIStore } from '../store/catalogUIStore';
import { CategorySkeleton, ProductSkeleton } from '@/src/components/Skeletons';

// --- Import FilterDialog ---
import FilterDialog from '../components/FilterDialog';

// --- Global Category Level ---
export const MAX_CATEGORY_LEVEL = 3;

// --- Medusa fetch helper ---
// (Unchanged...)

type MedusaCategory = {
  id: string;
  name: string;
  parent_category_id: string | null;
  image?: string;
  metadata?: Record<string, any>;
};

type MedusaProduct = {
  id: string;
  title: string;
  thumbnail?: string;
  images?: { url: string }[];
  handle?: string;
  type?: any;
  collection?: any;
  categories?: MedusaCategory[];
  [key: string]: any;
};

type FilterOptionItem = {
  key: string;
  name?: string;
  values: { value: string; label: string }[];
};

type FilterableOptionsType = {
  categories?: any[];
  metadata?: Record<string, { values: string[]; label?: string }>;
};

type ProductCatalogScreenNavigationProp = NativeStackNavigationProp<
  CatalogStackParamList & RootStackParamList
> & {
  navigate: (name: any, params?: any) => void;
};

interface ProductCatalogScreenProps {
  onCreatePost?: () => void;
  onStateChange?: (data: {
    selectedProduct: any | null;
    currentLevel: number;
    parentPath: string[];
    breadcrumbItems: BreadcrumbItem[];
  }) => void;
  scrollViewPaddingBottom?: number;
}

const MEDUSA_BASE_URL =
  process.env.EXPO_PUBLIC_MEDUSA_URL || 'http://192.168.1.26:8090'; // fallback
const CATEGORIES_ENDPOINT_BASE = `${MEDUSA_BASE_URL}/store/product-categories?`;
const MEDUSA_API_KEY =
  process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY ||
  'pk_cfe68434d1ee0dd82890fcfe492a3472656dbea641266cb02f3dae8b204de65e';

const PAGE_SIZE = 500;

// --- Medusa API Fetch Helper Functions ---

/**
 * Kategorileri parent_category_id'ye göre çeker
 */
async function fetchMedusaCategoriesByParent(
  parentId: string | null
): Promise<MedusaCategory[]> {
  try {
    let url = CATEGORIES_ENDPOINT_BASE;
    if (parentId) {
      url += `parent_category_id=${parentId}&`;
    } else {
      url += `parent_category_id=null&`;
    }
    url += `limit=${PAGE_SIZE}&include_descendants_tree=false`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': MEDUSA_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('[fetchMedusaCategoriesByParent] Error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.product_categories || [];
  } catch (error) {
    console.error('[fetchMedusaCategoriesByParent] Exception:', error);
    return [];
  }
}

/**
 * Filtrelenebilir ürünleri kategori ID'sine göre çeker (pagination destekli)
 */
async function fetchFilterableProductsByCategoryIdPaged(
  categoryId: string,
  options: {
    searchQuery?: string;
    pageSize?: number;
    offset?: number;
    metadataFilters?: Record<string, string[]>;
  } = {}
): Promise<{
  products: MedusaProduct[];
  total: number;
  filterable_options: FilterableOptionsType | null;
}> {
  const { searchQuery = '', pageSize = 30, offset = 0, metadataFilters } = options;

  try {
    // Önce custom filterable-products endpoint'ini dene
    let url = `${MEDUSA_BASE_URL}/store/custom/filterable-products?category_id=${categoryId}&limit=${pageSize}&offset=${offset}`;
    
    if (searchQuery) {
      url += `&q=${encodeURIComponent(searchQuery)}`;
    }

    // Metadata filtrelerini ekle
    if (metadataFilters && Object.keys(metadataFilters).length > 0) {
      Object.entries(metadataFilters).forEach(([key, values]) => {
        if (values.length > 0) {
          url += `&metadata[${key}]=${encodeURIComponent(values.join(','))}`;
        }
      });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': MEDUSA_API_KEY,
      },
    });

    if (response.ok) {
      const data = await response.json();
      // Debug: API'den gelen ham veriyi logla
      return {
        products: data.products || [],
        total: data.count || data.products?.length || 0,
        filterable_options: data.filterable_options || null,
      };
    }

    // Fallback: standart products endpoint
    const fallbackUrl = `${MEDUSA_BASE_URL}/store/products?category_id[]=${categoryId}&limit=${pageSize}&offset=${offset}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`;
    
    const fallbackResponse = await fetch(fallbackUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': MEDUSA_API_KEY,
      },
    });

    if (!fallbackResponse.ok) {
      console.error('[fetchFilterableProductsByCategoryIdPaged] Error:', fallbackResponse.status);
      return { products: [], total: 0, filterable_options: null };
    }

    const fallbackData = await fallbackResponse.json();
    return {
      products: fallbackData.products || [],
      total: fallbackData.count || fallbackData.products?.length || 0,
      filterable_options: null,
    };
  } catch (error) {
    console.error('[fetchFilterableProductsByCategoryIdPaged] Exception:', error);
    return { products: [], total: 0, filterable_options: null };
  }
}

// Kategori yolundaki objeler
type FlatCategoryNode = {
  id: string;
  name: string;
  parent_category_id: string | null;
  image?: string;
  metadata?: Record<string, any>;
  children: FlatCategoryNode[];
  path: string[];
  level: number;
};

export const ProductCatalogScreen: React.FC<ProductCatalogScreenProps> = ({
  onCreatePost,
  onStateChange,
  scrollViewPaddingBottom = 52,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ProductCatalogScreenNavigationProp>();

  // Medusa Kategorileri (flat array)
  const [categories, setCategories] = useState<MedusaCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ProductState
  const [products, setProducts] = useState<MedusaProduct[]>([]);
  const [productsTotal, setProductsTotal] = useState<number>(0);
  const [productsOffset, setProductsOffset] = useState<number>(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState<boolean>(false);

  const PRODUCT_PAGE_SIZE = 30;

  const [parentPath, setParentPath] = useState<string[]>([]);
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProductLocal] = useState<any | null>(null);

  // --- FILTER STATE ---
  // Filter options state and modal visibility
  const [showFilterModal, setShowFilterModal] = useState(false);

  // In real use, filterOptions and selectedFilters would be populated from the backend or product fetch response
  const [filterOptions, setFilterOptions] = useState<FilterableOptionsType | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const setFlowContext = useCreatePostFlowStore((state) => state.setFlowContext);
  const setCurrentView = useCatalogUIStore((state) => state.setCurrentView);

  // Kategorileri başlangıçta yükle
  useEffect(() => {
    setIsLoading(true);
    fetchMedusaCategoriesByParent(null)
      .then(data => {
        setCategories(data || []);
        setIsLoading(false);
      })
      .catch(err => {
        setCategories([]);
        setIsLoading(false);
      });
  }, []);

  // Kategori children'ı fetch etmek için
  const fetchAndAppendChildren = useCallback(
    async (categoryNode: MedusaCategory) => {
      setIsLoading(true);
      const children = await fetchMedusaCategoriesByParent(categoryNode.id);
      setCategories((prev) => {
        const all = [...prev];
        for (const child of children) {
          if (!all.find(c => c.id === child.id)) {
            all.push(child);
          }
        }
        return all;
      });
      setIsLoading(false);
    },
    []
  );

  // Flat -> tree structure
  const buildCategoryTree = useCallback((cats: MedusaCategory[]): FlatCategoryNode[] => {
    const idMap = new Map<string, FlatCategoryNode>();
    cats.forEach(cat => {
      let catImage: string | undefined = cat.image;
      if (cat.metadata && cat.metadata.thumb_image) {
        catImage = cat.metadata.thumb_image;
      }
      idMap.set(cat.id, {
        ...cat,
        image: catImage,
        children: [],
        path: [],
        level: 0,
      });
    });
    const rootNodes: FlatCategoryNode[] = [];
    cats.forEach(cat => {
      if (cat.parent_category_id && idMap.has(cat.parent_category_id)) {
        const parent = idMap.get(cat.parent_category_id)!;
        const current = idMap.get(cat.id)!;
        parent.children.push(current);
      } else {
        rootNodes.push(idMap.get(cat.id)!);
      }
    });

    function setMeta(node: FlatCategoryNode, parentPath: string[], level: number) {
      node.path = [...parentPath, node.id];
      node.level = level;
      node.children.forEach(child => setMeta(child, node.path, level + 1));
    }
    rootNodes.forEach(n => setMeta(n, [], 0));
    return rootNodes;
  }, []);

  // Kategori tree memoda
  const categoryRoots = useMemo(() => buildCategoryTree(categories), [categories, buildCategoryTree]);

  // Her parentPath'e göre gösterilecek kategoriler (next children)
  const currentCategories = useMemo(() => {
    let nodes: FlatCategoryNode[] = categoryRoots;
    if (parentPath.length > 0) {
      const findNodeByPath = (roots: FlatCategoryNode[], pathArr: string[]): FlatCategoryNode | null => {
        let current: FlatCategoryNode | null = null;
        let search = roots;
        for (const id of pathArr) {
          current = search.find(n => n.id === id) || null;
          if (!current) return null;
          search = current.children;
        }
        return current;
      };
      const lastNode = findNodeByPath(categoryRoots, parentPath);
      nodes = lastNode ? lastNode.children : [];
    }
    return nodes.filter((n) => n.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [categoryRoots, parentPath, searchQuery]);

  // currentLevel: 0=root, 1=alt, 2=alt, ...
  const currentLevel = parentPath.length;
  const isProductGroupLevel = currentLevel === MAX_CATEGORY_LEVEL;

  // Breadcrumb güncelle
  useEffect(() => {
    const crumbs: BreadcrumbItem[] = [];
    let search = categoryRoots;
    for (let i = 0; i < parentPath.length; i++) {
      const id = parentPath[i];
      const node = search.find(n => n.id === id);
      if (node) {
        crumbs.push({
          id: node.id,
          name: node.name,
          type: isProductGroupLevel && i === MAX_CATEGORY_LEVEL ? 'productGroup' : 'category',
          data: node,
        });
        search = node.children;
      } else {
        break;
      }
    }
    setBreadcrumbItems(crumbs);
  }, [parentPath, categoryRoots, isProductGroupLevel]);

  // State parent'a bildir
  useEffect(() => {
    onStateChange?.({
      selectedProduct,
      currentLevel,
      parentPath,
      breadcrumbItems,
    });
  }, [selectedProduct, currentLevel, parentPath, breadcrumbItems, onStateChange]);

  // Ürünleri /store/custom/filterable-products endpointinden çek + Pagination mantığı
  useEffect(() => {
    let cancelled = false;
    const fetchProductsInCategory = async () => {
      if (isProductGroupLevel && parentPath.length > 0) {
        const lastCategoryId = parentPath[parentPath.length - 1];
        setIsLoadingProducts(true);
        setProductsOffset(0);
        // Yeni kategori seçildiğinde filtreleri sıfırla
        setFilterOptions(null);
        setSelectedFilters({});
        try {
          const { products: newProducts, total, filterable_options } = await fetchFilterableProductsByCategoryIdPaged(
            lastCategoryId,
            { searchQuery, pageSize: PRODUCT_PAGE_SIZE, offset: 0 }
          );
          
          if (cancelled) return;
          
          // Debug: filterable_options'ı logla
         
          // filterable_options'ı her zaman set et (null olsa bile)
          console.log('[ProductCatalog] filterable_options:', filterable_options);
          setFilterOptions(filterable_options);
          setProducts(newProducts);
          setProductsTotal(total);
        } catch (err) {
          console.error('[ProductCatalog] Fetch error:', err);
          if (cancelled) return;
          setProducts([]);
          setProductsTotal(0);
          setFilterOptions(null);
        } finally {
          if (!cancelled) setIsLoadingProducts(false);
        }
      } else {
        setProducts([]);
        setProductsTotal(0);
        setFilterOptions(null);
        setIsLoadingProducts(false);
      }
    };
    fetchProductsInCategory();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProductGroupLevel, parentPath, searchQuery]);

  // Daha fazla ürün çek:
  const handleLoadMoreProducts = async () => {
    if (!isProductGroupLevel || isLoadingMoreProducts) return;
    const lastCategoryId = parentPath[parentPath.length - 1];
    if (!lastCategoryId) return;
    const nextOffset = products.length;
    if (nextOffset >= productsTotal) return;
    setIsLoadingMoreProducts(true);
    try {
      const { products: moreProducts } = await fetchFilterableProductsByCategoryIdPaged(
        lastCategoryId,
        { searchQuery, pageSize: PRODUCT_PAGE_SIZE, offset: nextOffset }
      );
      setProducts((prev) => [...prev, ...moreProducts]);
      setProductsOffset(nextOffset);
    } catch (err) {
      // ignore
    } finally {
      setIsLoadingMoreProducts(false);
    }
  };

  // Kategori/altkategori/g içinde seçim basıldığında
  const handleCategoryPress = async (categoryNode: FlatCategoryNode) => {
    if (categoryNode.level === MAX_CATEGORY_LEVEL) {
      setParentPath(categoryNode.path);
      setCurrentView('productgroups');
    } else {
      setParentPath(categoryNode.path);
      setCurrentView('categories');
      if (categoryNode.children.length === 0) {
        await fetchAndAppendChildren(categoryNode);
      }
    }
    setSelectedProductLocal(null);
  };

  // Breadcrumb'a tıklama
  const handleBreadcrumbPress = async (item: BreadcrumbItem, index: number) => {
    setParentPath(parentPath.slice(0, index + 1));
    setSelectedProductLocal(null);
    setCurrentView(index === MAX_CATEGORY_LEVEL ? 'productgroups' : 'categories');
    if (categoryRoots.length && index >= 0) {
      let search = categoryRoots;
      let node: FlatCategoryNode | null = null;
      for (let i = 0; i <= index; i++) {
        const id = parentPath[i];
        node = search.find(n => n.id === id) || null;
        if (!node) break;
        search = node.children;
      }
      if (node && node.children.length === 0) {
        await fetchAndAppendChildren(node);
      }
    }
  };

  const handleShowPosts = () => {
    const lastCrumb = breadcrumbItems[breadcrumbItems.length - 1];
    let productInfo: { image: any; title: string; subName?: string } | null = null;
    if (lastCrumb) {
      let img = lastCrumb.data.image;
      if (lastCrumb.data.metadata && lastCrumb.data.metadata.thumb_image) {
        img = lastCrumb.data.metadata.thumb_image;
      }
      productInfo = {
        image: img,
        title: lastCrumb.data.name,
      };
    }
    if (lastCrumb) {
      setFlowContext(
        isProductGroupLevel ? ProductInfoType.PRODUCT_GROUP : ProductInfoType.CATEGORY,
        lastCrumb.id,
        productInfo || undefined
      );
      navigation.navigate('Post', {
        screen: 'PostsScreen',
        params: {
          stage: isProductGroupLevel ? 'ProductGroup' : 'Categories',
          name: lastCrumb.name,
          productInfo,
          contextType: isProductGroupLevel ? ProductInfoType.PRODUCT_GROUP : ProductInfoType.CATEGORY,
        },
      });
    }
  };

  const handleCreatePost = () => {
    onCreatePost?.();
  };

  const handleProductPress = (product: MedusaProduct) => {
    setSelectedProductLocal(product);
    // Ekstra iş mantığı: burada ürün seçildiğinde başka bir şey yapılacaksa ekleyin.
  };

  // Checkbox değişirse
  const handleFilterToggle = (key: string, value: string) => {
    setSelectedFilters((prev) => {
      const existing = prev[key] || [];
      if (existing.includes(value)) {
        return { ...prev, [key]: existing.filter((v) => v !== value) };
      } else {
        return { ...prev, [key]: [...existing, value] };
      }
    });
  };

  // Filtreleri uygula butonu
  const handleApplyFilters = () => {
    setShowFilterModal(false);
    // TODO: Use selectedFilters in fetching!
    // Use searchQuery + selectedFilters in fetchFilterableProductsByCategoryIdPaged as metadataFilters!
    // See: fetchFilterableProductsByCategoryIdPaged usage and add selectedFilters to dependency.
  };

  // --- Arayüz: Kategori veya Product Group gösterimi ---
  return (
    <Box flex={1}>
      {/* Breadcrumb */}
      <Breadcrumb
        items={breadcrumbItems}
        onItemPress={handleBreadcrumbPress}
        rootLabel="All Categories"
      />
      {/* Action Buttons - ProductGroup seviyesinde göster */}
      {isProductGroupLevel && (
        <ActionButtons
          onShowPosts={handleShowPosts}
          onCreatePost={handleCreatePost}
        />
      )}
      
      {/* Filter Button - ProductGroup seviyesinde göster */}
      {isProductGroupLevel && (
        <HStack px="$4" pb="$2" justifyContent="flex-end">
          <Pressable
            onPress={() => setShowFilterModal(true)}
            bg={isDark ? '#2A2A2A' : '#FFFFFF'}
            borderWidth={1}
            borderColor={isDark ? '#404040' : '#13459b'}
            borderRadius={8}
            px="$4"
            py="$2"
            flexDirection="row"
            alignItems="center"
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
            accessibilityLabel="Filtrele"
          >
            <FilterIcon color="#13459b" size={18} />
            <Text color="#13459b" fontWeight="$semibold" fontSize={12} ml="$2">
              Filtrele
            </Text>
          </Pressable>
        </HStack>
      )}

      {/* --- DIALOG FILTER MODAL --- */}
      <FilterDialog
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filterOptions={filterOptions}
        selectedFilters={selectedFilters}
        onToggle={handleFilterToggle}
        onApply={handleApplyFilters}
      />

      {/* Dynamic Grid */}
      <ScrollView
        flex={1}
        px="$4"
        // filter button padding için biraz ekstra boşluk ekleyelim
        contentContainerStyle={{
          paddingBottom: scrollViewPaddingBottom + (isProductGroupLevel ? 92 : 40)
        }}
      >
        <VStack space="md" pb={scrollViewPaddingBottom}>
          {/* Loading skeleton */}
          {isLoading || (isProductGroupLevel && isLoadingProducts) ? (
            isProductGroupLevel ? (
              <ProductSkeleton count={9} />
            ) : (
              <CategorySkeleton count={9} />
            )
          ) : isProductGroupLevel ? (
            // Max seviyeye gelindiyse: ürünleri göster
            <>
              {/* Products grid */}
              {products.length === 0 ? (
                <Box pt="$8" alignItems="center">
                  <Text color="$muted900" fontSize="$md">
                    No products found in this product group.
                  </Text>
                </Box>
              ) : (
                <>
                  {Array.from({ length: Math.ceil(products.length / 3) }).map((_, rowIndex) => {
                    const startIndex = rowIndex * 3;
                    const rowItems = products.slice(startIndex, startIndex + 3);
                    const priority = rowIndex < 3 ? 'high' : 'low';
                    return (
                      <HStack key={`product-row-${rowIndex}`} space="md" justifyContent="space-between" pt={rowIndex === 0 ? undefined : "$1"}>
                        {[0, 1, 2].map((colIndex) => {
                          const prod = rowItems[colIndex];
                          if (!prod) {
                            return <Box key={colIndex} flex={1} />;
                          }
                          let thumb = prod.thumbnail;
                          if (!thumb && Array.isArray(prod.images) && prod.images.length > 0)
                            thumb = prod.images[0].url;
                          return (
                            <Pressable
                              key={prod.id}
                              flex={1}
                              bg={selectedProduct?.id === prod.id ? "$primary200" : "transparent"}
                              borderRadius={12}
                              alignItems="center"
                              justifyContent="center"
                              p="$2"
                              mb="$1"
                              onPress={() => handleProductPress(prod)}
                              style={{ minHeight: 120, marginHorizontal: 2 }}
                            >
                              <Box alignItems="center" w="100%">
                                {thumb ? (
                                  <Image
                                    source={{ uri: thumb }}
                                    style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: "#fff" }}
                                    alt={prod.title}
                                  />
                                ) : (
                                  <Box
                                    style={{
                                      width: 64,
                                      height: 64,
                                      borderRadius: 8,
                                      backgroundColor: '#eef',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    alignItems="center"
                                    justifyContent="center"
                                  >
                                    <Text fontWeight="600" fontSize="$lg">
                                      {prod.title && prod.title.length > 1
                                        ? prod.title[0].toUpperCase()
                                        : '?'}
                                    </Text>
                                  </Box>
                                )}
                                <Text pt={4} numberOfLines={2} fontSize="$sm" textAlign="center">
                                  {prod.title}
                                </Text>
                              </Box>
                            </Pressable>
                          );
                        })}
                      </HStack>
                    );
                  })}
                  {/* Pagination - Load More button */}
                  {(products.length < productsTotal) && (
                    <Box alignItems="center" mt="$2" mb="$4">
                      <Button
                        onPress={handleLoadMoreProducts}
                        isDisabled={isLoadingMoreProducts}
                        size="md"
                        px="$8"
                        variant="solid"
                        bg={isLoadingMoreProducts ? "$muted300" : "$primary500"}
                      >
                        {isLoadingMoreProducts ? (
                          <HStack alignItems="center" space="xs">
                            <Spinner color="$muted800" size="sm" />
                            <Text color="$muted800" fontWeight="600">Loading...</Text>
                          </HStack>
                        ) : (
                          <Text color="#fff" fontWeight="600">
                            Show More
                          </Text>
                        )}
                      </Button>
                      <Text mt="$1" fontSize="$xs" color="$muted600">
                        {products.length} / {productsTotal}
                      </Text>
                    </Box>
                  )}
                </>
              )}
            </>
          ) : (
            // Alt/ana kategori seviyelerinde: kategorileri göster
            <>
              {Array.from({ length: Math.ceil(currentCategories.length / 3) }).map((_, rowIndex) => {
                const startIndex = rowIndex * 3;
                const rowItems = currentCategories.slice(startIndex, startIndex + 3);
                const priority = rowIndex < 3 ? 'high' : 'low';
                return (
                  <HStack key={`row-${rowIndex}`} space="md" justifyContent="space-between">
                    {[0, 1, 2].map((colIndex) => {
                      const currentItem = rowItems[colIndex];
                      if (!currentItem) {
                        return <Box key={colIndex} flex={1} />;
                      }
                      let itemImage = currentItem.image;
                      if (currentItem.metadata && currentItem.metadata.thumb_image) {
                        itemImage = currentItem.metadata.thumb_image;
                      }
                      return (
                        <CategoryCard
                          key={currentItem.id}
                          category={{
                            id: currentItem.id,
                            name: currentItem.name,
                            icon: currentItem.level === MAX_CATEGORY_LEVEL ? 'package' : 'folder',
                            image: itemImage,
                            subCategories: [],
                          } as any}
                          onPress={() => handleCategoryPress(currentItem)}
                          priority={priority}
                        />
                      );
                    })}
                  </HStack>
                );
              })}
            </>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
};
