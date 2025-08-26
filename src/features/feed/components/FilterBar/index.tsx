import React, { useState } from 'react';
import { HStack, Pressable, Text, Box, VStack, Modal, Button, ButtonText } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ChevronDown, Filter, Tag, Grid, ArrowUpDown } from 'lucide-react-native';

interface FilterOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  options: string[];
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'interest',
    label: 'İlgi Alanı',
    icon: <Filter size={16} color="#000000" />,
    options: ['Teknoloji', 'Spor', 'Müzik', 'Sanat', 'Bilim', 'Tarih'],
  },
  {
    id: 'tag',
    label: 'Etiket',
    icon: <Tag size={16} color="#000000" />,
    options: ['Popüler', 'Yeni', 'Trend', 'Öne Çıkan', 'Özel'],
  },
  {
    id: 'category',
    label: 'Kategori',
    icon: <Grid size={16} color="#000000" />,
    options: ['Ürün', 'Deneyim', 'Hizmet', 'Olay', 'Proje'],
  },
  {
    id: 'sort',
    label: 'Sırala',
    icon: <ArrowUpDown size={16} color="#000000" />,
    options: ['En Yeni', 'En Popüler', 'En Çok Beğenilen', 'En Çok Yorumlanan'],
  },
];

export const FilterBar = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const handleFilterPress = (filterId: string) => {
    setSelectedFilter(filterId);
  };

  const handleOptionSelect = (filterId: string, option: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [filterId]: option
    }));
    setSelectedFilter(null);
  };

  const handleCloseModal = () => {
    setSelectedFilter(null);
  };

  const getSelectedOption = (filterId: string) => {
    return selectedOptions[filterId] || '';
  };

  return (
    <>
      <HStack justifyContent="space-between" px="$4" py="$3" mt="$2">
        <HStack space="md" flex={1}>
          {FILTER_OPTIONS.slice(0, 3).map((option) => (
            <Pressable
              key={option.id}
              onPress={() => handleFilterPress(option.id)}
            >
              <Box
                flexDirection="row"
                alignItems="center"
                gap="$2"
                px="$3"
                py="$2"
                bg={isDark ? '$backgroundDark800' : '$backgroundLight200'}
                borderWidth={1}
                borderColor={isDark ? '$borderDark700' : '$borderLight300'}
                borderRadius="$full"
                minWidth={80}
                justifyContent="space-between"
              >
                <HStack alignItems="center" space="sm">
                  {option.icon}
                  <Text
                    color={isDark ? '$textDark50' : '$textLight900'}
                    fontSize="$xs"
                    fontWeight="$500"
                  >
                    {option.label}
                  </Text>
                </HStack>
                <ChevronDown size={14} color={isDark ? '#ffffff' : '#000000'} />
              </Box>
            </Pressable>
          ))}
        </HStack>
      </HStack>

      {/* Selection Modal */}
      <Modal
        isOpen={selectedFilter !== null}
        onClose={handleCloseModal}
        size="md"
      >
        <Modal.Content
          bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
          borderWidth={1}
          borderColor={isDark ? '$borderDark700' : '$borderLight300'}
          borderRadius="$lg"
        >
          <Modal.Header
            borderBottomWidth={1}
            borderBottomColor={isDark ? '$borderDark700' : '$borderLight300'}
            pb="$3"
          >
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$lg"
              fontWeight="$600"
            >
              {selectedFilter ? FILTER_OPTIONS.find(f => f.id === selectedFilter)?.label : ''}
            </Text>
          </Modal.Header>
          
          <Modal.Body py="$4">
            <VStack space="md">
              {selectedFilter && FILTER_OPTIONS.find(f => f.id === selectedFilter)?.options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => handleOptionSelect(selectedFilter, option)}
                >
                  <Box
                    p="$3"
                    bg={isDark ? '$backgroundDark700' : '$backgroundLight50'}
                    borderRadius="$md"
                    borderWidth={1}
                    borderColor={
                      getSelectedOption(selectedFilter) === option
                        ? '$lime500'
                        : isDark ? '$borderDark600' : '$borderLight200'
                    }
                  >
                    <Text
                      color={isDark ? '$textDark50' : '$textLight900'}
                      fontSize="$md"
                      fontWeight="$500"
                    >
                      {option}
                    </Text>
                  </Box>
                </Pressable>
              ))}
            </VStack>
          </Modal.Body>
          
          <Modal.Footer
            borderTopWidth={1}
            borderTopColor={isDark ? '$borderDark700' : '$borderLight300'}
            pt="$3"
          >
            <Button
              variant="outline"
              onPress={handleCloseModal}
              borderColor={isDark ? '$borderDark600' : '$borderLight300'}
            >
              <ButtonText
                color={isDark ? '$textDark50' : '$textLight900'}
              >
                Kapat
              </ButtonText>
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  );
};
