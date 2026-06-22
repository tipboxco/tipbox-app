import React, { useMemo, useState, useCallback } from 'react';
import { ScrollView, ActivityIndicator, Alert, type GestureResponderEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Tag, Package, Star, Layers } from 'lucide-react-native';
import { PencilIcon, TrashIcon, ArrowTopRightOnSquareIcon } from 'react-native-heroicons/outline';
import { VStack, HStack, Text, Image, Box } from '@gluestack-ui/themed';

import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { useInventory, useUserReviews, useDeleteInventoryItem } from '../api/hooks';
import { toImageSource, cleanNewlines } from '@/src/utils';
import { ProfileStackParamList } from '../navigation';
import { useAppStore } from '@/src/store/appStore';
import { useTranslation } from '@/src/hooks/useTranslation';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { ProductInfoType } from '@/src/types/common';
import { ExperiencePostCard } from '@/src/components/PostCards/ExperiencePostCard';
import { mapExperienceToCardData } from '../components/TabContents/ExperienceTab';
import {
  AnchoredPopoverMenu,
  computeAnchoredMenuPosition,
  type AnchoredPopoverMenuItem,
} from '@/src/components/AnchoredPopoverMenu';
import type { ProfileReview } from '../types';

const InventoryDetailScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute<RouteProp<ProfileStackParamList, 'InventoryDetail'>>();
  const { itemId, userId } = route.params as { itemId: string; userId: string };
  const { user } = useAppStore();
  const { t } = useTranslation('profile');

  // Sadece kendi envanterinde 3-nokta menüsü (Deneyimi Güncelle / Ürünü Sil) görünür
  const isOwnInventory = !!user?.id && user.id === userId;

  // Popover menü ve experience segment (Orijinal/AI) state'leri
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 56, left: 0 });
  const [isExperienceSegmented, setIsExperienceSegmented] = useState(false);

  // API'den inventory listesini al (pagination ile)
  const { data, isLoading, error } = useInventory(userId, 20);

  // Kullanıcının experience post'ları (bu ürüne ait olanı bulmak için)
  const { data: reviewsData } = useUserReviews(userId, 50);
  const deleteInventoryMutation = useDeleteInventoryItem();

  // Tüm sayfalardaki item'ları birleştir ve itemId'ye göre item'ı bul
  const allInventoryItems = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  const item = allInventoryItems.find((item) => item.id === itemId);

  // Bu ürüne ait experience post'unu bul (update tipi hariç) ve karta map et
  const experienceCardData = useMemo(() => {
    if (!item?.productId || !reviewsData?.pages) return null;
    const allReviews = reviewsData.pages.flatMap((page) => page.items ?? []);
    const matching = allReviews.find((review) => {
      if ((review as ProfileReview & { type?: string }).type === 'update') return false;
      const reviewProductId =
        (review as any).product?.id || review.contextData?.id;
      return reviewProductId === item.productId;
    });
    return matching ? mapExperienceToCardData(matching) : null;
  }, [item?.productId, reviewsData]);

  // 3-nokta menüsündeki öğe sayısı (yükseklik hesabı için)
  const menuItemCount =
    1 + (isOwnInventory ? 1 : 0) + (isOwnInventory && experienceCardData ? 1 : 0);

  // 3-nokta menüsünü dokunma konumunda aç
  const handleOpenMenu = useCallback((event?: GestureResponderEvent) => {
    const menuHeight = menuItemCount * 52 + 8;
    setMenuPosition(computeAnchoredMenuPosition(event, 220, menuHeight));
    setIsMenuOpen(true);
  }, [menuItemCount]);

  // Deneyimi Güncelle → CreateUpdatePostScreen (mevcut experience post'a bağlanır)
  const handleUpdateExperience = useCallback(() => {
    if (!experienceCardData) return;
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'CreateUpdatePostScreen',
      params: {
        experiencePostId: experienceCardData.id,
        experiencePost: {
          id: experienceCardData.id,
          content: experienceCardData.content,
          images: experienceCardData.images,
          product: {
            id: experienceCardData.contextData?.id || '',
            name: experienceCardData.contextData?.name || '',
            subName: experienceCardData.contextData?.subName || '',
            image: experienceCardData.contextData?.image,
          },
        },
        product: experienceCardData.contextData
          ? {
              id: experienceCardData.contextData.id,
              name: experienceCardData.contextData.name,
              description: experienceCardData.contextData.subName,
              image: experienceCardData.contextData.image,
            }
          : undefined,
      },
    });
  }, [experienceCardData]);

  // Paylaş / dışa link → ürün sayfasına (PostsScreen Product) git
  const handleShareProduct = useCallback(() => {
    if (!item) return;
    const productName = [cleanNewlines(item.brand.name), cleanNewlines(item.brand.model)]
      .filter((v) => v && v.toLowerCase() !== 'unknown')
      .join(' ');
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'PostsScreen',
      params: {
        stage: 'Product',
        name: productName,
        productInfo: { image: toImageSource(item.image), title: productName },
        selectedProduct: {
          id: item.productId,
          name: productName,
          image: toImageSource(item.image),
          productGroupId: item.productGroupId,
        },
        contextType: ProductInfoType.PRODUCT,
        contextId: item.productId,
      },
    });
  }, [item]);

  // Ürünü Sil → envanterden kaldır (onaylı)
  const handleDeleteProduct = useCallback(() => {
    Alert.alert(
      t('inventoryDetail.deleteConfirmTitle'),
      t('inventoryDetail.deleteConfirmMessage'),
      [
        { text: t('common:buttons.cancel'), style: 'cancel' },
        {
          text: t('common:buttons.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInventoryMutation.mutateAsync(itemId);
              navigation.goBack();
            } catch (e) {
              Alert.alert('', t('inventoryDetail.deleteError'));
            }
          },
        },
      ]
    );
  }, [itemId, deleteInventoryMutation, navigation, t]);

  const menuItems = useMemo<AnchoredPopoverMenuItem[]>(() => {
    const items: AnchoredPopoverMenuItem[] = [];
    // Deneyimi Güncelle — sadece kendi envanteri ve experience varsa
    if (isOwnInventory && experienceCardData) {
      items.push({
        key: 'update-experience',
        label: t('inventoryDetail.updateExperience'),
        icon: <PencilIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />,
        onPress: handleUpdateExperience,
      });
    }
    // Paylaş / dışa link — herkes için
    items.push({
      key: 'share-product',
      label: t('inventoryDetail.shareProduct'),
      icon: <ArrowTopRightOnSquareIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />,
      onPress: handleShareProduct,
    });
    // Ürünü Sil — sadece kendi envanteri (en altta, yıkıcı)
    if (isOwnInventory) {
      items.push({
        key: 'delete-product',
        label: t('inventoryDetail.deleteProduct'),
        icon: <TrashIcon width={20} height={20} color="#FF3040" />,
        destructive: true,
        onPress: handleDeleteProduct,
      });
    }
    return items;
  }, [isOwnInventory, experienceCardData, handleUpdateExperience, handleShareProduct, handleDeleteProduct, isDark, t]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <VStack flex={1} bg={isDark ? '#000000' : '#FFFFFF'} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        </VStack>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !item) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <VStack flex={1} bg={isDark ? '#000000' : '#FFFFFF'}>
          <Header
            title={t('inventoryDetail.title')}
            showBackButton
            onBackPress={() => navigation.goBack()}
          />
          <VStack flex={1} justifyContent="center" alignItems="center" p={20}>
            <Text
              fontSize={14}
              color={isDark ? '$textDark400' : '#6D6D6D'}
              textAlign="center"
            >
              {error ? t('inventoryDetail.errorLoading') : t('inventoryDetail.notFound')}
            </Text>
          </VStack>
        </VStack>
      </SafeAreaView>
    );
  }

  // API'den gelen reviews array'ini formatla
  // İlk review'u "Price and Shopping Experience" olarak, ikinci review'u "Product and Usage Experience" olarak kullan
  const priceReview = item.reviews && item.reviews.length > 0 ? item.reviews[0] : null;
  const productReview = item.reviews && item.reviews.length > 1 ? item.reviews[1] : null;

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={12}
        fill={index < count ? '#829905' : 'transparent'}
        color={index < count ? '#829905' : '#7E7E7E'}
        strokeWidth={0.5}
      />
    ));
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
    <VStack flex={1} bg={isDark ? '#000000' : '#FFFFFF'}>
      <Header
        title={t('inventoryDetail.title')}
        showBackButton
        onBackPress={() => navigation.goBack()}
        showThreeDots
        onThreeDotsPress={
          ((event?: GestureResponderEvent) => handleOpenMenu(event)) as () => void
        }
      />

      <ScrollView 
      style={{ 
        flex: 1, 
        backgroundColor: isDark ? '#000000' : '#FFFFFF' 
      }}
      showsVerticalScrollIndicator={false}
    >
      <VStack space="lg" p={15}>
        {/* Product Image and Title */}
        <Box
          bg={isDark ? '$backgroundDark800' : '$white'}
          borderWidth={1}
          borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
          borderRadius={5}
          p={20}
          alignItems="center"
        >
          <Image
            source={toImageSource(item.image) || require('@/assets/inventory/product_01.png')}
            alt={[item.brand.name, item.brand.model].filter((v) => v && v.toLowerCase() !== 'unknown').join(' ')}
            w="80%"
            h={200}
            resizeMode="contain"
          />
          <VStack space="xs" alignItems="center" mt={15}>
            <Text
              fontSize={14}
              fontWeight="$bold"
              color={isDark ? '$textDark50' : '#A3A3A3'}
              textAlign="center"
            >
              {[cleanNewlines(item.brand.name), cleanNewlines(item.brand.model)].filter((v) => v && v.toLowerCase() !== 'unknown').join(' ')}
            </Text>
            <Text
              fontSize={10}
              color={isDark ? '$textDark400' : '#A3A3A3'}
              textAlign="center"
            >
              {cleanNewlines(item.brand.specs)}
            </Text>
          </VStack>
        </Box>

        {/* Reviews */}
        <Box
          bg={isDark ? '$backgroundDark800' : '$white'}
          borderWidth={1}
          borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
          borderRadius={5}
          p={15}
        >
          {/* Price Review */}
          {priceReview && (
            <VStack space="sm">
              <HStack alignItems="center" space="sm">
                <Tag size={16} color={isDark ? '#3B3B3B' : '#3B3B3B'} />
                <Text
                  fontSize={11}
                  fontWeight="$semibold"
                  color={isDark ? '$textDark50' : '#3B3B3B'}
                >
                  {priceReview.title || t('inventoryDetail.priceReview')}
                </Text>
              </HStack>
              <Text
                fontSize={10}
                color={isDark ? '$textDark400' : '#343434'}
                lineHeight={14}
                ml={18}
              >
                {priceReview.description}
              </Text>
              <HStack space="xs" ml={18}>
                {renderStars(priceReview.rating || 0)}
              </HStack>
            </VStack>
          )}

          {priceReview && productReview && (
            <Box h={1} bg={isDark ? '$borderDark700' : '#E9E9E9'} my={15} />
          )}

          {/* Product Review */}
          {productReview && (
            <VStack space="sm">
              <HStack alignItems="center" space="sm">
                <Package size={16} color={isDark ? '#3B3B3B' : '#3B3B3B'} />
                <Text
                  fontSize={11}
                  fontWeight="$semibold"
                  color={isDark ? '$textDark50' : '#3B3B3B'}
                >
                  {productReview.title || t('inventoryDetail.productReview')}
                </Text>
              </HStack>
              <Text
                fontSize={10}
                color={isDark ? '$textDark400' : '#343434'}
                lineHeight={14}
                ml={18}
              >
                {productReview.description}
              </Text>
              <HStack space="xs" ml={18}>
                {renderStars(productReview.rating || 0)}
              </HStack>
            </VStack>
          )}

          {/* Eğer hiç review yoksa mesaj göster */}
          {!priceReview && !productReview && (
            <VStack space="sm" alignItems="center" py={20}>
              <Text
                fontSize={11}
                color={isDark ? '$textDark400' : '#6D6D6D'}
                textAlign="center"
              >
                {t('inventoryDetail.noReviews')}
              </Text>
            </VStack>
          )}
        </Box>

        {/* Tags / Features */}
        {item.tags && item.tags.length > 0 && (
          <Box
            bg={isDark ? '$backgroundDark800' : '$white'}
            borderWidth={1}
            borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
            borderRadius={5}
            py={15}
          >
            <VStack space="lg" w="100%" px={15}>
              {item.tags.map((tag, index) => (
                <HStack key={index} alignItems="center" w="100%">
                  <Box w={24} h={24} justifyContent="center" alignItems="center">
                    <Layers size={16} color="#536471" strokeWidth={1.5} />
                  </Box>
                  <Text
                    fontSize={11}
                    fontWeight="$medium"
                    color={isDark ? '$textDark400' : '#6D6D6D'}
                    ml={4}
                  >
                    {tag}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        {/* Kullanıcının bu ürüne dair paylaştığı deneyim (Orijinal / Segmentli AI) */}
        {experienceCardData && (
          <VStack space="sm">
            <Text
              fontSize={13}
              fontWeight="$bold"
              color={isDark ? '$textDark50' : '#3B3B3B'}
            >
              {t('inventoryDetail.experienceTitle')}
            </Text>
            <ExperiencePostCard
              data={experienceCardData}
              showHeader={false}
              hideProduct
              showActions={false}
              showSegmentToggle
              isDetailMode={isExperienceSegmented}
              onSegmentedChange={setIsExperienceSegmented}
            />
          </VStack>
        )}
      </VStack>
    </ScrollView>

    {/* Header 3-nokta popover menüsü (Deneyimi Güncelle / Ürünü Sil) */}
    <AnchoredPopoverMenu
      visible={isMenuOpen}
      onClose={() => setIsMenuOpen(false)}
      position={menuPosition}
      items={menuItems}
    />
    </VStack>
    </SafeAreaView>
  );
};

export default InventoryDetailScreen;
