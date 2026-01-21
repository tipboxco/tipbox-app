import React from 'react';
import { 
    VStack, 
    HStack, 
    Text, 
    Pressable, 
    Box, 
    Image
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
            <HStack alignItems="center" space="md" maxWidth={240} flex={1}>
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
                            {mutualTrustCount} ortak arkadaş
                        </Text>
                    ) : null}
                </VStack>
            </HStack>

            {/* Add Trust Button */}
            <Pressable 
                onPress={() => !isTrusted && onAddTrust(id)}
                bg={isTrusted ? '#00C853' : '#F1F1F1'}
                borderRadius={5}
                px="$4"
                py="$2"
                minWidth={102}
                height={32}
                alignItems="center"
                justifyContent="center"
                disabled={isTrusted}
                opacity={isTrusted ? 1 : 1}
            >
                <Text
                    color={isTrusted ? '#FFF' : '#000'}
                    fontSize="$sm"
                    fontWeight="$bold"
                >
                    {isTrusted ? 'Added' : 'Add Trust'}
                </Text>
            </Pressable>
        </HStack>
    );
};

export default SuggestedUserCard;
