import React from 'react';
import { 
    VStack, 
    HStack, 
    Text, 
    Pressable, 
    Box, 
    Image
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface SuggestionCardProps {
    title: string;
    subtitle: string;
    avatars: Array<{
        id: string;
        source: any;
        alt: string;
    }>;
    onPress?: () => void;
    showBorder?: boolean;
}

export const SuggestionCard = ({ 
    title, 
    subtitle, 
    avatars, 
    onPress,
    showBorder = true 
}: SuggestionCardProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Pressable onPress={onPress}>
            <HStack 
                alignItems="center" 
                justifyContent="space-between" 
                px={16} 
                py={12}
                borderBottomWidth={showBorder ? 1 : 0}
                borderBottomColor={isDark ? '#333' : '#E9E9E9'}
            >
                <HStack alignItems="center" space="md" flex={1}>
                    {/* Overlapping Avatars */}
                    <Box position="relative" width={38} height={38} mr={16}>
                        {avatars.map((avatar, index) => {
                            const isLast = index === avatars.length - 1;
                            const zIndex = avatars.length - index;
                            const leftOffset = index * 8; // Her avatar 8px sola kaydırılmış
                            
                            return (
                                <Box
                                    key={avatar.id}
                                    position="absolute"
                                    left={leftOffset}
                                    top={0}
                                    width={38}
                                    height={38}
                                    borderRadius={19}
                                    bg="#DDDDDD"
                                    alignItems="center"
                                    justifyContent="center"
                                    zIndex={zIndex}
                                    borderWidth={2}
                                    borderColor={isDark ? '#000' : '#FAFAFA'}
                                >
                                    <Image
                                        source={avatar.source}
                                        alt={avatar.alt}
                                        width={34}
                                        height={34}
                                        borderRadius={17}
                                        resizeMode="cover"
                                    />
                                    {/* Son avatar'da + sayısı göster */}
                                    {isLast && avatars.length > 1 && (
                                        <Box
                                            position="absolute"
                                            bottom={-2}
                                            right={-2}
                                            width={16}
                                            height={16}
                                            borderRadius={8}
                                            bg={isDark ? '#1A1A1A' : '#FAFAFA'}
                                            borderWidth={2}
                                            borderColor={isDark ? '#000' : '#FAFAFA'}
                                            alignItems="center"
                                            justifyContent="center"
                                        >
                                            <Text
                                                color={isDark ? '#fff' : '#000'}
                                                fontSize={8}
                                                fontWeight="$bold"
                                            >
                                                +{avatars.length - 1}
                                            </Text>
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>

                    {/* Text Content */}
                    <VStack flex={1}>
                        <Text
                            color={isDark ? '#fff' : '#000'}
                            fontSize={10}
                            fontWeight="$bold"
                        >
                            {title}
                        </Text>
                        <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize={9}
                        >
                            {subtitle}
                        </Text>
                    </VStack>
                </HStack>

                {/* More Options Button */}
                <Pressable p={8}>
                    <Feather 
                        name="chevron-right" 
                        size={24} 
                        color={isDark ? '#959595' : '#959595'} 
                    />
                </Pressable>
            </HStack>
        </Pressable>
    );
};

export default SuggestionCard;
