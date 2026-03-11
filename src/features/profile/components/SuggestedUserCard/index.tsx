import React from 'react';
import { Pressable, StyleSheet, View, Text, Image } from 'react-native';
import {
    VStack,
    HStack,
    Box,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';

interface SuggestedUserCardProps {
    id: string;
    name: string;
    titles: string[];
    avatar: string | null;
    mutualTrustCount?: number;
    isTrusted: boolean;
    onAddTrust: (userId: string) => void;
    onPress?: (userId: string) => void; // ADDED: Handler for clicking on user card
    showBorder?: boolean;
}

export const SuggestedUserCard = ({
    id,
    name,
    titles,
    avatar,
    mutualTrustCount,
    isTrusted,
    onAddTrust,
    onPress, // ADDED
    showBorder = true
}: SuggestedUserCardProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    // Titles array'ini string'e çevir
    const titleText = titles.join(' - ');

    return (
        <HStack
            alignItems="center"
            justifyContent="space-between"
            px={16}
            py={12}
            borderBottomWidth={showBorder ? 1 : 0}
            borderBottomColor={isDark ? '#333' : '#E9E9E9'}
        >
            {/* UPDATED: Wrap user info in Pressable for navigation */}
            <Pressable
                onPress={() => onPress?.(id)}
                style={styles.userInfoPressable}
            >
                <HStack alignItems="center" space="md">
                    {/* Avatar */}
                    <Box
                        width={54}
                        height={54}
                        borderRadius={100}
                        bg="#CE4A4A"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Box
                            width={50}
                            height={50}
                            borderRadius={23}
                            overflow="hidden"
                        >
                            <Image
                                source={toImageSource(avatar) || DEFAULT_USER_AVATAR}
                                alt={name}
                                width={50}
                                height={50}
                                borderRadius={23}
                                resizeMode="cover"
                            />
                        </Box>
                    </Box>

                    {/* Text Content */}
                    <VStack flex={1} space="xs">
                        <Text
                            color={isDark ? '#fff' : '#000'}
                            fontSize="$sm"
                            fontWeight="$semibold"
                            numberOfLines={1}
                        >
                            {name}
                        </Text>
                        <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize="$xs"
                            numberOfLines={2}
                        >
                            {titleText}
                        </Text>
                        {mutualTrustCount && mutualTrustCount > 0 ? (
                            <Text
                                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                fontSize="$xs"
                                numberOfLines={1}
                            >
                                {mutualTrustCount} mutual friends
                            </Text>
                        ) : null}
                    </VStack>
                </HStack>
            </Pressable>

            {/* Add Trust Button */}
            <Pressable
                onPress={() => !isTrusted && onAddTrust(id)}
                disabled={isTrusted}
                style={[
                    styles.trustButton,
                    { backgroundColor: isTrusted ? '#00C853' : '#F1F1F1' }
                ]}
            >
                <Text
                    style={[
                        styles.trustButtonText,
                        { color: isTrusted ? '#FFF' : '#000' }
                    ]}
                >
                    {isTrusted ? 'Added' : 'Add Trust'}
                </Text>
            </Pressable>
        </HStack>
    );
};

const styles = StyleSheet.create({
    userInfoPressable: {
        flex: 1,
        maxWidth: 240,
    },
    trustButton: {
        borderRadius: 5,
        paddingHorizontal: 16,
        paddingVertical: 8,
        minWidth: 102,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trustButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
});

export default SuggestedUserCard;
