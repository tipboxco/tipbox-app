import React, { useState } from 'react';
import { Box, VStack, Text, ScrollView, HStack, Pressable } from '@gluestack-ui/themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { SavedCard, SavedCardData } from '../../components/SavedCard';
import { BillingHistoryEntry, BillingHistoryEntryData } from '../../components/BillingHistoryEntry';
import { LinkedPaymentMethod, LinkedPaymentMethodData } from '../../components/LinkedPaymentMethod';

interface PaymentTabProps {
  onAddPaymentMethod?: () => void;
}

// Mock saved cards data - This should come from your state management or API
const mockSavedCards: SavedCardData[] = [
  {
    id: '1',
    nameOnCard: 'Ozan Mutluoğlu',
    cardNumber: '520939843945',
    expirationDate: '12/25',
    cardName: 'Work Card',
    cardType: 'mastercard',
  },
  // Add more cards as needed
];

// Mock billing history data
const mockBillingHistory: BillingHistoryEntryData[] = [
  {
    id: '1',
    planName: 'Premium Plan Name',
    date: '12.10.2025',
    amount: '$10',
    cardLastFour: '3945',
  },
  {
    id: '2',
    planName: 'Premium Plan Name',
    date: '12.09.2025',
    amount: '$10',
    cardLastFour: '3945',
  },
];

// Mock linked payment method
const mockLinkedPaymentMethod: LinkedPaymentMethodData = {
  cardType: 'Mastercard',
  cardNumber: '52093984******3945',
};

export const PaymentTab: React.FC<PaymentTabProps> = ({ onAddPaymentMethod }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [savedCards, setSavedCards] = useState<SavedCardData[]>(mockSavedCards);
  const [billingHistory] = useState<BillingHistoryEntryData[]>(mockBillingHistory);
  const [dateRange, setDateRange] = useState('14 May - 14 July');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleCardDelete = (cardId: string) => {
    setSavedCards(savedCards.filter(card => card.id !== cardId));
  };

  const handleCardPress = (cardId: string) => {
    // Handle card press - could open edit modal or set as default
    console.log('Card pressed:', cardId);
  };

  const handleEditCardName = (cardId: string) => {
    // Handle edit card name - could open edit modal
    console.log('Edit card name:', cardId);
  };

  const handleBillingEntryPress = (entryId: string) => {
    console.log('Billing entry pressed:', entryId);
  };

  const handleDateRangePress = () => {
    // Handle date range selection
    console.log('Date range pressed');
  };

  const handleSortPress = () => {
    // Handle sort options
    console.log('Sort pressed');
  };

  const handleViewPaymentMethod = () => {
    // Handle view payment method
    console.log('View payment method pressed');
  };

  return (
    <ScrollView 
      flex={1} 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={{ paddingHorizontal: 0 }}
      scrollEnabled={!isPopoverOpen}
    >
      <VStack space="md">
        {/* Saved Cards List */}
        {savedCards.length > 0 && (
          <VStack space="md">
            {savedCards.map((card) => (
              <SavedCard
                key={card.id}
                data={card}
                onPress={handleCardPress}
                onDelete={handleCardDelete}
                onEditCardName={handleEditCardName}
                onPopoverOpenChange={setIsPopoverOpen}
              />
            ))}
          </VStack>
        )}

        {/* Add Payment Method Card */}
        <Pressable
          onPress={() => {
            if (onAddPaymentMethod) {
              onAddPaymentMethod();
            }
          }}
        >
          <Box
            borderWidth={1}
            borderColor={isDark ? '#8C8C8C' : '#D1D5DB'}
            borderStyle="dashed"
            borderRadius={12}
            p="$4"
            bg={isDark ? '$backgroundDark0' : '$backgroundLight0'}
          >
            <HStack alignItems="center" justifyContent="space-between">
              <HStack alignItems="center" space="md" flex={1}>
                <Box
                  w={24}
                  h={24}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Feather
                    name="credit-card"
                    size={20}
                    color={isDark ? '#8C8C8C' : '#9CA3AF'}
                  />
                </Box>
                <Text
                  color={isDark ? '#8C8C8C' : '#9CA3AF'}
                  fontSize={14}
                  fontWeight="$normal"
                >
                  Add Payment Method
                </Text>
              </HStack>
              <Box
                w={32}
                h={32}
                alignItems="center"
                justifyContent="center"
              >
                <Feather
                  name="plus"
                  size={24}
                  color={isDark ? '#8C8C8C' : '#9CA3AF'}
                />
              </Box>
            </HStack>
          </Box>
        </Pressable>

        {/* Billing History Section */}
        <VStack space="md" mt="$4">
          {/* Billing History Header */}
          <HStack alignItems="center" justifyContent="space-between" mb="$2">
            <Text
              fontSize={16}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              Billing History
            </Text>
            <HStack space="sm" alignItems="center">
              {/* Date Range Button */}
              <Pressable onPress={handleDateRangePress}>
                <Box
                  bg={isDark ? '$backgroundDark0' : '$backgroundLight0'}
                  borderWidth={1}
                  borderColor={isDark ? '$borderDark600' : '$borderLight200'}
                  borderRadius={20}
                  px="$3"
                  py="$2"
                >
                  <HStack alignItems="center" space="xs">
                    <Text
                      fontSize={10}
                      fontWeight="$medium"
                      color={isDark ? '$textDark50' : '$textLight900'}
                    >
                      {dateRange}
                    </Text>
                    <Feather
                      name="chevron-down"
                      size={14}
                      color={isDark ? '#FFFFFF' : '#000000'}
                    />
                  </HStack>
                </Box>
              </Pressable>

              {/* Sort Button */}
              <Pressable onPress={handleSortPress}>
                <Box
                  bg={isDark ? '$backgroundDark0' : '$backgroundLight0'}
                  borderWidth={1}
                  borderColor={isDark ? '$borderDark600' : '$borderLight200'}
                  borderRadius={20}
                  px="$3"
                  py="$2"
                >
                  <HStack alignItems="center" space="xs">
                    <Text
                      fontSize={10}
                      fontWeight="$medium"
                      color={isDark ? '$textDark50' : '$textLight900'}
                    >
                      Sort
                    </Text>
                    <Feather
                      name="chevron-down"
                      size={14}
                      color={isDark ? '#FFFFFF' : '#000000'}
                    />
                  </HStack>
                </Box>
              </Pressable>
            </HStack>
          </HStack>

          {/* Billing History Entries */}
          {billingHistory.length > 0 && (
            <VStack space="sm">
              {billingHistory.map((entry) => (
                <BillingHistoryEntry
                  key={entry.id}
                  data={entry}
                  onPress={handleBillingEntryPress}
                />
              ))}
            </VStack>
          )}

          {/* Linked Payment Method */}
          <LinkedPaymentMethod
            data={mockLinkedPaymentMethod}
            onViewPress={handleViewPaymentMethod}
          />
        </VStack>
      </VStack>
    </ScrollView>
  );
};

export default PaymentTab;

