import React, { useState } from 'react';
import { VStack, HStack, Text, Pressable, ScrollView } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import TipsTab from './TipsTab';
import NftTab from './NftTab';

interface TabsScreenProps {
    onReceive?: () => void;
    onSend?: () => void;
    onSwap?: () => void;
    onClaim?: () => void;
}

const TabsScreen: React.FC<TabsScreenProps> = ({
    onReceive,
    onSend,
    onSwap,
    onClaim
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [activeTab, setActiveTab] = useState<'tips' | 'nft'>('tips');

    return (
        <VStack flex={1}>
            {/* Tabs - En Üst Bölüm */}
            <HStack gap="$8" justifyContent="center" py="$4" px="$4" bg={isDark ? '$backgroundDark900' : '$backgroundLight50'}>
                <Pressable
                    onPress={() => setActiveTab('tips')}
                    pb="$2"
                    borderBottomWidth={activeTab === 'tips' ? 2 : 0}
                    borderBottomColor={activeTab === 'tips' ? (isDark ? '$primary500' : '$primary600') : 'transparent'}
                >
                    <Text 
                        fontSize="$sm" 
                        fontWeight="$bold" 
                        color={activeTab === 'tips' ? (isDark ? '$primary500' : '$primary600') : (isDark ? '$textDark400' : '#8C8C8C')}
                    >
                        TIPS
                    </Text>
                </Pressable>
                
                <Pressable
                    onPress={() => setActiveTab('nft')}
                    pb="$2"
                    borderBottomWidth={activeTab === 'nft' ? 2 : 0}
                    borderBottomColor={activeTab === 'nft' ? (isDark ? '$primary500' : '$primary600') : 'transparent'}
                >
                    <Text 
                        fontSize="$sm" 
                        fontWeight="$bold" 
                        color={activeTab === 'nft' ? (isDark ? '$primary500' : '$primary600') : (isDark ? '$textDark400' : '#8C8C8C')}
                    >
                        NFT Varlıklar
                    </Text>
                </Pressable>
            </HStack>

            {/* Tab İçeriği */}
            <ScrollView 
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {activeTab === 'tips' ? (
                    <TipsTab 
                        onReceive={onReceive}
                        onSend={onSend}
                        onSwap={onSwap}
                        onClaim={onClaim}
                    />
                ) : (
                    <NftTab />
                )}
            </ScrollView>
        </VStack>
    );
};

export default TabsScreen;
