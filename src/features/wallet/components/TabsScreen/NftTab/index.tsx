import React from 'react';
import { VStack, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather as FeatherIcon } from '@expo/vector-icons';

const NftTab: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <VStack gap="$3" alignItems="center" py="$8">
            <FeatherIcon 
                name="image" 
                size={48} 
                color={isDark ? '$textDark400' : '#B9B9B9'} 
            />
            <Text 
                fontSize="$lg" 
                fontWeight="$semibold" 
                color={isDark ? '$textDark100' : '$textLight900'}
                textAlign="center"
            >
                NFT Varlıklarınız yok
            </Text>
            <Text 
                fontSize="$sm" 
                color={isDark ? '$textDark400' : '#B9B9B9'}
                textAlign="center"
            >
                Henüz NFT varlığınız bulunmuyor
            </Text>
        </VStack>
    );
};

export default NftTab;
