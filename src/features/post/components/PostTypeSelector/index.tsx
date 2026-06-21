import React from 'react';
import { HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';

export interface PostTypeOption {
  value: string;
  labelKey: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}

interface PostTypeSelectorProps {
  options: PostTypeOption[];
  value: string;
  onChange: (value: string) => void;
  /** Devre dışı (envanter gerektiren ama ürün envanterde olmayan) tip değerleri. */
  disabledValues?: string[];
  /** Devre dışı bir tipe dokunulduğunda (örn. kullanıcıyı bilgilendirmek için). */
  onDisabledPress?: (value: string) => void;
}

/**
 * Paylaşım tipini seçtiren yatay radio kart grubu. Seçenekler dışarıdan verilir
 * (kategori bağlamında General/Question/Tips, ürün bağlamında
 * Experience/Question/Tips/Benchmark). Seçili kart yeşil kenarlık + yeşil içerik.
 * disabledValues içindeki tipler soluk ve seçilemez görünür.
 */
export const PostTypeSelector: React.FC<PostTypeSelectorProps> = ({
  options,
  value,
  onChange,
  disabledValues,
  onDisabledPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('post');

  const activeColor = '#829905';
  const inactiveColor = isDark ? '#8E8E93' : '#9D9D9D';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const inactiveBorder = isDark ? '#38383A' : '#E9E9E9';

  return (
    <HStack space='sm' px={16}>
      {options.map(({ value: optValue, labelKey, Icon }) => {
        const selected = value === optValue;
        const disabled = disabledValues?.includes(optValue) ?? false;
        const color = disabled
          ? inactiveColor
          : selected
            ? activeColor
            : inactiveColor;
        return (
          <Pressable
            key={optValue}
            flex={1}
            onPress={() =>
              disabled ? onDisabledPress?.(optValue) : onChange(optValue)
            }
            accessibilityRole='radio'
            accessibilityState={{ selected, disabled }}
          >
            <VStack
              bg={cardBg}
              borderWidth={selected && !disabled ? 1.5 : 1}
              borderColor={selected && !disabled ? activeColor : inactiveBorder}
              borderRadius={10}
              py={12}
              px={4}
              space='xs'
              alignItems='center'
              opacity={disabled ? 0.4 : 1}
            >
              <Icon size={22} color={color} />
              <Text
                fontSize={11}
                fontWeight={selected ? '$semibold' : '$medium'}
                color={color}
                textAlign='center'
              >
                {t(labelKey)}
              </Text>
            </VStack>
          </Pressable>
        );
      })}
    </HStack>
  );
};
