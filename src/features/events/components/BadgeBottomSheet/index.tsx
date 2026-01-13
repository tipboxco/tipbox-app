import React from 'react';
import { VStack, HStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { X } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';

interface BadgeBottomSheetProps {
  data: SeeAllReward;
  onClose: () => void;
}

export const BadgeBottomSheet: React.FC<BadgeBottomSheetProps> = ({ data, onClose }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Progress percentage hesapla
  const progressPercentage = data.task && data.task > 0 
    ? ((data.completed || 0) / data.task) * 100 
    : 0;
  const isCompleted = data.isUnlocked || progressPercentage >= 100;

  // Açıklama metni oluştur
  const descriptionText = data.task && data.task > 0
    ? `"${data.title}" rozetini kazanmak için en az ${data.task} gönderi paylaşmalısın.`
    : data.description || '';

  return (
    <VStack space="lg" p="$6" minHeight={500}>
      {/* Header - X Button and Title */}
      <HStack alignItems="center" justifyContent="space-between" mb="$2">
        {/* X Close Button */}
        <Pressable
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        
        {/* Title - Centered */}
        <Box flex={1} alignItems="center">
          <Text
            fontSize={24}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
            textAlign="center"
          >
            {data.title}
          </Text>
        </Box>
        
        {/* Spacer for centering */}
        <Box width={24} />
      </HStack>

      {/* Description Text */}
      {descriptionText && (
        <Text
          fontSize={14}
          color={isDark ? '#CCCCCC' : '#666666'}
          textAlign="center"
          mb="$6"
          px="$4"
        >
          {descriptionText}
        </Text>
      )}

      {/* Badge Image - Large, Centered */}
      <Box
        width={250}
        height={250}
        justifyContent="center"
        alignItems="center"
        alignSelf="center"
        mb="$6"
      >
        <Image
          source={data.image || require('@/assets/defaultImages/default-badge.png')}
          alt={data.title}
          style={{
            width: 250,
            height: 250,
          }}
          resizeMode="contain"
        />
      </Box>

      {/* Progress Bar */}
      <VStack space="xs" w="100%">
        <Box
          w="100%"
          h={5}
          bg={isDark ? '#333333' : '#E0E0E0'}
          borderRadius={10}
          overflow="hidden"
        >
          <Box
            w={`${Math.min(progressPercentage, 100)}%`}
            h="100%"
            bg={isCompleted ? '#0C7A24' : '#686868'}
          />
        </Box>
        <Text
          color={isCompleted ? '#0C7A24' : (isDark ? '#CCCCCC' : '#666666')}
          fontSize={12}
          textAlign="center"
          fontWeight={isCompleted ? '$bold' : '$normal'}
        >
          {isCompleted ? 'Completed' : `${data.completed || 0}/${data.task || 1}`}
        </Text>
      </VStack>
    </VStack>
  );
};

export default BadgeBottomSheet;
