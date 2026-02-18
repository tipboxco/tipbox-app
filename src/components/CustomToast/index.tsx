import React, { useEffect, useRef } from 'react';
import { Box, Text, HStack, Pressable, VStack, Toast } from '@gluestack-ui/themed';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react-native';
import { Animated } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { IToastProps } from '@gluestack-ui/toast/lib/types';

interface CustomToastProps {
  id: string;
  title: string;
  description?: string;
  action: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export interface ShowToastOptions {
  title: string;
  description?: string;
  action?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

/**
 * useToast hook'unun döndürdüğü tip
 */
type ToastInstance = {
  show: (props: IToastProps) => string;
  close: (id: string) => void;
  closeAll: () => void;
  isActive: (id: string) => boolean;
};

/**
 * Helper function to show CustomToast
 * Tüm ekranlarda aynı toast yapısını kullanmak için helper fonksiyon
 */
export const showCustomToast = (
  toast: ToastInstance,
  options: ShowToastOptions
) => {
  const { title, description, action = 'info', duration = 3000 } = options;
  
  toast.show({
    placement: 'top',
    duration,
    render: ({ id }: { id: string }): React.ReactNode => {
      return (
        <CustomToast
          id={id}
          title={title}
          description={description}
          action={action}
          duration={duration}
          onClose={() => toast.close(id)}
        />

      );
    },
  });
};

/**
 * CustomToast Component
 * 
 * Figma tasarımına göre güncellenmiş toast component'i.
 * - Beyaz arka plan
 * - Sol tarafta dairesel ikon (koyu renk, etrafında açık renk halka, içinde beyaz ikon)
 * - Orta kısımda mesaj metni
 * - Sağ üstte kapatma butonu
 * - Alt kısımda progress bar
 */
export const CustomToast: React.FC<CustomToastProps> = ({
  id,
  title,
  description,
  action,
  duration = 3000,
  onClose,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Progress bar animasyonu
  useEffect(() => {
    if (duration > 0) {
      progressAnim.setValue(1);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration,
        useNativeDriver: false,
      }).start(() => {
        onClose?.();
      });
    }
  }, [duration, onClose]);

  // Action'a göre icon ve renk belirle
  const getActionConfig = () => {
    switch (action) {
      case 'success':
        return {
          icon: CheckCircle,
          iconBgColor: '#065F46', // koyu yeşil
          iconRingColor: '#10B981', // açık yeşil halka
          iconColor: '#FFFFFF', // beyaz ikon
          textColor: '#10B981', // hafif soluk yeşil
          progressColor: '#065F46', // koyu yeşil
          progressBgColor: '#E5E7EB', // açık gri
        };
      case 'error':
        return {
          icon: XCircle,
          iconBgColor: '#991B1B', // koyu kırmızı
          iconRingColor: '#EF4444', // açık kırmızı halka
          iconColor: '#FFFFFF', // beyaz ikon
          textColor: '#EF4444', // hafif soluk kırmızı
          progressColor: '#991B1B', // koyu kırmızı
          progressBgColor: '#E5E7EB', // açık gri
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconBgColor: '#92400E', // koyu amber
          iconRingColor: '#F59E0B', // açık amber halka
          iconColor: '#FFFFFF', // beyaz ikon
          textColor: '#F59E0B', // hafif soluk amber
          progressColor: '#92400E', // koyu amber
          progressBgColor: '#E5E7EB', // açık gri
        };
      case 'info':
      default:
        return {
          icon: AlertCircle,
          iconBgColor: '#1E40AF', // koyu mavi
          iconRingColor: '#3B82F6', // açık mavi halka
          iconColor: '#FFFFFF', // beyaz ikon
          textColor: '#3B82F6', // hafif soluk mavi
          progressColor: '#1E40AF', // koyu mavi
          progressBgColor: '#E5E7EB', // açık gri
        };
    }
  };

  const config = getActionConfig();
  const IconComponent = config.icon;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Box
      bg="$white"
      borderRadius="$lg"
      px={12}
      py={8}
      shadowColor="$black"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={8}
      elevation={5}
      width={358}
      minHeight={48}
      overflow="hidden"
    >
      <HStack space="sm" alignItems="flex-start" position="relative" flex={1}>
        {/* Sol tarafta dairesel ikon */}
        <Box
          width={20}
          height={20}
          borderRadius="$full"
          bg={config.iconBgColor}
          alignItems="center"
          justifyContent="center"
          style={{
            shadowColor: config.iconRingColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 4,
          }}
          mt={2}
        >
          <IconComponent
            width={10}
            height={10}
            color={config.iconColor}
          />
        </Box>

        {/* Orta kısım - Mesaj metni (açıklama alt satırda devam eder) */}
        <Box flex={1} minWidth={0}>
          <Text
            fontSize="$xs"
            fontWeight="$medium"
            color={config.textColor}
            numberOfLines={1}
          >
            {title}
          </Text>
          {description && (
            <Text
              fontSize="$xs"
              color={config.textColor}
              opacity={0.8}
              flexWrap="wrap"
            >
              {description}
            </Text>
          )}
        </Box>

        {/* Sağ üstte kapatma butonu */}
        <Pressable
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X
            width={10}
            height={10}
            color="#9CA3AF"
          />
        </Pressable>
      </HStack>

      {/* Alt kısım - Progress bar */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        height={2}
        bg={config.progressBgColor}
        overflow="hidden"
      >
        <Animated.View
          style={{
            height: '100%',
            width: progressWidth,
            backgroundColor: config.progressColor,
          }}
        />
      </Box>
    </Box>
  );
};
