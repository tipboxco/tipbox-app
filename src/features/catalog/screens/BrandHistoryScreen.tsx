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
import { useSafeAreaValues } from '@/src/utils';

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

  const renderSkeletonCard = () => (
    <Box
      width={61}
      alignItems="center"
    >
      <Box
        width={48}
        height={48}
        bg="#ECECEC"
        borderWidth={1}
        borderColor="#BFBFBF"
        borderRadius={6}
      />
      <Box
        width="100%"
        height={14}
        bg="#DDDDDD"
        borderRadius={2}
        opacity={0.6}
      />
    </Box>
  );


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

          {/* Recent Activity Section */}
          <Box
            bg={isDark ? '#1A1A1A' : '#FDFDFD'}
            borderWidth={1}
            borderColor="#E9E9E9"
            borderRadius={5}
            p="$4"
          >
            <VStack space="md" alignItems="center">
              <HStack space="md" alignItems="center">
                {renderSkeletonCard()}
                {renderSkeletonCard()}
                {renderSkeletonCard()}
                {renderSkeletonCard()}
              </HStack>
              <Text
                color="#8C8C8C"
                fontSize={8}
                fontWeight="$normal"
                textAlign="center"
              >
                See All
              </Text>
            </VStack>
          </Box>

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
