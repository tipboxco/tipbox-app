import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { ProductCatalogScreen } from './ProductCatalogScreen';
import { useTranslation } from '@/src/hooks/useTranslation';

export const ProductCatalogWrapper = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const { t } = useTranslation('catalog');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        <Header
          title={t('productCatalog.categories')}
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <ProductCatalogScreen scrollViewPaddingBottom={20} />
      </VStack>
    </SafeAreaView>
  );
};
