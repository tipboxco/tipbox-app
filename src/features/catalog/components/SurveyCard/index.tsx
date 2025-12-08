import React from 'react';
import { Box, VStack, HStack, Text, Button, ButtonText, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

import type { Survey } from '../../types';

interface SurveyCardProps {
  survey: Survey;
  onPress?: () => void;
}

const SurveyCard: React.FC<SurveyCardProps> = ({ survey, onPress }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const getButtonText = (status: string) => {
    switch (status) {
      case 'start':
        return 'Start';
      case 'continue':
        return 'Continue';
      case 'view_results':
        return 'View Results';
      default:
        return 'Start';
    }
  };

  return (
    <Box
      bg={isDark ? '#1A1A1A' : '#FDFDFD'}
      borderWidth={1}
      borderColor="#E9E9E9"
      borderRadius={10}
      p="$3"
      mb="$3"
    >
      <VStack space="sm">
        {/* Top Row - Badge and Time */}
        <HStack justifyContent="space-between" alignItems="flex-start">
          {/* Survey Type Badge */}
          <Box
            bg="#BEDA36"
            borderRadius={8}
            px="$4"
            py="$1"
            alignSelf="flex-start"
          >
            <Text
              color="#111111"
              fontSize={9}
              fontWeight="$bold"
              textAlign="center"
            >
              {survey.type}
            </Text>
          </Box>

          {/* Time Indicator */}
          <HStack alignItems="center" space="xs">
            <Text
              color="#686868"
              fontSize={9}
              fontWeight="$semibold"
            >
              {survey.duration}
            </Text>
            <Feather name="clock" size={18} color="#686868" />
          </HStack>
        </HStack>

        {/* Survey Content */}
        <VStack space="xs">
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={12}
            fontWeight="$bold"
            numberOfLines={2}
          >
            {survey.title}
          </Text>
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={10}
            lineHeight={12}
            numberOfLines={2}
          >
            {survey.description}
          </Text>
        </VStack>

        {/* Progress Bar */}
        <Box
          width="100%"
          height={6}
          bg="#EBEBEB"
          borderRadius={10}
          overflow="hidden"
        >
          <Box
            width={`${survey.progress || 0}%`}
            height="100%"
            bg="#686868"
            borderRadius={10}
          />
        </Box>

        {/* Bottom Row - Points and Button */}
        <HStack justifyContent="space-between" alignItems="center" mt="$2">
          {/* Points */}
          <HStack alignItems="center" space="xs">
            <Feather name="layers" size={24} color="#686868" />
            <Text
              color="#686868"
              fontSize={10}
              fontWeight="$bold"
            >
              {survey.points} Points
            </Text>
          </HStack>

          {/* Action Button */}
          <Button
            bg="#F6F6F6"
            borderRadius={8}
            height={26}
            onPress={onPress}
          >
            <ButtonText
              color="#111111"
              fontSize={10}
              fontWeight="$bold"
            >
              {getButtonText(survey.status)}
            </ButtonText>
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default SurveyCard;
