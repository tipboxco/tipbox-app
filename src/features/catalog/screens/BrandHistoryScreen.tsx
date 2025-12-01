import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, VStack, HStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import BrandInfoCard from '../components/BrandInfoCard';
import PointsHistoryCard from '../components/PointsHistoryCard';
import { useSafeAreaValues, toImageSource } from '@/src/utils';

type BrandHistoryScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandHistoryScreen'>;

const BrandHistoryScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandHistoryScreenNavigationProp>();
  const bottomInset = useSafeAreaValues('bottom');

  // Mock data for brand history
  const brandData = {
    name: 'Apple',
    category: 'Technology',
    totalPoints: 2405,
    stats: {
      surveys: 27,
      shares: 127,
      events: 12,
    },
    badges: [
      { id: '1', title: 'Apple Expert', image: require('@/assets/badges/badge_01.png') },
      { id: '2', title: 'Tech Enthusiast', image: require('@/assets/badges/badge_02.png') },
      { id: '3', title: 'Product Reviewer', image: require('@/assets/badges/badge_03.png') },
      { id: '4', title: 'Community Leader', image: require('@/assets/badges/badge_04.png') },
    ],
    pointsHistory: [
      { id: '1', title: 'Puan Kazanılan Anket Adı', points: 250 },
      { id: '2', title: 'Puan Kazanılan Anket Adı', points: 250 },
      { id: '3', title: 'Puan Kazanılan Anket Adı', points: 250 },
      { id: '4', title: 'Puan Kazanılan Anket Adı', points: 250 },
      { id: '5', title: 'Puan Kazanılan Anket Adı', points: 250 },
      { id: '6', title: 'Puan Kazanılan Anket Adı', points: 250 },
      { id: '7', title: 'Puan Kazanılan Anket Adı', points: 250 },
    ],
  };


  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title="Marka Geçmişim"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          flex={1}
          contentContainerStyle={{ paddingBottom: bottomInset }}
        >
          <VStack space="md" p="$4">
          {/* Brand Info Card */}
          <BrandInfoCard
            onNotificationPress={() => console.log('Notification pressed')}
            onHistoryPress={() => navigation.navigate('BrandHistoryScreen')}
            showPoints={true}
            points={brandData.totalPoints}
          />

          {/* Stats Row */}
          <HStack space="md">
            {/* Surveys */}
            <Pressable
              onPress={() => navigation.navigate('BrandSurveyListScreen')}
              flex={1}
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
                <Feather name="file-text" size={24} color="#A1A1A1" />
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={12}
                  fontWeight="$bold"
                  textAlign="center"
                >
                  {brandData.stats.surveys}
                </Text>
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={12}
                  fontWeight="$bold"
                  textAlign="center"
                >
                  Anket
                </Text>
              </VStack>
              </Box>
            </Pressable>

            {/* Shares */}
            <Pressable
              onPress={() => navigation.navigate('BrandPostListScreen')}
              flex={1}
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
                <Feather name="message-circle" size={24} color="#A1A1A1" />
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={12}
                  fontWeight="$bold"
                  textAlign="center"
                >
                  {brandData.stats.shares}
                </Text>
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={12}
                  fontWeight="$bold"
                  textAlign="center"
                >
                  Paylaşım
                </Text>
              </VStack>
              </Box>
            </Pressable>

            {/* Events */}
            <Pressable
              onPress={() => navigation.navigate('BrandEventsScreen')}
              flex={1}
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
                <Feather name="calendar" size={24} color="#A1A1A1" />
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={12}
                  fontWeight="$bold"
                  textAlign="center"
                >
                  {brandData.stats.events}
                </Text>
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={12}
                  fontWeight="$bold"
                  textAlign="center"
                >
                  Etkinlik
                </Text>
              </VStack>
              </Box>
            </Pressable>
          </HStack>

          {/* Badges Section */}
          {brandData.badges && brandData.badges.length > 0 && (
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
                  {brandData.badges.slice(0, 4).map((badge) => (
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
                          source={typeof badge.image === 'string' ? toImageSource(badge.image) || require('@/assets/badges/badge_01.png') : badge.image}
                          alt={badge.title}
                          w={60}
                          h={60}
                          resizeMode="contain"
                        />
                      </Box>
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize={8}
                        fontWeight="$bold"
                        textAlign="center"
                      >
                        {badge.title}
                      </Text>
                    </VStack>
                  ))}
                </HStack>
                <Pressable onPress={() => console.log('See More Badges')}>
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize={8}
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
                fontSize={14}
                fontWeight="$bold"
              >
                Puan Geçmişi
              </Text>
              {brandData.pointsHistory.map((item) => (
                <PointsHistoryCard key={item.id} item={item} />
              ))}
            </VStack>
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default BrandHistoryScreen;
