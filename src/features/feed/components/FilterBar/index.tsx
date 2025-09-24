import React, { useState } from 'react';
import { HStack, Pressable, Text, Box, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import {
  Popover,
  PopoverBackdrop,
  PopoverContent,
  PopoverBody,
  PopoverCloseButton,
  PopoverHeader,
  PopoverFooter,
  PopoverArrow,
} from '@gluestack-ui/themed';

interface FilterOption {
  id: string;
  label: string;
  icon: string;
  options: string[];
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'interest',
    label: 'İlgi Alanı',
    icon: 'filter',
    options: ['Teknoloji', 'Spor', 'Müzik', 'Sanat', 'Bilim', 'Tarih'],
  },
  {
    id: 'tag',
    label: 'Etiket',
    icon: 'tag',
    options: ['Popüler', 'Yeni', 'Trend', 'Öne Çıkan', 'Özel'],
  },
  {
    id: 'category',
    label: 'Kategori',
    icon: 'grid',
    options: ['Ürün', 'Deneyim', 'Hizmet', 'Olay', 'Proje'],
  },
  {
    id: 'sort',
    label: 'Sırala',
    icon: 'arrow-up-down',
    options: ['En Yeni', 'En Popüler', 'En Çok Beğenilen', 'En Çok Yorumlanan'],
  },
];

export const FilterBar = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const handleOptionSelect = (filterId: string, option: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [filterId]: option
    }));
    setOpenPopoverId(null); // Popover'ı kapat
  };

  const handlePopoverOpen = (filterId: string) => {
    setOpenPopoverId(filterId);
  };

  const handlePopoverClose = () => {
    setOpenPopoverId(null);
  };

  const getSelectedOption = (filterId: string) => {
    return selectedOptions[filterId] || '';
  };

  const renderFilterButton = (option: FilterOption) => (
    <Popover
      key={option.id}
      placement="bottom"
      offset={4}
      isOpen={openPopoverId === option.id}
      onClose={handlePopoverClose}
      trigger={(triggerProps) => (
        <Pressable
          {...triggerProps}
          onPress={() => handlePopoverOpen(option.id)}
        >
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            gap={4}
            px="$3"
            bg="#FDFDFD"
            borderWidth={1}
            borderColor="#E9E9E9"
            borderRadius={10}
            height={23}
          >
            <Text
              color="#000000"
              fontSize={9}
              fontWeight="$bold"
            >
              {option.label}
            </Text>
            <Box
              width={12}
              height={12}
              alignItems="center"
              justifyContent="center"
            >
              <Feather
                name="chevron-down"
                size={8}
                color="#000000"
              />
            </Box>
          </Box>
        </Pressable>
      )}
    >
      <PopoverBackdrop onPress={handlePopoverClose} />
      <PopoverContent
        bg={isDark ? '#1A1A1A' : '#FFFFFF'}
        borderWidth={1}
        borderColor={isDark ? '#333333' : '#E9E9E9'}
        borderRadius={10}
        minWidth={120}
        maxWidth={200}
        p="$2"
      >
        <PopoverArrow />
        <PopoverBody>
          <VStack space="xs">
            {option.options.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => handleOptionSelect(option.id, opt)}
              >
                <Box
                  px="$3"
                  py="$2"
                  bg={
                    getSelectedOption(option.id) === opt
                      ? '#E2FF46'
                      : 'transparent'
                  }
                  borderRadius={8}
                  minWidth={100}
                >
                  <Text
                    color={
                      getSelectedOption(option.id) === opt
                        ? '#000000'
                        : isDark ? '#FFFFFF' : '#000000'
                    }
                    fontSize={11}
                    fontWeight="$medium"
                    numberOfLines={1}
                  >
                    {opt}
                  </Text>
                </Box>
              </Pressable>
            ))}
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      <Box px="$4" pb="$2" mt="$2">
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="sm" alignItems="center">
            {FILTER_OPTIONS.slice(0, 3).map(renderFilterButton)}
          </HStack>
          <Box>
            {renderFilterButton(FILTER_OPTIONS[3])}
          </Box>
        </HStack>
      </Box>

      {/* Güvenli kapanış overlay'i - sadece popover açıkken aktif */}
      {openPopoverId && (
        <Pressable
          onPress={handlePopoverClose}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1
          }}
          pointerEvents="auto"
        />
      )}
    </>
  );
};
