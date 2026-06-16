import React from 'react';
import { HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import { ChevronRight, XCircle } from 'lucide-react-native';
import { CachedImage } from '@/src/components/CachedImage';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';

export interface ProductSelectValue {
  image?: any;
  title: string;
  subName?: string;
}

interface ProductSelectInputProps {
  /** Seçili ürün/kategori bilgisi; yoksa placeholder gösterilir */
  value?: ProductSelectValue | null;
  placeholder: string;
  onPress: () => void;
  onClear?: () => void;
}

/**
 * Paylaşılan ürün/kategori seçim input satırı. Hem CreatePostScreen'deki
 * birincil bağlam seçimi hem de benchmark'taki ikinci ürün seçimi AYNI bu
 * bileşeni kullanır (tutarlı, tek kaynak).
 */
export const ProductSelectInput: React.FC<ProductSelectInputProps> = ({ value, placeholder, onPress, onClear }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('post');

  return (
    <Pressable onPress={onPress}>
      <HStack
        alignItems="center"
        justifyContent="space-between"
        bg={isDark ? '#2A2A2A' : '#FFFFFF'}
        borderWidth={1}
        borderColor={isDark ? '#333333' : '#E9E9E9'}
        borderRadius={10}
        px="$4"
        py="$3"
      >
        {value ? (
          <>
            <CachedImage
              source={value.image}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: isDark ? '#1A1A1A' : '#F1F1F1',
                marginRight: 10,
              }}
              contentFit="cover"
            />
            <VStack flex={1} space="xs">
              <Text color={isDark ? '#FFFFFF' : '#111111'} fontSize="$sm" fontWeight="$medium" numberOfLines={1}>
                {value.title}
              </Text>
              {value.subName ? (
                <Text color={isDark ? '#9CA3AF' : '#6B7280'} fontSize="$xs" numberOfLines={1}>
                  {value.subName}
                </Text>
              ) : null}
            </VStack>
            {onClear && (
              <Pressable
                onPress={onClear}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={t('create.context.remove', 'Kaldır')}
              >
                <XCircle size={22} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </Pressable>
            )}
          </>
        ) : (
          <>
            <Text flex={1} color="#9D9D9D" fontSize="$sm" numberOfLines={1}>
              {placeholder}
            </Text>
            <ChevronRight size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </>
        )}
      </HStack>
    </Pressable>
  );
};
