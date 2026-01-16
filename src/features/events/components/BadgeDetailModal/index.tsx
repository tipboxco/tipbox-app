import React from 'react';
import { Dimensions, ActivityIndicator } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Pressable,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventsStackParamList } from '../../navigation';
import { useEventBadgeDetail } from '../../api/hooks';
import { toImageSource } from '@/src/utils';

const { width, height } = Dimensions.get('window');

type BadgeDetailModalNavigationProp = NativeStackNavigationProp<EventsStackParamList>;

interface BadgeDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  data: SeeAllReward | null;
  eventId: string;
  badgeId?: string;
}

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = React.memo(({
  isVisible,
  onClose,
  data,
  eventId,
  badgeId,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BadgeDetailModalNavigationProp>();

  // API'den badge detail verisini al
  const { 
    data: badgeDetailData, 
    isLoading, 
    error 
  } = useEventBadgeDetail(
    eventId, 
    badgeId || data?.id || ''
  );

  // Handle View Achievement button press
  const handleViewAchievement = () => {
    onClose();
    // Navigate to RewardsBadgesScreen
    navigation.navigate('RewardsBadges', { eventId });
  };

  // PERFORMANCE FIX: Don't render modal content when not visible
  // This prevents unnecessary rendering that slows down modal opening
  if (!isVisible) return null;

  // API verisi kullanılabilirse onu kullan, yoksa props'tan gelen data'yı kullan (fallback)
  const displayData = badgeDetailData || data;
  
  // Hiç veri yoksa modal'ı gösterme
  if (!displayData && !isLoading) return null;

  return (
    <Modal 
      style={{ flex: 1 }} 
      isOpen={isVisible} 
      onClose={onClose} 
      size="md"
    >
      <ModalBackdrop />
      <ModalContent
        bg={isDark ? '#1A1A1A' : '#FFFFFF'}
        borderRadius={16}
        maxWidth={width * 0.85}
        maxHeight={height * 0.6}
        alignSelf="center"
        justifyContent="center"
      >
        {isLoading ? (
          <VStack alignItems="center" py="$8" flex={1} justifyContent="center" px="$6">
            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
              Loading badge details...
            </Text>
          </VStack>
        ) : error ? (
          <VStack alignItems="center" py="$8" flex={1} justifyContent="center" px="$6">
            <Text fontSize={14} color="$error500" textAlign="center">
              Badge detayları yüklenirken bir hata oluştu
            </Text>
            <Button mt="$4" onPress={onClose} bg="#C2E607">
              <ButtonText color="#000000">Kapat</ButtonText>
            </Button>
          </VStack>
        ) : (
          <>
            <ModalHeader
              borderBottomWidth={0}
              mb="$5"
            >
              <VStack space="md" alignItems="center" w="100%" px="$4" pt="$4">
                {/* Badge Title */}
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={16}
                  fontWeight="$bold"
                  textAlign="center"
                >
                  {badgeDetailData?.title || displayData?.title}
                </Text>

                {/* Instruction Text - API'den gelen description */}
                <Text
                  color={isDark ? '#CCCCCC' : '#000000'}
                  fontSize={12}
                  textAlign="center"
                  px="$2"
                >
                  {badgeDetailData?.description || displayData?.description}
                </Text>

                {/* Badge Image */}
                <Image
                  source={
                    badgeDetailData?.imageUrl 
                      ? toImageSource(badgeDetailData.imageUrl)
                      : (displayData?.image || require('@/assets/defaultImages/default-badge.png'))
                  }
                  alt={badgeDetailData?.title || displayData?.title}
                  width={180}
                  height={180}
                />
              </VStack>
            </ModalHeader>

            <ModalBody pt="$0" pb="$4">
              <VStack space="md" px={'$4'}>
                <Box
                  w="100%"
                  h={5}
                  bg={isDark ? '$backgroundDark700' : '#E0E0E0'}
                  borderRadius={10}
                  overflow="hidden"
                >
                  <Box
                    w={`${
                      badgeDetailData 
                        ? badgeDetailData.userProgress.progressPercentage
                        : ((displayData?.completed || 0) / (displayData?.task || 1)) * 100
                    }%`}
                    h="100%"
                    bg={
                      badgeDetailData 
                        ? (badgeDetailData.userProgress.isCompleted ? '#0C7A24' : '#686868')
                        : (displayData?.isUnlocked ? '#0C7A24' : '#686868')
                    }
                  />
                </Box>
                <Text
                  color={isDark ? '$textDark400' : '#797979'}
                  fontSize={9}
                  textAlign="center"
                >
                  {badgeDetailData ? (
                    badgeDetailData.userProgress.isCompleted 
                      ? badgeDetailData.userProgress.completedAt
                        ? `Completed - ${new Date(badgeDetailData.userProgress.completedAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}`
                        : 'Completed'
                      : `${badgeDetailData.userProgress.current}/${badgeDetailData.userProgress.target}`
                  ) : (
                    displayData?.isUnlocked 
                      ? 'Completed' 
                      : `${displayData?.completed || 0}/${displayData?.task || 1}`
                  )}
                </Text>
              </VStack>
            </ModalBody>

            <ModalFooter borderTopWidth={0} pt="$0">
              <VStack space="sm" w="100%" px="$4" pb="$4">
                <Button
                  bg="#C2E607"
                  borderRadius={8}
                  h={48}
                  onPress={handleViewAchievement}
                >
                  <ButtonText
                    color="#000000"
                    fontSize={12}
                    fontWeight="$bold"
                  >
                    View Detail
                  </ButtonText>
                </Button>
              </VStack>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}, (prevProps, nextProps) => {
  // PERFORMANCE FIX: Only re-render if visibility or data actually changed
  // Prevents unnecessary re-renders that slow down modal opening
  return (
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.data?.id === nextProps.data?.id &&
    prevProps.badgeId === nextProps.badgeId &&
    prevProps.eventId === nextProps.eventId
  );
});

BadgeDetailModal.displayName = 'BadgeDetailModal';

export default BadgeDetailModal;
