import React from 'react';
import { Dimensions } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Pressable,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface BadgeDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  data: SeeAllReward | null;
}

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
  isVisible,
  onClose,
  data,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  if (!data) return null;

  return (
    <Modal style={{ flex: 1 }} isOpen={isVisible} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent
        bg={isDark ? '#1A1A1A' : '#FFFFFF'}
        borderRadius={16}
        maxWidth={width * 0.85}
        maxHeight={height * 0.6}
        alignSelf="center"
        justifyContent="center"
      >
        <ModalHeader
          borderBottomWidth={0}
          mb="$5"
        >
          <VStack space="md" alignItems="center" w="100%" px="$4" pt="$4">
            {/* Badge Title */}
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={16}
              fontWeight="$bold"
              textAlign="center"
            >
              {data.title}
            </Text>

            {/* Instruction Text */}
            <Text
              color={isDark ? '#CCCCCC' : '#000000'}
              fontSize={12}
              textAlign="center"
              px="$2"
            >
              "{data.title}" rozetini kazanmak için en az {data.task} gönderi paylaşmalısın.
            </Text>

            {/* Badge Image */}
            <Image
              source={data.image}
              alt={data.title}
              width={180}
              height={180}
            />
          </VStack>
        </ModalHeader>

        <ModalBody pt="$0" pb="$4">
          <VStack space="md" px={'$4'}>
            <Box
              w="100%"
              h={5}
              bg={isDark ? '$backgroundDark700' : '#E0E0E0'}
              borderRadius={10}
              overflow="hidden"
            >
              <Box
                w={`${((data.completed || 0) / (data.task || 1)) * 100}%`}
                h="100%"
                bg={data.isUnlocked ? '#0C7A24' : '#686868'}
              />
            </Box>
            <Text
              color={isDark ? '$textDark400' : '#797979'}
              fontSize={9}
              textAlign="center"
            >
              {data.isUnlocked ? 'Completed' : `${data.completed || 0}/${data.task || 1}`}
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth={0} pt="$0">
          <VStack space="sm" w="100%" px="$4" pb="$4">
            <Button
              bg="#C2E607"
              borderRadius={8}
              h={48}
              onPress={onClose}
            >
              <ButtonText
                color="#000000"
                fontSize={16}
                fontWeight="$bold"
              >
                Continue
              </ButtonText>
            </Button>
          </VStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BadgeDetailModal;
