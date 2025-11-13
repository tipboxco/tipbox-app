import React from 'react';
import { Dimensions } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Pressable,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { EventCard as EventCardType } from '@/src/mock/events/communityEvents/types';
import { EventType } from '@/src/utils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const GRID_CARD_WIDTH = (width - 48) / 2; // 16px padding on each side + 16px gap between cards

interface EventCardProps {
  data: EventCardType;
  onPress?: () => void;
  isGrid?: boolean;
}

export const EventCard = ({ data, onPress, isGrid = false }: EventCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Pressable onPress={onPress}>
      <Box
        bg={isDark ? '#1A1A1A' : '#FFF'}
        borderWidth={1}
        borderColor="#E9E9E9"
        borderRadius={10}
        width={isGrid ? GRID_CARD_WIDTH : CARD_WIDTH}
        height={230}
        overflow="hidden"
      >
        {/* Image Section */}
        <Box
          position="relative"
          height={100}
          bg={'#FFF'}
          borderRadius={5}
          mb="$2"
          overflow="hidden"
          padding={'$2'}
        >
          <Image
            source={data.image}
            alt={data.title}
            style={{ width: '100%', height: '100%' }}
            borderRadius={5}
          />
          {/* Event Type Badge */}
          <Box
            position="absolute"
            top={14}
            left={14}
            bg="rgba(144, 8, 255, 0.8)"
            borderWidth={1}
            borderColor="#CA88FF"
            borderRadius={10}
            px="$2"
            py="$1"
          >
            <Text
              color="#FFFFFF"
              fontSize={9}
              fontWeight="$bold"
            >
              {data.eventType}
            </Text>
          </Box>
        </Box>

        {/* Content Section */}
        <VStack px="$2" space="xs" >
          {/* Title */}
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={11}
            fontWeight="$bold"
            numberOfLines={1}
          >
            {data.title}
          </Text>

          {/* Description */}
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={9}
            fontWeight="$normal"
            numberOfLines={3}
            lineHeight={12}
          >
            {data.description}
          </Text>

          {/* Date Range */}
          <HStack alignItems="center" space="xs" my="$1">
            <Box
              width={14}
              height={14}
              bg={isDark ? '#FFFFFF' : '#000000'}
              borderRadius={7}
              alignItems="center"
              justifyContent="center"
            >
              <Feather
                name="calendar"
                size={8}
                color={isDark ? '#000000' : '#FFFFFF'}
              />
            </Box>
            <Text
              color={isDark ? '#FFFFFF' : '#B9B9B9'}
              fontSize={9}
              fontWeight="$medium"
            >
              {data.dateRange}
            </Text>
          </HStack>
        </VStack>

        {/* Type1 Events - Participants Section */}
        {data.eventType === EventType.TYPE1 && (
          <>
            {/* Divider Line */}
            <Box
              height={1}
              bg="#D9D9D9"
              width="100%"
              mt="$1"
            />

            {/* Participants */}
            <HStack px="$2" alignItems="center" justifyContent="space-between" mt="$2">
              <HStack alignItems="center" space="xs">
                {data.avatars.slice(0, 4).map((avatar, index) => (
                  <Image
                    key={index}
                    source={avatar}
                    alt={`Participant ${index + 1}`}
                    width={18}
                    height={18}
                    borderRadius={9}
                    style={{
                      marginLeft: index > 0 ? -12 : 0,
                      zIndex: 4 - index,
                    }}
                  />
                ))}
              </HStack>
              <Text
                color={isDark ? '#FFFFFF' : '#B9B9B9'}
                fontSize={9}
                fontWeight="$medium"
              >
                {data.participants}+ Etkileşim
              </Text>
            </HStack>
          </>
        )}

      </Box>
    </Pressable>
  );
};

export default EventCard;
