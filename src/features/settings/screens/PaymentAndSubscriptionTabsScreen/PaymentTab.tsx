import React, { useState, useMemo, useCallback } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  ScrollView,
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  ButtonText,
  Input,
  InputField,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { SavedCard, SavedCardData } from '@/src/features/settings/components/SavedCard';
import { BillingHistoryEntry, BillingHistoryEntryData } from '@/src/features/settings/components/BillingHistoryEntry';
import {
  usePaymentDashboard,
  useInvoices,
  useDeletePaymentMethod,
  useUpdatePaymentMethod,
} from '../../api/hooks';
import type { PaymentApiErrorResponse } from '../../api/paymentApi';
import type { AxiosError } from 'axios';

interface PaymentTabProps {
  onAddPaymentMethod?: () => void;
}

const brandToCardType = (
  brand: string
): 'visa' | 'mastercard' | 'amex' | 'other' => {
  const b = brand?.toLowerCase() ?? '';
  if (b.includes('visa')) return 'visa';
  if (b.includes('master')) return 'mastercard';
  if (b.includes('amex')) return 'amex';
  return 'other';
};

const formatInvoiceDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const PaymentTab: React.FC<PaymentTabProps> = ({ onAddPaymentMethod }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc'>('date_desc');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editCardId, setEditCardId] = useState<string | null>(null);
  const [editCardAlias, setEditCardAlias] = useState('');

  const { data: dashboard, isLoading: isLoadingDashboard } = usePaymentDashboard();
  const { data: invoicesList, isLoading: isLoadingInvoices } = useInvoices({
    sort_by: sortBy,
    limit: 20,
    offset: 0,
  });
  const deleteMutation = useDeletePaymentMethod();
  const updateMutation = useUpdatePaymentMethod();

  const savedCards: SavedCardData[] = useMemo(() => {
    if (!dashboard?.saved_cards) return [];
    return dashboard.saved_cards.map((card) => ({
      id: card.id,
      nameOnCard: card.brand,
      cardNumber: card.last4,
      expirationDate: `${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}`,
      cardName: card.card_alias,
      cardType: brandToCardType(card.brand),
    }));
  }, [dashboard?.saved_cards]);

  const recentInvoices = dashboard?.recent_invoices ?? [];
  const fullInvoices = invoicesList ?? recentInvoices;
  const billingHistory: BillingHistoryEntryData[] = useMemo(() => {
    return fullInvoices.map((inv) => ({
      id: inv.id,
      planName: inv.description ?? 'Invoice',
      date: formatInvoiceDate(inv.date),
      amount: `${inv.amount} ${inv.currency}`,
      cardLastFour: '-',
    }));
  }, [fullInvoices]);

  const isLoading = isLoadingDashboard;

  const handleCardDelete = useCallback(
    (cardId: string) => {
      deleteMutation.mutate(cardId, {
        onError: (err: Error) => {
          const axiosErr = err as AxiosError<PaymentApiErrorResponse>;
          const code = axiosErr.response?.data?.error_code;
          const message =
            code === 'CARD_IN_USE_BY_SUBSCRIPTION'
              ? 'This card is in use by an active subscription. Please change your subscription payment method first.'
              : axiosErr.response?.data?.message ?? 'An error occurred while deleting the card.';
          Alert.alert('Error', message);
        },
      });
    },
    [deleteMutation]
  );

  const handleEditCardName = useCallback((cardId: string) => {
    const card = dashboard?.saved_cards?.find((c) => c.id === cardId);
    setEditCardId(cardId);
    setEditCardAlias(card?.card_alias ?? '');
  }, [dashboard?.saved_cards]);

  const handleSaveEditCardName = useCallback(() => {
    if (!editCardId || !editCardAlias.trim()) return;
    updateMutation.mutate(
      { id: editCardId, body: { card_alias: editCardAlias.trim() } },
      {
        onSuccess: () => setEditCardId(null),
        onError: () => {
          Alert.alert('Error', 'An error occurred while updating the card name.');
        },
      }
    );
  }, [editCardId, editCardAlias, updateMutation]);

  const handleCardPress = useCallback((_cardId: string) => {
    // İsteğe bağlı: detay veya varsayılan yap
  }, []);

  const handleBillingEntryPress = useCallback((_entryId: string) => {
    // İsteğe bağlı: fatura detayı
  }, []);

  const handleSortPress = useCallback(() => {
    setSortBy((prev) => (prev === 'date_desc' ? 'date_asc' : 'date_desc'));
  }, []);

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
        {savedCards.length > 0 && (
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
            if (onAddPaymentMethod) onAddPaymentMethod();
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
          <Text
            fontSize={11}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
            px="$2"
            mb="$2"
          >
            Billing History
          </Text>

          <HStack alignItems="center" justifyContent="flex-end" mb="$3" px="$2">
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
                    {sortBy === 'date_desc' ? 'Date (newest first)' : 'Date (oldest first)'}
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

          {isLoadingInvoices && fullInvoices.length === 0 ? (
            <Box py="$4" alignItems="center">
              <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : billingHistory.length > 0 ? (
            <VStack space="sm">
              {billingHistory.map((entry) => (
                <BillingHistoryEntry
                  key={entry.id}
                  data={entry}
                  onPress={handleBillingEntryPress}
                />
              ))}
            </VStack>
          ) : (
            <Text
              fontSize="$xs"
              color="#B9B9B9"
              px="$2"
              py="$4"
            >
              No invoices yet.
            </Text>
          )}
        </VStack>
      </VStack>

      {/* Edit Card Name Dialog */}
      <AlertDialog isOpen={!!editCardId} onClose={() => setEditCardId(null)}>
        <AlertDialogBackdrop />
        <AlertDialogContent bg={isDark ? '#1A1A1A' : '#FFFFFF'} borderRadius={10} p="$4">
          <AlertDialogHeader mb="$2">
            <Text
              fontSize={16}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              Update card name
            </Text>
          </AlertDialogHeader>
          <AlertDialogBody mb="$4">
            <Input
              size="md"
              borderWidth={1}
              borderColor="#B9B9B9"
              borderRadius={8}
              bg={isDark ? '#2A2A2A' : '#F5F5F5'}
            >
              <InputField
                placeholder="e.g. Work Card"
                placeholderTextColor="#B9B9B9"
                value={editCardAlias}
                onChangeText={setEditCardAlias}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </Input>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack space="md" flex={1}>
              <Button
                flex={1}
                variant="outline"
                onPress={() => setEditCardId(null)}
                borderColor={isDark ? '#333333' : '#E5E5E5'}
                bg="transparent"
              >
                <ButtonText color={isDark ? '#FFFFFF' : '#000000'} fontSize={14} fontWeight="$medium">
                  Cancel
                </ButtonText>
              </Button>
              <Button
                flex={1}
                onPress={handleSaveEditCardName}
                bg="#E2FF46"
              >
                <ButtonText color="#000000" fontSize={14} fontWeight="$bold">
                  Save
                </ButtonText>
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollView>
  );
};

export default PaymentTab;
