import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, HStack, Input, InputField, FormControl, FormControlLabel, FormControlLabelText, Icon, Image, Pressable, Spinner, ScrollView } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CheckCircle, Camera, User } from 'lucide-react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../navigation';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { toImageSource } from '@/src/utils';
import { useSetupProfile, useCheckUsernameAvailability, useUsernameSuggestions } from '../api/hooks';
import { Alert } from 'react-native';
import * as yup from 'yup';
import { useAppStore } from '@/src/store/appStore';
import { getCurrentUser } from '../api/authApi';

type SetupProfileScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SetupProfile'>;
type SetupProfileScreenRouteProp = RouteProp<AuthStackParamList, 'SetupProfile'>;

export const SetupProfileScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SetupProfileScreenNavigationProp>();
  const route = useRoute<SetupProfileScreenRouteProp>();
  const setupProfileMutation = useSetupProfile();
  const insets = useSafeAreaInsets();
  
  // Edge-to-Edge Design: Top ve bottom insets için beyaz background
  const backgroundColor = '#FFFFFF';

  const { user } = useAppStore();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ fullName?: string; username?: string }>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Array<{
    categoryId: string;
    subCategoryIds: string[];
  }>>([]);
  
  // Debounce için username state
  const [debouncedUsername, setDebouncedUsername] = useState('');
  
  // Username availability check (debounced)
  const shouldCheckUsername = Boolean(debouncedUsername && debouncedUsername.length >= 3 && /^[a-zA-Z0-9_]+$/.test(debouncedUsername));
  const usernameCheck = useCheckUsernameAvailability(debouncedUsername, shouldCheckUsername);
  
  // Username suggestions (sadece username alınmışsa)
  const shouldFetchSuggestions = Boolean(shouldCheckUsername && usernameCheck.data?.isValid && !usernameCheck.data?.isAvailable);
  const usernameSuggestions = useUsernameSuggestions(debouncedUsername, 5, shouldFetchSuggestions);
  
  // Debounce username input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username);
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [username]);
  
  // Username check sonuçlarını işle
  useEffect(() => {
    if (usernameCheck.data) {
      setIsUsernameAvailable(usernameCheck.data.isAvailable);
      if (!usernameCheck.data.isValid) {
        setErrors((prev) => ({ ...prev, username: usernameCheck.data.message || 'Invalid username format' }));
        setIsUsernameValid(false);
      } else if (!usernameCheck.data.isAvailable) {
        setErrors((prev) => ({ ...prev, username: usernameCheck.data.message || 'This username is already taken' }));
        setIsUsernameValid(false);
        setShowSuggestions(true);
      } else {
        setErrors((prev) => ({ ...prev, username: undefined }));
        setIsUsernameValid(true);
        setShowSuggestions(false);
      }
    }
  }, [usernameCheck.data]);

  // Yup validation schema
  const validationSchema = yup.object().shape({
    fullName: yup
      .string()
      .required('Full name is required')
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must be at most 100 characters'),
    username: yup
      .string()
      .required('Username is required')
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  });

  // SelectAvatar ve SelectCategories ekranlarından dönen verileri al
  useFocusEffect(
    React.useCallback(() => {
      const params = route.params as any;
      
      // Avatar data'yı al (sadece yeni avatar seçildiyse)
      if (params?.avatarData) {
        if (params.avatarData.type === 'upload') {
          setProfileImage(params.avatarData.uri);
        } else if (params.avatarData.type === 'avatar') {
          setProfileImage(`avatar://${params.avatarData.id}`);
        }
        // Avatar data'yı params'tan temizle, ama diğer state'leri koru
        navigation.setParams({ 
          ...params,
          avatarData: undefined 
        } as any);
      }
      
      // SelectedCategories'i al ve state'te tut (SelectCategories'den döndüğünde)
      if (params?.selectedCategories && Array.isArray(params.selectedCategories) && params.selectedCategories.length > 0) {
        setSelectedCategories(params.selectedCategories);
        // selectedCategories'i params'tan temizleme, çünkü handleNext'te kullanılacak
      }
    }, [route.params, navigation])
  );

  const validateUsername = (text: string) => {
    // @ işaretini kaldır ve sadece alfanumerik karakterleri kabul et
    const cleanText = text.replace(/^@+/, '').replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(cleanText);
    setShowSuggestions(false);
    setIsUsernameAvailable(null);
    
    // Yup validation (format kontrolü)
    validationSchema
      .validateAt('username', { username: cleanText })
      .then(() => {
        // Format geçerli, availability check debounce ile yapılacak
        if (cleanText.length < 3) {
          setIsUsernameValid(false);
          setErrors((prev) => ({ ...prev, username: undefined }));
        }
      })
      .catch((err) => {
        setIsUsernameValid(false);
        setIsUsernameAvailable(null);
        setErrors((prev) => ({ ...prev, username: err.message }));
      });
  };
  
  const handleSelectSuggestion = (suggestedUsername: string) => {
    setUsername(suggestedUsername);
    setShowSuggestions(false);
  };

  const validateFullName = (text: string) => {
    setFullName(text);
    
    // Yup validation
    validationSchema
      .validateAt('fullName', { fullName: text })
      .then(() => {
        setErrors((prev) => ({ ...prev, fullName: undefined }));
      })
      .catch((err) => {
        setErrors((prev) => ({ ...prev, fullName: err.message }));
      });
  };

  const handleSelectAvatar = () => {
    // Avatar seçim ekranına yönlendir
    // Mevcut selectedCategories varsa onu da koru
    const currentParams = route.params as any;
    navigation.navigate('SelectAvatar', {
      selectedCategories: selectedCategories.length > 0 
        ? selectedCategories 
        : currentParams?.selectedCategories
    });
  };

  const handleNext = async () => {
    // Yup validation
    try {
      await validationSchema.validate({ fullName: fullName.trim(), username: username.trim() }, { abortEarly: false });
      
      // selectedCategories kontrolü - önce state'ten, sonra params'tan al
      const categoriesToUse = selectedCategories.length > 0 
        ? selectedCategories 
        : (route.params as any)?.selectedCategories;
      
      if (!categoriesToUse || categoriesToUse.length === 0) {
        Alert.alert('Error', 'Please select categories');
        // Mevcut input değerlerini koruyarak SelectCategories'e git
        navigation.navigate('SelectCategories');
        return;
      }

      // User ID'yi backend'den al (/auth/me endpoint'inden)
      let userId = user?.id;
      if (!userId) {
        try {
          const currentUser = await getCurrentUser();
          userId = String(currentUser.id); // Number'ı string'e çevir
        } catch (error) {
          console.error('[SetupProfileScreen] Failed to get user ID:', error);
          Alert.alert('Error', 'Failed to get user information. Please try again.');
          return;
        }
      }

      try {
        // API'ye profil bilgilerini gönder
        // Backend sadece selectedCategories array'ini bekliyor (userId gereksiz)
        await setupProfileMutation.mutateAsync({
          fullName: fullName.trim(),
          username: username.trim(),
          profileImage: profileImage || undefined,
          selectCategories: categoriesToUse,
        });

        // Başarılı olursa Onboarding ekranına yönlendir
        navigation.navigate('Onboarding');
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred while saving profile information.';
        Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
        console.error('[SetupProfileScreen] Profile setup error:', error);
      }
    } catch (validationError: any) {
      // Yup validation errors
      const validationErrors: { fullName?: string; username?: string } = {};
      if (validationError.inner) {
        validationError.inner.forEach((err: any) => {
          if (err.path) {
            validationErrors[err.path as keyof typeof validationErrors] = err.message;
          }
        });
      }
      setErrors(validationErrors);
      
      if (validationErrors.fullName) {
        Alert.alert('Validation Error', validationErrors.fullName);
      } else if (validationErrors.username) {
        Alert.alert('Validation Error', validationErrors.username);
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top', 'bottom']}>
      {/* Ana İçerik */}
      <Box
        flex={1}
        bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
        p="$4"
      >
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space="xl" pt="$4" pb="$4">
          <Text
            fontSize="$xl"
            fontWeight="$bold"
            color={isDark ? '$textDark50' : '$textLight900'}
            textAlign="center"
          >
            Enter Your Profile Information
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
              style={{ width: 120, height: 120 }}
            >
              {profileImage && !profileImage.startsWith('avatar://') ? (
                <Image
                  source={toImageSource(profileImage)}
                  alt="Profile Photo"
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : profileImage && profileImage.startsWith('avatar://') ? (
                <Image
                  source={require('@/assets/avatar/default-useravatar.png')}
                  alt="Avatar"
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
              onPress={handleSelectAvatar}
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
                placeholder="Your full name"
                value={fullName}
                onChangeText={validateFullName}
              />
              {errors.fullName && (
                <Text fontSize="$xs" color="$error500" mt="$1" px="$3">
                  {errors.fullName}
                </Text>
              )}
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
              <HStack alignItems="center" pl="$3" flex={1} >
                <Text color={isDark ? '$textDark50' : '$textLight900'} fontSize="$md">@</Text>
                <InputField 
                  placeholder="username"
                  value={username}
                  onChangeText={validateUsername}
                  flex={1}
                  pl="$0"
                />
                {usernameCheck.isLoading ? (
                  <Spinner size="small" color={isDark ? '$textDark300' : '$textLight600'} mr="$2" />
                ) : (
                  <Icon 
                    as={CheckCircle} 
                    color={isUsernameValid && isUsernameAvailable === true ? "$success500" : "$gray400"} 
                    size="md" 
                    mr="$2" 
                  />
                )}
              </HStack>
            </Input>
            {errors.username && (
              <Text fontSize="$xs" color="$error500" mt="$1" px="$3">
                {errors.username}
              </Text>
            )}
            {/* Username availability status */}
            {username.length >= 3 && !usernameCheck.isLoading && usernameCheck.data && (
              <Text fontSize="$xs" color={usernameCheck.data.isAvailable ? "$success500" : "$error500"} mt="$1" px="$3">
                {usernameCheck.data.isAvailable ? '✓ Username available' : usernameCheck.data.message}
              </Text>
            )}
            {usernameCheck.isLoading && username.length >= 3 && (
              <HStack alignItems="center" mt="$1" px="$3" space="xs">
                <Spinner size="small" color={isDark ? '$textDark300' : '$textLight600'} />
                <Text fontSize="$xs" color={isDark ? '$textDark300' : '$textLight600'}>
                  Checking...
                </Text>
              </HStack>
            )}
            {/* Username suggestions */}
            {showSuggestions && usernameSuggestions.data?.suggestions && usernameSuggestions.data.suggestions.length > 0 && (
              <Box mt="$2" px="$3">
                <Text fontSize="$xs" color={isDark ? '$textDark300' : '$textLight600'} mb="$2">
                  Suggested usernames:
                </Text>
                <VStack space="xs">
                  {usernameSuggestions.data.suggestions.map((suggestion, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleSelectSuggestion(suggestion)}
                      bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
                      px="$3"
                      py="$2"
                      rounded="$md"
                      borderWidth={1}
                      borderColor={isDark ? '$borderDark100' : '$borderLight100'}
                    >
                      <HStack alignItems="center" space="sm">
                        <Text fontSize="$sm" color={isDark ? '$textDark50' : '$textLight900'}>
                          @{suggestion}
                        </Text>
                        <Icon as={CheckCircle} size="sm" color="$success500" />
                      </HStack>
                    </Pressable>
                  ))}
                </VStack>
              </Box>
            )}
          </FormControl>
        </VStack>

          <Button
            bg="$buttonPrimary"
            py="$1"
            rounded="$lg"
            mt="auto"
            mb="$4"
            onPress={handleNext}
            opacity={fullName.trim() && isUsernameValid && isUsernameAvailable === true && username.trim().length >= 3 && !setupProfileMutation.isPending && !errors.fullName && !errors.username ? 1 : 0.5}
            disabled={!fullName.trim() || !isUsernameValid || isUsernameAvailable !== true || username.trim().length < 3 || setupProfileMutation.isPending || !!errors.fullName || !!errors.username}
          >
            {setupProfileMutation.isPending ? (
              <Spinner size="small" color="$textLight900" />
            ) : (
              <ButtonText color="$textLight900">Continue</ButtonText>
            )}
          </Button>
        </VStack>
      </ScrollView>
      </Box>
    </SafeAreaView>
  );
};
