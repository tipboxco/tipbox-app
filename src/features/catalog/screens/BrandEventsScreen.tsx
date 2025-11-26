import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import EventCard from '../components/EventCard';
import { mockBrandEvents } from '@/src/mock/catalog/brandSurveys';
import { useSafeAreaValues } from '@/src/utils';

type BrandEventsScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandEventsScreen'>;

const BrandEventsScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandEventsScreenNavigationProp>();
  const bottomInset = useSafeAreaValues('bottom');

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title="Etkinlikler"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          flex={1}
          contentContainerStyle={{ paddingBottom: bottomInset }}
        >
          <VStack p="$4">
            {mockBrandEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => navigation.navigate('BrandEventsDetailScreen')}
              />
            ))}
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default BrandEventsScreen;
