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
import { mock_review_card, mock_review_card_image, mock_user_profile } from '@/src/mock/common';



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
          {...mock_review_card}
          onPress={handleReviewPress}
        />
        <ReviewImageCard
          {...mock_review_card_image}
          onPress={handleReviewPress}
        />
      </ScrollView>
      <SideMenu
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        userProfile={mock_user_profile}

      />
    </Box>
  );
};