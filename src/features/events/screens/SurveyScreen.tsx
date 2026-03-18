import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Image,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventStackParamList } from '../EventNavigator';
import { useSurveyQuestions, useSubmitSurvey } from '../api/hooks';
import { useTranslation } from '@/src/hooks/useTranslation';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from 'react-native-heroicons/solid';
import type { SurveyBadgeEarned } from '../types/survey.types';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

type SurveyScreenNavigationProp = NativeStackNavigationProp<EventStackParamList, 'SurveyScreen'>;
type SurveyScreenRouteProp = RouteProp<EventStackParamList, 'SurveyScreen'>;

/** Radio button circle */
const RadioCircle: React.FC<{ selected: boolean; isDark: boolean }> = ({ selected, isDark }) => (
  <View
    style={[
      styles.radio,
      {
        borderColor: selected
          ? isDark ? '#000000' : '#6B7040'
          : isDark ? '#555' : '#D1D1D1',
        backgroundColor: selected
          ? isDark ? '#000000' : '#6B7040'
          : 'transparent',
      },
    ]}
  >
    {selected && <View style={styles.radioInner} />}
  </View>
);

const SurveyScreen: React.FC = () => {
  const { t } = useTranslation('events');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SurveyScreenNavigationProp>();
  const route = useRoute<SurveyScreenRouteProp>();
  const { brandId, surveyId, title } = route.params;

  // Fetch questions
  const { data: surveyData, isLoading, error } = useSurveyQuestions(brandId, surveyId);

  // Submit mutation
  const submitSurvey = useSubmitSurvey();

  // PagerView ref
  const pagerRef = useRef<PagerView>(null);
  const scrollProgress = useSharedValue(0);

  // Local state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [showSuccess, setShowSuccess] = useState(false);
  const [result, setResult] = useState<{
    pointsAwarded: number;
    badgesEarned: SurveyBadgeEarned[];
  } | null>(null);

  const questions = useMemo(
    () => surveyData?.questions?.sort((a, b) => a.order - b.order) ?? [],
    [surveyData?.questions]
  );

  // Only count questions that have options (answerable)
  const answerableQuestions = useMemo(
    () => questions.filter((q) => q.options.length > 0),
    [questions]
  );

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const hasOptions = currentQuestion ? currentQuestion.options.length > 0 : false;
  const selectedOptionId = currentQuestion ? answers.get(currentQuestion.id) : undefined;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Check if all answerable questions have been answered
  const allAnswerableAnswered = useMemo(() => {
    return answerableQuestions.every((q) => answers.has(q.id));
  }, [answerableQuestions, answers]);

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (!currentQuestion) return;
      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(currentQuestion.id, optionId);
        return next;
      });
    },
    [currentQuestion]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      pagerRef.current?.setPage(currentIndex + 1);
    }
  }, [currentIndex, totalQuestions]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      pagerRef.current?.setPage(currentIndex - 1);
    }
  }, [currentIndex]);

  // PagerView scroll handler - realtime progress tracking
  const handlePageScroll = useCallback(
    (e: any) => {
      'worklet';
      const { position, offset } = e.nativeEvent;
      scrollProgress.value = position + offset;
    },
    [scrollProgress]
  );

  // PagerView page selected handler
  const handlePageSelected = useCallback(
    (e: any) => {
      const position = e.nativeEvent.position;
      scrollProgress.value = withTiming(position, { duration: 0 });
      setCurrentIndex(position);
    },
    [scrollProgress]
  );

  const handleComplete = useCallback(() => {
    const answersArray = Array.from(answers.entries()).map(([questionId, optionId]) => ({
      questionId,
      answerId: optionId,
    }));

    if (answersArray.length === 0) return;

    submitSurvey.mutate(
      { brandId, surveyId, answers: answersArray },
      {
        onSuccess: (data) => {
          setResult({
            pointsAwarded: data.pointsAwarded,
            badgesEarned: data.badgesEarned,
          });
          setShowSuccess(true);
        },
      }
    );
  }, [answers, brandId, surveyId, submitSurvey]);

  // Can proceed: either has selected an option, or question has no options (skip)
  const canProceed = selectedOptionId || !hasOptions;

  // Animated progress bar width
  const progressBarStyle = useAnimatedStyle(() => {
    const pct = totalQuestions > 0
      ? ((scrollProgress.value + 1) / totalQuestions) * 100
      : 0;
    return { width: `${Math.min(pct, 100)}%` };
  });

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#FAFAFA' }]}>
        <SurveyHeader title={title} isDark={isDark} onBack={() => navigation.goBack()} />
        <Box flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator size="large" color={isDark ? '#C2E607' : '#C2E607'} />
          <Text color={isDark ? '#999' : '#666'} fontSize={14} mt="$3">
            {t('survey.loading')}
          </Text>
        </Box>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !surveyData || questions.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#FAFAFA' }]}>
        <SurveyHeader title={title} isDark={isDark} onBack={() => navigation.goBack()} />
        <Box flex={1} alignItems="center" justifyContent="center" px="$4">
          <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={16} textAlign="center">
            {t('survey.submitError')}
          </Text>
        </Box>
      </SafeAreaView>
    );
  }

  // Success state
  if (showSuccess && result) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#FAFAFA' }]}>
        <SurveyHeader title={title} isDark={isDark} onBack={() => navigation.goBack()} />
        <Box flex={1} alignItems="center" justifyContent="center" px="$6">
          <CheckCircleSolidIcon width={64} height={64} color="#4ADE80" />
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={22}
            fontWeight="$bold"
            mt="$4"
            textAlign="center"
          >
            {t('survey.success')}
          </Text>
          {result.pointsAwarded > 0 && (
            <Box
              bg={isDark ? '#1A2E00' : '#F0FFF4'}
              borderRadius={12}
              px="$5"
              py="$3"
              mt="$4"
            >
              <Text
                color={isDark ? '#C2E607' : '#16A34A'}
                fontSize={20}
                fontWeight="$bold"
                textAlign="center"
              >
                {t('survey.pointsEarned', { points: result.pointsAwarded })}
              </Text>
            </Box>
          )}
          {result.badgesEarned.length > 0 && (
            <VStack mt="$5" space="sm" alignItems="center">
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={16}
                fontWeight="$bold"
              >
                {t('survey.badgesEarned')}
              </Text>
              <HStack space="md" mt="$2" flexWrap="wrap" justifyContent="center">
                {result.badgesEarned.map((badge) => (
                  <VStack key={badge.id} alignItems="center" space="xs" width={80}>
                    <Image
                      source={{ uri: badge.image }}
                      alt={badge.name}
                      width={56}
                      height={56}
                      borderRadius={28}
                    />
                    <Text
                      color={isDark ? '#FFFFFF' : '#000000'}
                      fontSize={11}
                      fontWeight="$medium"
                      textAlign="center"
                      numberOfLines={2}
                    >
                      {badge.name}
                    </Text>
                  </VStack>
                ))}
              </HStack>
            </VStack>
          )}
          <Pressable
            mt="$8"
            bg="#C2E607"
            borderRadius={12}
            px="$8"
            py="$3.5"
            onPress={() => navigation.goBack()}
          >
            <Text color="#000000" fontSize={16} fontWeight="$bold">
              {t('survey.back')}
            </Text>
          </Pressable>
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#FAFAFA' }]}>
      {/* Header */}
      <SurveyHeader title={title} isDark={isDark} onBack={() => navigation.goBack()} />

      {/* Progress bar row - outside PagerView so it doesn't swipe */}
      <View style={styles.progressContainer}>
        <HStack alignItems="center" space="sm" px="$4">
          <Box flex={1} height={8} bg={isDark ? '#333' : '#E5E5E5'} borderRadius={4} overflow="hidden">
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: '#C2E607' },
                progressBarStyle,
              ]}
            />
          </Box>
          <Text color={isDark ? '#888' : '#999'} fontSize={13} fontWeight="$medium">
            {t('survey.questionOf', { current: currentIndex + 1, total: totalQuestions })}
          </Text>
        </HStack>
      </View>

      {/* Swipeable question pages */}
      <AnimatedPagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageScroll={handlePageScroll}
        onPageSelected={handlePageSelected}
        overdrag={false}
      >
        {questions.map((question, index) => {
          const qSelectedOptionId = answers.get(question.id);
          const qHasOptions = question.options.length > 0;

          return (
            <ScrollView
              key={question.id}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
              nestedScrollEnabled
            >
              {/* Question Card */}
              <Box
                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                borderRadius={12}
                borderWidth={1}
                borderColor={isDark ? '#2A2A2A' : '#ECECEC'}
                px="$4"
                pt="$4"
                pb="$3"
                mx="$4"
                mt="$3"
              >
                {/* Question text */}
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={16}
                  fontWeight="$normal"
                  lineHeight={24}
                  mb="$3"
                >
                  {question.text}
                </Text>

                {/* Previous question link */}
                {index > 0 && (
                  <Pressable onPress={() => pagerRef.current?.setPage(index - 1)} py="$1">
                    <HStack alignItems="center" space="xs">
                      <ChevronLeftIcon width={14} height={14} color={isDark ? '#888' : '#888'} />
                      <Text color={isDark ? '#888' : '#888'} fontSize={13}>
                        {t('survey.previousQuestion')}
                      </Text>
                    </HStack>
                  </Pressable>
                )}
              </Box>

              {/* Options */}
              <VStack space="sm" px="$4" mt="$4" mb="$6">
                {qHasOptions ? (
                  question.options.map((option) => {
                    const isSelected = qSelectedOptionId === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => {
                          setAnswers((prev) => {
                            const next = new Map(prev);
                            next.set(question.id, option.id);
                            return next;
                          });
                        }}
                      >
                        <Box
                          bg={isSelected ? '#C2E607' : isDark ? '#1A1A1A' : '#FFFFFF'}
                          borderWidth={1}
                          borderColor={isSelected ? '#C2E607' : isDark ? '#2A2A2A' : '#ECECEC'}
                          borderRadius={12}
                          px="$4"
                          py="$4"
                        >
                          <HStack alignItems="center" space="md">
                            <RadioCircle selected={isSelected} isDark={isDark} />
                            <Text
                              color={isSelected ? '#000000' : isDark ? '#FFFFFF' : '#000000'}
                              fontSize={15}
                              fontWeight={isSelected ? '$medium' : '$normal'}
                              flex={1}
                            >
                              {option.text}
                            </Text>
                          </HStack>
                        </Box>
                      </Pressable>
                    );
                  })
                ) : (
                  <Box
                    bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                    borderWidth={1}
                    borderColor={isDark ? '#2A2A2A' : '#ECECEC'}
                    borderRadius={12}
                    px="$4"
                    py="$6"
                    alignItems="center"
                  >
                    <Text color={isDark ? '#666' : '#999'} fontSize={14}>
                      {t('survey.noOptions')}
                    </Text>
                  </Box>
                )}
              </VStack>
            </ScrollView>
          );
        })}
      </AnimatedPagerView>

      {/* Bottom button */}
      <Box px="$4" pb="$4" pt="$2">
        {/* Submit error */}
        {submitSurvey.isError && (
          <Box bg="#FEE2E2" borderRadius={8} px="$3" py="$2" mb="$3">
            <Text color="#DC2626" fontSize={13} textAlign="center">
              {t('survey.submitError')}
            </Text>
          </Box>
        )}

        {isLastQuestion ? (
          <Pressable
            bg={canProceed ? '#C2E607' : isDark ? '#333' : '#E5E5E5'}
            borderRadius={12}
            py="$3.5"
            alignItems="center"
            onPress={handleComplete}
            disabled={!canProceed || submitSurvey.isPending}
            opacity={canProceed && !submitSurvey.isPending ? 1 : 0.5}
          >
            {submitSurvey.isPending ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text
                color={canProceed ? '#000000' : isDark ? '#666' : '#999'}
                fontSize={16}
                fontWeight="$bold"
              >
                {t('survey.complete')}
              </Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            bg={canProceed ? '#C2E607' : isDark ? '#333' : '#E5E5E5'}
            borderRadius={12}
            py="$3.5"
            alignItems="center"
            onPress={handleNext}
            disabled={!canProceed}
            opacity={canProceed ? 1 : 0.5}
          >
            <Text
              color={canProceed ? '#000000' : isDark ? '#666' : '#999'}
              fontSize={16}
              fontWeight="$bold"
            >
              {t('survey.next')}
            </Text>
          </Pressable>
        )}
      </Box>
    </SafeAreaView>
  );
};

/** Simple header with back button + centered title */
const SurveyHeader: React.FC<{
  title: string;
  isDark: boolean;
  onBack: () => void;
}> = ({ title, isDark, onBack }) => (
  <HStack
    alignItems="center"
    px="$4"
    py="$2.5"
  >
    <Pressable
      onPress={onBack}
      width={36}
      height={36}
      alignItems="center"
      justifyContent="center"
    >
      <ChevronLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
    </Pressable>
    <Text
      flex={1}
      color={isDark ? '#FFFFFF' : '#000000'}
      fontSize={17}
      fontWeight="$bold"
      textAlign="center"
      mr={36}
    >
      {title}
    </Text>
  </HStack>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  pagerView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});

export default SurveyScreen;
