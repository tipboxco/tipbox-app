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
import { useColorMode } from '@/src/hooks/useColorMode';
import {
  BoltIcon,
  ClockIcon,
} from 'react-native-heroicons/outline';
import type { LimitedEventApiResponse } from '../../types';
import { useCountdown, toImageSource } from '@/src/utils';

const { width } = Dimensions.get('window');

interface LimitedTimeEventCardProps {
    data: LimitedEventApiResponse;
    onPress?: () => void;
}

export const LimitedTimeEventCard: React.FC<LimitedTimeEventCardProps> = ({
    data,
    onPress,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    
    // ERROR FIX: Null/undefined checks for data properties
    if (!data) {
        console.warn('[LimitedTimeEventCard] ⚠️ Data is null or undefined');
        return null;
    }
    
    // Countdown hook - performanslı geri sayım
    const countdown = useCountdown(data.endDate);
    
    // Format countdown: "DDD:HH:MM:SS" -> "HH:MM:SS" (gün kısmını kaldır)
    // ERROR FIX: Check if countdown is valid before splitting
    const formattedCountdown = countdown && typeof countdown === 'string'
        ? countdown.split(':').slice(1).join(':') // İlk kısmı (gün) kaldır
        : '00:00:00';
    
    // Image sources - ERROR FIX: Null checks for image sources
    const backgroundImageSource = toImageSource(data.backgroundImage) || require('@/assets/defaultImages/default-banner.png');
    const eventImageSource = toImageSource(data.eventImage) || require('@/assets/defaultImages/default-event.png');
    const userAvatarSource = toImageSource(data.userScore?.avatar) || require('@/assets/avatar/default-useravatar.png');

    return (
        <Box
            width={width - 32}
            height={230}
            borderRadius={10}
            overflow="hidden"
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 0 }}
            shadowOpacity={0.25}
            shadowRadius={3}
            elevation={3}
            position="relative"
            mt="$4"
        >
            {/* Background Image */}
            <Image
                source={backgroundImageSource}
                alt="Event background"
                width={width - 32}
                height={230}
                position="absolute"
                top={0}
                left={0}
                resizeMode="cover"
            />

            {/* Dark overlay */}
            <Box
                width="100%"
                height="100%"
                bg="rgba(0, 0, 0, 0.8)"
                borderRadius={10}
                position="relative"
            >
                {/* Content */}
                <VStack flex={1} p="$3" space="md">
                    {/* 1. HStack: Limited Time Badge and Timer */}
                    <HStack justifyContent="space-between" alignItems="flex-start">
                        <HStack
                            bg="#C2E607"
                            borderRadius={8}
                            px="$2"
                            py="$1"
                            alignItems="center"
                            space="xs"
                        >
                            <BoltIcon width={14} height={14} color="#111111" />
                            <Text
                                color="#111111"
                                fontSize="$2xs"
                                fontWeight="$semibold"
                            >
                                Limited Time
                            </Text>
                        </HStack>

                        <HStack alignItems="center" space="xs">
                            <Text
                                color="#FFFFFF"
                                fontSize="$2xs"
                                fontWeight="$semibold"
                            >
                                {formattedCountdown}
                            </Text>
                            <ClockIcon width={18} height={18} color="#FFFFFF" />
                        </HStack>
                    </HStack>

                    {/* 2. HStack: Event Image, Title and Description */}
                    <HStack space="md" alignItems="flex-start">
                        {/* Event Image */}
                        <Box
                            width={60}
                            height={60}
                            borderRadius={5}
                            overflow="hidden"
                        >
                            <Image
                                source={eventImageSource}
                                alt="Event image"
                                width={60}
                                height={60}
                                resizeMode="cover"
                            />
                        </Box>

                        {/* Title and Description */}
                        <VStack space="xs" flex={1}>
                            <Text
                                color="#FFFFFF"
                                fontSize="$sm"
                                fontWeight="$bold"
                                lineHeight={15}
                            >
                                {data.title || 'Event'}
                            </Text>
                            <Text
                                color="#D1D1D1"
                                fontSize="$2xs"
                                lineHeight={11}
                                numberOfLines={2}
                            >
                                {data.description || ''}
                            </Text>
                        </VStack>
                    </HStack>

                    {/* 3. HStack: User Avatar, Score and Rank */}
                    <Box
                        bg="rgba(223, 223, 223, 0.2)"
                        borderRadius={4}
                        p="$2"
                    >
                        <HStack justifyContent="space-between" alignItems="center">
                            <HStack alignItems="center" space="sm">
                                <Image
                                    source={userAvatarSource}
                                    alt="User avatar"
                                    width={34}
                                    height={34}
                                    borderRadius={17}
                                />
                                <VStack space="xs">
                                    <Text
                                        color="#B9B9B9"
                                        fontSize="$2xs"
                                        fontWeight="$semibold"
                                    >
                                        Your Score
                                    </Text>
                                    <Text
                                        color="#FFFFFF"
                                        fontSize="$2xs"
                                        fontWeight="$semibold"
                                    >
                                        {data.userScore?.score != null 
                                            ? `${data.userScore.score.toLocaleString()} Points`
                                            : '0 Points'}
                                    </Text>
                                </VStack>
                            </HStack>

                            <Text
                                color="#FFFFFF"
                                fontSize="$2xs"
                                fontWeight="$semibold"
                            >
                                #{data.userScore?.rank ?? 0}
                            </Text>
                        </HStack>
                    </Box>

                    {/* 4. HStack: Other Users and View Detail Button */}
                    <HStack justifyContent="space-between" alignItems="center">
                        {/* Other Users */}
                        <HStack space="xs" alignItems="flex-end">
                            {(data.leaderboardUsers || []).slice(0, 3).map((user, index) => {
                                const avatarSource = toImageSource(user?.avatar) || require('@/assets/avatar/default-useravatar.png');
                                return (
                                    <Box key={user?.id || index} ml={index === 0 ? 0 : -12}>
                                        <Image
                                            source={avatarSource}
                                            alt={`User ${user.rank}`}
                                            width={26}
                                            height={26}
                                            borderRadius={13}
                                            borderWidth={1}
                                            borderColor={index === 0 ? '#D3BE00' : index === 1 ? '#BEBEBE' : '#AB7A49'}
                                        />
                                        <Box
                                            bg={index === 0 ? '#D3BE00' : index === 1 ? '#BEBEBE' : '#AB7A49'}
                                            borderRadius={10}
                                            width={11}
                                            height={11}
                                            justifyContent="center"
                                            alignItems="center"
                                            mt={-8}
                                            ml={15}
                                        >
                                            <Text
                                                color="#FFFFFF"
                                                fontSize="$2xs"
                                                fontWeight="$semibold"
                                            >
                                                {user?.rank ?? 0}
                                            </Text>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </HStack>

                        {/* View Detail Button */}
                        <Pressable
                            bg="rgba(223, 223, 223, 0.2)"
                            borderRadius={8}
                            px="$3"
                            py="$2"
                            onPress={onPress}
                        >
                            <Text
                                color="#FFFFFF"
                                fontSize="$2xs"
                                fontWeight="$semibold"
                                textAlign="center"
                            >
                                View Detail
                            </Text>
                        </Pressable>
                    </HStack>
                </VStack>
            </Box>
        </Box>
    );
};

export default LimitedTimeEventCard;
