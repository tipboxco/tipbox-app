import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, HStack, ScrollView, Pressable, Image, Icon, Spinner } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Camera, Upload, Check } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../navigation';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { toImageSource } from '@/src/utils';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SelectAvatarScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SelectAvatar'>;
type SelectAvatarScreenRouteProp = RouteProp<AuthStackParamList, 'SelectAvatar'>;

// Mock avatar listesi - API'den gelecek
const MOCK_AVATARS = [
  { id: '1', image: require('@/assets/avatar/default-useravatar.png') },
  { id: '2', image: require('@/assets/avatar/default-useravatar.png') },
  { id: '3', image: require('@/assets/avatar/default-useravatar.png') },
  { id: '4', image: require('@/assets/avatar/default-useravatar.png') },
  { id: '5', image: require('@/assets/avatar/default-useravatar.png') },
  { id: '6', image: require('@/assets/avatar/default-useravatar.png') },
  { id: '7', image: require('@/assets/avatar/default-useravatar.png') },
  { id: '8', image: require('@/assets/avatar/default-useravatar.png') },
  { id: '9', image: require('@/assets/avatar/default-useravatar.png') },
  { id: '10', image: require('@/assets/avatar/default-useravatar.png') },
  { id: '11', image: require('@/assets/avatar/default-useravatar.png') },
  { id: '12', image: require('@/assets/avatar/default-useravatar.png') },
];

