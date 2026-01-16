import React from 'react';
import { VStack, HStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { X } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { useEventBadgeDetail } from '../../api/hooks';
import { toImageSource } from '@/src/utils';

interface BadgeBottomSheetProps {
  data: SeeAllReward;
  onClose: () => void;
  hideFollowLadder?: boolean; // Eğer true ise "Follow Ladder" butonu gösterilmez (completed badge'ler için)
  eventId: string;
  badgeId?: string;
}

const BadgeBottomSheet: React.FC<BadgeBottomSheetProps> = React.memo(({ 
  data, 
  onClose, 
  hideFollowLadder = false,
  eventId,
  badgeId,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // API'den badge detail verisini al
  const { 
    data: badgeDetailData, 
    isLoading, 
    error 
  } = useEventBadgeDetail(
    eventId, 
    badgeId || data?.id || ''
  );

  // API verisi kullanılabilirse onu kullan, yoksa props'tan gelen data'yı kullan (fallback)
  const displayData = badgeDetailData || data;

  // Progress percentage hesapla
  const progressPercentage = badgeDetailData
    ? badgeDetailData.userProgress.progressPercentage
    : (data.task && data.task > 0 
        ? ((data.completed || 0) / data.task) * 100 
        : 0);
  
  const isCompleted = badgeDetailData
    ? badgeDetailData.userProgress.isCompleted
    : (data.isUnlocked || progressPercentage >= 100);

  // Açıklama metni oluştur
  const descriptionText = badgeDetailData
    ? badgeDetailData.description
    : (data.task && data.task > 0 && !isCompleted
        ? `"${data.title}" rozetini kazanmak için en az ${data.task} gönderi paylaşmalısın.`
        : data.description || '');

  // Badge image source
  const imageSource = badgeDetailData?.imageUrl
    ? toImageSource(badgeDetailData.imageUrl)
    : (data.image || require('@/assets/defaultImages/default-badge.png'));

  // Progress değerleri
  const currentProgress = badgeDetailData
    ? badgeDetailData.userProgress.current
    : (data.completed || 0);
  
  const targetProgress = badgeDetailData
    ? badgeDetailData.userProgress.target
    : (data.task || 1);

  if (isLoading) {
    return (
      <VStack space="lg" p="$6" minHeight={500} alignItems="center" justifyContent="center">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
          Loading badge details...
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack space="lg" p="$6" minHeight={500} alignItems="center" justifyContent="center">
        <Text fontSize={14} color="$error500" textAlign="center">
          Badge detayları yüklenirken bir hata oluştu
        </Text>
        <Pressable mt="$4" onPress={onClose} bg="#C2E607" borderRadius={12} h={52} px="$6">
          <Text color="#000000" fontWeight="$bold">Kapat</Text>
        </Pressable>
      </VStack>
    );
  }

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
            {badgeDetailData?.title || data.title}
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
          source={imageSource}
          alt={badgeDetailData?.title || data.title}
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
          {isCompleted && badgeDetailData?.userProgress.completedAt
            ? `Completed - ${new Date(badgeDetailData.userProgress.completedAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}`
            : isCompleted
              ? 'Completed'
              : `${currentProgress}/${targetProgress}`
          }
        </Text>
      </VStack>

      {/* Follow Ladder Button - Sadece completed değilse ve hideFollowLadder false ise göster */}
      {!hideFollowLadder && !isCompleted && (
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
      )}
      
      {/* Completed Badge Message - Eğer completed ise veya hideFollowLadder true ise göster */}
      {(hideFollowLadder || isCompleted) && (
        <Box
          bg={isDark ? '#1A1A1A' : '#F5F5F5'}
          borderRadius={12}
          h={52}
          w="100%"
          px="$4"
          alignItems="center"
          justifyContent="center"
          mt="$2"
        >
          <Text
            color={isDark ? '#0C7A24' : '#0C7A24'}
            fontSize={16}
            fontWeight="$bold"
          >
            ✓ Completed
          </Text>
        </Box>
      )}
    </VStack>
  );
}, (prevProps, nextProps) => {
  // PERFORMANCE FIX: Only re-render if data actually changed
  // Prevents unnecessary re-renders that slow down modal opening
  return (
    prevProps.data?.id === nextProps.data?.id &&
    prevProps.badgeId === nextProps.badgeId &&
    prevProps.eventId === nextProps.eventId &&
    prevProps.hideFollowLadder === nextProps.hideFollowLadder
  );
});

BadgeBottomSheet.displayName = 'BadgeBottomSheet';

export default BadgeBottomSheet;
