import React, { useState } from 'react';
import { ScrollView, VStack, HStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import { mock_survey_tabs, mock_surveys, mockBenchmarkData, mockTipsAndTricksData, mockPostData, mockEvents } from '@/src/mock/catalog/brandSurveys';
import SurveyCard from '../components/SurveyCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import PostCard from '@/src/components/PostCards/PostCard';
import EventCard from '../components/EventCard';
import BrandInfoCard from '../components/BrandInfoCard';

type SurveyScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'SurveyScreen'>;

const SurveyScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SurveyScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState('Anketler');

  const renderContent = () => {
    console.log('Active tab:', activeTab); // Debug için
    
    switch (activeTab) {
      case 'Trendler':
        return (
          <VStack space="md">
            <BenchmarkPostCard data={mockBenchmarkData} />
            <TipsAndTricksPostCard data={mockTipsAndTricksData} />
            <PostCard data={mockPostData} />
          </VStack>
        );
      
      case 'Etkinlikler':
        return (
          <VStack>
            {mockEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => navigation.navigate('BrandEventsDetailScreen')}
              />
            ))}
          </VStack>
        );
      
      case 'Anketler':
      default:
        return (
          <VStack>
            {mock_surveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                onPress={() => console.log('Survey action:', survey.status)}
              />
            ))}
          </VStack>
        );
    }
  };


  return (
    <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Header */}
      <Header
        title="Anketler & Oyunlaştırmalar"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView flex={1}>
        <VStack space="md" p="$4">
          {/* Top Cards */}
          <BrandInfoCard
            onNotificationPress={() => console.log('Notification pressed')}
            onHistoryPress={() => navigation.navigate('BrandHistoryScreen')}
          />

          {/* Tabs */}
          <HStack justifyContent="space-around">
            {mock_survey_tabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.name)}
                flex={1}
              >
                <VStack alignItems="center" space="xs">
                  <Text
                    color={activeTab === tab.name ? (isDark ? '#FFFFFF' : '#000000') : '#8C8C8C'}
                    fontSize={14}
                    fontWeight="$bold"
                  >
                    {tab.name}
                  </Text>
                  {activeTab === tab.name && (
                    <Box
                      width="100%"
                      height={2}
                      bg="#000000"
                      borderRadius={1}
                    />
                  )}
                </VStack>
              </Pressable>
            ))}
          </HStack>


          {/* Content */}
          {renderContent()}
        </VStack>
      </ScrollView>
    </VStack>
  );
};

export default SurveyScreen;
