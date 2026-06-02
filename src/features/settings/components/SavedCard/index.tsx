import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Popover,
  PopoverBackdrop,
  PopoverContent,
  PopoverBody,
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

export interface SavedCardData {
  id: string;
  nameOnCard: string;
  cardNumber: string; // Last 4 digits will be shown
  expirationDate: string;
  cardName?: string;
  cardType?: 'visa' | 'mastercard' | 'amex' | 'other';
}

interface SavedCardProps {
  data: SavedCardData;
  onPress?: (cardId: string) => void;
  onDelete?: (cardId: string) => void;
  onEditCardName?: (cardId: string) => void;
  onPopoverOpenChange?: (isOpen: boolean) => void;
}

export const SavedCard: React.FC<SavedCardProps> = ({ data, onPress, onDelete, onEditCardName, onPopoverOpenChange }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handlePopoverOpen = () => {
    setIsPopoverOpen(true);
    if (onPopoverOpenChange) {
      onPopoverOpenChange(true);
    }
  };

  const handlePopoverClose = () => {
    setIsPopoverOpen(false);
    if (onPopoverOpenChange) {
      onPopoverOpenChange(false);
    }
  };

  // Format card number: API'den last4 veya tam numara; maskeli gösterim
  const formatCardNumber = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    const last4 = cleaned.slice(-4);
    return `**** - **** - **** - **${last4}`;
  };

  const handlePress = () => {
    if (onPress) {
      onPress(data.id);
    }
  };

  const handleEditCardName = () => {
    handlePopoverClose();
    if (onEditCardName) {
      onEditCardName(data.id);
    }
  };

  const handleDeleteClick = () => {
    handlePopoverClose();
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    if (onDelete) {
      onDelete(data.id);
    }
  };

  return (
    <>
      <Pressable onPress={handlePress}>
        <Box
          bg={isDark ? '#1A1A1A' : '#FFFFFF'}
          borderWidth={1}
          borderColor={isDark ? '#555555' : '#B9B9B9'}
          borderRadius={10}
          p="$4"
          mb="$3"
        >
          <HStack alignItems="center" justifyContent="space-between">
            <VStack flex={1} space="xs">
              {data.cardName && (
                <Text
                  fontSize={11}
                  fontWeight="$bold"
                  color={isDark ? '#FFFFFF' : '#000000'}
                >
                  {data.cardName}
                </Text>
              )}
              <Text
                fontSize={11}
                fontWeight="$normal"
                color={isDark ? '#FFFFFF' : '#000000'}
              >
                {data.nameOnCard}
              </Text>
              <Text
                fontSize={10}
                fontWeight="$normal"
                color="#B9B9B9"
              >
                {formatCardNumber(data.cardNumber)}
              </Text>
            </VStack>

            {/* Menu Button with Popover */}
            <Popover
              isOpen={isPopoverOpen}
              onClose={handlePopoverClose}
              placement="bottom right"
              trigger={(triggerProps) => (
                <Pressable
                  {...triggerProps}
                  ml="$2"
                  onPress={(e) => {
                    e.stopPropagation();
                    (triggerProps as any)?.onPress?.(e);
                    handlePopoverOpen();
                  }}
                >
                  <Box
                    w={24}
                    h={24}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Feather
                      name="more-vertical"
                      size={18}
                      color={isDark ? '#666666' : '#999999'}
                    />
                  </Box>
                </Pressable>
              )}
            >
              <PopoverBackdrop onPress={handlePopoverClose} />
              <PopoverContent
                width={180}
                bg={isDark ? '#1F1F1F' : '#FFFFFF'}
                borderWidth={1}
                borderColor={isDark ? '#333333' : '#E5E5E5'}
                borderRadius={8}
                pointerEvents="box-none"
              >
                <PopoverBody p={0} pointerEvents="auto">
                  <VStack>
                    {/* Edit Card Name Option */}
                    <Pressable
                      onPress={handleEditCardName}
                      px={16}
                      py={14}
                      borderBottomWidth={1}
                      borderBottomColor={isDark ? '#333333' : '#E5E5E5'}
                    >
                      <HStack space="md" alignItems="center">
                        <Feather
                          name="edit-2"
                          size={16}
                          color={isDark ? '#FFFFFF' : '#000000'}
                        />
                        <Text
                          fontSize={11}
                          fontWeight="$medium"
                          color={isDark ? '#FFFFFF' : '#000000'}
                        >
                          Edit Card Name
                        </Text>
                      </HStack>
                    </Pressable>

                    {/* Delete Card Option */}
                    <Pressable
                      onPress={handleDeleteClick}
                      px={16}
                      py={14}
                    >
                      <HStack space="md" alignItems="center">
                        <Feather
                          name="trash-2"
                          size={16}
                          color={isDark ? '#EF4444' : '#DC2626'}
                        />
                        <Text
                          fontSize={11}
                          fontWeight="$medium"
                          color={isDark ? '#EF4444' : '#DC2626'}
                        >
                          Delete Card
                        </Text>
                      </HStack>
                    </Pressable>
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </HStack>
        </Box>
      </Pressable>

      {/* Delete Confirmation Dialog */}
      <AlertDialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent bg={isDark ? '#1A1A1A' : '#FFFFFF'} borderRadius={10} p="$4">
          <AlertDialogHeader mb="$4">
            <Text
              fontSize={16}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
              textAlign="center"
            >
              Are you sure you want to delete this saved card?
            </Text>
          </AlertDialogHeader>
          <AlertDialogBody mb="$4">
            <Text
              fontSize={11}
              color={isDark ? '#FFFFFF' : '#000000'}
              textAlign="center"
            >
              Your card named "{data.cardName || 'Card'}" will be deleted. This action cannot be undone.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack space="md" flex={1}>
              <Button
                flex={1}
                variant="outline"
                onPress={() => setShowDeleteDialog(false)}
                borderColor={isDark ? '#333333' : '#E5E5E5'}
                bg="transparent"
              >
                <ButtonText color={isDark ? '#FFFFFF' : '#000000'} fontSize={14} fontWeight="$medium">
                  Cancel
                </ButtonText>
              </Button>
              <Button
                flex={1}
                onPress={handleDeleteConfirm}
                bg="transparent"
              >
                <ButtonText color="#CE4A4A" fontSize={14} fontWeight="$bold">
                  Delete
                </ButtonText>
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SavedCard;
