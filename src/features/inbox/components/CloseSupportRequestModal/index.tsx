import React, { useState } from 'react';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalBody,
  VStack,
  HStack,
  Text,
  Pressable,
  Box,
  Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import StarRating from '../StarRating';

interface CloseSupportRequestModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (rating: number) => void;
  onReport?: () => void; // Report butonu için callback
  userName: string;
  userTitle: string;
  userAvatar: any;
}

export const CloseSupportRequestModal: React.FC<CloseSupportRequestModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  onReport,
  userName,
  userTitle,
  userAvatar,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [rating, setRating] = useState(0);

  const handleConfirm = () => {
    if (rating > 0) {
      onConfirm(rating);
      setRating(0); // Reset rating for next time
    }
  };

  const handleClose = () => {
    setRating(0); // Reset rating
    onClose();
  };

  return (
    <Modal isOpen={isVisible} onClose={handleClose} flex={1}>
      <ModalBackdrop bg="rgba(0, 0, 0, 0.5)" />
      <ModalContent
        bg={isDark ? '#1A1A1A' : '#FFFFFF'}
        borderRadius={24}
        maxWidth="90%"
        width="90%"
        mx="$4"
        position="relative"
      >
        <ModalBody p="$0">
          <VStack px="$5" py="$5" space="md">
            {/* Report Button - Sağ üst köşede */}
            {onReport && (
              <Box position="absolute" top="$4" right="$4" zIndex={10}>
                <Pressable
                  onPress={onReport}
                  bg={isDark ? '#2A2A2A' : '#F3F4F6'}
                  borderRadius={8}
                  p="$2"
                  borderWidth={1}
                  borderColor={isDark ? '#3A3A3A' : '#E5E7EB'}
                >
                  <Feather
                    name="flag"
                    size={18}
                    color={isDark ? '#FFFFFF' : '#000000'}
                  />
                </Pressable>
              </Box>
            )}

            {/* User Profile Section */}
            <VStack space="sm" alignItems="center">
              {/* User Avatar - Görseldeki gibi pembe border */}
              <Image
                source={userAvatar}
                alt={userName}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  borderWidth: 4,
                  borderColor: '#FF69B4', // Pembe border (görseldeki gibi)
                }}
              />

              {/* User Name */}
              <Text
                fontSize={18}
                fontWeight="$bold"
                color={isDark ? '#FFFFFF' : '#000000'}
                textAlign="center"
              >
                {userName}
              </Text>

              {/* User Title - Görseldeki gibi uzun title */}
              <Text
                fontSize={13}
                fontWeight="$normal"
                color={isDark ? '#8C8C8C' : '#6B7280'}
                textAlign="center"
                numberOfLines={2}
              >
                {userTitle}
              </Text>
            </VStack>

            {/* Divider */}
            <Box height={1} bg={isDark ? '#2A2A2A' : '#E5E7EB'} width="100%" />

            {/* Description Text */}
            <VStack space="sm">
              <Text
                fontSize={14}
                fontWeight="$normal"
                color={isDark ? '#CCCCCC' : '#4B5563'}
                textAlign="center"
                lineHeight={20}
              >
                You are about to close the one-on-one support request with the user.
              </Text>

              <Text
                fontSize={15}
                fontWeight="$semibold"
                color={isDark ? '#FFFFFF' : '#000000'}
                textAlign="center"
              >
                Please rate the process!
              </Text>
            </VStack>

            {/* Star Rating - Görseldeki gibi outline stars */}
            <Box py="$2" alignItems="center">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size={32}
                color="#FFD700"
                outlineColor={isDark ? '#8C8C8C' : '#9CA3AF'}
                showOutline={true}
              />
            </Box>

            {/* Action Buttons - Görseldeki gibi */}
            <VStack space="sm" mt="$2">
              {/* Close Support Request Button - Rating yapıldığında sarı-yeşil, yoksa gri */}
              <Pressable onPress={handleConfirm} disabled={rating === 0}>
                <Box
                  bg={rating > 0 ? '#E8FF6B' : (isDark ? '#2A2A2A' : '#F3F4F6')}
                  borderRadius={16}
                  py="$3"
                  alignItems="center"
                  borderWidth={1}
                  borderColor={rating > 0 ? '#D8FF08' : (isDark ? '#3A3A3A' : '#E5E7EB')}
                  opacity={rating === 0 ? 0.6 : 1}
                >
                  <Text
                    fontSize={15}
                    fontWeight="$semibold"
                    color={rating > 0 ? '#000000' : (isDark ? '#FFFFFF' : '#000000')}
                  >
                    Close Support Request
                  </Text>
                </Box>
              </Pressable>

              {/* Cancel Button - Görseldeki gibi gri */}
              <Pressable onPress={handleClose}>
                <Box
                  bg={isDark ? '#2A2A2A' : '#F3F4F6'}
                  borderRadius={16}
                  py="$3"
                  alignItems="center"
                  borderWidth={1}
                  borderColor={isDark ? '#3A3A3A' : '#E5E7EB'}
                >
                  <Text
                    fontSize={15}
                    fontWeight="$semibold"
                    color={isDark ? '#FFFFFF' : '#000000'}
                  >
                    Cancel
                  </Text>
                </Box>
              </Pressable>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CloseSupportRequestModal;

