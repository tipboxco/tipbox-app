import React, { memo, useMemo } from 'react';
import { Box, VStack, HStack, Text, Pressable, Image } from '@gluestack-ui/themed';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';
import type { SearchUser, SearchBrand, SearchProduct } from '@/src/features/search/api/searchApi';

/**
 * Shared search result item components
 * SearchModal ve SearchScreen tarafından ortak kullanılır
 */

interface UserItemProps {
  user: SearchUser;
  isDark: boolean;
  onPress: (userId: string) => void;
}

export const UserItem = memo<UserItemProps>(({ user, isDark, onPress }) => {
  const avatarSource = useMemo(
    () => toImageSource(user.avatar) || require('@/assets/avatar/default-useravatar.png'),
    [user.avatar]
  );

  const cosmeticParts = useMemo(() => {
    if (!user.cosmetic) return null;
    const parts = user.cosmetic.split(' - ');
    return {
      first: parts[0] || user.cosmetic,
      rest: parts.length > 1 ? parts.slice(1).join(' - ') : null,
    };
  }, [user.cosmetic]);

  return (
    <Pressable onPress={() => onPress(user.id)}>
      <HStack alignItems="center" space="sm" py="$2" px="$4">
        <Box
          width={52}
          height={52}
          borderRadius={100}
          borderWidth={2}
          borderColor="#CE4A4A"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
          bg={isDark ? '#1C1C1E' : '#F2F2F7'}
        >
          <Image source={avatarSource} alt={user.name} width={48} height={48} resizeMode="cover" />
        </Box>
        <VStack flex={1} space="xs">
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize="$sm"
            fontWeight="$bold"
            numberOfLines={1}
          >
            {user.name}
          </Text>
          {cosmeticParts && (
            <VStack space="xs">
              <Text
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                fontSize="$xs"
                numberOfLines={1}
                lineHeight={18}
              >
                {cosmeticParts.first}
              </Text>
              {cosmeticParts.rest && (
                <Text
                  color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  fontSize="$xs"
                  numberOfLines={1}
                  lineHeight={18}
                >
                  {cosmeticParts.rest}
                </Text>
              )}
            </VStack>
          )}
        </VStack>
      </HStack>
    </Pressable>
  );
});

UserItem.displayName = 'UserItem';

interface BrandItemProps {
  brand: SearchBrand;
  isDark: boolean;
  onPress: (brandId: string) => void;
}

export const BrandItem = memo<BrandItemProps>(({ brand, isDark, onPress }) => {
  const logoSource = useMemo(
    () => toImageSource(brand.logo) || require('@/assets/inventory/product_01.png'),
    [brand.logo]
  );

  return (
    <Pressable onPress={() => onPress(brand.id)}>
      <HStack alignItems="center" space="sm" py="$2" px="$4">
        <Box width={52} height={52} borderRadius={8} overflow="hidden">
          <Image source={logoSource} alt={brand.name} width={52} height={52} resizeMode="contain" />
        </Box>
        <VStack flex={1} space="xs">
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize="$xs"
            fontWeight="$bold"
            numberOfLines={1}
          >
            {brand.name}
          </Text>
          {brand.category && (
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize="$sm"
              numberOfLines={1}
            >
              {brand.category}
            </Text>
          )}
        </VStack>
      </HStack>
    </Pressable>
  );
});

BrandItem.displayName = 'BrandItem';

interface ProductItemProps {
  product: SearchProduct;
  isDark: boolean;
  onPress: (product: SearchProduct) => void;
}

export const ProductItem = memo<ProductItemProps>(({ product, isDark, onPress }) => {
  const imageSource = useMemo(
    () => toImageSource(product.image) || require('@/assets/inventory/product_01.png'),
    [product.image]
  );

  return (
    <Box py="$2" px="$4">
      <ProductInfoCard
        size="small"
        type={ProductInfoType.PRODUCT}
        image={imageSource}
        title={product.name}
        subName={product.model || product.specs || ''}
        titleColor={isDark ? '#FFFFFF' : '#000000'}
        onPress={() => onPress(product)}
      />
    </Box>
  );
});

ProductItem.displayName = 'ProductItem';
