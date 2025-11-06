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
  userName: string;
  userTitle: string;
  userAvatar: any;
}

export const CloseSupportRequestModal: React.FC<CloseSupportRequestModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
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
      >
        <ModalBody p="$0">
          <VStack px="$5" py="$5" space="md">
            {/* User Profile Section */}
            <VStack space="sm" alignItems="center">
              {/* User Avatar */}
              <Image
                source={userAvatar}
                alt={userName}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  borderWidth: 3,
                  borderColor: isDark ? '#2A2A2A' : '#E5E7EB',
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

              {/* User Title */}
              <Text
                fontSize={13}
                fontWeight="$normal"
                color={isDark ? '#8C8C8C' : '#6B7280'}
                textAlign="center"
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

            {/* Star Rating */}
            <Box py="$2">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size={36}
                color="#FFD700"
              />
            </Box>

            {/* Action Buttons */}
            <VStack space="sm" mt="$2">
              {/* Close Support Request Button */}
              <Pressable onPress={handleConfirm} disabled={rating === 0}>
                <Box
                  bg={rating > 0 ? '#E8FF6B' : (isDark ? '#2A2A2A' : '#E5E7EB')}
                  borderRadius="$xl"
                  py="$3"
                  alignItems="center"
                  opacity={rating === 0 ? 0.5 : 1}
                >
                  <Text
                    fontSize={15}
                    fontWeight="$semibold"
                    color={rating > 0 ? '#000000' : (isDark ? '#6B7280' : '#9CA3AF')}
                  >
                    Close Support Request
                  </Text>
                </Box>
              </Pressable>

              {/* Cancel Button */}
              <Pressable onPress={handleClose}>
                <Box
                  bg={isDark ? '#2A2A2A' : '#F3F4F6'}
                  borderRadius="$xl"
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

