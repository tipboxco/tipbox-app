import React, { useState, useMemo, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, ActivityIndicator } from 'react-native';
import { VStack, HStack, Text, Box, Pressable, Image } from '@gluestack-ui/themed';
import { ChevronRightIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BrandStackParamList } from '../BrandNavigator';
import { Header } from '@/src/components/Header';
import { mock_survey_tabs } from '@/src/mock/catalog/brandSurveys';
import SurveyCard from '../components/SurveyCard';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { useBrandSurveys, useBrandHistory } from '../api/hooks';
import type { Survey } from '../types';
import { useTranslation } from '@/src/hooks/useTranslation';

type SurveyScreenNavigationProp = NativeStackNavigationProp<BrandStackParamList, 'SurveyScreen'>;
type SurveyScreenRouteProp = {
  key: string;
  name: string;
  params: {
    brandId: string;
  };
};

const SurveyScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SurveyScreenNavigationProp>();
  const route = useRoute<SurveyScreenRouteProp>();
  const brandId = route.params?.brandId;
  const [activeTab, setActiveTab] = useState('Polls');
  const bottomInset = useSafeAreaValues('bottom');
  const { t } = useTranslation('catalog');

  // Surveys (Polls) API hook
  const {
    data: surveysData,
    fetchNextPage: fetchNextSurveysPage,
    hasNextPage: hasNextSurveysPage,
    isFetchingNextPage: isFetchingNextSurveysPage,
    isLoading: isSurveysLoading,
    error: surveysError,
  } = useBrandSurveys(brandId, 20);

  // Brand history (points + badges for Badges tab and top card)
  const { data: brandHistory } = useBrandHistory(brandId);

  const surveys = useMemo(() => {
    if (!surveysData?.pages) return [];
    const allItems = surveysData.pages.flatMap((page) => page.items ?? []);
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    );
    return uniqueItems;
  }, [surveysData]);

  const handleLoadMoreSurveys = useCallback(() => {
    if (hasNextSurveysPage && !isFetchingNextSurveysPage) {
      fetchNextSurveysPage();
    }
  }, [hasNextSurveysPage, isFetchingNextSurveysPage, fetchNextSurveysPage]);

  const handleSurveyPress = useCallback(
    (item: Survey) => {
      if (!brandId) return;
      navigation.navigate('SurveyParticipationScreen', {
        surveyId: item.id,
        brandId,
      });
    },
    [brandId, navigation]
  );

  const renderSurveyItem = useCallback(
    ({ item }: { item: Survey }) => {
      return (
        <SurveyCard
          survey={item}
          onPress={() => handleSurveyPress(item)}
        />
      );
    },
    [handleSurveyPress]
  );

  const renderSurveyFooter = useCallback(() => {
    if (!isFetchingNextSurveysPage) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [isFetchingNextSurveysPage, isDark]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Badges':
        if (!brandHistory?.badges?.length) {
          return (
            <VStack py={20} alignItems="center">
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                {t('survey.noBadgesYet')}
              </Text>
            </VStack>
          );
        }
        return (
          <FlatList
            data={brandHistory.badges}
            numColumns={2}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: bottomInset,
            }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: badge }) => (
              <Pressable
                flex={1}
                minW="45%"
                bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                borderWidth={1}
                borderColor={isDark ? '#333333' : '#E9E9E9'}
                borderRadius={10}
                p="$4"
                alignItems="center"
              >
                <Box w={60} h={60} borderRadius={8} overflow="hidden" alignItems="center" justifyContent="center" bg={isDark ? '#2A2A2A' : '#F0F0F0'}>
                  <Image
                    source={toImageSource(badge.image) || require('@/assets/defaultImages/default-badge.png')}
                    alt={badge.title}
                    style={{ width: 56, height: 56 }}
                    resizeMode="contain"
                  />
                </Box>
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$xs"
                  fontWeight="$bold"
                  textAlign="center"
                  mt="$2"
                  numberOfLines={2}
                >
                  {badge.title}
                </Text>
              </Pressable>
            )}
          />
        );

      case 'Polls':
      default:
        if (isSurveysLoading && !surveysData) {
          return (
            <VStack py={20} alignItems="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
                {t('survey.loadingSurveys')}
              </Text>
            </VStack>
          );
        }

        if (surveysError) {
          return (
            <VStack py={20} alignItems="center">
              <Text color="#CE4A4A" fontSize="$sm">
                {t('survey.errorLoadingSurveys')}: {surveysError.message}
              </Text>
            </VStack>
          );
        }

        if (surveys.length === 0) {
          return (
            <VStack py={20} alignItems="center">
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                {t('survey.noSurveysYet')}
              </Text>
            </VStack>
          );
        }

        return (
          <FlatList
            data={surveys}
            renderItem={renderSurveyItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: bottomInset,
            }}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMoreSurveys}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderSurveyFooter}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            updateCellsBatchingPeriod={50}
          />
        );
    }
  };


  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title={t('survey.title')}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        {/* Tab Bar */}
        <VStack pt='$4' bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
          <HStack borderBottomWidth={1} borderColor={isDark ? '#333333' : '#E9E9E9'}>
            {mock_survey_tabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.name)}
                flex={1}
                alignItems="center"
                pb="$1"
                position="relative"
              >
                <VStack alignItems="center" space="xs">
                  <Text
                    color={activeTab === tab.name ? (isDark ? '#FFFFFF' : '#000000') : '#8C8C8C'}
                    fontSize="$sm"
                    fontWeight="$bold"
                  >
                    {tab.name}
                  </Text>
                </VStack>
                <Box
                  position="absolute"
                  bottom={-1}
                  left="25%"
                  height={2}
                  width="50%"
                  borderRadius={999}
                  bg={activeTab === tab.name ? (isDark ? '#FFFFFF' : '#000000') : 'transparent'}
                />
              </Pressable>
            ))}
          </HStack>
        </VStack>

        {/* Marka Geçmişim kartı (Figma: Apple Marka Geçmişim + 1000 Points) */}
        <VStack px="$4" pt="$4" pb="$2">
          <Pressable
            onPress={() => brandId && navigation.navigate('BrandHistoryScreen', { brandId })}
            bg={isDark ? '#1A1A1A' : '#FDFDFD'}
            borderWidth={1}
            borderColor={isDark ? '#333333' : '#E9E9E9'}
            borderRadius={10}
            p="$3"
            flexDirection="row"
            alignItems="center"
          >
            <Box w={52} h={52} borderRadius={26} bg={isDark ? '#444444' : '#DDDDDD'} overflow="hidden" alignItems="center" justifyContent="center">
              <Image
                source={require('@/assets/avatar/default-useravatar.png')}
                alt="User"
                style={{ width: 52, height: 52 }}
                resizeMode="cover"
              />
            </Box>
            <VStack flex={1} ml="$3">
              <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={12} fontWeight="$bold" numberOfLines={1}>
                {brandHistory?.name ?? '—'} {t('survey.brandHistory')}
              </Text>
              <Text color="#9B9B9B" fontSize={12} fontWeight="$semibold">
                {brandHistory?.totalPoints ?? 0} {t('survey.points')}
              </Text>
            </VStack>
            <ChevronRightIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </VStack>

        {/* Content */}
        <VStack flex={1}>
          <Box flex={1} px="$4">
            {renderContent()}
          </Box>
        </VStack>
      </VStack>
    </SafeAreaView>
  );
};

export default SurveyScreen;
