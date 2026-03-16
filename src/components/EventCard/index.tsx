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
import { EventCardData, UpcomingEventCardData } from '@/src/types/EventCard';
import { toImageSource } from '@/src/utils';
import { useTranslation } from '@/src/hooks/useTranslation';

const { width } = Dimensions.get('window');
// Horizontal card: Ekranın %55'i (kompakt ve peek effect güçlü)
const HORIZONTAL_CARD_WIDTH = width * 0.55;
// Grid card: 2'li grid düzeni
const GRID_CARD_WIDTH = (width - 48) / 2; // 16px padding on each side + 16px gap between cards

interface EventCardProps {
  data: EventCardData | UpcomingEventCardData;
  onPress?: () => void;
  isGrid?: boolean;
}

export const EventCard = ({ data, onPress, isGrid = false }: EventCardProps) => {
  const { t } = useTranslation('events');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  // Type guard: UpcomingEventCardData'da interaction ve avatars yok
  const isActiveEvent = 'interaction' in data && 'avatars' in data;
  const activeEventData = isActiveEvent ? data as EventCardData : null;

  return (
    <Pressable onPress={onPress}>
      <Box
        bg={isDark ? '#1A1A1A' : '#FFF'}
        borderWidth={1}
        borderColor="#E9E9E9"
        borderRadius={10}
        width={isGrid ? GRID_CARD_WIDTH : HORIZONTAL_CARD_WIDTH}
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
          {(() => {
            const imageSource = data.image ? toImageSource(data.image) : null;
            const defaultImage = require('@/assets/defaultImages/default-event.png');
            return (
              <Image
                source={imageSource || defaultImage}
                alt={data.title}
                style={{ width: '100%', height: '100%' }}
                borderRadius={5}
              />
            );
          })()}
          {/* Event Type Badge */}
          <Box
            position="absolute"
            top={14}
            left={14}
            bg="rgba(144, 8, 255, 0.8)"
            borderWidth={1}
            borderColor="#CA88FF"
            borderRadius={8}
            px="$1.5"
            py="$0.5"
          >
            <Text
              color="#FFFFFF"
              fontSize={10}
              fontWeight="$bold"
            >
              {t(`eventTypes.${data.eventType}`, { defaultValue: data.eventType })}
            </Text>
          </Box>
        </Box>

        {/* Content Section */}
        <Box flex={1} justifyContent={isActiveEvent ? "space-between" : "flex-start"}>
          <VStack space="xs" px="$2" flexShrink={1} flex={1}>
            {/* Title */}
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize="$xs"
              fontWeight="$bold"
              numberOfLines={1}
            >
              {data.title}
            </Text>

            {/* Description - 3 satır gösterilecek */}
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize="$xs"
              fontWeight="$normal"
              numberOfLines={4}
            >
              {data.description}
            </Text>

            {/* Date Range */}
            <HStack alignItems="center" space="xs" pt='$2' pb={isActiveEvent ? '$1' : '$2'}>
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
                fontSize={10}
                fontWeight="$normal"
              >
                {data.dateRange}
              </Text>
            </HStack>
          </VStack>

          {/* Divider Line - Sadece Active Events için gösterilir */}
          {isActiveEvent && (
            <Box
              height={1}
              bg="#D9D9D9"
              width="100%"
              mt="$1"
            />
          )}
        </Box>

        {/* Participants Section - Type1 and Type2 (Sadece Active Events için gösterilir) */}
        {isActiveEvent && activeEventData && (
          <HStack px="$2" alignItems="center" justifyContent="space-between" my="$2">
            <HStack alignItems="center" space="xs">
              {activeEventData.avatars && activeEventData.avatars.length > 0
                ? (() => {
                    const validAvatarSources: Array<NonNullable<ReturnType<typeof toImageSource>>> = [];
                    
                    for (const avatar of activeEventData.avatars) {
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
              fontSize="$xs"
              fontWeight="$normal"
            >
              {activeEventData.interaction || 0}{t('details.peopleJoined')}
            </Text>
          </HStack>
        )}

      </Box>
    </Pressable>
  );
};

export default EventCard;

