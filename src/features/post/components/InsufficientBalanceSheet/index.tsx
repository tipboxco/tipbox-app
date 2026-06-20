import React from 'react';
import { Box, VStack, Text, Pressable } from '@gluestack-ui/themed';
import { Wallet } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';

interface InsufficientBalanceSheetProps {
  /** Mevcut TIPS bakiyesi (varsa). */
  available?: number;
  /** Gerekli TIPS miktarı (varsa). */
  required?: number;
  /** "Cüzdana Git" — cüzdana yönlendir. */
  onGoToWallet: () => void;
  /** Vazgeç. */
  onCancel: () => void;
}

/**
 * Yetersiz TIPS bakiyesi (paywall) bottom sheet'i.
 * Boost'lu gönderi için bakiye yetmeyince hata toast'ı yerine gösterilir; cüzdana yönlendirir.
 */
export const InsufficientBalanceSheet: React.FC<
  InsufficientBalanceSheetProps
> = ({ available, required, onGoToWallet, onCancel }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('post');

  const bg = isDark ? '#121212' : '#FFFFFF';
  const textColor = isDark ? '#F5F5F5' : '#111111';
  const subTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const accent = '#6366F1';

  return (
    <Box bg={bg} width='100%' px='$4' pt='$2' pb='$4'>
      <VStack space='md' alignItems='center'>
        <Box
          width={56}
          height={56}
          borderRadius={999}
          bg={isDark ? '#2A2E15' : '#EDF2C9'}
          alignItems='center'
          justifyContent='center'
        >
          <Wallet size={28} color='#829905' />
        </Box>

        <Text
          fontSize='$lg'
          fontWeight='$bold'
          color={textColor}
          textAlign='center'
        >
          {t('create.paywall.title', 'Yetersiz TIPS Bakiyesi')}
        </Text>

        <Text fontSize='$sm' color={subTextColor} textAlign='center'>
          {required !== undefined && available !== undefined
            ? t('create.paywall.descriptionDetailed', {
                required,
                available,
                defaultValue:
                  'Bu işlem için {{required}} TIPS gerekiyor; mevcut bakiyen {{available}} TIPS. Devam etmek için bakiyeni yükle.',
              })
            : t(
                'create.paywall.description',
                'Bu işlem için yeterli TIPS bakiyen yok. Devam etmek için bakiyeni yükle.'
              )}
        </Text>

        <Pressable
          onPress={onGoToWallet}
          bg={accent}
          borderRadius={25}
          width='100%'
          alignItems='center'
          justifyContent='center'
          h={48}
          mt='$1'
        >
          <Text fontSize='$md' fontWeight='$semibold' color='#FFFFFF'>
            {t('create.paywall.goToWallet', 'Cüzdana Git')}
          </Text>
        </Pressable>

        <Pressable onPress={onCancel} h={40} justifyContent='center'>
          <Text fontSize='$sm' fontWeight='$medium' color={subTextColor}>
            {t('create.paywall.cancel', 'Vazgeç')}
          </Text>
        </Pressable>
      </VStack>
    </Box>
  );
};
