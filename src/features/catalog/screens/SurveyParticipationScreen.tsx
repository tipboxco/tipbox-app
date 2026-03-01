import React, { useState, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, VStack, HStack, Text, Box, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { BrandStackParamList } from '../BrandNavigator';
import { Header } from '@/src/components/Header';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';
import { useSafeAreaValues } from '@/src/utils';
import { useSurveyQuestions, useSubmitSurveyAnswer } from '../api/hooks';
import type { SurveyQuestion, SurveyAnswerOption } from '../types';

type SurveyParticipationScreenNavigationProp = NativeStackNavigationProp<BrandStackParamList, 'SurveyParticipationScreen'>;
type SurveyParticipationScreenRouteProp = RouteProp<BrandStackParamList, 'SurveyParticipationScreen'>;

const SurveyParticipationScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SurveyParticipationScreenNavigationProp>();
  const route = useRoute<SurveyParticipationScreenRouteProp>();
  const bottomInset = useSafeAreaValues('bottom');

  const { surveyId, brandId } = route.params;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  // API hooks
  const { data: questionsData, isLoading, error } = useSurveyQuestions(surveyId, brandId);
  const submitAnswerMutation = useSubmitSurveyAnswer();

  const questions = questionsData?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const handleAnswerSelect = useCallback((answerId: string) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answerId,
    }));
  }, [currentQuestion]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleNextQuestion = useCallback(async () => {
    if (!currentQuestion) return;

    const selectedAnswerId = selectedAnswers[currentQuestion.id];
    if (!selectedAnswerId) {
      // Kullanıcıya uyarı göster
      return;
    }

    // Cevabı gönder
    try {
      await submitAnswerMutation.mutateAsync({
        brandId,
        surveyId,
        questionId: currentQuestion.id,
        answerId: selectedAnswerId,
      });

      // Son soru değilse bir sonraki soruya geç
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        // Anket tamamlandı, geri dön veya sonuç ekranına git
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  }, [brandId, currentQuestion, currentQuestionIndex, totalQuestions, selectedAnswers, surveyId, submitAnswerMutation, navigation]);

  const selectedAnswerId = currentQuestion ? selectedAnswers[currentQuestion.id] : null;
  const canGoToPrevious = currentQuestionIndex > 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} justifyContent="center" alignItems="center">
          <Text color={isDark ? '$textDark400' : '$textLight500'}>Loading survey...</Text>
        </VStack>
      </SafeAreaView>
    );
  }

  if (error || !currentQuestion) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
          <Header
            title="Anket"
            showBackButton={true}
            onBackPress={() => navigation.goBack()}
          />
          <VStack flex={1} justifyContent="center" alignItems="center" px="$4">
            <Text color={isDark ? '$textDark400' : '$textLight500'}>
              {error ? 'Error loading survey' : 'No questions found'}
            </Text>
          </VStack>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title="Anket"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          flex={1}
          contentContainerStyle={{ paddingBottom: bottomInset + 20 }}
        >
          <VStack px="$4" pt="$4" space="md">
            {/* Progress Bar */}
            <VStack space="xs">
              <HStack justifyContent="space-between" alignItems="center">
                <Box
                  flex={1}
                  height={6}
                  bg={isDark ? '#2A2A2A' : '#EBEBEB'}
                  borderRadius={10}
                  overflow="hidden"
                  mr="$2"
                >
                  <Box
                    width={`${progress}%`}
                    height="100%"
                    bg="#BEDA36"
                    borderRadius={10}
                  />
                </Box>
                <Text
                  fontSize="$sm"
                  fontWeight="$semibold"
                  color={isDark ? '$textDark400' : '$textLight600'}
                >
                  {currentQuestionIndex + 1}/{totalQuestions}
                </Text>
              </HStack>
            </VStack>

            {/* Question */}
            <Box
              bg={isDark ? '$backgroundDark800' : '#FFFFFF'}
              borderWidth={1}
              borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
              borderRadius={10}
              p="$4"
              mt="$2"
            >
              <Text
                fontSize="$md"
                fontWeight="$bold"
                color={isDark ? '$textDark50' : '#000000'}
                lineHeight={24}
              >
                {currentQuestion.text}
              </Text>
            </Box>

            {/* Previous Question Link */}
            {canGoToPrevious && (
              <Pressable onPress={handlePreviousQuestion}>
                <HStack alignItems="center" space="xs">
                  <ChevronLeftIcon width={16} height={16} color={isDark ? '#BEDA36' : '#BEDA36'} />
                  <Text
                    fontSize="$sm"
                    fontWeight="$medium"
                    color="#BEDA36"
                  >
                    Önceki Soruya Dön
                  </Text>
                </HStack>
              </Pressable>
            )}

            {/* Answer Options */}
            <VStack space="sm" mt="$2">
              {currentQuestion.options.map((option: SurveyAnswerOption) => {
                const isSelected = selectedAnswerId === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => handleAnswerSelect(option.id)}
                  >
                    <Box
                      bg={isSelected
                        ? '#BEDA36'
                        : (isDark ? '$backgroundDark800' : '#FFFFFF')
                      }
                      borderWidth={1}
                      borderColor={isSelected
                        ? '#BEDA36'
                        : (isDark ? '$borderDark600' : '#E9E9E9')
                      }
                      borderRadius={10}
                      p="$4"
                    >
                      <HStack alignItems="center" space="md">
                        {/* Radio Button */}
                        <Box
                          w={20}
                          h={20}
                          rounded="$full"
                          borderWidth={2}
                          borderColor={isSelected
                            ? '#000000'
                            : (isDark ? '#666666' : '#D4D4D4')
                          }
                          bg={isSelected ? '#FFFFFF' : 'transparent'}
                          alignItems="center"
                          justifyContent="center"
                        >
                          {isSelected && (
                            <Box
                              w={8}
                              h={8}
                              rounded="$full"
                              bg="#000000"
                            />
                          )}
                        </Box>
                        <Text
                          flex={1}
                          fontSize="$sm"
                          fontWeight="$medium"
                          color={isSelected
                            ? '#000000'
                            : (isDark ? '$textDark50' : '#000000')
                          }
                        >
                          {option.text}
                        </Text>
                      </HStack>
                    </Box>
                  </Pressable>
                );
              })}
            </VStack>

            {/* Next/Submit Button */}
            <Box mt="$4" mb="$2">
              <Pressable
                onPress={handleNextQuestion}
                disabled={!selectedAnswerId || submitAnswerMutation.isPending}
                opacity={!selectedAnswerId || submitAnswerMutation.isPending ? 0.5 : 1}
                bg={selectedAnswerId ? '#BEDA36' : '#F6F6F6'}
                borderRadius={8}
                py="$3"
                px="$4"
                alignItems="center"
                justifyContent="center"
              >
                <Text
                  fontSize="$sm"
                  fontWeight="$bold"
                  color={selectedAnswerId ? '#000000' : '#686868'}
                >
                  {submitAnswerMutation.isPending
                    ? 'Sending...'
                    : isLastQuestion
                    ? 'Tamamla'
                    : 'Sonraki Soru'
                  }
                </Text>
              </Pressable>
            </Box>
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default SurveyParticipationScreen;
