import React, { useState } from 'react';
import { VStack, HStack, Text, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

// Android için layout animasyonlarını etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface RewardDetail {
  date: string;
  name: string;
  amount: number;
}

export interface RewardCardProps {
  id: string;
  title: string;
  amount: number;
  claimed: boolean;
  details?: RewardDetail[];
  onClaim?: (id: string) => void;
}

export const RewardCard: React.FC<RewardCardProps> = ({
  id,
  title,
  amount,
  claimed,
  details = [],
  onClaim,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('wallet');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    if (claimed) return;
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleIconPress = (e: any) => {
    e.stopPropagation();
    // Icon'a tıklandığında accordion'u toggle et
    handleToggle();
  };

  return (
    <Box
      bg="$backgroundLight0"
      $dark-bg="$backgroundDark800"
      borderWidth={1}
      borderColor="#E9E9E9"
      $dark-borderColor="$borderDark600"
      rounded={5}
      overflow="hidden"
    >
      {/* Header Section - Always visible */}
      <Pressable onPress={handleToggle} disabled={claimed}>
        <Box p="$4">
          <HStack alignItems="center" justifyContent="space-between">
            <HStack alignItems="center" space="md" flex={1}>
              <Box
                w={42}
                h={42}
                rounded={6}
                bg="#D9D9D9"
                $dark-bg="$backgroundDark700"
              />
              <VStack>
                <Text fontSize={12} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
                  {title}
                </Text>
              </VStack>
            </HStack>
            <HStack alignItems="center" space="sm">
              <Text fontSize={12} fontWeight="$bold" color="#3CA241" $dark-color="#3CA241">
                {amount} TIPS
              </Text>
              {!claimed && (
                <Pressable
                  onPress={handleIconPress}
                  w={20}
                  h={20}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Feather 
                    name="chevron-down" 
                    size={20} 
                    color={isDark ? '#FFFFFF' : '#000000'}
                    style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                  />
                </Pressable>
              )}
            </HStack>
          </HStack>
        </Box>
      </Pressable>

      {/* Expanded Content Section */}
      {isExpanded && !claimed && details.length > 0 && (
        <Box px="$4" pb="$4">
          <VStack space="sm" mt="$2">
            {/* Recents Header */}
            <Text fontSize={9} fontWeight="$semibold" color="#7B7B7B" $dark-color="$textDark400">
              {t('rewardCard.recents')}
            </Text>
            
            {/* Details List */}
            <VStack space="xs">
              {details.map((detail, index) => (
                <HStack key={index} justifyContent="space-between" alignItems="center">
                  <Text fontSize={9} fontWeight="$medium" color="#B9B9B9" $dark-color="$textDark400">
                    {detail.date} - {detail.name}
                  </Text>
                  <Text fontSize={9} fontWeight="$medium" color="#B9B9B9" $dark-color="$textDark400">
                    {detail.amount} TIPS
                  </Text>
                </HStack>
              ))}
            </VStack>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

