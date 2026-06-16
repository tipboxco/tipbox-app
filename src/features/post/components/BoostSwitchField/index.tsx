import React from 'react';
import { Box, HStack, VStack, Text, Switch, Divider } from '@gluestack-ui/themed';
import { ArrowTrendingUpIcon } from 'react-native-heroicons/outline';
import { Controller, useFormContext } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';

/** TIPS to USD display rate (e.g. 100 TIPS = $1) */
const TIPS_TO_USD_RATE = 100;

interface BoostSwitchFieldProps {
  boostPrice?: number;
  isLoadingPrice: boolean;
  availableTips: number;
}

/**
 * Soru paylaşımında boost ON/OFF anahtarı + Available / Boost Price satırı.
 * `boostEnabled` form alanını okur; hem CreateQuestionPostScreen hem birleşik
 * CreatePostScreen'de tekrar kullanılır (form tipi agnostik).
 */
export const BoostSwitchField: React.FC<BoostSwitchFieldProps> = ({
  boostPrice,
  isLoadingPrice,
  availableTips,
}) => {
  const { t } = useTranslation('post');
  const { control } = useFormContext();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const greyLabel = isDark ? '$textDark400' : '#787878';
  const greyValue = isDark ? '#A3A3A3' : '#A3A3A3';

  return (
    <Controller
      name="boostEnabled"
      control={control}
      render={({ field: { onChange, value } }) => (
        <Box
          px={16}
          py={12}
          bg={isDark ? '$backgroundDark900' : '$white'}
          borderRadius={12}
          borderWidth={1}
          borderColor={isDark ? '#333333' : '#E9E9E9'}
        >
          <HStack alignItems="center" justifyContent="space-between">
            <Box
              w={36}
              h={36}
              borderRadius={8}
              bg={isDark ? '#333333' : '#E9E9E9'}
              alignItems="center"
              justifyContent="center"
              mr={12}
            >
              <ArrowTrendingUpIcon width={20} height={20} color={isDark ? '#A3A3A3' : '#787878'} />
            </Box>
            <VStack flex={1} mr={12}>
              <Text color={isDark ? '$textDark50' : '#000'} fontSize="$sm" fontWeight="$semibold" mb={4}>
                {t('create.question.boost.title')}
              </Text>
              <Text color={isDark ? '$textDark400' : '#787878'} fontSize={11} lineHeight={14}>
                {isLoadingPrice
                  ? t('create.question.boost.calculating')
                  : value
                    ? (boostPrice != null ? t('create.question.boost.activeTips', { price: boostPrice }) : t('create.question.boost.active'))
                    : t('create.question.boost.description')}
              </Text>
            </VStack>
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{
                false: isDark ? '#333333' : '#E9E9E9',
                true: '#829905',
              }}
              thumbColor={value ? '#B8CC04' : (isDark ? '#666666' : '#FFFFFF')}
              disabled={isLoadingPrice}
            />
          </HStack>

          <Divider my={12} bg={isDark ? '#333333' : '#E9E9E9'} />

          <HStack justifyContent="space-between" alignItems="flex-start">
            <VStack alignItems="flex-start" flex={1}>
              <Text color={greyLabel} fontSize={10} mb={4}>
                {t('create.question.boost.available')}
              </Text>
              <Text color={greyValue} fontSize="$sm" fontWeight="$medium">
                {Math.floor(availableTips)} TIPS
              </Text>
              <Text color={greyLabel} fontSize={10} mt={2}>
                (${(availableTips / TIPS_TO_USD_RATE).toFixed(0)})
              </Text>
            </VStack>
            <VStack alignItems="flex-end" flex={1}>
              <Text color={greyLabel} fontSize={10} mb={4}>
                {t('create.question.boost.boostPrice')}
              </Text>
              <Text color={isLoadingPrice ? greyValue : '#829905'} fontSize="$sm" fontWeight="$semibold">
                {isLoadingPrice ? '—' : `${Math.floor(boostPrice ?? 0)} TIPS`}
              </Text>
              <Text color={greyLabel} fontSize={10} mt={2}>
                ({isLoadingPrice ? '—' : `$${((boostPrice ?? 0) / TIPS_TO_USD_RATE).toFixed(1)}`})
              </Text>
            </VStack>
          </HStack>
        </Box>
      )}
    />
  );
};
