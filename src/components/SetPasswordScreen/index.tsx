import React, { useState } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  ButtonText,
  Input,
  InputField
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';

interface SetPasswordScreenProps {
  headerTitle: string;
  onSetPassword: (newPassword: string, confirmPassword: string) => void;
  onBackPress?: () => void;
  isLoading?: boolean;
}

export const SetPasswordScreen = ({
  headerTitle,
  onSetPassword,
  onBackPress,
  isLoading = false
}: SetPasswordScreenProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSetPassword = () => {
    if (newPassword && confirmPassword) {
      onSetPassword(newPassword, confirmPassword);
    }
  };

  const isFormValid = newPassword.length > 0 && confirmPassword.length > 0;

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
    >
      <Header
        title={headerTitle}
        showBackButton={!!onBackPress}
        onBackPress={onBackPress}
      />
      
      <VStack flex={1} space="lg" p="$4" pt="$16">
        {/* New Password Section */}
        <VStack space="xs">
          <Text
            fontSize="$sm"
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
                fontSize="$sm"
              />
            </Input>
          </Box>
        </VStack>

        {/* Confirm New Password Section */}
        <VStack space="xs">
          <Text
            fontSize="$sm"
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
                fontSize="$sm"
              />
            </Input>
          </Box>
        </VStack>

        {/* Change Password Button */}
        <Button
          bg="#E2FF46"
          borderRadius={8}
          onPress={handleSetPassword}
          opacity={isFormValid ? 1 : 0.5}
          disabled={!isFormValid || isLoading}
        >
          <ButtonText
            color="#000000"
            fontSize="$sm"
            fontWeight="$bold"
            textAlign="center"
          >
            {isLoading ? 'Setting Password...' : 'Change Password'}
          </ButtonText>
        </Button>
      </VStack>
    </Box>
  );
};

export default SetPasswordScreen;
