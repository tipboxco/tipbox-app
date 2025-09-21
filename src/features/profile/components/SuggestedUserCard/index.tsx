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

interface SuggestedUserCardProps {
    id: string;
    name: string;
    title: string;
    avatars: Array<{
        id: string;
        source: any;
        alt: string;
    }>;
    onAddTrust: (userId: string) => void;
    showBorder?: boolean;
}

export const SuggestedUserCard = ({ 
    id,
    name, 
    title, 
    avatars, 
    onAddTrust,
    showBorder = true 
}: SuggestedUserCardProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

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
                {/* Overlapping Avatars */}
                <Box position="relative" width={50} height={50}>
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
                                width={50}
                                height={50}
                                borderRadius={25}
                                bg="#CE4A4A"
                                alignItems="center"
                                justifyContent="center"
                                zIndex={zIndex}
                                borderWidth={2}
                                borderColor={isDark ? '#000' : '#FAFAFA'}
                            >
                                <Box
                                    width={46}
                                    height={46}
                                    borderRadius={23}
                                    overflow="hidden"
                                >
                                    <Image
                                        source={avatar.source}
                                        alt={avatar.alt}
                                        width={46}
                                        height={46}
                                        resizeMode="cover"
                                    />
                                </Box>
                            </Box>
                        );
                    })}
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
                        {title}
                    </Text>
                </VStack>
            </HStack>

            {/* Add Trust Button */}
            <Pressable 
                onPress={() => onAddTrust(id)}
                bg="#F1F1F1"
                borderRadius={5}
                px={12}
                py={4}
                minWidth={102}
                height={26}
                alignItems="center"
                justifyContent="center"
            >
                <Text
                    color={isDark ? '#000' : '#000'}
                    fontSize={10}
                    fontWeight="$bold"
                >
                    Add Trust
                </Text>
            </Pressable>
        </HStack>
    );
};

export default SuggestedUserCard;
