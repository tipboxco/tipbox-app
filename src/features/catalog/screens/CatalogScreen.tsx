import React, { useState } from 'react';
import { Box, Text, ScrollView, Pressable, HStack, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { SideMenu } from '@/src/components/SideMenu';
import { mock_user_profile } from '@/src/mock/common';
import { Search, ChevronRight } from 'lucide-react-native';

// Kategori sekmeleri için tip
type CategoryTab = 'main' | 'sub' | 'groups' | 'products';

export const CatalogScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<CategoryTab>('main');
  const [searchQuery, setSearchQuery] = useState('');

  // Kategori sekmeleri
  const categoryTabs = [
    { id: 'main', label: 'Ana Kategoriler', active: activeTab === 'main' },
    { id: 'sub', label: 'Alt Kategoriler', active: activeTab === 'sub' },
    { id: 'groups', label: 'Ürün Grupları', active: activeTab === 'groups' },
    { id: 'products', label: 'Ürünler', active: activeTab === 'products' },
  ];

  const handleTabPress = (tabId: CategoryTab) => {
    setActiveTab(tabId);
  };

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
    >
      <Header
        title="Katalog"
        hasNotification
        hasMessage
        onMenuPress={() => setIsMenuVisible(true)}
      />
      
      {/* Arama Çubuğu */}
      <Box px="$4" py="$3">
        <Box
          bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
          borderRadius="$lg"
          px="$4"
          py="$2"
          flexDirection="row"
          alignItems="center"
        >
          <Search 
            size={16} 
            color={isDark ? '#FFFFFF' : '#000000'} 
            style={{ marginRight: 8 }}
          />
          <Text
            flex={1}
            fontSize="$xs"
            color={isDark ? '$textDark400' : '$textLight400'}
          >
            Ana Kategori seçin veya ürün adı arayın
          </Text>
        </Box>
      </Box>

      {/* Kategori Sekmeleri */}
      <Box px="$4" mb="$4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack space="md" alignItems="center">
            {categoryTabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => handleTabPress(tab.id as CategoryTab)}
              >
                <HStack space="sm" alignItems="center">
                  <Text
                    fontSize="$xs"
                    fontWeight="$bold"
                    color={
                      tab.active
                        ? (isDark ? '$textDark0' : '$textLight950')
                        : (isDark ? '$textDark400' : '$textLight400')
                    }
                  >
                    {tab.label}
                  </Text>
                  <ChevronRight 
                    size={16} 
                    color={tab.active 
                      ? (isDark ? '#FFFFFF' : '#000000') 
                      : '#8C8C8C'
                    } 
                  />
                </HStack>
              </Pressable>
            ))}
          </HStack>
        </ScrollView>
        
        {/* Aktif sekme altındaki çizgi */}
        <Box
          mt="$2"
          h="$0.5"
          bg={isDark ? '$backgroundDark800' : '$backgroundLight200'}
          borderRadius="$full"
        />
      </Box>

      {/* Ürün Grid'i */}
      <ScrollView flex={1} px="$4">
        <VStack space="md">
          {Array.from({ length: 3 }, (_, rowIndex) => (
            <HStack key={rowIndex} space="md" justifyContent="space-between">
              {Array.from({ length: 3 }, (_, colIndex) => {
                const productIndex = rowIndex * 3 + colIndex;
                
                return (
                  <Box
                    key={colIndex}
                    flex={1}
                    bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
                    borderRadius="$md"
                    p="$3"
                    alignItems="center"
                  >
                    <Box
                      w="$20"
                      h="$20"
                      bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                      borderRadius="$md"
                      mb="$2"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text fontSize="$xs" color={isDark ? '$textDark400' : '$textLight400'}>
                        Ürün {productIndex + 1}
                      </Text>
                    </Box>
                    <Box
                      w="$16"
                      h="$2.5"
                      bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                      borderRadius="$xs"
                    />
                  </Box>
                );
              })}
            </HStack>
          ))}
        </VStack>
      </ScrollView>

      <SideMenu
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        userProfile={mock_user_profile}
      />
    </Box>
  );
};
