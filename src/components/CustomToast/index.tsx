import React from 'react';
import { Box, Text, HStack, Icon, Pressable } from '@gluestack-ui/themed';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';

interface CustomToastProps {
  id: string;
  title: string;
  description?: string;
  action: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

/**
 * CustomToast Component
 * 
 * Gluestack UI toast sisteminde kullanılan custom toast component'i.
 * Success, error, warning ve info action'larını destekler.
 */
export const CustomToast: React.FC<CustomToastProps> = ({
  id,
  title,
  description,
  action,
  onClose,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Action'a göre icon ve renk belirle
  const getActionConfig = () => {
    switch (action) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: '#10B981', // green-500
          bgColor: isDark ? '#064E3B' : '#D1FAE5', // green-50 / green-900
          borderColor: isDark ? '#047857' : '#10B981', // green-500 / green-700
          textColor: isDark ? '#D1FAE5' : '#065F46', // green-900 / green-50
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: '#EF4444', // red-500
          bgColor: isDark ? '#7F1D1D' : '#FEE2E2', // red-50 / red-900
          borderColor: isDark ? '#991B1B' : '#EF4444', // red-500 / red-700
          textColor: isDark ? '#FEE2E2' : '#991B1B', // red-900 / red-50
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconColor: '#F59E0B', // amber-500
          bgColor: isDark ? '#78350F' : '#FEF3C7', // amber-50 / amber-900
          borderColor: isDark ? '#92400E' : '#F59E0B', // amber-500 / amber-700
          textColor: isDark ? '#FEF3C7' : '#92400E', // amber-900 / amber-50
        };
      case 'info':
      default:
        return {
          icon: AlertCircle,
          iconColor: '#3B82F6', // blue-500
          bgColor: isDark ? '#1E3A8A' : '#DBEAFE', // blue-50 / blue-900
          borderColor: isDark ? '#1E40AF' : '#3B82F6', // blue-500 / blue-700
          textColor: isDark ? '#DBEAFE' : '#1E40AF', // blue-900 / blue-50
        };
    }
  };

  const config = getActionConfig();
  const IconComponent = config.icon;

  return (
    <Pressable
      onPress={onClose}
      style={{
        width: '100%',
        maxWidth: 400,
      }}
    >
      <Box
        bg={config.bgColor}
        borderWidth={1}
        borderColor={config.borderColor}
        borderRadius="$lg"
        p="$4"
        shadowColor="$black"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.1}
        shadowRadius={4}
        elevation={5}
      >
        <HStack space="md" alignItems="center">
          <Icon
            as={IconComponent}
            color={config.iconColor}
            size="lg"
          />
          <Box flex={1}>
            <Text
              fontSize="$sm"
              fontWeight="$semibold"
              color={config.textColor}
              mb={description ? '$1' : 0}
            >
              {title}
            </Text>
            {description && (
              <Text
                fontSize="$xs"
                color={config.textColor}
                opacity={0.9}
              >
                {description}
              </Text>
            )}
          </Box>
        </HStack>
      </Box>
    </Pressable>
  );
};
