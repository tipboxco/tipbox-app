import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, VStack, HStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { ActivityIndicator } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { Header } from '@/src/components/Header';
import {
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
} from 'react-native-heroicons/outline';
import BrandInfoCard from '../components/BrandInfoCard';
import PointsHistoryCard from '../components/PointsHistoryCard';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { useBrandHistory } from '../api/hooks';

type BrandHistoryScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandHistoryScreen'>;
type BrandHistoryScreenRouteProp = RouteProp<CatalogStackParamList, 'BrandHistoryScreen'>;

const BrandHistoryScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandHistoryScreenNavigationProp>();
  const route = useRoute<BrandHistoryScreenRouteProp>();
  const bottomInset = useSafeAreaValues('bottom');
  
  const { brandId } = route.params;

  // API hook
  const { data: brandHistory, isLoading, error, refetch } = useBrandHistory(brandId);
  
  // 🔍 DEBUG: Brand history durumunu logla
  React.useEffect(() => {
    console.log('[BrandHistoryScreen] 📋 Brand History Durumu:', {
      brandId,
      isLoading,
      hasError: !!error,
      hasData: !!brandHistory,
      data: brandHistory ? {
        brandId: brandHistory.brandId,
        name: brandHistory.name,
        totalPoints: brandHistory.totalPoints,
        stats: brandHistory.stats,
        badgesCount: brandHistory.badges?.length || 0,
        pointsHistoryCount: brandHistory.pointsHistory?.length || 0,
      } : null,
    });
    
    if (error) {
      console.error('[BrandHistoryScreen] ❌ Error:', error);
    }
    
    if (brandHistory) {
      console.log('[BrandHistoryScreen] ✅ Data loaded:', {
        brandId: brandHistory.brandId,
        name: brandHistory.name,
        totalPoints: brandHistory.totalPoints,
        stats: brandHistory.stats,
        badges: brandHistory.badges,
        pointsHistory: brandHistory.pointsHistory,
      });
    }
  }, [brandId, isLoading, error, brandHistory]);


  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title="Brand History"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          flex={1}
          contentContainerStyle={{ paddingBottom: bottomInset }}
        >
          {isLoading ? (
            <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
              <Text mt="$4" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                Loading brand history...
              </Text>
            </VStack>
          ) : error || !brandHistory ? (
            <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
              <Text fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                Error loading brand history
              </Text>
            </VStack>
          ) : (
            <VStack space="md" p="$4">
            {/* Brand Info Card */}
            <BrandInfoCard
              brandId={brandId}
              onNotificationPress={() => console.log('Notification pressed')}
              onHistoryPress={() => navigation.navigate('BrandHistoryScreen', { brandId })}
              showPoints={true}
              points={brandHistory.totalPoints || 0}
            />

          {/* Stats Row */}
          <HStack space="md">
            {/* Surveys */}
            <Pressable
              onPress={() => navigation.navigate('BrandSurveyListScreen', { brandId })}
              flex={1}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Box
                bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                borderWidth={1}
                borderColor="#E9E9E9"
                borderRadius={10}
                p="$3"
                alignItems="center"
              >
              <VStack alignItems="center" space="xs">
                <DocumentTextIcon width={24} height={24} color="#A1A1A1" />
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$xs"
                  fontWeight="$bold"
                  textAlign="center"
                >
                  {brandHistory.stats?.surveys || 0}
                </Text>
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$xs"
                  fontWeight="$bold"
                  textAlign="center"
                >
                  Survey
                </Text>
              </VStack>
              </Box>
            </Pressable>

            {/* Shares */}
            <Pressable
              onPress={() => navigation.navigate('BrandPostListScreen', { brandId })}
              flex={1}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Box
                bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                borderWidth={1}
                borderColor="#E9E9E9"
                borderRadius={10}
                p="$3"
                alignItems="center"
              >
              <VStack alignItems="center" space="xs">
                <ChatBubbleLeftIcon width={24} height={24} color="#A1A1A1" />
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$xs"
                  fontWeight="$bold"
                  textAlign="center"
                >
                  {brandHistory.stats?.shares || 0}
                </Text>
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$xs"
                  fontWeight="$bold"
                  textAlign="center"
                >
                  Share
                </Text>
              </VStack>
              </Box>
            </Pressable>

            {/* Events */}
            <Pressable
              onPress={() => navigation.navigate('BrandEventsScreen', { brandId })}
              flex={1}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Box
                bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                borderWidth={1}
                borderColor="#E9E9E9"
                borderRadius={10}
                p="$3"
                alignItems="center"
              >
              <VStack alignItems="center" space="xs">
                <CalendarIcon width={24} height={24} color="#A1A1A1" />
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$xs"
                  fontWeight="$bold"
                  textAlign="center"
                >
                  {brandHistory.stats?.events || 0}
                </Text>
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$xs"
                  fontWeight="$bold"
                  textAlign="center"
                >
                  Event
                </Text>
              </VStack>
              </Box>
            </Pressable>
          </HStack>

          {/* Badges Section */}
          {brandHistory.badges && brandHistory.badges.length > 0 && (
            <Box
              bg={isDark ? '#1A1A1A' : '#FDFDFD'}
              borderWidth={1}
              borderColor="#E9E9E9"
              borderRadius={5}
              p="$4"
            >
              <Box
                borderRadius={5}
                p="$3.5"
                h={130}
              >
                <HStack space="md" justifyContent="space-between">
                  {brandHistory.badges.slice(0, 4).map((badge) => (
                    <VStack key={badge.id} space="xs" alignItems="center" flex={1}>
                      <Box
                        w={70}
                        h={70}
                        borderRadius={5}
                        borderWidth={0}
                        overflow="hidden"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Image
                          source={toImageSource(badge.image) || require('@/assets/defaultImages/default-badge.png')}
                          alt={badge.title}
                          w={60}
                          h={60}
                          resizeMode="contain"
                        />
                      </Box>
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$xs"
                        fontWeight="$bold"
                        textAlign="center"
                      >
                        {badge.title}
                      </Text>
                    </VStack>
                  ))}
                </HStack>
                <Pressable 
                  onPress={() => {
                    // RewardsBadgesScreen'e navigate et (Events stack içinde)
                    navigationService.navigateNested(TAB_ROUTES.EVENTS, 'RewardsBadges', undefined);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize="$xs"
                    textAlign="center"
                    mt="$4"
                    fontWeight="$regular"
                  >
                    See More Collections
                  </Text>
                </Pressable>
              </Box>
            </Box>
          )}

            {/* Points History Section */}
            <VStack space="sm">
              <Text
                color="#9D9D9D"
                fontSize="$sm"
                fontWeight="$bold"
              >
                Points History
              </Text>
              {brandHistory.pointsHistory && brandHistory.pointsHistory.length > 0 ? (
                brandHistory.pointsHistory.map((item) => (
                  <PointsHistoryCard key={item.id} item={item} />
                ))
              ) : (
                <Text fontSize="$xs" color="$textLight500" $dark-color="$textDark400" textAlign="center" py="$4">
                  No points history found
                </Text>
              )}
            </VStack>
          </VStack>
          )}
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default BrandHistoryScreen;
