import React from 'react';
import { VStack, HStack, Text, Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather as FeatherIcon } from '@expo/vector-icons';

export interface TransactionData {
    id: string;
    type: 'send' | 'receive' | 'claim';
    title: string;
    description: string;
    amount: string;
    amountColor: string;
    icon: string;
    date?: string;
    sender?: string;
    receiver?: string;
    txId?: string;
    isDetailed?: boolean;
}

interface TransactionCardProps {
    transaction: TransactionData;
    onCopy?: (txId: string) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onCopy }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const getIconName = (type: string) => {
        switch (type) {
            case 'send':
                return 'send';
            case 'receive':
                return 'gift';
            case 'claim':
                return 'gift';
            default:
                return 'circle';
        }
    };

    return (
        <Box
            bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
            borderRadius="$lg"
            borderWidth={1}
            borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
            p="$4"
        >

            <HStack justifyContent="space-between" alignItems="center">
                <HStack alignItems="center" gap="$3">
                    <Box
                        bg={isDark ? '$backgroundDark600' : '#D9D9D9'}
                        borderRadius="$md"
                        width={42}
                        height={42}
                        justifyContent="center"
                        alignItems="center"
                    >
                        <FeatherIcon
                            name={getIconName(transaction.type) as any}
                            size={20}
                            color={isDark ? '$textDark100' : '$textLight900'}
                        />
                    </Box>
                    <VStack>
                        <Text
                            fontSize="$sm"
                            fontWeight="$bold"
                            color={isDark ? '$textDark100' : '$textLight900'}
                        >
                            {transaction.title}
                        </Text>
                        <Text
                            fontSize="$xs"
                            color={isDark ? '$textDark400' : '#B9B9B9'}
                        >
                            {transaction.description}
                        </Text>
                    </VStack>
                </HStack>
                <Text
                    fontSize="$sm"
                    fontWeight="$bold"
                    color={transaction.amountColor}
                >
                    {transaction.amount}
                </Text>
            </HStack>
        </Box>
    );
};

export default TransactionCard;
