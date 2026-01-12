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
import { CachedImage } from '@/src/components/CachedImage';

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
                    width={50}
                    height={50}
                    borderRadius={25}
                    bg="#CE4A4A"
                    alignItems="center"
                    justifyContent="center"
                    borderWidth={2}
                    borderColor={isDark ? '#000' : '#FAFAFA'}
                >
                    <Box
                        width={46}
                        height={46}
                        borderRadius={23}
                        overflow="hidden"
                    >
                        {avatar ? (
                            <CachedImage
                                source={{ uri: avatar }}
                                alt={name}
                                width={46}
                                height={46}
                                resizeMode="cover"
                            />
                        ) : (
                            <Box
                                width={46}
                                height={46}
                                bg="#8C8C8C"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Text color="#FFF" fontSize={18} fontWeight="$bold">
                                    {name.charAt(0).toUpperCase()}
                                </Text>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Text Content */}
                <VStack flex={1} space="xs">
                    <Text
                        color={isDark ? '#fff' : '#000'}
                        fontSize={11}
                        fontWeight="$semibold"
                        numberOfLines={1}
                    >
                        {name}
                    </Text>
                    <Text
                        color={isDark ? '#8C8C8C' : '#8C8C8C'}
                        fontSize={9}
                        numberOfLines={2}
                        lineHeight={11}
                    >
                        {titleText}
                    </Text>
                    {mutualTrustCount && mutualTrustCount > 0 ? (
                        <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize={8}
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
                px={12}
                py={4}
                minWidth={102}
                height={26}
                alignItems="center"
                justifyContent="center"
                disabled={isTrusted}
                opacity={isTrusted ? 1 : 1}
            >
                <Text
                    color={isTrusted ? '#FFF' : '#000'}
                    fontSize={10}
                    fontWeight="$bold"
                >
                    {isTrusted ? 'Added' : 'Add Trust'}
                </Text>
            </Pressable>
        </HStack>
    );
};

export default SuggestedUserCard;
