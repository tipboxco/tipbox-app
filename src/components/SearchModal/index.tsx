import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Platform, Keyboard, ActivityIndicator, Dimensions, Modal, StyleSheet, Pressable as RNPressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputField,
  Pressable,
  ScrollView,
  Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useSearch } from '@/src/features/search/api/hooks';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.5; // %50
const SWIPE_THRESHOLD = 100; // Kapatma için minimum kayma mesafesi

type SearchFilter = 'users' | 'brands' | 'products';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * SearchModal Component
 * React Native Modal + Reanimated + Gesture Handler kullanarak
 * yukarıdan aşağıya açılan, handler'dan sürüklenebilen arama modal'ı
 */
export const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<SearchFilter>('users');
  const inputRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Debounced search query - API çağrısını optimize et
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Animation values
  const translateY = useSharedValue(-MODAL_HEIGHT);
  const opacity = useSharedValue(0);
  const panY = useSharedValue(0);

  // Search API hook - sadece debounced query varsa çağrılır
  const searchTypes = useMemo(() => {
    switch (selectedFilter) {
      case 'users':
        return ['user'];
      case 'brands':
        return ['brand'];
      case 'products':
        return ['product'];
      default:
        return ['user', 'brand', 'product'];
    }
  }, [selectedFilter]);

  const {
    data: searchData,
    isLoading: isSearching,
    error: searchError,
  } = useSearch(
    {
      keyword: debouncedQuery,
      types: searchTypes,
      limit: 4, // Default: 4'er veri
    },
    debouncedQuery.length > 0 // Sadece query varsa aktif et
  );

  // Debounce effect - thread safety için optimize edildi
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce'u artır - search sırasında gesture handler'ı rahatsız etmemek için
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 500); // 500ms debounce (300ms'den artırıldı)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Close callback
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    setSearchQuery('');
    setDebouncedQuery('');
    onClose();
  }, [onClose]);

  // Focus input callback - worklet dışında tanımla
  const focusInput = useCallback(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, []);

  // Close callback - worklet dışında tanımla (thread safety için)
  // useEffect'ten önce tanımlanmalı (hoisting sorunu için)
  const closeModal = useCallback(() => {
    handleClose();
    setShouldRender(false);
    setIsAnimating(false);
    // Shared value'ları reset et (worklet dışında direkt erişim)
    translateY.value = -MODAL_HEIGHT;
    panY.value = 0;
  }, [handleClose]);

  // Modal açılma/kapanma animasyonu
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setIsAnimating(true); // Animasyon başladı - gesture handler'ı devre dışı bırak
      // Modal açılıyor - yukarıdan aşağıya
      // Önce değerleri reset et
      translateY.value = -MODAL_HEIGHT;
      panY.value = 0;
      
      // Kısa bir delay ile animasyonu başlat (render tamamlansın)
      const timer = setTimeout(() => {
        opacity.value = withTiming(1, { duration: 200 });
        translateY.value = withSpring(
          0,
          {
            damping: 20,
            stiffness: 90,
            mass: 0.5,
          },
          (finished) => {
            'worklet';
            if (finished) {
              // Animasyon bitti - gesture handler'ı aktif et
              runOnJS(setIsAnimating)(false);
              // Input'a focus et - JS thread'ine geç
              runOnJS(focusInput)();
            }
          }
        );
      }, 50);

      return () => clearTimeout(timer);
    } else if (shouldRender) {
      setIsAnimating(true); // Kapanma animasyonu başladı
      // Modal kapanıyor - aşağıdan yukarıya
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withSpring(
        -MODAL_HEIGHT,
        {
          damping: 20,
          stiffness: 90,
          mass: 0.5,
        },
        (finished) => {
          'worklet';
          if (finished) {
            // JS thread'ine geç - sadece bir kez çağır
            runOnJS(closeModal)();
          }
        }
      );
    }
  }, [visible, translateY, opacity, panY, shouldRender, focusInput, closeModal]);

  // Gesture handler - sadece handler'dan sürükleme (yeni Gesture API)
  // useMemo ile memoize et - thread safety için
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          'worklet';
          // Gesture başladığında mevcut pozisyonu kaydet
        })
        .onUpdate((event) => {
          'worklet';
          // Alttan yukarı çekme (kapatma) - translationY negatif olmalı
          // Modal yukarıdan aşağıya açıldığı için, alttan yukarı çekince kapanır
          if (event.translationY < 0) {
            panY.value = event.translationY;
          }
        })
        .onEnd((event) => {
          'worklet';
          const totalTranslation = translateY.value + panY.value;

          // Eğer yeterince yukarı çekildiyse kapat (alttan yukarı çekme)
          if (totalTranslation < -SWIPE_THRESHOLD || event.velocityY < -500) {
            // Kapat - animasyonları başlat
            panY.value = 0;
            translateY.value = withSpring(
              -MODAL_HEIGHT,
              {
                damping: 20,
                stiffness: 90,
                mass: 0.5,
              },
              (finished) => {
                'worklet';
                if (finished) {
                  // JS thread'ine geç - sadece bir kez çağır
                  runOnJS(closeModal)();
                }
              }
            );
            opacity.value = withTiming(0, { duration: 200 });
          } else {
            // Geri dön
            panY.value = withSpring(0, {
              damping: 20,
              stiffness: 90,
            });
          }
        })
        .enabled(visible && shouldRender && !isAnimating), // Sadece modal açık ve animasyon yokken aktif
    [visible, shouldRender, isAnimating, panY, translateY, opacity, closeModal]
  );

  // Animated styles - thread safety için optimize edildi
  const modalAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateY: translateY.value + panY.value }],
    };
  }, [translateY, panY]);

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: opacity.value,
    };
  }, [opacity]);

  // User item'a tıklandığında profile git
  const handleUserPress = useCallback(
    (userId: string) => {
      if (!userId) {
        console.warn('[SearchModal] handleUserPress: userId is missing');
        return;
      }
      handleClose();
      setTimeout(() => {
        (navigation as any).navigate('Profile', {
          screen: 'ProfileMain',
          params: { userId },
        });
      }, 300);
    },
    [navigation, handleClose]
  );

  // Brand item'a tıklandığında brand post list screen'e git
  const handleBrandPress = useCallback(
    (brandId: string) => {
      if (!brandId) {
        console.warn('[SearchModal] handleBrandPress: brandId is missing');
        return;
      }
      handleClose();
      setTimeout(() => {
        // Catalog tab'ına nested navigation → BrandPostListScreen
        navigationService.navigateNested(TAB_ROUTES.CATALOG, 'BrandPostListScreen' as any, {
          brandId,
        });
      }, 300);
    },
    [handleClose]
  );

  // Product item'a tıklandığında product post list screen'e git
  const handleProductPress = useCallback(
    (productId: string) => {
      if (!productId) {
        console.warn('[SearchModal] handleProductPress: productId is missing');
        return;
      }
      handleClose();
      setTimeout(() => {
        // Post stack'ine navigate → PostsScreen (productId contextId olarak)
        navigationService.navigate(ROOT_ROUTES.POST, {
          screen: 'PostsScreen',
          params: {
            stage: 'Product',
            name: '', // Product name API'den gelecek veya PostsScreen'de gösterilmeyecek
            productInfo: {
              image: require('@/assets/inventory/product_01.png'), // Placeholder, API'den gelecek
              title: '', // Placeholder, API'den gelecek
            },
            selectedProduct: {
              id: productId,
              name: '', // Placeholder, API'den gelecek
              description: '',
              image: require('@/assets/inventory/product_01.png'), // Placeholder
            },
            contextType: ProductInfoType.PRODUCT,
            contextId: productId, // Product ID'yi contextId olarak gönder
          },
        });
      }, 300);
    },
    [handleClose]
  );

  // Render search results
  const renderSearchResults = () => {
    if (debouncedQuery.length === 0) {
      return (
        <Box flex={1} justifyContent="center" alignItems="center" py="$20">
          <Feather name="search" size={56} color={isDark ? '#48484A' : '#D1D1D6'} />
          <Text
            mt="$4"
            fontSize={16}
            color={isDark ? '#8E8E93' : '#8E8E93'}
            textAlign="center"
          >
            Arama yapmak için yazmaya başlayın
          </Text>
        </Box>
      );
    }

    if (isSearching) {
      return (
        <Box flex={1} justifyContent="center" alignItems="center" py="$20">
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
          <Text
            mt="$4"
            fontSize={14}
            color={isDark ? '#8E8E93' : '#8E8E93'}
            textAlign="center"
          >
            Aranıyor...
          </Text>
        </Box>
      );
    }

    if (searchError) {
      return (
        <Box flex={1} justifyContent="center" alignItems="center" px="$4" py="$20">
          <Feather name="alert-circle" size={48} color="#CE4A4A" />
          <Text
            mt="$4"
            fontSize={14}
            color="#CE4A4A"
            textAlign="center"
            fontWeight="$semibold"
          >
            Arama sırasında bir hata oluştu
          </Text>
          <Text
            mt="$2"
            fontSize={12}
            color={isDark ? '#8E8E93' : '#8E8E93'}
            textAlign="center"
          >
            Lütfen tekrar deneyin
          </Text>
        </Box>
      );
    }

    // Results render
    const hasResults =
      (searchData?.userData && searchData.userData.length > 0) ||
      (searchData?.brandData && searchData.brandData.length > 0) ||
      (searchData?.productData && searchData.productData.length > 0);

    if (!hasResults) {
      return (
        <Box flex={1} justifyContent="center" alignItems="center" py="$20">
          <Feather name="search" size={56} color={isDark ? '#48484A' : '#D1D1D6'} />
          <Text
            mt="$4"
            fontSize={16}
            color={isDark ? '#8E8E93' : '#8E8E93'}
            textAlign="center"
            fontWeight="$medium"
          >
            Sonuç bulunamadı
          </Text>
          <Text
            mt="$2"
            fontSize={14}
            color={isDark ? '#8E8E93' : '#8E8E93'}
            textAlign="center"
          >
            "{debouncedQuery}" için arama sonucu yok
          </Text>
        </Box>
      );
    }

    return (
      <VStack space="lg" flex={1}>
        {/* Users Results */}
        {selectedFilter === 'users' && searchData?.userData && searchData.userData.length > 0 && (
          <VStack space="md" mt="$2">
            <Text
              fontSize={12}
              fontWeight="$semibold"
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              px="$4"
            >
              User
            </Text>
            <VStack>
              {searchData.userData.map((user: any) => (
                <Pressable key={user.id} onPress={() => handleUserPress(user.id)}>
                  <HStack
                    alignItems="center"
                    space="md"
                    py="$4"
                    px="$4"
                  >
                    {/* Avatar - Circular with red border */}
                    <Box
                      width={56}
                      height={56}
                      borderRadius={100}
                      borderWidth={2}
                      borderColor="#CE4A4A"
                      alignItems="center"
                      justifyContent="center"
                      overflow="hidden"
                      bg={isDark ? '#1C1C1E' : '#F2F2F7'}
                    >
                      <Image
                        source={toImageSource(user.avatar) || require('@/assets/avatar/ozan.png')}
                        alt={user.name}
                        width={52}
                        height={52}
                        resizeMode="cover"
                      />
                    </Box>

                    {/* User Info */}
                    <VStack flex={1} space="xs">
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize={15}
                        fontWeight="$bold"
                        numberOfLines={1}
                      >
                        {user.name}
                      </Text>
                      {user.cosmetic && (
                        <VStack space="xs">
                          {/* İlk satır */}
                          <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize={13}
                            numberOfLines={1}
                            lineHeight={18}
                          >
                            {user.cosmetic.split(' - ')[0] || user.cosmetic}
                          </Text>
                          {/* İkinci satır - eğer " - " ile ayrılmışsa */}
                          {user.cosmetic.includes(' - ') && user.cosmetic.split(' - ').length > 1 && (
                            <Text
                              color={isDark ? '#8C8C8C' : '#8C8C8C'}
                              fontSize={13}
                              numberOfLines={1}
                              lineHeight={18}
                            >
                              {user.cosmetic.split(' - ').slice(1).join(' - ')}
                            </Text>
                          )}
                        </VStack>
                      )}
                    </VStack>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </VStack>
        )}

        {/* Brands Results */}
        {selectedFilter === 'brands' && searchData?.brandData && searchData.brandData.length > 0 && (
          <VStack space="md" mt="$2">
            <Text
              fontSize={12}
              fontWeight="$semibold"
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              px="$4"
            >
              Brand
            </Text>
            <VStack>
              {searchData.brandData.map((brand: any) => (
                <Pressable key={brand.id} onPress={() => handleBrandPress(brand.id)}>
                  <HStack
                    alignItems="center"
                    space="md"
                    py="$4"
                    px="$4"
                  >
                    {/* Brand Logo */}
                    <Box width={54} height={54} borderRadius={8} overflow="hidden">
                      <Image
                        source={
                          toImageSource(brand.logo) || require('@/assets/inventory/product_01.png')
                        }
                        alt={brand.name}
                        width={54}
                        height={54}
                        resizeMode="contain"
                      />
                    </Box>

                    {/* Brand Info */}
                    <VStack flex={1} space="xs">
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize={14}
                        fontWeight="$bold"
                        numberOfLines={1}
                      >
                        {brand.name}
                      </Text>
                      {brand.category && (
                        <Text
                          color={isDark ? '#8C8C8C' : '#8C8C8C'}
                          fontSize={13}
                          numberOfLines={1}
                        >
                          {brand.category}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </VStack>
        )}

        {/* Products Results */}
        {selectedFilter === 'products' &&
          searchData?.productData &&
          searchData.productData.length > 0 && (
            <VStack space="md" mt="$2">
              <Text
                fontSize={12}
                fontWeight="$semibold"
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                px="$4"
              >
                Product
              </Text>
              <VStack>
                {searchData.productData.map((product: any) => (
                  <Box
                    key={product.id}
                    py="$4"
                    px="$4"
                  >
                    <ProductInfoCard
                      size="big"
                      type={ProductInfoType.PRODUCT}
                      image={toImageSource(product.image) || require('@/assets/inventory/product_01.png')}
                      title={product.name}
                      subName={product.model || product.specs || ''}
                      onPress={() => handleProductPress(product.id)}
                    />
                  </Box>
                ))}
              </VStack>
            </VStack>
          )}
      </VStack>
    );
  };

  const filters: { id: SearchFilter; label: string }[] = [
    { id: 'users', label: 'Users' },
    { id: 'brands', label: 'Brands' },
    { id: 'products', label: 'Products' },
  ];

  if (!shouldRender && !visible) {
    return null;
  }

  return (
    <Modal
      visible={shouldRender}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent
      hardwareAccelerated={true}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Box style={{ flex: 1 }}>
          {/* Overlay Background */}
          <Animated.View
            style={[
              {
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              },
              overlayAnimatedStyle,
            ]}
          >
            <RNPressable
              style={StyleSheet.absoluteFillObject}
              onPress={handleClose}
            />
          </Animated.View>

          {/* Search Panel - Yukarıdan aşağıya */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: MODAL_HEIGHT + insets.top,
                backgroundColor: isDark ? '#000000' : '#FFFFFF',
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
                overflow: 'hidden',
              },
              modalAnimatedStyle,
            ]}
          >
            <VStack flex={1} bg={isDark ? '#000000' : '#FFFFFF'}>
              {/* Header */}
              <VStack space="md" px="$4" pt={insets.top + 8} pb="$2">
                  {/* Search Bar */}
                  <HStack
                    alignItems="center"
                    bg={isDark ? '#1C1C1E' : '#F2F2F7'}
                    borderRadius={12}
                    px="$3"
                    space="sm"
                    h={48}
                  >
                    <Feather name="search" size={20} color={isDark ? '#8E8E93' : '#8E8E93'} />
                    <Input flex={1} borderWidth={0} bg="transparent">
                      <InputField
                        ref={inputRef}
                        placeholder="Search..."
                        placeholderTextColor={isDark ? '#8E8E93' : '#8E8E93'}
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize={15}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        autoFocus={false}
                      />
                    </Input>
                    {searchQuery.length > 0 && (
                      <Pressable onPress={() => setSearchQuery('')} p="$1">
                        <Feather name="x-circle" size={18} color={isDark ? '#8E8E93' : '#8E8E93'} />
                      </Pressable>
                    )}
                  </HStack>

                  {/* Filters */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <HStack space="sm" px="$4">
                      {filters.map((filter) => (
                        <Pressable
                          key={filter.id}
                          onPress={() => setSelectedFilter(filter.id)}
                          bg={
                            selectedFilter === filter.id
                              ? (isDark ? '#2C2C2E' : '#E5E5EA')
                              : (isDark ? '#1C1C1E' : '#FFFFFF')
                          }
                          borderWidth={selectedFilter === filter.id ? 0 : 1}
                          borderColor={isDark ? '#2C2C2E' : '#E5E5EA'}
                          borderRadius={20}
                          px="$4"
                          py="$2"
                        >
                          <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={14}
                            fontWeight={selectedFilter === filter.id ? '$semibold' : '$normal'}
                          >
                            {filter.label}
                          </Text>
                        </Pressable>
                      ))}
                    </HStack>
                  </ScrollView>
                </VStack>

                {/* Content */}
                <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                  {renderSearchResults()}
                </ScrollView>

              {/* Handler - Altta, sadece buradan sürüklenebilir (alttan yukarı çekme) */}
              <GestureDetector gesture={panGesture}>
                <Animated.View
                  style={{
                    paddingTop: 0,
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom  : 0,
                    alignItems: 'center',
                 
                    borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA',
                  }}
                >
                  <Box
                    width={40}
                    height={4}
                    borderRadius={2}
                    bg={isDark ? '#3C3C3E' : '#D1D1D6'}
                  />
                </Animated.View>
              </GestureDetector>
            </VStack>
          </Animated.View>
        </Box>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default SearchModal;
