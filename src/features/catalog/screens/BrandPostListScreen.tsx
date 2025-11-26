import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import PostCard from '@/src/components/PostCards/PostCard';
import { mockPostData } from '@/src/mock/catalog/brandSurveys';
import { useSafeAreaValues } from '@/src/utils';

type BrandPostListScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandPostListScreen'>;

const BrandPostListScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandPostListScreenNavigationProp>();
  const bottomInset = useSafeAreaValues('bottom');

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title="Paylaşımlar"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          flex={1}
          contentContainerStyle={{ paddingBottom: bottomInset }}
        >
          <VStack space="md" p="$4">
            <PostCard data={mockPostData} hideProduct={true} />
            <PostCard data={mockPostData} hideProduct={true} />
            <PostCard data={mockPostData} hideProduct={true} />
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default BrandPostListScreen;
