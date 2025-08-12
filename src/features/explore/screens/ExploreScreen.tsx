import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ReviewCard, ReviewImageCard } from '@/src/components/ReviewCard';
import { SideMenu } from '@/src/components/SideMenu';
import { mock_review_card, mock_review_card_image, mock_user_profile } from '@/src/mock/common';



const ExploreScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header 
        title="Explore" 
        hasNotification 
        hasMessage 
        onMenuPress={() => setIsMenuVisible(true)}
      />
      <ScrollView>
        <Box px="$4" py="$2">
          <ReviewCard
            {...mock_review_card}
            onPress={() => {}}
          />
          <ReviewImageCard
            {...mock_review_card_image}
            onPress={() => {}}
          />
        </Box>
      </ScrollView>
      <SideMenu
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        userProfile={mock_user_profile}

      />
    </Box>
  );
};

ExploreScreen.displayName = 'ExploreScreen';

export default ExploreScreen;