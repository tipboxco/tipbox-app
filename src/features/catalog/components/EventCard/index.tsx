import React from 'react';
import { Box, VStack, HStack, Text, Image, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { Event } from '@/src/mock/catalog/brandSurveys/types';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const getButtonStyle = (status: string) => {
    if (status === 'joined') {
      return {
        bg: 'rgba(215, 215, 215, 0.8)',
        borderColor: '#ADADAD',
        textColor: '#000000',
        text: 'Joined',
        icon: 'check' as const,
      };
    }
    if (status === 'completed') {
      return {
        bg: '#E8FF6B',
        borderColor: '#D8FF08',
        textColor: '#000000',
        text: 'Completed',
        icon: 'check' as const,
      };
    }
    return {
      bg: '#E8FF6B',
      borderColor: '#D8FF08',
      textColor: '#000000',
      text: 'Join',
      icon: null,
    };
  };

  const buttonStyle = getButtonStyle(event.status);

  return (
    <Pressable onPress={onPress}>
      <Box
        bg={isDark ? '#1A1A1A' : '#FDFDFD'}
        borderWidth={1}
        borderColor="#E9E9E9"
        borderRadius={10}
        p="$3"
        mb="$3"
      >
        <HStack space="sm" alignItems="center">
          {/* Event Image - 68x68 */}
          <Box
            width={68}
            height={68}
            borderRadius={5}
            bg="#F6F6F6"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            <Image
              source={event.image}
              alt={event.title}
              style={{
                width: 68,
                height: 68,
              }}
              resizeMode="cover"
            />
          </Box>

          {/* Event Content - VStack with fixed height */}
          <VStack pr={'$2'} maxHeight={68} flex={1} space="xs">
            {/* Title */}
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={12}
              fontWeight="$bold"
              numberOfLines={1}
            >
              {event.title}
            </Text>

            {/* Description */}
            <Text
              color={isDark ? '#FFFFFF' : '#343434'}
              fontSize={9}
              lineHeight={11}
              numberOfLines={3}
            >
              {event.description}
            </Text>

            {/* Date Range */}
            <HStack alignItems="center" space="xs">
              <Feather name="calendar" size={12} color="#B9B9B9" />
              <Text
                color="#B9B9B9"
                fontSize={9}
                fontWeight="$medium"
              >
                {event.dateRange}
              </Text>
            </HStack>
          </VStack>

          {/* Action Button */}
          <Box
            alignItems="center"
            justifyContent="center"
            minWidth={72}
            height={24}
          >
            <Pressable
              onPress={onPress}
              bg={buttonStyle.bg}
              borderWidth={1}
              borderColor={buttonStyle.borderColor}
              borderRadius={5}
              px="$5"
              py="$1.5"
              alignItems="center"
              justifyContent="center"
              width="100%"
              height="100%"
            >
              <Text
                color={buttonStyle.textColor}
                fontSize={event.status === 'joined' || event.status === 'completed' ? 9 : 10}
                fontWeight="$bold"
                textAlign="center"
              >
                {buttonStyle.text}
              </Text>
            </Pressable>
          </Box>
        </HStack>
      </Box>
    </Pressable>
  );
};

export default EventCard;
