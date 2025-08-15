import React from 'react';
import { Box, Text, VStack, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

interface AddProductCardProps {
    onPress?: () => void;
}

export const AddProductCard: React.FC<AddProductCardProps> = ({ onPress }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Pressable onPress={onPress}>
            <VStack width={100} space="xs" alignItems="center">
                <Box
                    width={100}
                    height={100}
                    borderRadius="$lg"
                    borderWidth={1}
                    borderStyle="dashed"
                    borderColor={isDark ? '$borderDark100' : '$borderLight200'}
                    bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
                    alignItems="center"
                    justifyContent="center"
                >
                    <Feather
                        name="plus"
                        size={24}
                        color={isDark ? '#666666' : '#999999'}
                    />
                    <Text
                        mt={'$2'}
                        fontSize={12}
                        color={isDark ? '$textDark400' : '$textLight500'}
                        textAlign="center"
                    >
                        Add Product
                    </Text>
                </Box>
            </VStack>
        </Pressable>
    );
};