export const SelectAvatarScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SelectAvatarScreenNavigationProp>();
  const route = useRoute<SelectAvatarScreenRouteProp>();
  const insets = useSafeAreaInsets();
  
  // Edge-to-Edge Design: Top ve bottom insets için beyaz background
  const backgroundColor = '#FFFFFF';

  const [activeTab, setActiveTab] = useState<'avatars' | 'upload'>('avatars');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSelectAvatar = (avatarId: string) => {
    setSelectedAvatarId(avatarId);
    setUploadedImage(null); // Upload edilen görseli temizle
  };

  const handlePickFromGallery = async () => {
    try {
      setIsUploading(true);
      const result = await imagePickerService.pickFromGallery();
      
      if (result.success && result.asset) {
        setUploadedImage(result.asset.uri);
        setSelectedAvatarId(null); // Avatar seçimini temizle
      } else {
        Alert.alert('Error', result.error || 'An error occurred while selecting photo');
      }
    } catch (error: any) {
      console.error('[SelectAvatarScreen] Gallery pick error:', error);
      Alert.alert('Error', 'An error occurred while selecting photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setIsUploading(true);
      const result = await imagePickerService.pickFromCamera();
      
      if (result.success && result.asset) {
        setUploadedImage(result.asset.uri);
        setSelectedAvatarId(null); // Avatar seçimini temizle
      } else {
        Alert.alert('Error', result.error || 'An error occurred while taking photo');
      }
    } catch (error: any) {
      console.error('[SelectAvatarScreen] Camera error:', error);
      Alert.alert('Error', 'An error occurred while taking photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleNext = () => {
    // Seçilen avatar veya upload edilen görseli geri gönder
    if (selectedAvatarId || uploadedImage) {
      const avatarData = uploadedImage 
        ? { type: 'upload' as const, uri: uploadedImage }
        : { type: 'avatar' as const, id: selectedAvatarId! };
      
      // SetupProfile ekranına navigate et ve avatar bilgisini params ile gönder
      // Mevcut selectedCategories varsa onu da koru
      const currentParams = route.params as any;
      navigation.navigate('SetupProfile', { 
        avatarData,
        selectedCategories: currentParams?.selectedCategories 
      });
    }
  };

  const hasSelection = selectedAvatarId !== null || uploadedImage !== null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top', 'bottom']}>
      {/* Üst Güvenli Alan - Status Bar arkasını beyaz boyar */}


      {/* Ana İçerik */}
        <Box
          flex={1}
          bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
          p="$4"
        >
          <VStack flex={1} space="md"  >
            <Text
              fontSize="$2xl"
              fontWeight="$bold"
              color={isDark ? '$textDark50' : '$textLight900'}
              textAlign="center"
            >
              Set Up Profile
            </Text>

            {/* Tab Buttons */}
            <HStack space="sm" justifyContent="center" mt="$4">
              <Pressable
                onPress={() => setActiveTab('avatars')}
                bg={activeTab === 'avatars' ? '$buttonPrimary' : isDark ? '$backgroundDark100' : '$backgroundLight100'}
                px="$6"
                py="$2"
                rounded="$full"
              >
                <Text
                  color={activeTab === 'avatars' ? '$textLight900' : isDark ? '$textDark50' : '$textLight900'}
                  fontWeight="$bold"
                  fontSize="$sm"
                >
                  Avatars
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('upload')}
                bg={activeTab === 'upload' ? '$buttonPrimary' : isDark ? '$backgroundDark100' : '$backgroundLight100'}
                px="$6"
                py="$2"
                rounded="$full"
              >
                <Text
                  color={activeTab === 'upload' ? '$textLight900' : isDark ? '$textDark50' : '$textLight900'}
                  fontWeight="$bold"
                  fontSize="$sm"
                >
                  Upload Photo
                </Text>
              </Pressable>
            </HStack>

            {/* Tab Content */}
            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
              {activeTab === 'avatars' ? (
                <Box mt="$4">
                  <HStack flexWrap="wrap" justifyContent="space-between" space="md">
                    {MOCK_AVATARS.map((avatar) => {
                      const isSelected = selectedAvatarId === avatar.id;
                      return (
                        <Pressable
                          key={avatar.id}
                          onPress={() => handleSelectAvatar(avatar.id)}
                          w="30%"
                          aspectRatio={1}
                          mb="$3"
                          position="relative"
                        >
                          <Box
                            w="100%"
                            h="100%"
                            rounded="$lg"
                            borderWidth={isSelected ? 3 : 1}
                            borderColor={isSelected ? '$buttonPrimary' : isDark ? '$borderDark100' : '$borderLight100'}
                            overflow="hidden"
                            bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
                          >
                            <Image
                              source={avatar.image}
                              alt={`Avatar ${avatar.id}`}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                            {isSelected && (
                              <Box
                                position="absolute"
                                top="$2"
                                right="$2"
                                bg="$buttonPrimary"
                                rounded="$full"
                                p="$1"
                              >
                                <Icon as={Check} size="sm" color="$textLight900" />
                              </Box>
                            )}
                          </Box>
                        </Pressable>
                      );
                    })}
                  </HStack>
                </Box>
              ) : (
                <VStack space="md" mt="$4" alignItems="center">
                  {uploadedImage ? (
                    <Box
                      w="100%"
                      aspectRatio={1}
                      
                      rounded="$lg"
                      overflow="hidden"
                      borderWidth={2}
                      borderColor="$buttonPrimary"
                    >
                      <Image
                        source={toImageSource(uploadedImage)}
                        alt="Uploaded photo"
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </Box>
                  ) : (
                    <Box
                      w="100%"
                      aspectRatio={1}
                      rounded="$lg"
                      bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
                      borderWidth={1}
                      borderColor={isDark ? '$borderDark100' : '$borderLight100'}
                      borderStyle="dashed"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <VStack space="md" alignItems="center">
                        <Icon as={Upload} size="xl" color={isDark ? '$textDark300' : '$textLight600'} />
                        <Text
                          color={isDark ? '$textDark300' : '$textLight600'}
                          fontSize="$sm"
                          textAlign="center"
                          px="$4"
                        >
                          Use the buttons below to upload a photo
                        </Text>
                      </VStack>
                    </Box>
                  )}

                  <HStack space="md" w="100%" justifyContent="center" mt="$4">
                    <Button
                      variant="outline"
                      flex={1}
                      onPress={handlePickFromGallery}
                      isDisabled={isUploading}
                      borderColor={isDark ? '$borderDark100' : '$borderLight100'}
                    >
                      {isUploading ? (
                        <Spinner size="small" color={isDark ? '$textDark50' : '$textLight900'} />
                      ) : (
                        <>
                          <Icon as={Upload} size="md" color={isDark ? '$textDark50' : '$textLight900'} mr="$2" />
                          <ButtonText color={isDark ? '$textDark50' : '$textLight900'}>
                            Gallery
                          </ButtonText>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      flex={1}
                      onPress={handleTakePhoto}
                      isDisabled={isUploading}
                      borderColor={isDark ? '$borderDark100' : '$borderLight100'}
                    >
                      {isUploading ? (
                        <Spinner size="small" color={isDark ? '$textDark50' : '$textLight900'} />
                      ) : (
                        <>
                          <Icon as={Camera} size="md" color={isDark ? '$textDark50' : '$textLight900'} mr="$2" />
                          <ButtonText color={isDark ? '$textDark50' : '$textLight900'}>
                            Camera
                          </ButtonText>
                        </>
                      )}
                    </Button>
                  </HStack>
                </VStack>
              )}
            </ScrollView>

            <Button
              bg="$buttonPrimary"
              py="$1"
              rounded="$lg"
              mt="auto"
              mb="$4"
              onPress={handleNext}
              opacity={hasSelection ? 1 : 0.5}
              disabled={!hasSelection}
            >
              <ButtonText color="$textLight900">Next</ButtonText>
            </Button>
          </VStack>
        </Box>

   
    </SafeAreaView>
  );
};
