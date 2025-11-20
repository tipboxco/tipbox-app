import React from 'react';
import { VStack, HStack, Text, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface SuccessBottomSheetProps {
    onClose: () => void;
    title?: string;
    message?: string;
    transactionDetails?: {
        sentAmount?: string;
        receivedAmount?: string;
        transactionFee?: string;
        remainingBalance?: string;
        transactionId?: string;
    };
}

export const SuccessBottomSheet: React.FC<SuccessBottomSheetProps> = ({
    onClose,
    title = 'Transaction Successful',
    message = 'Your transaction has been completed successfully.',
    transactionDetails,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <VStack px="$4" py="$4" space="lg" flex={1}>
            {/* Success Icon and Message */}
            <VStack alignItems="center" space="md" py="$4">
                {/* Success Icon Circle */}
                <Box
                    w={146}
                    h={146}
                    rounded="$full"
                    bg="#E8FF6B"
                    $dark-bg="#E8FF6B"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Feather name="check" size={80} color="#111111" />
                </Box>

                {/* Title and Message */}
                <VStack alignItems="center" space="xs" px="$4">
                    <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50" textAlign="center">
                        {title}
                    </Text>
                    <Text fontSize={12} fontWeight="$normal" color="$textLight500" $dark-color="$textDark400" textAlign="center" lineHeight={18}>
                        {message}
                    </Text>
                </VStack>
            </VStack>

            {/* Transaction Details Card */}
            {transactionDetails && (
                <VStack
                    bg="$backgroundLight0"
                    $dark-bg="$backgroundDark800"
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    $dark-borderColor="$borderDark600"
                    rounded={5}
                >
                    <VStack>
                            {transactionDetails.sentAmount && (
                                <>
                                    <HStack justifyContent="space-between" alignItems="center" px="$4" py="$4">
                                        <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400" flex={1}>
                                            From
                                        </Text>
                                        <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50" textAlign="right" flex={1} numberOfLines={1}>
                                            {transactionDetails.sentAmount}
                                        </Text>
                                    </HStack>
                                    <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />
                                </>
                            )}

                            {transactionDetails.receivedAmount && (
                                <>
                                    <HStack justifyContent="space-between" alignItems="center" px="$4" py="$4">
                                        <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400" flex={1}>
                                            To
                                        </Text>
                                        <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50" textAlign="right" flex={1} numberOfLines={1}>
                                            {transactionDetails.receivedAmount}
                                        </Text>
                                    </HStack>
                                    <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />
                                </>
                            )}

                            {transactionDetails.transactionFee && (
                                <>
                                    <HStack justifyContent="space-between" alignItems="center" px="$4" py="$4">
                                        <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400" flex={1}>
                                            Exchange Rate
                                        </Text>
                                        <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50" textAlign="right" flex={1} numberOfLines={1}>
                                            {transactionDetails.transactionFee}
                                        </Text>
                                    </HStack>
                                    {transactionDetails.remainingBalance && <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />}
                                </>
                            )}

                            {transactionDetails.remainingBalance && (
                                <>
                                    <HStack justifyContent="space-between" alignItems="center" px="$4" py="$4">
                                        <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400" flex={1}>
                                            Network Fee
                                        </Text>
                                        <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50" textAlign="right" flex={1} numberOfLines={1}>
                                            {transactionDetails.remainingBalance}
                                        </Text>
                                    </HStack>
                                    {transactionDetails.transactionId && <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />}
                                </>
                            )}

                            {transactionDetails.transactionId && (
                                <HStack justifyContent="space-between" alignItems="center" px="$4" py="$4">
                                    <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400" flex={1}>
                                        Transaction ID
                                    </Text>
                                    <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50" textAlign="right" flex={1} numberOfLines={1}>
                                        {transactionDetails.transactionId}
                                    </Text>
                                </HStack>
                            )}
                        </VStack>
                </VStack>
            )}

            {/* Date */}
            <HStack px="$4" justifyContent="flex-end">
                        <Text fontSize={9} fontWeight="$normal" color="#9D9D9D" $dark-color="$textDark400">
                            {(() => {
                                const now = new Date();
                                const day = now.getDate();
                                const month = now.toLocaleDateString('en-US', { month: 'short' });
                                const year = now.getFullYear();
                                const hours = now.getHours().toString().padStart(2, '0');
                                const minutes = now.getMinutes().toString().padStart(2, '0');
                                return `${day} ${month} ${year}, ${hours}:${minutes}`;
                            })()}
                        </Text>
                    </HStack>

            {/* Action Buttons */}
            <HStack space="md" mt="auto">
                <Pressable
                    onPress={() => {
                        // TODO: Open explorer link
                        console.log('View on Explorer pressed');
                    }}
                    bg="#F5F5F5"
                    $dark-bg="#F5F5F5"
                    rounded={8}
                    py="$3"
                    flex={1}
                    alignItems="center"
                    justifyContent="center"
                >
                    <Text fontSize={12} fontWeight="$bold" color="#9E9E9E" textAlign="center">
                        View on Explorer
                    </Text>
                </Pressable>
                <Pressable
                    onPress={onClose}
                    bg="#D8FF08"
                    $dark-bg="#D8FF08"
                    rounded={8}
                    py="$3"
                    flex={1}
                    alignItems="center"
                    justifyContent="center"
                >
                    <Text fontSize={14} fontWeight="$bold" color="#111111" textAlign="center">
                        Go to Wallet
                    </Text>
                </Pressable>
            </HStack>
        </VStack>
    );
};

