import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { Header } from '@/src/components/Header';
import { useWalletStore } from '@/src/store';
import { useNavigation } from '@react-navigation/native';

export const WalletConnection: React.FC = () => {
    const connect = useWalletStore(state => state.connect);
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
            <Box flex={1} bg="$backgroundLight0" $dark-bg="$backgroundDark950">
            <Header title="Varlıklar" showBackButton onBackPress={() => navigation.goBack()} />

            {/* Body */}
            <VStack flex={1} px="$4" py="$4" space="lg" alignItems="center" justifyContent="center">
                {/* Illustration placeholder (kept minimal; design uses a circular graphic) */}
                <Box
                    w={220}
                    h={220}
                    rounded="$full"
                    bg="$backgroundLight100"
                    $dark-bg="$backgroundDark800"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Feather name="shield" size={64} color="#9CA3AF" />
                </Box>

                {/* Action buttons block (Create / Connect) */}
                <HStack mt="$6" space="md" flexWrap="wrap" justifyContent="center">
                    <Pressable
                        onPress={() => {
                            connect();
                        }}
                        bg="$backgroundLight100"
                        $dark-bg="$backgroundDark800"
                        borderWidth={1}
                        borderColor="$borderLight200"
                        $dark-borderColor="$borderDark600"
                        rounded="$lg"
                        px={20}
                        h={40}
                        alignItems="center"
                        justifyContent="center"
                        mb="$2"
                    >
                        <HStack space="xs" alignItems="center">
                            <Feather name="link" size={14} color="#6B7280" />
                            <Text fontSize={12} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
                                Connect Wallet
                            </Text>
                        </HStack>
                    </Pressable>

                    <Pressable
                        onPress={() => { }}
                        bg="#E8FF6B"
                        $dark-bg="#E8FF6B"
                        borderWidth={1}
                        borderColor="#D8FF08"
                        rounded="$lg"
                        px={20}
                        h={40}
                        alignItems="center"
                        justifyContent="center"
                        mb="$2"
                    >
                        <HStack space="xs" alignItems="center">
                            <Feather name="plus" size={14} color="#000000" />
                            <Text fontSize={12} fontWeight="$bold" color="$black">
                                Create a Wallet
                            </Text>
                        </HStack>
                    </Pressable>
                </HStack>
            </VStack>
            </Box>
        </SafeAreaView>
    );
};


