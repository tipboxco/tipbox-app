import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  ScrollView,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { SavedCard, SavedCardData } from '@/src/features/settings/components/SavedCard';
import { BillingHistoryEntry, BillingHistoryEntryData } from '@/src/features/settings/components/BillingHistoryEntry';
import { LinkedPaymentMethod, LinkedPaymentMethodData } from '@/src/features/settings/components/LinkedPaymentMethod';

interface PaymentTabProps {
  onAddPaymentMethod?: () => void;
}

// Mock saved cards data - This should come from your state management or API
const mockSavedCards: SavedCardData[] = [
  {
    id: '1',
    nameOnCard: 'Ozan Mutluoglu',
    cardNumber: '520939843945',
    expirationDate: '12/25',
    cardName: 'Work Card',
    cardType: 'mastercard',
  },
  {
    id: '2',
    nameOnCard: 'Ozan Mutluoglu',
    cardNumber: '520939843945',
    expirationDate: '12/25',
    cardType: 'mastercard',
  },
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
      <VStack space="lg" pt="$4">
        {/* Saved Cards Section */}
        {savedCards.length > 0 && (
          <VStack space="md">
            <Text
              fontSize={11}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
              px="$2"
            >
              Saved Cards
            </Text>
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
            bg={isDark ? '#1A1A1A' : '#F5F5F5'}
            borderRadius={10}
            px="$4"
            py="$4"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <HStack alignItems="center" space="md" flex={1}>
              <Feather
                name="credit-card"
                size={24}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
              <Text
                fontSize={11}
                fontWeight="$bold"
                color={isDark ? '#FFFFFF' : '#000000'}
              >
                Add Payment Method
              </Text>
            </HStack>
            <Feather
              name="plus"
              size={24}
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </Box>
        </Pressable>

        {/* Billing History Section */}
        <VStack space="md" mt="$4">
          {/* Billing History Header */}
          <Text
            fontSize={11}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
            px="$2"
            mb="$2"
          >
            Billing History
          </Text>

          <HStack alignItems="center" justifyContent="space-between" mb="$3" px="$2">
            {/* Date Range Button */}
            <Pressable onPress={handleDateRangePress}>
              <Box
                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                borderWidth={1}
                borderColor="#B9B9B9"
                borderRadius={20}
                px="$3"
                py="$2"
              >
                <HStack alignItems="center" space="xs">
                  <Text
                    fontSize={10}
                    fontWeight="$medium"
                    color={isDark ? '#FFFFFF' : '#000000'}
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
                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                borderWidth={1}
                borderColor="#B9B9B9"
                borderRadius={20}
                px="$3"
                py="$2"
              >
                <HStack alignItems="center" space="xs">
                  <Text
                    fontSize={10}
                    fontWeight="$medium"
                    color={isDark ? '#FFFFFF' : '#000000'}
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
