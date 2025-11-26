import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import SurveyCard from '../components/SurveyCard';
import { mockBrandSurveys } from '@/src/mock/catalog/brandSurveys';
import { useSafeAreaValues } from '@/src/utils';

type BrandSurveyListScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandSurveyListScreen'>;

const BrandSurveyListScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandSurveyListScreenNavigationProp>();
  const bottomInset = useSafeAreaValues('bottom');

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title="Anketler"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          flex={1}
          contentContainerStyle={{ paddingBottom: bottomInset }}
        >
          <VStack p="$4">
            {mockBrandSurveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                onPress={() => console.log('Survey action:', survey.status)}
              />
            ))}
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default BrandSurveyListScreen;
