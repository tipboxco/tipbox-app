import React, { useState, useCallback, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text } from '@gluestack-ui/themed';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useCreatePostFlowStore } from '@/src/features/post/store/createPostFlowStore';
import { ProductInfoType } from '@/src/types/common';
import type { PostStackParamList } from '../navigation';
import {
  InventoryPickerTab,
  type PickedProduct,
} from '../components/ProductPicker/InventoryPickerTab';
import { CatalogPickerTab } from '../components/ProductPicker/CatalogPickerTab';

type ProductPickerNavigationProp =
  NativeStackNavigationProp<PostStackParamList>;

/**
 * Ürün seçici — iki sekme:
 *  - Envanterim: kullanıcının envanterindeki ürünler.
 *  - Katalogdan Ara: ürün arama + kategori gezerek en alt katmandaki ürünler.
 * Her iki sekmede de seçilen ürün post bağlamı olarak flow store'a yazılır ve geri dönülür
 * (Twitter'da medya ekleme gibi attach mekaniği; CreatePostScreen store'dan okur).
 */
export const ProductPickerScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ProductPickerNavigationProp>();
  const route = useRoute<RouteProp<PostStackParamList, 'ProductPicker'>>();
  const target = route.params?.target ?? 'context';
  const { t } = useTranslation('post');
  const setFlowContext = useCreatePostFlowStore(state => state.setFlowContext);
  const setCompareProduct = useCreatePostFlowStore(state => state.setCompareProduct);

  const [tabIndex, setTabIndex] = useState(0);

  const handleSelect = useCallback(
    (product: PickedProduct) => {
      if (target === 'compare') {
        // Benchmark 2. ürün — ana bağlamı ezmeden ayrı slot'a yaz
        setCompareProduct({
          productId: product.productId,
          image: product.image,
          title: product.title,
          subName: product.subName,
        });
      } else {
        setFlowContext(ProductInfoType.PRODUCT, product.productId, {
          image: product.image,
          title: product.title,
          subName: product.subName,
        });
      }
      navigation.goBack();
    },
    [target, setFlowContext, setCompareProduct, navigation]
  );

  const tabs = useMemo(
    () => [
      { key: 'inventory', label: t('create.productPicker.tabInventory') },
      { key: 'catalog', label: t('create.productPicker.tabCatalog') },
    ],
    [t]
  );

  const bgColor = isDark ? '#1A1A1A' : '#FAFAFA';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const tabBorder = isDark ? '#333333' : '#E9E9E9';
  const activeColor = isDark ? '#FFFFFF' : '#111111';
  const inactiveColor = '#8C8C8C';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: bgColor }}
    >
      <Box flex={1}>
        {/* Header */}
        <Box h={48} justifyContent='center' px='$4'>
          <Text
            textAlign='center'
            fontSize='$md'
            fontWeight='$semibold'
            color={textColor}
            numberOfLines={1}
          >
            {t('create.productPicker.title')}
          </Text>
          <Pressable
            style={{
              position: 'absolute',
              left: 16,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
            }}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={22} color={textColor} />
          </Pressable>
        </Box>

        {/* Tab bar — feed ekranındaki alt-çizgili sekme yapısıyla aynı */}
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: tabBorder,
            flexDirection: 'row',
          }}
        >
          {tabs.map((tab, index) => {
            const isActive = tabIndex === index;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setTabIndex(index)}
                style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text
                  fontSize='$sm'
                  fontWeight={isActive ? '$bold' : '$medium'}
                  color={isActive ? activeColor : inactiveColor}
                >
                  {tab.label}
                </Text>
                {isActive && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 24,
                      right: 24,
                      height: 2,
                      backgroundColor: activeColor,
                      borderRadius: 1,
                    }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Tab content — sekme değişince ilgili içerik render edilir */}
        <Box flex={1}>
          {tabIndex === 0 ? (
            <InventoryPickerTab onSelect={handleSelect} />
          ) : (
            <CatalogPickerTab onSelect={handleSelect} />
          )}
        </Box>
      </Box>
    </SafeAreaView>
  );
};
