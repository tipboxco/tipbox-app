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

  const handlePopoverOpen = () => {
    setIsPopoverOpen(true);
    if (onPopoverOpenChange) {
      onPopoverOpenChange(true);
    }
  };

  const handlePopoverClose = () => {
    console.log('handlePopoverClose called');
    setIsPopoverOpen(false);
    if (onPopoverOpenChange) {
      onPopoverOpenChange(false);
    }
  };

  // Extract last 4 digits from card number
  const getLastFourDigits = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.slice(-4);
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

  const handleDelete = () => {
    handlePopoverClose();
    if (onDelete) {
      onDelete(data.id);
    }
  };

  return (
    <Pressable onPress={handlePress}>
      <Box
        bg={isDark ? '$backgroundDark0' : '$backgroundLight0'}
        borderWidth={1}
        borderColor={isDark ? '$borderDark600' : '$borderLight200'}
        borderRadius={12}
        p="$4"
      >
        <HStack alignItems="center" justifyContent="space-between">
          <HStack alignItems="center" space="md" flex={1}>
            {/* Card Icon */}
            <Box
              w={40}
              h={40}
              bg={isDark ? '$backgroundDark700' : '$backgroundLight50'}
              borderRadius={8}
              alignItems="center"
              justifyContent="center"
            >
              <Feather
                name="credit-card"
                size={20}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </Box>

            {/* Card Info */}
            <VStack flex={1} space="xs">
              <Text
                fontSize={12}
                fontWeight="$semibold"
                color={isDark ? '$textDark50' : '$textLight900'}
              >
                {data.cardName || 'Card'}
              </Text>
              <Text
                fontSize={10}
                color={isDark ? '$textDark400' : '$textLight500'}
              >
                •••• •••• •••• {getLastFourDigits(data.cardNumber)}
              </Text>
              <Text
                fontSize={9}
                color={isDark ? '$textDark400' : '$textLight500'}
              >
                {data.nameOnCard} • Expires {data.expirationDate}
              </Text>
            </VStack>
          </HStack>

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
                  w={32}
                  h={32}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Feather
                    name="more-vertical"
                    size={18}
                    color={isDark ? '#8C8C8C' : '#9CA3AF'}
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
              borderColor={isDark ? '$borderDark600' : '$borderLight200'}
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
                    borderBottomColor={isDark ? '$borderDark600' : '$borderLight200'}
                  >
                    <HStack space="md" alignItems="center">
                      <Feather
                        name="edit-2"
                        size={16}
                        color={isDark ? '#FFFFFF' : '#000000'}
                      />
                      <Text
                        fontSize={12}
                        fontWeight="$medium"
                        color={isDark ? '$textDark50' : '$textLight900'}
                      >
                        Edit Card Name
                      </Text>
                    </HStack>
                  </Pressable>

                  {/* Delete Card Option */}
                  <Pressable
                    onPress={handleDelete}
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
                        fontSize={12}
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
  );
};

export default SavedCard;

