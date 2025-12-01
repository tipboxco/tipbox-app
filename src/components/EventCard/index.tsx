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
import { EventCardData } from '@/src/types/EventCard';
import { toImageSource } from '@/src/utils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const GRID_CARD_WIDTH = (width - 48) / 2; // 16px padding on each side + 16px gap between cards

interface EventCardProps {
  data: EventCardData;
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
        flexDirection="column"
      >
        {/* Image Section */}
        <Box
          position="relative"
          height={100}
          bg={'#FFF'}
          borderRadius={5}
          mb="$2"
          overflow="hidden"
          padding='$2'
        >
          {data.image ? (
            (() => {
              const imageSource = toImageSource(data.image);
              return imageSource ? (
                <Image
                  source={imageSource}
                  alt={data.title}
                  style={{ width: '100%', height: '100%' }}
                  borderRadius={5}
                />
              ) : (
                <Box
                  width="100%"
                  height="100%"
                  bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Feather
                    name="image"
                    size={32}
                    color={isDark ? '#666' : '#999'}
                  />
                </Box>
              );
            })()
          ) : (
            <Box
              width="100%"
              height="100%"
              bg={isDark ? '#2A2A2A' : '#F5F5F5'}
              alignItems="center"
              justifyContent="center"
            >
              <Feather
                name="image"
                size={32}
                color={isDark ? '#666' : '#999'}
              />
            </Box>
          )}
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
        <Box flex={1} justifyContent="space-between">
          <VStack space="xs" flex={1} px="$2">
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
              flex={1}
            >
              {data.description}
            </Text>

            {/* Date Range */}
            <HStack alignItems="center" space="xs">
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
                  size={14}
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

          {/* Divider Line */}
          <Box
            height={1}
            bg="#D9D9D9"
            width="100%"
            mt="$1"
          />
        </Box>

        {/* Participants Section - Type1 and Type2 */}
        <HStack px="$2" alignItems="center" justifyContent="space-between" my="$2">
          <HStack alignItems="center" space="xs">
            {data.avatars && data.avatars.length > 0
              ? (() => {
                  const validAvatarSources: Array<NonNullable<ReturnType<typeof toImageSource>>> = [];
                  
                  for (const avatar of data.avatars) {
                    if (avatar) {
                      const avatarSource = toImageSource(avatar);
                      if (avatarSource) {
                        validAvatarSources.push(avatarSource);
                        if (validAvatarSources.length >= 4) break;
                      }
                    }
                  }

                  return validAvatarSources.length > 0
                    ? validAvatarSources.map((avatarSource, index) => (
                        <Image
                          key={index}
                          source={avatarSource}
                          alt={`Participant ${index + 1}`}
                          width={18}
                          height={18}
                          borderRadius={9}
                          style={{
                            marginLeft: index > 0 ? -12 : 0,
                            zIndex: 4 - index,
                          }}
                        />
                      ))
                    : null;
                })()
              : null}
          </HStack>
          <Text
            color={isDark ? '#FFFFFF' : '#B9B9B9'}
            fontSize={9}
            fontWeight="$medium"
          >
            {data.participants || 0}+ Etkileşim
          </Text>
        </HStack>

      </Box>
    </Pressable>
  );
};

export default EventCard;

