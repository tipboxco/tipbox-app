import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';

interface ChangePasswordBottomSheetProps {
  onClose: () => void;
}

export const ChangePasswordBottomSheet = ({ onClose }: ChangePasswordBottomSheetProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <VStack flex={1} px="$4" py="$4">
      {/* Header */}
      <HStack justifyContent="center" alignItems="center" mb="$4">
        <Text
          fontSize={16}
          fontWeight="$bold"
          color={isDark ? '#FFFFFF' : '#000000'}
          textAlign="center"
        >
          Change Password
        </Text>
        <Box w={24} h={24} />
      </HStack>

      <HStack mb="$4">
        <Text
          fontSize={11}
          fontWeight="$semibold"
          color={isDark ? '#FFFFFF' : '#000000'}
        >
          Lorem Ipsum is simply dummy text of the printing and typesetting industry.
        </Text>
      </HStack>

      {/* Current Password Section */}
      <VStack space="md" mb="$4">
        <VStack space="xs">
          <Text
            fontSize={11}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
          >
            Current Password
          </Text>
          <Box
            borderWidth={1}
            borderColor="#B9B9B9"
            borderRadius={10}
            px="$4"
            py="$1"
            mt={'$1'}
          >
            <Input borderWidth={0} bg="transparent">
              <InputField
                placeholder="****************"
                placeholderTextColor="#B9B9B9"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={11}
              />
            </Input>
          </Box>
        </VStack>

        <HStack justifyContent="space-between" alignItems="center">
          <Text
            fontSize={9}
            fontWeight="$semibold"
            color="#B9B9B9"
          >
            Son güncelleme: 26.03.2025
          </Text>
          <Pressable
            onPress={() => {
              onClose();
              navigation.navigate('ForgotPassword' as never);
            }}
          >
            <Text
              fontSize={9}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
              underline
            >
              Forgot Password
            </Text>
          </Pressable>
        </HStack>
      </VStack>

      {/* Divider */}
      <Box
        height={1}
        bg="#D9D9D9"
        mb="$4"
      />

      {/* New Password Section */}
      <VStack space="lg" mb="$4">
        <VStack space="xs">
          <Text
            fontSize={11}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
          >
            New Password
          </Text>
          <Box
            borderWidth={1}
            borderColor="#B9B9B9"
            borderRadius={10}
            px="$4"
            py="$1"
            mt={'$1'}
          >
            <Input borderWidth={0} bg="transparent">
              <InputField
                placeholder="****************"
                placeholderTextColor="#B9B9B9"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={11}
              />
            </Input>
          </Box>
        </VStack>

        <VStack space="xs">
          <Text
            fontSize={11}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
          >
            Confirm New Password
          </Text>
          <Box
            borderWidth={1}
            borderColor="#B9B9B9"
            borderRadius={10}
            px="$4"
            py="$1"
            mt={'$1'}
          >
            <Input borderWidth={0} bg="transparent">
              <InputField
                placeholder="****************"
                placeholderTextColor="#B9B9B9"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={11}
              />
            </Input>
          </Box>
        </VStack>
      </VStack>

      {/* Change Password Button */}
      <Button
        bg="#E2FF46"
        borderRadius={8}
        onPress={() => {
          console.log('Password change requested');
          onClose();
        }}
      >
        <ButtonText
          color="#000000"
          fontSize={14}
          fontWeight="$bold"
          textAlign="center"
        >
          Change Password
        </ButtonText>
      </Button>
    </VStack>
  );
};

export default ChangePasswordBottomSheet;
