import React, { useState } from 'react';
import { Box, Text, Button, ButtonText, VStack, Input, InputField, FormControl, FormControlLabel, FormControlLabelText, Icon, Image, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CheckCircle, Camera, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';

type SetupProfileScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SetupProfile'>;

export const SetupProfileScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SetupProfileScreenNavigationProp>();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const validateUsername = (text: string) => {
    const usernameRegex = /^[a-zA-Z0-9._]{3,}$/;
    setUsername(text);
    setIsUsernameValid(usernameRegex.test(text));
  };

  const handleTakePhoto = async () => {
    try {
      const result = await imagePickerService.pickFromCamera();
      if (result.success && result.asset) {
        setProfileImage(result.asset.uri);
      } else {
        console.error('Fotoğraf çekme hatası:', result.error);
        // TODO: Hata mesajını kullanıcıya göster
      }
    } catch (error) {
      console.error('Kamera hatası:', error);
      // TODO: Hata mesajını kullanıcıya göster
    }
  };

  const handleNext = () => {
    if (fullName && isUsernameValid) {
      console.log('Profile setup:', { fullName, username, profileImage });
      // TODO: API entegrasyonu yapılacak
      navigation.navigate('SelectCategories');
    }
  };

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
      p="$4"
    >
      <VStack flex={1} space="xl" pt="$16">
        <Text
          fontSize="$xl"
          fontWeight="$bold"
          color={isDark ? '$textDark50' : '$textLight900'}
          textAlign="center"
        >
          Set up Profile
        </Text>

        {/* Profile Photo */}
                  <Box alignItems="center" mt="$4">
            <Box position="relative">
              <Box
                rounded="$full"
                justifyContent="center"
                alignItems="center"
                bg="$gray100"
                overflow="hidden"
                style={{ width: 120, height: 120, borderWidth: 1, borderColor: 'red' }}
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    alt="Profile Photo"
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <Icon as={User} size="xl" color="$gray400" />
                )}
              </Box>
              <Pressable
                position="absolute"
                top={80}
                right={-5}
                bg="$white"
                p="$3"
                rounded="$full"
                borderWidth={1}
                borderColor="$gray200"
                onPress={handleTakePhoto}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
              >
                <Icon as={Camera} size="lg" color="$gray800" />
              </Pressable>
            </Box>
          </Box>

        <VStack space="md" mt="$4">
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Full Name</FormControlLabelText>
            </FormControlLabel>
            <Input
              variant="outline"
              size="md"
              bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
              borderColor={isDark ? '$borderDark100' : '$borderLight100'}
            >
              <InputField 
                placeholder="Adınız Soyadınız"
                value={fullName}
                onChangeText={setFullName}
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Username</FormControlLabelText>
            </FormControlLabel>
            <Input
              variant="outline"
              size="md"
              bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
              borderColor={isDark ? '$borderDark100' : '$borderLight100'}
            >
              <InputField 
                placeholder="@kullaniciadi"
                value={username}
                onChangeText={validateUsername}
              />
              <Icon 
                as={CheckCircle} 
                color={isUsernameValid ? "$success500" : "$gray400"} 
                size="md" 
                mr="$2" 
              />
            </Input>
          </FormControl>
        </VStack>

        <Button
          bg="$yellow400"
          py="$1"
          rounded="$lg"
          mt="auto"
          mb="$4"
          onPress={handleNext}
          opacity={fullName && isUsernameValid ? 1 : 0.5}
          disabled={!fullName || !isUsernameValid}
        >
          <ButtonText color="$textLight900">Next</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
};
