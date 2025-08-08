import React, { useState } from 'react';
import { Box, ScrollView } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FeedStackParamList } from '../navigation';
import { FilterBar } from '../components/FilterBar';
import { ReviewCard, ReviewImageCard } from '@/src/components/ReviewCard';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { SideMenu } from '@/src/components/SideMenu';

const MOCK_USER_PROFILE = {
  name: 'Ozan Mutluoğlu',
  avatar: require('@/assets/avatar/ozan.png'),
  trust: 776,
  truster: 556,
  friends: 556,
  badge: {
    text: 'Kitchen Specialist',
    color: '#FF0842',
    borderColor: '#FF0842',
  },
};

import { Feather } from '@expo/vector-icons';
type FeatherIconName = keyof typeof Feather.glyphMap;

const MENU_ITEMS: Array<{
  id: string;
  icon: FeatherIconName;
  label: string;
  onPress: () => void;
}> = [
  {
    id: 'profile',
    icon: 'user',
    label: 'Profil',
    onPress: () => {},
  },
  {
    id: 'wishlist',
    icon: 'heart',
    label: 'Wishlist',
    onPress: () => {},
  },
  {
    id: 'bridge',
    icon: 'link',
    label: 'Bridge',
    onPress: () => {},
  },
  {
    id: 'wishbox',
    icon: 'package',
    label: 'Wishbox',
    onPress: () => {},
  },
  {
    id: 'achievements',
    icon: 'trending-up',
    label: 'Başarım Merdiveni',
    onPress: () => {},
  },
  {
    id: 'collection',
    icon: 'grid',
    label: 'Koleksiyon Vitrini',
    onPress: () => {},
  },
  {
    id: 'assets',
    icon: 'package',
    label: 'Varlıklarım',
    onPress: () => {},
  },
  {
    id: 'bookmarks',
    icon: 'bookmark',
    label: 'Kaydedilenler',
    onPress: () => {},
  },
];

type FeedScreenNavigationProp = NativeStackNavigationProp<FeedStackParamList, 'FeedScreen'>;

export const FeedScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const navigation = useNavigation<FeedScreenNavigationProp>();

  const handleReviewPress = () => {
    navigation.navigate('ReviewDetail');
  };

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
    >
      <Header
        title="Feed"
        hasNotification
        hasMessage
        onMenuPress={() => setIsMenuVisible(true)}
      />
      <FilterBar />
      <ScrollView flex={1} px="$4" py="$2">
        <ReviewCard
          title="Decent but Could Be Better"
          content="The PHILIPS Azur DST8050/20 steam iron offers decent steam power and is practical for ironing various fabrics. However, its weight and somewhat long heating time were drawbacks for me. I didn't get..."
          productImage={require('@/assets/product/product_01.png')}
          productName="PHILIPS Azur DST8050/20 Steam Iron"
          likes={110}
          comments={32}
          shares={11}
          bookmarks={32}
          rating={3}
          usageDuration="4-7 Days"
          experience="It Could be Better"
          useCase="Daily Use"
          userImage={require('@/assets/avatar/ozan.png')}
          userName="Salvador Costa"
          userBadge="Home Wizard"
          userAction="Added a new product and experiences to your inventory!"
          onPress={handleReviewPress}
        />
        <ReviewImageCard
          title="Okay Coffee Maker, Nothing Special"
          content="This filter coffee maker brews decent coffee and is easy to use. However, the brewing time is a bit slow, and the coffee temperature doesn't stay hot for long. The design is..."
          mainImage={require('@/assets/product/product_02.png')}
          productImage={require('@/assets/product/product_02.png')}
          productName="PHILIPS Coffee Maker XL"
          likes={110}
          comments={32}
          shares={11}
          bookmarks={32}
          rating={3}
          usageDuration="4-7 Days"
          experience="Could be Better"
          userImage={require('@/assets/avatar/ozan.png')}
          userName="Teresa Randolph"
          userBadge="Kitchen Specialist"
          userAction="Added a new product and experiences to your inventory!"
          onPress={handleReviewPress}
        />
      </ScrollView>
      <SideMenu
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        userProfile={MOCK_USER_PROFILE}
        menuItems={MENU_ITEMS}
      />
    </Box>
  );
};