import React, { useMemo } from 'react';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, VStack, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import SurveyCard from '../components/SurveyCard';
import { useSafeAreaValues } from '@/src/utils';
import { useBrandSurveys } from '../api/hooks';
import type { Survey } from '../types';

type BrandSurveyListScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandSurveyListScreen'>;
type BrandSurveyListScreenRouteProp = RouteProp<CatalogStackParamList, 'BrandSurveyListScreen'>;

const BrandSurveyListScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandSurveyListScreenNavigationProp>();
  const route = useRoute<BrandSurveyListScreenRouteProp>();
  const bottomInset = useSafeAreaValues('bottom');
  
  const { brandId } = route.params;

  // API hook
  const { data: surveysData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useBrandSurveys(brandId, 20);

  // Transform API surveys data
  const surveys = useMemo(() => {
    if (!surveysData?.pages) {
      return [];
    }
    const allSurveys: Survey[] = [];
    surveysData.pages.forEach((page) => {
      if (page.items) {
        allSurveys.push(...page.items);
      }
    });
    return allSurveys;
  }, [surveysData]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title="Surveys"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          flex={1}
          contentContainerStyle={{ paddingBottom: bottomInset }}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
            if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          scrollEventThrottle={400}
        >
          <VStack p="$4">
            {isLoading ? (
              <VStack alignItems="center" py="$8">
                <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                <Text mt="$4" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                  Loading surveys...
                </Text>
              </VStack>
            ) : surveys.length === 0 ? (
              <VStack alignItems="center" py="$8">
                <Text fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                  No surveys found
                </Text>
              </VStack>
            ) : (
              <>
                {surveys.map((survey) => (
                  <SurveyCard
                    key={survey.id}
                    survey={survey}
                    onPress={() => console.log('Survey action:', survey.status)}
                  />
                ))}
                {isFetchingNextPage && (
                  <VStack alignItems="center" py="$4">
                    <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                  </VStack>
                )}
              </>
            )}
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default BrandSurveyListScreen;
