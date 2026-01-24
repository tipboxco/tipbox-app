import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import {
  VStack,
  HStack,
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
  isFinalize?: boolean; // ✅ FIX: Finalize modal'ı mı yoksa close modal'ı mı?
}

export const CloseSupportRequestModal: React.FC<CloseSupportRequestModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  onReport,
  userName,
  userTitle,
  userAvatar,
  isFinalize = false, // ✅ FIX: Default false (close modal)
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
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <VStack px={24} py={16} space="md" style={styles.modalBody}>
                {/* User Profile Section */}
                <VStack space="sm" alignItems="center">
                  {/* User Avatar - Mor/macenta border */}
                  <Image
                    source={userAvatar}
                    alt={userName}
                    style={{
                      width: 110,
                      height: 110,
                      borderRadius: 55,
                      borderWidth: 4,
                      borderColor: '#C026D3', // Mor/macenta border
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

                  {/* User Title */}
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
                <Box height={1} bg="#E5E7EB" width="100%" my="$1" />

                {/* Description Text */}
                <VStack space="xs" alignItems="center">
                  {isFinalize ? (
                    <>
                      <Text
                        fontSize={14}
                        fontWeight="$normal"
                        color="#4B5563"
                        textAlign="center"
                        lineHeight={20}
                      >
                        You are about to finalize the one-on-one
                      </Text>
                      <Text
                        fontSize={14}
                        fontWeight="$normal"
                        color="#4B5563"
                        textAlign="center"
                        lineHeight={20}
                      >
                        support request with the user.
                      </Text>
                      <Text
                        fontSize={15}
                        fontWeight="$semibold"
                        color="#000000"
                        textAlign="center"
                        mt="$1"
                      >
                        Please rate the process!
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text
                        fontSize={14}
                        fontWeight="$normal"
                        color="#4B5563"
                        textAlign="center"
                        lineHeight={20}
                      >
                        You are about to close the one-on-one
                      </Text>
                      <Text
                        fontSize={14}
                        fontWeight="$normal"
                        color="#4B5563"
                        textAlign="center"
                        lineHeight={20}
                      >
                        support request with the user.
                      </Text>
                      <Text
                        fontSize={15}
                        fontWeight="$semibold"
                        color="#000000"
                        textAlign="center"
                        mt="$1"
                      >
                        Please rate the process!
                      </Text>
                    </>
                  )}
                </VStack>

                {/* Star Rating */}
                <Box py="$2" alignItems="center">
                  <StarRating
                    rating={rating}
                    onRatingChange={setRating}
                    size={36}
                    color="#FFD700"
                    outlineColor="#9CA3AF"
                    showOutline={true}
                  />
                </Box>

                {/* Action Buttons */}
                <VStack space="sm" mt="$2">
                  {/* Close Support Request ve Flag Butonları - Yan yana */}
                  <HStack space="sm" width="100%">
                    {/* Close Support Request Button */}
                    <Box flex={1}>
                      <Pressable onPress={handleConfirm} disabled={rating === 0}>
                        <Box
                          bg={rating > 0 ? '#E8FF6B' : '#F3F4F6'}
                          borderRadius={16}
                          py="$2.5"
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
                            {isFinalize ? 'Finalize Support Request' : 'Close Support Request'}
                          </Text>
                        </Box>
                      </Pressable>
                    </Box>

                    {/* Flag Button */}
                    {onReport && (
                      <Pressable onPress={onReport}>
                        <Box
                          bg="#F3F4F6"
                          borderRadius={16}
                          py="$2.5"
                          px="$4"
                          alignItems="center"
                          justifyContent="center"
                          borderWidth={1}
                          borderColor="#E5E7EB"
                          minWidth={56}
                        >
                          <Feather
                            name="flag"
                            size={20}
                            color="#000000"
                          />
                        </Box>
                      </Pressable>
                    )}
                  </HStack>

                  {/* Cancel Button */}
                  <Pressable onPress={handleClose}>
                    <Box
                      bg="#F3F4F6"
                      borderRadius={16}
                      py="$2.5"
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
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    maxWidth: '90%',
    minWidth: 280,
    maxHeight: '80%',
    width: '90%',
    overflow: 'hidden',
  },
  modalBody: {
    width: '100%',
  },
});

export default CloseSupportRequestModal;

