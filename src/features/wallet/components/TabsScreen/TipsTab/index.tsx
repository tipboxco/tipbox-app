import React, { useRef } from 'react';
import { VStack, Text, Box, HStack, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import WalletInfoCard from '../../WalletInfoCard';
import TransactionCard from '../../TransactionCard';
import SendBottomSheet from '../../SendBottomSheet';
import { allTransactions } from '../../../mock/transactionData';

interface TipsTabProps {
    onReceive?: () => void;
    onSend?: () => void;
    onSwap?: () => void;
    onClaim?: () => void;
}

const TipsTab: React.FC<TipsTabProps> = ({
    onReceive,
    onSend,
    onSwap,
    onClaim
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const sendBottomSheetRef = useRef<BottomSheet>(null);

    const handleReceive = () => {
        if (onReceive) {
            onReceive();
        } else {
            console.log('Receive');
        }
    };

    const handleSend = () => {
        if (sendBottomSheetRef.current) {
            sendBottomSheetRef.current.snapToIndex(0);
        } else {
            console.log('Send BottomSheet ref is null');
        }
    };

    const handleSwap = () => {
        if (onSwap) {
            onSwap();
        } else {
            console.log('Swap');
        }
    };

    const handleClaim = () => {
        if (onClaim) {
            onClaim();
        } else {
            console.log('Claim');
        }
    };

    const handleCopyTxId = (txId: string) => {
        console.log('Transaction ID copied:', txId);
        // Burada clipboard'a kopyalama işlemi yapılabilir
    };

    const handleSendToWallet = () => {
        console.log('Send to wallet');
        // Cüzdan adresine gönderim sayfasına yönlendirme
    };

    const handleSendToFriend = () => {
        console.log('Send to friend');
        // Arkadaş listesi sayfasına yönlendirme
    };

    const handleConfirmSend = (address: string) => {
        console.log('Confirm send to address:', address);
        // Gönderim işlemini onaylama
    };

    const renderBackdrop = React.useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={0.5}
            />
        ),
        []
    );

    return (
        <VStack gap="$4" px="$4" py="$2">
            {/* Wallet Bilgileri */}
            <WalletInfoCard
                userName="Michael Clark"
                walletAddress="F4184fc596......0e9831e9e16"
                onCopyAddress={() => console.log('Wallet address copied')}
            />

            {/* Ana Bakiye Kartı ve Aksiyon Butonları */}
            <Box
                bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                borderRadius="$lg"
                borderWidth={1}
                borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
                p="$6"
            >
                {/* Bakiye Bölümü */}
                <VStack alignItems="center" mb="$6">
                    <Text
                        fontSize="$sm"
                        fontWeight="$bold"
                        color={isDark ? '$textDark400' : '#B9B9B9'}
                        mb="$2"
                    >
                        Current Balance
                    </Text>

                    <Text
                        fontSize="$4xl"
                        fontWeight="$bold"
                        color={isDark ? '$textDark100' : '$textLight900'}
                        mb="$4"
                    >
                        20.000
                    </Text>

                    {/* Değişim bilgisi */}
                    <HStack alignItems="center" gap="$1">
                        <Text
                            fontSize="$xs"
                            fontWeight="$semibold"
                            color={isDark ? '$textDark400' : '$textLight900'}
                        >
                            -$0.24
                        </Text>
                        <Box
                            bg={isDark ? '$backgroundDark600' : '#D9D9D9'}
                            borderRadius="$sm"
                            px="$2"
                            py="$1"
                        >
                            <Text
                                fontSize="$xs"
                                fontWeight="$semibold"
                                color={isDark ? '$textDark400' : '$textLight900'}
                            >
                                -1.05%
                            </Text>
                        </Box>
                    </HStack>
                </VStack>

                {/* Aksiyon Butonları */}
                <HStack gap="$2" justifyContent="space-between">
                    <Pressable
                        onPress={handleReceive}
                        bg={isDark ? '$backgroundDark700' : '#FDFDFD'}
                        borderRadius="$lg"
                        borderWidth={1}
                        borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
                        p="$4"
                        alignItems="center"
                        flex={1}
                    >
                        <FeatherIcon
                            name="smartphone"
                            size={24}
                            color={isDark ? '$textDark100' : '$textLight900'}
                        />
                        <Text
                            fontSize="$xs"
                            fontWeight="$medium"
                            color={isDark ? '$textDark100' : '$textLight900'}
                            mt="$1"
                        >
                            Receive
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={handleSend}
                        bg={isDark ? '$backgroundDark700' : '#FDFDFD'}
                        borderRadius="$lg"
                        borderWidth={1}
                        borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
                        p="$4"
                        alignItems="center"
                        flex={1}
                    >
                        <FeatherIcon
                            name="send"
                            size={24}
                            color={isDark ? '$textDark100' : '$textLight900'}
                        />
                        <Text
                            fontSize="$xs"
                            fontWeight="$medium"
                            color={isDark ? '$textDark100' : '$textLight900'}
                            mt="$1"
                        >
                            Send
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={handleSwap}
                        bg={isDark ? '$backgroundDark700' : '#FDFDFD'}
                        borderRadius="$lg"
                        borderWidth={1}
                        borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
                        p="$4"
                        alignItems="center"
                        flex={1}
                    >
                        <FeatherIcon
                            name="refresh-cw"
                            size={24}
                            color={isDark ? '$textDark100' : '$textLight900'}
                        />
                        <Text
                            fontSize="$xs"
                            fontWeight="$medium"
                            color={isDark ? '$textDark100' : '$textLight900'}
                            mt="$1"
                        >
                            Swap
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={handleClaim}
                        bg={isDark ? '$backgroundDark700' : '#FDFDFD'}
                        borderRadius="$lg"
                        borderWidth={1}
                        borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
                        p="$4"
                        alignItems="center"
                        flex={1}
                    >
                        <FeatherIcon
                            name="gift"
                            size={24}
                            color={isDark ? '$textDark100' : '$textLight900'}
                        />
                        <Text
                            fontSize="$xs"
                            fontWeight="$medium"
                            color={isDark ? '$textDark100' : '$textLight900'}
                            mt="$1"
                        >
                            Claim
                        </Text>
                    </Pressable>
                </HStack>
            </Box>

            <Text
                fontSize="$lg"
                fontWeight="$bold"
                color={isDark ? '$textDark100' : '$textLight900'}
                mb="$2"
            >
                Transaction History
            </Text>

            {/* İşlem kartları */}
            <VStack gap="$4">
                {/* Today Section */}
                <VStack gap="$3">
                    <Text
                        fontSize="$sm"
                        fontWeight="$bold"
                        color={isDark ? '$textDark400' : '#B9B9B9'}
                    >
                        Today
                    </Text>
                    
                    {allTransactions.today.map((transaction) => (
                        <TransactionCard
                            key={transaction.id}
                            transaction={transaction}
                            onCopy={handleCopyTxId}
                        />
                    ))}
                </VStack>

                {/* Yesterday Section */}
                <VStack gap="$3">
                    <Text
                        fontSize="$sm"
                        fontWeight="$bold"
                        color={isDark ? '$textDark400' : '#B9B9B9'}
                    >
                        Yesterday
                    </Text>
                    
                    {allTransactions.yesterday.map((transaction) => (
                        <TransactionCard
                            key={transaction.id}
                            transaction={transaction}
                            onCopy={handleCopyTxId}
                        />
                    ))}
                </VStack>
            </VStack>

            {/* Send Bottom Sheet */}
            <BottomSheet
                ref={sendBottomSheetRef}
                index={-1}
                snapPoints={['50%']}
                enablePanDownToClose={true}
                backdropComponent={renderBackdrop}
                backgroundStyle={{
                    backgroundColor: isDark ? '$backgroundDark800' : '#FDFDFB',
                    borderTopLeftRadius: 30,
                    borderTopRightRadius: 30,
                }}
                handleIndicatorStyle={{
                    backgroundColor: isDark ? '$backgroundDark600' : '#B8B8B7',
                }}
            >
                <BottomSheetView>
                    <SendBottomSheet
                        onClose={() => sendBottomSheetRef.current?.close()}
                        onSendToWallet={handleSendToWallet}
                        onSendToFriend={handleSendToFriend}
                        onConfirm={handleConfirmSend}
                    />
                </BottomSheetView>
            </BottomSheet>
        </VStack>
    );
};

export default TipsTab;
