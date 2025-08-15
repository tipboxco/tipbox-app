import React from 'react';
import { Box, VStack } from '@gluestack-ui/themed';
import { mockWishlistItems } from '@/src/mock/profile/wishlist';
import { useColorMode } from '@/src/hooks/useColorMode';
import { WishlistCard } from '../WishlistCard';
import { AddWishlistCard } from '../WishlistCard/AddWishlistCard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation';

export const WishlistTab = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const handleAddWishlist = () => {
    // Add Wishlist işlemleri burada yapılacak
    console.log('Add Wishlist clicked');
  };

  return (
    <Box flex={1} px="$4" bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <VStack space="xs">
        {mockWishlistItems.map((item) => (
          <WishlistCard 
            key={item.id} 
            item={item} 
            onPress={() => navigation.navigate('WishlistDetail')}
          />
        ))}
        <AddWishlistCard onPress={handleAddWishlist} />
      </VStack>
    </Box>
  );
};