import React, { useState, useCallback } from 'react';
import { ActivityIndicator } from 'react-native';
import { View } from 'react-native-safe-area-context';
import { ScrollView, VStack, HStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import {
  CheckIcon,
  CircleStackIcon,
  PresentationChartBarIcon,
  GiftIcon,
} from 'react-native-heroicons/outline';
import { CheckIcon as CheckIconSolid } from 'react-native-heroicons/solid';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { useEventDetail, useJoinEvent, useEventRequirements } from '@/src/features/events/api/hooks';
import { useTranslation } from '@/src/hooks/useTranslation';

type BrandEventsDetailScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandEventsDetailScreen'>;
type BrandEventsDetailScreenRouteProp = RouteProp<CatalogStackParamList, 'BrandEventsDetailScreen'>;

const BrandEventsDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandEventsDetailScreenNavigationProp>();
  const route = useRoute<BrandEventsDetailScreenRouteProp>();
  const bottomInset = useSafeAreaValues('bottom');
  const { t } = useTranslation('catalog');

  const eventId = route.params?.eventId;

  // API hooks - eventId yoksa query'ler disabled olacak
  const { data: eventDetail, isLoading: isLoadingEvent, refetch: refetchEvent } = useEventDetail(eventId || '');
  const { data: requirements, isLoading: isLoadingRequirements } = useEventRequirements(eventId || undefined);
  const joinEventMutation = useJoinEvent();

  const [isJoining, setIsJoining] = useState(false);

  const handleJoinEvent = useCallback(async () => {
    if (isJoining || eventDetail?.isJoined) return;
    setIsJoining(true);
    try {
      await joinEventMutation.mutateAsync(eventId);
      await refetchEvent();
    } catch (error) {
      console.error('[BrandEventsDetailScreen] Error joining event:', error);
    } finally {
      setIsJoining(false);
    }
  }, [joinEventMutation, eventId, refetchEvent, eventDetail?.isJoined, isJoining]);

  const getButtonStyle = (isJoined: boolean) => {
    if (isJoined) {
      return {
        bg: 'rgba(215, 215, 215, 0.8)',
        borderColor: '#ADADAD',
        textColor: '#000000',
        text: t('brandEventDetail.joined'),
                    icon: 'check' as const, // CheckIcon kullanılacak
      };
    }
    return {
      bg: '#E8FF6B',
      borderColor: '#D8FF08',
      textColor: '#000000',
      text: t('brandEventDetail.join'),
      icon: null,
    };
  };

  const buttonStyle = getButtonStyle(eventDetail?.isJoined || false);

  const renderRequirementItem = (requirement: any) => {
    const hasProgress = requirement.progress && requirement.total;
    const progressPercentage = hasProgress ? (requirement.progress.current / requirement.progress.total) * 100 : 0;
    const isCompleted = requirement.completed || false;
    
    return (
      <Box
        key={requirement.id}
        bg={isDark ? '#1A1A1A' : '#FDFDFD'}
        borderWidth={1}
        borderColor="#FDFDFD"
        borderRadius={0}
        p="$3"
        mb="$1"
      >
        <HStack alignItems="center" space="md">
          {/* Icon */}
          <Box
            width={36}
            height={36}
            bg="#B9B9B9"
            borderRadius={4}
            alignItems="center"
            justifyContent="center"
          >
            {requirement.icon === 'check' ? (
              <CheckIconSolid width={16} height={16} color="#FFFFFF" />
            ) : (
              <CircleStackIcon width={16} height={16} color="#FFFFFF" />
            )}
          </Box>

          {/* Content */}
          <VStack flex={1} space="xs">
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={10}
              fontWeight="$semibold"
            >
              {requirement.title}
            </Text>
            
            {/* Progress Bar */}
            <Box
              width="100%"
              height={6}
              bg="#EBEBEB"
              borderRadius={10}
              overflow="hidden"
            >
              <Box
                width={`${progressPercentage}%`}
                height="100%"
                bg="#686868"
                borderRadius={10}
              />
            </Box>
          </VStack>

          {/* Progress Circle */}
          <Box
            width={14}
            height={14}
            bg={isCompleted ? '#4CAF50' : '#686868'}
            borderRadius={7}
          />
        </HStack>
      </Box>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title={t('brandEventDetail.title')}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          flex={1}
          contentContainerStyle={{ paddingBottom: bottomInset }}
        >
          {isLoadingEvent ? (
            <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
              <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
                {t('brandEventDetail.loading')}
              </Text>
            </VStack>
          ) : !eventDetail ? (
            <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
              <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
                {t('brandEventDetail.eventNotFound')}
              </Text>
            </VStack>
          ) : (
            <VStack space="md" p="$4">
            {/* Event Header Card */}
            <Box
              bg={isDark ? '#1A1A1A' : '#FDFDFD'}
              borderWidth={1}
              borderColor="#E9E9E9"
              borderRadius={10}
              overflow="hidden"
            >
              {/* Event Info */}
              <HStack p="$3" alignItems="center" space="md">
                {/* Event Image */}
                {eventDetail.bannerImage && (
                  <Box
                    width={52}
                    height={52}
                    borderRadius={5}
                    bg="rgba(0, 0, 0, 0.2)"
                    alignItems="center"
                    justifyContent="center"
                    overflow="hidden"
                  >
                    <Image
                      source={toImageSource(eventDetail.bannerImage)}
                      alt={eventDetail.title}
                      style={{ width: 52, height: 52 }}
                      resizeMode="cover"
                    />
                  </Box>
                )}

                {/* Event Title */}
                <VStack flex={1}>
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize={12}
                    fontWeight="$bold"
                  >
                    {eventDetail.title}
                  </Text>
                </VStack>

                {/* Action Button */}
                <Pressable
                  onPress={handleJoinEvent}
                  disabled={isJoining || eventDetail.isJoined}
                  bg={buttonStyle.bg}
                  borderWidth={1}
                  borderColor={buttonStyle.borderColor}
                  borderRadius={5}
                  px="$5"
                  py="$1.5"
                  alignItems="center"
                  justifyContent="center"
                  minWidth={74}
                  height={24}
                  opacity={isJoining ? 0.6 : 1}
                >
                  {isJoining ? (
                    <ActivityIndicator size="small" color={buttonStyle.textColor} />
                  ) : (
                    <HStack alignItems="center" space="xs">
                      {buttonStyle.icon && buttonStyle.icon === 'check' && (
                        <CheckIconSolid width={12} height={12} color={buttonStyle.textColor} />
                      )}
                      <Text
                        color={buttonStyle.textColor}
                        fontSize={10}
                        fontWeight="$bold"
                      >
                        {buttonStyle.text}
                      </Text>
                    </HStack>
                  )}
                </Pressable>
              </HStack>

              {/* Description */}
              {eventDetail.description && (
                <Box
                  bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                  borderTopWidth={1}
                  borderColor="#E9E9E9"
                  p="$3"
                >
                  <Text
                    color="#838383"
                    fontSize={10}
                    fontWeight="$bold"
                    mb="$1"
                  >
                    {t('brandEventDetail.description')}
                  </Text>
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize={9}
                    lineHeight={11}
                  >
                    {eventDetail.description}
                  </Text>
                </Box>
              )}
            </Box>

            {/* Statistics and Rewards Row */}
            <HStack space="md">
            {/* Statistics Card */}
            <Box
              flex={1}
              bg={isDark ? '#1A1A1A' : '#FDFDFD'}
              borderWidth={1}
              borderColor="#E9E9E9"
              borderRadius={10}
              p="$3"
            >
              <HStack alignItems="center" space="sm" mb="$2">
                <Box
                  width={28}
                  height={28}
                  bg="#FFFFFF"
                  borderWidth={1}
                  borderColor="#B9B9B9"
                  borderRadius={20}
                  alignItems="center"
                  justifyContent="center"
                >
                  <PresentationChartBarIcon width={16} height={16} color="#B9B9B9" />
                </Box>
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={11}
                  fontWeight="$bold"
                >
                  {t('brandEventDetail.statistics')}
                </Text>
              </HStack>

              <Box
                width="100%"
                height={1}
                bg="#E9E9E9"
                mb="$2"
              />

              <VStack space="xs">
                <HStack alignItems="center" space="sm">
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize={16}
                    fontWeight="$bold"
                  >
                    {typeof eventDetail.participants === 'number' 
                      ? eventDetail.participants 
                      : Array.isArray(eventDetail.participants) 
                        ? eventDetail.participants.length 
                        : 0}
                  </Text>
                  <Text
                    color="#B9B9B9"
                    fontSize={10}
                    fontWeight="$medium"
                  >
                    {t('brandEventDetail.participants')}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Rewards Card */}
            {eventDetail.rewards && eventDetail.rewards.length > 0 && (
              <Box
                flex={1}
                bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                borderWidth={1}
                borderColor="#E9E9E9"
                borderRadius={10}
                p="$3"
              >
                <HStack alignItems="center" space="sm" mb="$2">
                  <Box
                    width={28}
                    height={28}
                    bg="#FFFFFF"
                    borderWidth={1}
                    borderColor="#B9B9B9"
                    borderRadius={20}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <GiftIcon width={16} height={16} color="#B9B9B9" />
                  </Box>
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize={11}
                    fontWeight="$bold"
                  >
                    {t('brandEventDetail.rewards')}
                  </Text>
                </HStack>

                <Box
                  width="100%"
                  height={1}
                  bg="#E9E9E9"
                  mb="$2"
                />

                <HStack space="xs" alignItems="center">
                  {eventDetail.rewards[0].image && (
                    <Image
                      source={toImageSource(eventDetail.rewards[0].image)}
                      alt="Badge"
                      style={{ width: 26, height: 20 }}
                      resizeMode="cover"
                    />
                  )}
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize={10}
                    fontWeight="$bold"
                  >
                    {eventDetail.rewards[0].title}
                  </Text>
                </HStack>
              </Box>
            )}
            </HStack>

            {/* Requirements Section */}
            {isLoadingRequirements ? (
              <VStack alignItems="center" py="$4">
                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                <Text mt="$2" fontSize={12} color="$textLight500" $dark-color="$textDark400">
                  {t('brandEventDetail.loadingRequirements')}
                </Text>
              </VStack>
            ) : requirements && requirements.requirements && requirements.requirements.length > 0 ? (
              <VStack space="sm">
                {requirements.requirements.map((req) => {
                  const requirementWithIcon = {
                    id: req.id,
                    title: req.title || req.description || t('brandEventDetail.requirementFallback'),
                    description: req.description,
                    completed: req.completed || false,
                    progress: req.progress ? { current: req.progress.current, total: req.progress.total } : { current: 0, total: 1 },
                    icon: (req.completed ? 'check' : 'circle') as any,
                  };
                  return renderRequirementItem(requirementWithIcon);
                })}
              </VStack>
            ) : (
              <VStack alignItems="center" py="$4">
                <Text fontSize={12} color="$textLight500" $dark-color="$textDark400">
                  {t('brandEventDetail.noRequirements')}
                </Text>
              </VStack>
            )}
            </VStack>
          )}
        </ScrollView>
      </VStack>
    </View>
  );
};

export default BrandEventsDetailScreen;
