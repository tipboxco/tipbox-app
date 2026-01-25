import React, { useState, useMemo } from 'react';
import { ActivityIndicator } from 'react-native';
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
import { usePaymentMethods, useBillingHistory, useLinkedPaymentMethod } from '../../api/hooks';

interface PaymentTabProps {
  onAddPaymentMethod?: () => void;
}


export const PaymentTab: React.FC<PaymentTabProps> = ({ onAddPaymentMethod }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [dateRange, setDateRange] = useState('14 May - 14 July');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // API hooks
  const { data: paymentMethods, isLoading: isLoadingPaymentMethods, error: paymentMethodsError } = usePaymentMethods();
  const { data: billingHistoryData, isLoading: isLoadingBillingHistory, error: billingHistoryError } = useBillingHistory();
  const { data: linkedPaymentMethodData, isLoading: isLoadingLinkedPaymentMethod, error: linkedPaymentMethodError } = useLinkedPaymentMethod();

  // Transform API data to component data
  const savedCards: SavedCardData[] = useMemo(() => {
    if (!paymentMethods) return [];
    return paymentMethods.map((method) => ({
      id: method.id,
      nameOnCard: method.nameOnCard,
      cardNumber: method.cardNumber,
      expirationDate: method.expirationDate,
      cardName: method.cardName,
      cardType: method.cardType,
    }));
  }, [paymentMethods]);

  const billingHistory: BillingHistoryEntryData[] = useMemo(() => {
    if (!billingHistoryData) return [];
    return billingHistoryData.map((entry) => ({
      id: entry.id,
      planName: entry.planName,
      date: entry.date,
      amount: entry.amount,
      cardLastFour: entry.cardLastFour,
    }));
  }, [billingHistoryData]);

  const linkedPaymentMethod: LinkedPaymentMethodData | null = useMemo(() => {
    if (!linkedPaymentMethodData) return null;
    return {
      cardType: linkedPaymentMethodData.cardType,
      cardNumber: linkedPaymentMethodData.cardNumber,
    };
  }, [linkedPaymentMethodData]);

  const isLoading = isLoadingPaymentMethods || isLoadingBillingHistory || isLoadingLinkedPaymentMethod;

  const handleCardDelete = (cardId: string) => {
    // TODO: Implement delete payment method API call
    console.log('Delete card:', cardId);
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

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" py="$10">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }

  return (
    <ScrollView 
      flex={1} 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={{ paddingHorizontal: 0 }}
      scrollEnabled={!isPopoverOpen}
    >
      <VStack space="lg" pt="$4">
        {/* Saved Cards Section */}
        {savedCards && savedCards.length > 0 && (
          <VStack space="md">
            <Text
              fontSize="$sm"
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
                fontSize="$sm"
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
                    fontSize="$xs"
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
                    fontSize="$xs"
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
          {billingHistory && billingHistory.length > 0 && (
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
          {linkedPaymentMethod && (
            <LinkedPaymentMethod
              data={linkedPaymentMethod}
              onViewPress={handleViewPaymentMethod}
            />
          )}
        </VStack>
      </VStack>
    </ScrollView>
  );
};

export default PaymentTab;
