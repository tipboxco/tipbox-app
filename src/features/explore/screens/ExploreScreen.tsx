import React from 'react';
import { ScrollView } from 'react-native';
import { Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ReviewCard, ReviewImageCard } from '@/src/components/ReviewCard';

const ExploreScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header title="Keşfet" hasNotification hasMessage />
      <ScrollView>
        <Box px="$4" py="$2">
          <ReviewCard
            title="PHILIPS Azur DST8050/20 Buharlı Ütü İncelemesi"
            content="PHILIPS Azur DST8050/20 buharlı ütü, güçlü buhar performansı ve çeşitli kumaşlar için pratik kullanım sunuyor. Ancak ağırlığı ve biraz uzun ısınma süresi benim için dezavantajdı..."
            productImage={require('@/assets/product/product_01.png')}
            productName="PHILIPS Azur DST8050/20 Buharlı Ütü"
            likes={110}
            comments={32}
            shares={11}
            bookmarks={32}
            rating={3}
            usageDuration="4-7 Gün"
            experience="İyi Olabilirdi"
            useCase="Günlük Kullanım"
            userImage={require('@/assets/avatar/ozan.png')}
            userName="Ozan Mutluoğlu"
            userBadge="Ev Uzmanı"
            userAction="Envanterine yeni bir ürün ve deneyim ekledi!"
            onPress={() => {}}
          />
          <ReviewImageCard
            title="PHILIPS Filtre Kahve Makinesi Değerlendirmesi"
            content="Bu filtre kahve makinesi iyi kahve demliyor ve kullanımı kolay. Ancak demleme süresi biraz yavaş ve kahve sıcaklığı uzun süre korunmuyor. Tasarımı..."
            mainImage={require('@/assets/product/product_02.png')}
            productImage={require('@/assets/product/product_02.png')}
            productName="PHILIPS HD7461/20 Filtre Kahve Makinesi"
            likes={156}
            comments={45}
            shares={23}
            bookmarks={67}
            rating={4}
            usageDuration="2-3 Hafta"
            experience="Memnun Kaldım"
            userImage={require('@/assets/avatar/ozan.png')}
            userName="Ozan Mutluoğlu"
            userBadge="Mutfak Uzmanı"
            userAction="Envanterine yeni bir ürün ve deneyim ekledi!"
            onPress={() => {}}
          />
        </Box>
      </ScrollView>
    </Box>
  );
};

ExploreScreen.displayName = 'ExploreScreen';

export default ExploreScreen;