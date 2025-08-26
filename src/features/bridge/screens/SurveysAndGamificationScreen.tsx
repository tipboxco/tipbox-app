import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Pressable,
  Image,
} from '@gluestack-ui/themed';
import { useThemeStore } from '@/src/store/themeStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BridgeStackParamList, Survey, SurveyCategory } from '../types';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<BridgeStackParamList>;

export const SurveysAndGamificationScreen = () => {
  const { colorMode } = useThemeStore();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NavigationProp>();

  const [activeCategory, setActiveCategory] = useState('surveys');

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleCategoryPress = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const categories: SurveyCategory[] = [
    { id: 'surveys', name: 'Anketler', isActive: activeCategory === 'surveys' },
    { id: 'trends', name: 'Trendler', isActive: activeCategory === 'trends' },
    { id: 'activities', name: 'Etkinlikler', isActive: activeCategory === 'activities' },
  ];

  const surveys: Survey[] = [
    {
      id: '1',
      title: 'Burada Anket Adı Yazacak',
      description: 'Burada anket açıklaması yazacak kısa.',
      type: 'Anket Tipi',
      duration: '3min',
      points: 250,
      status: 'not_started',
      buttonText: 'Start',
    },
    {
      id: '2',
      title: 'Burada Anket Adı Yazacak',
      description: 'Burada anket açıklaması yazacak kısa.',
      type: 'Anket Tipi',
      duration: '3min',
      points: 250,
      status: 'in_progress',
      progress: 50,
      buttonText: 'Continue',
    },
    {
      id: '3',
      title: 'Burada Anket Adı Yazacak',
      description: 'Burada anket açıklaması yazacak kısa.',
      type: 'Anket Tipi',
      duration: '3min',
      points: 250,
      status: 'completed',
      progress: 100,
      buttonText: 'View Results',
    },
    {
      id: '4',
      title: 'Burada Anket Adı Yazacak',
      description: 'Burada anket açıklaması yazacak kısa.',
      type: 'Anket Tipi',
      duration: '3min',
      points: 250,
      status: 'not_started',
      buttonText: 'Start',
    },
  ];



  const renderSurveyCard = (survey: Survey) => {
    const getButtonBgColor = () => {
      switch (survey.status) {
        case 'completed':
          return '$success500';
        case 'in_progress':
          return '$warning500';
        default:
          return '$primary500';
      }
    };

    return (
      <Box
        key={survey.id}
        bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
        borderWidth={1}
        borderColor={isDark ? '$backgroundDark700' : '$backgroundLight200'}
        borderRadius="$lg"
        p="$3"
        mb="$3"
      >
        <VStack space="md">
          {/* Survey Type Badge and Duration - Top Row */}
          <HStack justifyContent="space-between" alignItems="center">
            <HStack space="sm" alignItems="center">
              <Text
                fontSize="$2xs"
                fontWeight="$semibold"
                color={isDark ? '$textDark400' : '$textLight500'}
              >
                {survey.duration}
              </Text>
              <Feather 
                name="clock" 
                size={14} 
                color={isDark ? '#9CA3AF' : '#6B7280'} 
              />
            </HStack>
            
            <Box
              bg="$success400"
              px="$3"
              py="$1"
              borderRadius="$md"
            >
              <Text
                fontSize="$2xs"
                fontWeight="$semibold"
                color="$white"
              >
                {survey.type}
              </Text>
              </Box>
          </HStack>

          {/* Survey Title and Description */}
          <VStack space="sm">
            <Text
              fontSize="$sm"
              fontWeight="$bold"
              color={isDark ? '$textDark50' : '$textLight900'}
              numberOfLines={1}
            >
              {survey.title}
            </Text>
            <Text
              fontSize="$xs"
              color={isDark ? '$textDark300' : '$textLight600'}
              numberOfLines={2}
            >
              {survey.description}
            </Text>
          </VStack>

          {/* Progress Bar */}
          {survey.progress !== undefined && (
            <Box w="100%" h={6} bg="$backgroundLight200" borderRadius="$lg" overflow="hidden">
              <Box 
                w={`${survey.progress}%`} 
                h={6} 
                bg={survey.status === 'completed' ? '$success500' : '$primary500'} 
                borderRadius="$lg"
              />
            </Box>
          )}

          {/* Points and Action Button - Same Row */}
          <HStack justifyContent="space-between" alignItems="center">
            <HStack space="sm" alignItems="center">
              <Feather 
                name="award" 
                size={16} 
                color={isDark ? '#9CA3AF' : '#6B7280'} 
              />
              <Text
                fontSize="$xs"
                fontWeight="$semibold"
                color={isDark ? '$textDark400' : '$textLight500'}
              >
                {survey.status === 'completed' ? `${survey.points} Points earned` : `${survey.points} Points`}
              </Text>
            </HStack>

            {/* Action Button */}
            <Pressable
              bg={getButtonBgColor()}
              px="$4"
              py="$2"
              borderRadius="$md"
            >
              <Text
                fontSize="$xs"
                fontWeight="$semibold"
                color="$white"
              >
                {survey.buttonText}
              </Text>
            </Pressable>
          </HStack>
        </VStack>
      </Box>
    );
  };

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark900' : '$backgroundLight0'}
    >
      <Header
        title="Anketler & Oyunlaştırmalar"
        showBackButton
        onBackPress={handleBackPress}
      />

      <ScrollView style={{ flex: 1 }}>
        <VStack space="lg" p="$4">
          {/* Top Section - Apple Technology and Brand History in same row */}
          <HStack justifyContent="space-between" alignItems="flex-start">
            {/* Apple Technology Card */}
            <Box
              bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
              p="$3"
              borderRadius="$lg"
              shadowColor="$black"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.1}
              shadowRadius={4}
              elevation={3}
              flex={1}
              mr="$3"
            >
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space="md" alignItems="center" flex={1}>
                  <Image
                    source={require('@/assets/bridge/card-icon.png')}
                    alt="Card Icon"
                    w={52}
                    h={52}
                    rounded="$md"
                  />
                  <VStack space="xs">
                    <Text
                      fontSize="$sm"
                      fontWeight="$bold"
                      color={isDark ? '$textDark50' : '$textLight900'}
                    >
                      Apple
                    </Text>
                    <Text
                      fontSize="$sm"
                      fontWeight="$semibold"
                      color={isDark ? '$textDark300' : '$textLight600'}
                    >
                      Technology
                    </Text>
                  </VStack>
                </HStack>
                
                {/* Notification Icon */}
                <Box
                  bg={isDark ? '$backgroundDark700' : '$backgroundLight100'}
                  p="$2"
                  borderRadius="$full"
                >
                  <Feather 
                    name="bell" 
                    size={20} 
                    color={isDark ? '#9CA3AF' : '#6B7280'} 
                  />
                </Box>
              </HStack>
            </Box>

            {/* Brand History Card */}
            <Box
              bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
              p="$3"
              borderRadius="$lg"
              shadowColor="$black"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.1}
              shadowRadius={4}
              elevation={3}
              w="$20"
            >
              <VStack space="sm" alignItems="center">
                <Box
                  w={26}
                  h={26}
                  bg="$backgroundLight200"
                  borderRadius="$full"
                  borderWidth={2}
                  borderColor="$white"
                />
                <Text
                  fontSize="$2xs"
                  fontWeight="$semibold"
                  color={isDark ? '$textDark50' : '$textLight900'}
                  textAlign="center"
                >
                  Marka{'\n'}Geçmişim
                </Text>
              </VStack>
            </Box>
          </HStack>

          {/* Category Tabs - Using space-around for better spacing */}
          <HStack justifyContent="space-around" alignItems="center" w="100%">
            {categories.map((category) => (
              <VStack key={category.id} alignItems="center" space="xs" flex={1}>
                <Text
                  fontSize="$sm"
                  fontWeight="$bold"
                  color={category.isActive 
                    ? (isDark ? '$textDark50' : '$textLight900')
                    : (isDark ? '$textDark400' : '$textLight500')
                  }
                >
                  {category.name}
                </Text>
                {category.isActive && (
                  <Box
                    w="100%"
                    h={2}
                    bg={isDark ? '$primary500' : '$primary500'}
                    borderRadius="$full"
                  />
                )}
              </VStack>
            ))}
          </HStack>

          {/* Surveys List */}
          <VStack space="md">
            {surveys.map((survey) => renderSurveyCard(survey))}
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
};
