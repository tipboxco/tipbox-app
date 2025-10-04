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
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface LimitedTimeEventCardProps {
    title: string;
    description: string;
    timeRemaining: string;
    userScore: number;
    userRank: number;
    userAvatar: any;
    otherUsers: Array<{
        id: string;
        avatar: any;
        rank: number;
    }>;
    onPress?: () => void;
}

export const LimitedTimeEventCard: React.FC<LimitedTimeEventCardProps> = ({
    title,
    description,
    timeRemaining,
    userScore,
    userRank,
    userAvatar,
    otherUsers,
    onPress,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

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
        >
            {/* Background Image */}
            <Image
                source={require('@/assets/events/banner_02.png')}
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
                            <Feather name="zap" size={14} color="#111111" />
                            <Text
                                color="#111111"
                                fontSize={9}
                                fontWeight="$semibold"
                            >
                                Limited Time
                            </Text>
                        </HStack>

                        <HStack alignItems="center" space="xs">
                            <Text
                                color="#FFFFFF"
                                fontSize={9}
                                fontWeight="$semibold"
                            >
                                {timeRemaining}
                            </Text>
                            <Feather name="clock" size={18} color="#FFFFFF" />
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
                                source={require('@/assets/events/image_01.png')}
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
                                fontSize={12}
                                fontWeight="$bold"
                                lineHeight={15}
                            >
                                {title}
                            </Text>
                            <Text
                                color="#D1D1D1"
                                fontSize={9}
                                lineHeight={11}
                                numberOfLines={2}
                            >
                                {description}
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
                                    source={userAvatar}
                                    alt="User avatar"
                                    width={34}
                                    height={34}
                                    borderRadius={17}
                                />
                                <VStack space="xs">
                                    <Text
                                        color="#B9B9B9"
                                        fontSize={9}
                                        fontWeight="$semibold"
                                    >
                                        Your Score
                                    </Text>
                                    <Text
                                        color="#FFFFFF"
                                        fontSize={10}
                                        fontWeight="$semibold"
                                    >
                                        {userScore.toLocaleString()} Points
                                    </Text>
                                </VStack>
                            </HStack>

                            <Text
                                color="#FFFFFF"
                                fontSize={11}
                                fontWeight="$semibold"
                            >
                                #{userRank}
                            </Text>
                        </HStack>
                    </Box>

                    {/* 4. HStack: Other Users and View Detail Button */}
                    <HStack justifyContent="space-between" alignItems="center">
                        {/* Other Users */}
                        <HStack space="xs" alignItems="flex-end">
                            {otherUsers.slice(0, 3).map((user, index) => (
                                <Box key={user.id} ml={index === 0 ? 0 : -12}>
                                    <Image
                                        source={user.avatar}
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
                                            fontSize={6}
                                            fontWeight="$semibold"
                                        >
                                            {user.rank}
                                        </Text>
                                    </Box>
                                </Box>
                            ))}
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
                                fontSize={10}
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
