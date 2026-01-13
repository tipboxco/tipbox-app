import React from 'react';
import { VStack, HStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { X } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';

interface BadgeBottomSheetProps {
  data: SeeAllReward;
  onClose: () => void;
}

const BadgeBottomSheet: React.FC<BadgeBottomSheetProps> = React.memo(({ data, onClose }) => {
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
      <VStack space="xs" w="100%" mb="$4">
        <Box
          w="100%"
          h={5}
          bg={isDark ? '#E0E0E0' : '#E0E0E0'}
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
          color={isDark ? '#666666' : '#666666'}
          fontSize={12}
          textAlign="center"
          fontWeight="$normal"
        >
          {`${data.completed || 0}/${data.task || 1}`}
        </Text>
      </VStack>

      {/* Follow Ladder Button */}
      <Pressable
        bg="#C2E607"
        borderRadius={12}
        h={52}
        w="100%"
        px="$4"
        onPress={onClose}
        alignItems="center"
        justifyContent="center"
        mt="$2"
      >
        <Text
          color="#000000"
          fontSize={16}
          fontWeight="$bold"
        >
          Follow Ladder
        </Text>
      </Pressable>
    </VStack>
  );
}, (prevProps, nextProps) => {
  // PERFORMANCE FIX: Only re-render if data actually changed
  // Prevents unnecessary re-renders that slow down modal opening
  return (
    prevProps.data?.id === nextProps.data?.id &&
    prevProps.data?.title === nextProps.data?.title &&
    prevProps.data?.completed === nextProps.data?.completed &&
    prevProps.data?.task === nextProps.data?.task &&
    prevProps.data?.isUnlocked === nextProps.data?.isUnlocked
  );
});

BadgeBottomSheet.displayName = 'BadgeBottomSheet';

export default BadgeBottomSheet;
