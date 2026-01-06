import React, { useState } from 'react';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalBody,
  VStack,
  Text,
  Pressable,
  Box,
  Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
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
        bg="#FFFFFF"
        borderRadius={10}
        maxWidth="90%"
        minWidth={280}
        maxHeight="80%"
        alignSelf="center"
        justifyContent="center"
        alignItems="center"
        mx="$4"
        overflow="hidden"
      >
        <ModalBody p="$0">
          <VStack px="$6" py="$6" space="lg">
            {/* Report Button - Sağ üst köşede */}
            {onReport && (
              <Box position="absolute" top="$4" right="$4" zIndex={10}>
                <Pressable
                  onPress={onReport}
                  bg="#F3F4F6"
                  borderRadius={8}
                  p="$2"
                  borderWidth={1}
                  borderColor="#E5E7EB"
                >
                  <Feather
                    name="flag"
                    size={18}
                    color="#000000"
                  />
                </Pressable>
              </Box>
            )}

            {/* User Profile Section */}
            <VStack space="md" alignItems="center" pt="$2">
              {/* User Avatar - Görseldeki gibi pembe border */}
              <Image
                source={userAvatar}
                alt={userName}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  borderWidth: 4,
                  borderColor: '#FF69B4', // Pembe border (görseldeki gibi)
                }}
              />

              {/* User Name */}
              <Text
                fontSize={18}
                fontWeight="$bold"
                color="#000000"
                textAlign="center"
              >
                {userName}
              </Text>

              {/* User Title - Görseldeki gibi uzun title */}
              <Text
                fontSize={13}
                fontWeight="$normal"
                color="#6B7280"
                textAlign="center"
                numberOfLines={2}
              >
                {userTitle}
              </Text>
            </VStack>

            {/* Divider */}
            <Box height={1} bg="#E5E7EB" width="100%" my="$2" />

            {/* Description Text */}
            <VStack space="md" pt="$2">
              <Text
                fontSize={14}
                fontWeight="$normal"
                color="#4B5563"
                textAlign="center"
                lineHeight={20}
              >
                You are about to close the one-on-one support request with the user.
              </Text>

              <Text
                fontSize={15}
                fontWeight="$semibold"
                color="#000000"
                textAlign="center"
              >
                Please rate the process!
              </Text>
            </VStack>

            {/* Star Rating - Görseldeki gibi outline stars */}
            <Box py="$4" alignItems="center">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size={36}
                color="#FFD700"
                outlineColor="#9CA3AF"
                showOutline={true}
              />
            </Box>

            {/* Action Buttons - Görseldeki gibi */}
            <VStack space="md" mt="$4">
              {/* Close Support Request Button - Rating yapıldığında sarı-yeşil, yoksa gri */}
              <Pressable onPress={handleConfirm} disabled={rating === 0}>
                <Box
                  bg={rating > 0 ? '#E8FF6B' : '#F3F4F6'}
                  borderRadius={16}
                  py="$3"
                  alignItems="center"
                  borderWidth={1}
                  borderColor={rating > 0 ? '#D8FF08' : '#E5E7EB'}
                  opacity={rating === 0 ? 0.6 : 1}
                >
                  <Text
                    fontSize={15}
                    fontWeight="$semibold"
                    color="#000000"
                  >
                    Close Support Request
                  </Text>
                </Box>
              </Pressable>

              {/* Cancel Button - Görseldeki gibi gri */}
              <Pressable onPress={handleClose}>
                <Box
                  bg="#F3F4F6"
                  borderRadius={16}
                  py="$3"
                  alignItems="center"
                  borderWidth={1}
                  borderColor="#E5E7EB"
                >
                  <Text
                    fontSize={15}
                    fontWeight="$semibold"
                    color="#000000"
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

