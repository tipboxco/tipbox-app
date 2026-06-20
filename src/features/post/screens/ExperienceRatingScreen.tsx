import React, { useCallback, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView } from '@gluestack-ui/themed';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Header } from '@/src/components/Header';
import {
  ExperienceComposer,
  type ExperienceComposerHandle,
} from '../components/ExperienceComposer';
import type { PostStackParamList } from '../navigation';

type ExperienceRatingNavigationProp =
  NativeStackNavigationProp<PostStackParamList>;
type ExperienceRatingRouteProp = RouteProp<
  PostStackParamList,
  'ExperienceRating'
>;

/**
 * Deneyim puanlama (AI split) ekranı — onboarding adımı.
 * CreatePostScreen'de "Devam Et" ile açılır; ekranda yalnızca ürün preview + segmentli
 * puanlama kartları görünür. Paylaş ile gönderi oluşturulur. Geri çıkış serbesttir (onay yok).
 */
export const ExperienceRatingScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ExperienceRatingNavigationProp>();
  const route = useRoute<ExperienceRatingRouteProp>();
  const { t } = useTranslation('post');
  const draft = route.params?.draft;

  const composerRef = useRef<ExperienceComposerHandle>(null);
  const [composerState, setComposerState] = useState<{
    canShare: boolean;
    isLoading: boolean;
  }>({ canShare: true, isLoading: false });

  const handleStateChange = useCallback(
    (s: {
      canShare: boolean;
      isLoading: boolean;
      readyToPost: boolean;
      step: 'form' | 'rate';
    }) => setComposerState({ canShare: s.canShare, isLoading: s.isLoading }),
    []
  );

  const bgColor = isDark ? '#1A1A1A' : '#FAFAFA';
  const isShareEnabled = composerState.canShare;
  const isShareLoading = composerState.isLoading;

  if (!draft) {
    // Güvenlik: draft yoksa geri dön
    navigation.goBack();
    return null;
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: bgColor }}
    >
      <Box flex={1}>
        <Header
          title={t('create.experience.rateStepTitle', 'Deneyimini puanla')}
          leftAction='back'
          onLeftActionPress={() => navigation.goBack()}
          rightButton={{
            text: t('create.header.share'),
            backgroundColor:
              isShareEnabled || isShareLoading ? '#D0F205' : '#EDEDED',
            borderWidth: 1,
            borderColor:
              isShareEnabled || isShareLoading ? '#B8CC04' : '#B1B1B1',
            textColor: isShareEnabled || isShareLoading ? '#111111' : '#B1B1B1',
            fontSize: 11,
            borderRadius: 25,
            paddingX: 10,
            paddingY: 10,
            onPress: () => composerRef.current?.submit(),
            loading: isShareLoading,
          }}
        />
        <ScrollView
          flex={1}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
        >
          <ExperienceComposer
            ref={composerRef}
            initialStep='rate'
            initialSnippetId={draft.experienceSnippetId}
            initialExperienceOption={draft.experienceOption}
            productContext={{
              id: draft.productId,
              name: draft.productTitle,
              subName: draft.productSubName,
              image: draft.productImage,
            }}
            initialValues={{
              selectedProduct: {
                id: draft.productId,
                name: draft.productTitle,
                image: draft.productImage,
                description: draft.productSubName,
              },
              step1Duration: draft.step1Duration,
              selectedCondition: draft.selectedCondition,
              selectedFrequency: draft.selectedFrequency,
              experienceText: draft.experienceText,
              selectedImages: draft.selectedImages,
            }}
            onStateChange={handleStateChange}
          />
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
};
