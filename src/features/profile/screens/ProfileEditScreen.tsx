import React, { useState, useCallback } from 'react';
import { ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Image, 
  Pressable,
  Input,
  InputField,
  Textarea,
  TextareaInput,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalBody
} from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { mock_user_card } from '@/src/mock/profile/userCardData';
import { useUpdateProfile } from '../api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useBottomOffset } from '@/src/utils';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { uploadAvatar, uploadBanner } from '../api/profileApi';
import { useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';
import type { ProfileStackParamList } from '../navigation';

type ProfileEditScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

// Badge listesi - API'den çekilebilir
const AVAILABLE_BADGES = [
  { id: 'everyday_consumer', label: 'Everyday Consumer' },
  { id: 'home_appliance', label: 'Home Appliance Enthusiast' },
  { id: 'product_reviewer', label: 'Product Reviewer' },
  { id: 'tech_expert', label: 'Tech Expert' },
] as const;

const ProfileEditScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ProfileEditScreenNavigationProp>();
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });

  // Form state
  const [name, setName] = useState(mock_user_card.name);
  const [bio, setBio] = useState(mock_user_card.description);
  const [badge1, setBadge1] = useState('');
  const [badge2, setBadge2] = useState('');
  const [badge3, setBadge3] = useState('');
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [selectedAvatarType, setSelectedAvatarType] = useState<'picture' | 'cosmetic'>('picture');
  const [selectedBadgeSlot, setSelectedBadgeSlot] = useState<1 | 2 | 3 | null>(null);
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(null);
  const [selectedBannerUri, setSelectedBannerUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Update Profile mutation
  const updateProfileMutation = useUpdateProfile();
  const toast = useToast();

  // Badge seçimi için bottom sheet aç
  const handleBadgeSelect = useCallback((slot: 1 | 2 | 3) => {
    setSelectedBadgeSlot(slot);
    
    // Mevcut seçili badge'leri al
    const currentBadges = [badge1, badge2, badge3];
    const currentSlotValue = currentBadges[slot - 1];
    
    // Bottom sheet içeriği
    const badgeContent = (
      <Box px="$4" pb={bottomOffset}>
        <VStack space="md">
          <Text
            fontSize={18}
            fontWeight="$bold"
            color={isDark ? '$textDark50' : '$textLight900'}
            mb="$2"
          >
            Badge Seç
          </Text>
          
          {/* Badge listesi */}
          <VStack space="sm">
            {/* None seçeneği */}
            <Pressable
              onPress={() => {
                if (slot === 1) setBadge1('');
                else if (slot === 2) setBadge2('');
                else if (slot === 3) setBadge3('');
                closeBottomSheet();
                setSelectedBadgeSlot(null);
              }}
              bg={isDark ? '$backgroundDark900' : '#F5F5F5'}
              borderRadius={8}
              p="$3"
              borderWidth={currentSlotValue === '' ? 2 : 0}
              borderColor="#E8FF6B"
            >
              <Text
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize={14}
              >
                Badge Seçme
              </Text>
            </Pressable>
            
            {/* Badge seçenekleri */}
            {AVAILABLE_BADGES.map((badge) => {
              const isSelected = currentSlotValue === badge.id;
              const isUsedInOtherSlot = 
                (slot !== 1 && badge1 === badge.id) ||
                (slot !== 2 && badge2 === badge.id) ||
                (slot !== 3 && badge3 === badge.id);
              
              return (
                <Pressable
                  key={badge.id}
                  onPress={() => {
                    if (isUsedInOtherSlot) {
                      Alert.alert('Warning', 'This badge is already used in another slot');
                      return;
                    }
                    if (slot === 1) setBadge1(badge.id);
                    else if (slot === 2) setBadge2(badge.id);
                    else if (slot === 3) setBadge3(badge.id);
                    closeBottomSheet();
                    setSelectedBadgeSlot(null);
                  }}
                  bg={isDark ? '$backgroundDark900' : '#F5F5F5'}
                  borderRadius={8}
                  p="$3"
                  borderWidth={isSelected ? 2 : 0}
                  borderColor="#E8FF6B"
                  opacity={isUsedInOtherSlot ? 0.5 : 1}
                >
                  <Text
                    color={isDark ? '$textDark50' : '$textLight900'}
                    fontSize={14}
                    fontWeight={isSelected ? '$bold' : '$normal'}
                  >
                    {badge.label}
                  </Text>
                </Pressable>
              );
            })}
          </VStack>
        </VStack>
      </Box>
    );
    
    openBottomSheet(badgeContent, {
      enablePanDownToClose: true,
      enableDynamicSizing: true,
      backdropPressBehavior: 'close',
    });
  }, [badge1, badge2, badge3, isDark, bottomOffset, openBottomSheet, closeBottomSheet]);

  // Badge label'ını al
  const getBadgeLabel = useCallback((badgeId: string) => {
    const badge = AVAILABLE_BADGES.find((b) => b.id === badgeId);
    return badge ? badge.label : 'Badge Seç';
  }, []);

  const handleSave = () => {
    // Validate name (min 2 characters)
    if (name.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters');
      return;
    }

    // Validate biography (max 500 characters)
    if (bio.trim().length > 500) {
      Alert.alert('Error', 'Biography can be at most 500 characters');
      return;
    }

    // Collect badge IDs (filter out empty strings)
    const badgeIds = [badge1, badge2, badge3].filter((badge) => badge.trim().length > 0);

    // Prepare update data - API formatına uygun
    // Tüm field'ları gönder (boş string'ler yerine undefined/null kullan)
    const updateData: {
      name?: string;
      biography?: string;
      badge?: string[];
      cosmetic?: string | null;
      avatar?: string | null;
      banner?: string | null;
    } = {};

    // Name zorunlu - her zaman gönder
    if (name.trim().length > 0) {
      updateData.name = name.trim();
    }

    // Biography sadece doluysa ekle (boş string gönderme)
    if (bio.trim().length > 0) {
      updateData.biography = bio.trim();
    }

    // Badge array'i sadece varsa ekle
    if (badgeIds.length > 0) {
      updateData.badge = badgeIds;
    }

    // Avatar - eğer seçildiyse ve upload edildiyse (URL formatında)
    if (selectedAvatarUri && selectedAvatarUri.startsWith('http')) {
      updateData.avatar = selectedAvatarUri;
    }

    // Banner - eğer seçildiyse ve upload edildiyse (URL formatında)
    if (selectedBannerUri && selectedBannerUri.startsWith('http')) {
      updateData.banner = selectedBannerUri;
    }

    // Request data'yı logla
    console.log('[ProfileEditScreen] Sending update request:', JSON.stringify(updateData, null, 2));
    
    updateProfileMutation.mutate(updateData, {
      onSuccess: (data) => {
        console.log('[ProfileEditScreen] ✅ Profile updated successfully:', data);
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      },
      onError: (error: any) => {
        console.error('[ProfileEditScreen] ❌ Update profile error:', {
          error,
          message: error?.message,
          response: error?.response,
          responseData: error?.response?.data,
          responseStatus: error?.response?.status,
          requestData: updateData,
        });
        
        // Backend'den gelen detaylı hata mesajını göster
        const errorMessage = error?.response?.data?.message || 
                           error?.response?.data?.error ||
                           error?.message || 
                           'Profil güncellenirken bir hata oluştu';
        
        Alert.alert('Hata', errorMessage);
      },
    });
  };

  const handleAvatarChange = async () => {
    try {
      const result = await imagePickerService.pickFromGallery();
      
      if (result.success && result.asset) {
        setIsUploadingAvatar(true);
        try {
          // Avatar'ı direkt upload et
          const uploadResponse = await uploadAvatar(result.asset.uri);
          
          if (uploadResponse.success && uploadResponse.data.avatarUrl) {
            setSelectedAvatarUri(uploadResponse.data.avatarUrl);
            
            toast.show({
              placement: 'top',
              render: ({ id }: { id: string }) => {
                return (
                  <Box maxWidth="90%" alignSelf="center" px="$4">
                    <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                      <ToastTitle>Başarılı</ToastTitle>
                      <ToastDescription>Avatar değiştirildi. Değişiklikleri kaydetmek için Save butonuna basın.</ToastDescription>
                    </Toast>
                  </Box>
                );
              },
            });
          } else {
            throw new Error('Avatar yüklenemedi');
          }
        } catch (error: any) {
          console.error('[ProfileEditScreen] Avatar upload error:', error);
          toast.show({
            placement: 'top',
            render: ({ id }: { id: string }) => {
              return (
                <Box maxWidth="90%" alignSelf="center" px="$4">
                  <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                    <ToastTitle>Hata</ToastTitle>
                    <ToastDescription>{error?.message || 'Avatar yüklenirken bir hata oluştu'}</ToastDescription>
                  </Toast>
                </Box>
              );
            },
          });
        } finally {
          setIsUploadingAvatar(false);
        }
      } else {
        toast.show({
          placement: 'top',
          render: ({ id }: { id: string }) => {
            return (
              <Box maxWidth="90%" alignSelf="center" px="$4">
                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                  <ToastTitle>Hata</ToastTitle>
                  <ToastDescription>{result.error || 'Fotoğraf seçilirken bir hata oluştu'}</ToastDescription>
                </Toast>
              </Box>
            );
          },
        });
      }
    } catch (error: any) {
      console.error('[ProfileEditScreen] Image picker error:', error);
      toast.show({
        placement: 'top',
        render: ({ id }: { id: string }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>Hata</ToastTitle>
                <ToastDescription>Fotoğraf seçilirken bir hata oluştu</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
    }
  };

  const handlePickAvatarFromGallery = async () => {
    try {
      const result = await imagePickerService.pickFromGallery();
      
      if (result.success && result.asset) {
        setSelectedAvatarUri(result.asset.uri);
        console.log('[ProfileEditScreen] Avatar selected:', result.asset.uri);
      } else {
        toast.show({
          placement: 'top',
          render: ({ id }: { id: string }) => {
            return (
              <Box maxWidth="90%" alignSelf="center" px="$4">
                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                  <ToastTitle>Hata</ToastTitle>
                  <ToastDescription>{result.error || 'Fotoğraf seçilirken bir hata oluştu'}</ToastDescription>
                </Toast>
              </Box>
            );
          },
        });
      }
    } catch (error: any) {
      console.error('[ProfileEditScreen] Image picker error:', error);
      toast.show({
        placement: 'top',
        render: ({ id }: { id: string }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>Hata</ToastTitle>
                <ToastDescription>Fotoğraf seçilirken bir hata oluştu</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
    }
  };

  const handleSaveAvatarChange = async () => {
    if (!selectedAvatarUri) {
      // Eğer fotoğraf seçilmediyse sadece modal'ı kapat
      setIsAvatarModalVisible(false);
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Önce avatar'ı upload et
      const uploadResponse = await uploadAvatar(selectedAvatarUri);
      
      if (uploadResponse.success && uploadResponse.data.avatarUrl) {
        // Avatar URL'ini state'e kaydet (handleSave'de kullanılacak)
        setSelectedAvatarUri(uploadResponse.data.avatarUrl);
        
        toast.show({
          placement: 'top',
          render: ({ id }: { id: string }) => {
            return (
              <Box maxWidth="90%" alignSelf="center" px="$4">
                <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                  <ToastTitle>Başarılı</ToastTitle>
                  <ToastDescription>Avatar yüklendi. Değişiklikleri kaydetmek için Save butonuna basın.</ToastDescription>
                </Toast>
              </Box>
            );
          },
        });
        
        setIsAvatarModalVisible(false);
      } else {
        throw new Error('Avatar yüklenemedi');
      }
    } catch (error: any) {
      console.error('[ProfileEditScreen] Avatar upload error:', error);
      toast.show({
        placement: 'top',
        render: ({ id }: { id: string }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>Hata</ToastTitle>
                <ToastDescription>{error?.message || 'Avatar yüklenirken bir hata oluştu'}</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleBannerChange = async () => {
    try {
      const result = await imagePickerService.pickFromGallery();
      
      if (result.success && result.asset) {
        setIsUploadingBanner(true);
        try {
          // Banner'ı direkt upload et
          const uploadResponse = await uploadBanner(result.asset.uri);
          
          if (uploadResponse.success && uploadResponse.data.bannerUrl) {
            setSelectedBannerUri(uploadResponse.data.bannerUrl);
            
            toast.show({
              placement: 'top',
              render: ({ id }: { id: string }) => {
                return (
                  <Box maxWidth="90%" alignSelf="center" px="$4">
                    <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                      <ToastTitle>Başarılı</ToastTitle>
                      <ToastDescription>Banner değiştirildi. Değişiklikleri kaydetmek için Save butonuna basın.</ToastDescription>
                    </Toast>
                  </Box>
                );
              },
            });
          } else {
            throw new Error('Banner yüklenemedi');
          }
        } catch (error: any) {
          console.error('[ProfileEditScreen] Banner upload error:', error);
          toast.show({
            placement: 'top',
            render: ({ id }: { id: string }) => {
              return (
                <Box maxWidth="90%" alignSelf="center" px="$4">
                  <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                    <ToastTitle>Hata</ToastTitle>
                    <ToastDescription>{error?.message || 'Banner yüklenirken bir hata oluştu'}</ToastDescription>
                  </Toast>
                </Box>
              );
            },
          });
        } finally {
          setIsUploadingBanner(false);
        }
      } else {
        toast.show({
          placement: 'top',
          render: ({ id }: { id: string }) => {
            return (
              <Box maxWidth="90%" alignSelf="center" px="$4">
                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                  <ToastTitle>Hata</ToastTitle>
                  <ToastDescription>{result.error || 'Fotoğraf seçilirken bir hata oluştu'}</ToastDescription>
                </Toast>
              </Box>
            );
          },
        });
      }
    } catch (error: any) {
      console.error('[ProfileEditScreen] Image picker error:', error);
      toast.show({
        placement: 'top',
        render: ({ id }: { id: string }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>Hata</ToastTitle>
                <ToastDescription>Fotoğraf seçilirken bir hata oluştu</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Header */}
      <Header
        title="Edit Profile"
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightAction={
          <Pressable onPress={handleSave}>
            <Text
              color="#E8FF6B"
              fontSize={15}
              fontWeight="$semibold"
            >
              Save
            </Text>
          </Pressable>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <VStack space="lg">
          {/* Banner Section */}
          <Box position="relative">
            <Box h={160} overflow="hidden">
              <Image
                source={selectedBannerUri ? { uri: selectedBannerUri } : require('@/assets/banner/banner_01.png')}
                alt="Profile Banner"
                w="100%"
                h="100%"
                resizeMode="cover"
              />
            </Box>
            
            {/* Change Banner Button - Center */}
            <Pressable
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="rgba(0, 0, 0, 0.3)"
              justifyContent="center"
              alignItems="center"
              onPress={handleBannerChange}
              disabled={isUploadingBanner}
            >
              {isUploadingBanner ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Image
                  source={require('@/assets/icons/camera_plus.png')}
                  alt="Change Banner"
                  w={24}
                  h={24}
                  resizeMode="contain"
                />
              )}
            </Pressable>

            {/* Avatar Section */}
            <Box
              position="absolute"
              bottom={-40}
              left={16}
              borderRadius={100}
              overflow="hidden"
              w={100}
              h={100}
              borderWidth={4}
              borderColor={isDark ? '$backgroundDark950' : '$backgroundLight0'}
            >
              <Image
                source={selectedAvatarUri ? { uri: selectedAvatarUri } : mock_user_card.avatar}
                alt={name}
                w="100%"
                h="100%"
              />
              
              {/* Change Avatar Button - Center Overlay */}
              <Pressable
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="rgba(0, 0, 0, 0.4)"
                justifyContent="center"
                alignItems="center"
                onPress={handleAvatarChange}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Image
                    source={require('@/assets/icons/camera_plus.png')}
                    alt="Change Avatar"
                    w={24}
                    h={24}
                    resizeMode="contain"
                  />
                )}
              </Pressable>
            </Box>
          </Box>

          {/* Form Fields */}
          <VStack space="xl" px="$4" mt="$10">
            {/* Name Field */}
            <VStack space="xs">
              <Text
                color={isDark ? '$textDark200' : '$textLight700'}
                fontSize={11}
                fontWeight="$semibold"
              >
                Name
              </Text>
              <Input
                variant="outline"
                size="xl"
                bg={isDark ? '$backgroundDark900' : '#F5F5F5'}
                borderWidth={0}
                borderRadius={8}
              >
                <InputField
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize={11}
                />
              </Input>
            </VStack>

            {/* Bio Field */}
            <VStack space="xs">
              <Text
                color={isDark ? '$textDark200' : '$textLight700'}
                fontSize={11}
                fontWeight="$semibold"
              >
                Bio
              </Text>
              <Textarea
                bg={isDark ? '$backgroundDark900' : '#F5F5F5'}
                borderWidth={0}
                borderRadius={8}
                h={120}
              >
                <TextareaInput
                  value={bio}
                  onChangeText={(text) => {
                    if (text.length <= 160) setBio(text);
                  }}
                  placeholder="Tell us about yourself"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize={11}
                  multiline
                />
              </Textarea>
            </VStack>

            {/* Badge Section */}
            <VStack space="xs">
              <Text
                color={isDark ? '$textDark200' : '$textLight700'}
                fontSize={11}
                fontWeight="$semibold"
              >
                Badge
              </Text>
              
              {/* Badge 1 */}
              <Pressable
                onPress={() => handleBadgeSelect(1)}
                bg={isDark ? '$backgroundDark900' : '#F5F5F5'}
                borderWidth={0}
                borderRadius={8}
                p="$3"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text
                  color={badge1 ? (isDark ? '$textDark50' : '$textLight900') : (isDark ? '#666' : '#999')}
                  fontSize={11}
                >
                  {badge1 ? getBadgeLabel(badge1) : 'Select Badge 1'}
                </Text>
                <Feather
                  name="chevron-down"
                  size={16}
                  color={isDark ? '#666' : '#999'}
                />
              </Pressable>

              {/* Badge 2 */}
              <Pressable
                onPress={() => handleBadgeSelect(2)}
                bg={isDark ? '$backgroundDark900' : '#F5F5F5'}
                borderWidth={0}
                borderRadius={8}
                p="$3"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text
                  color={badge2 ? (isDark ? '$textDark50' : '$textLight900') : (isDark ? '#666' : '#999')}
                  fontSize={11}
                >
                  {badge2 ? getBadgeLabel(badge2) : 'Select Badge 2'}
                </Text>
                <Feather
                  name="chevron-down"
                  size={16}
                  color={isDark ? '#666' : '#999'}
                />
              </Pressable>

              {/* Badge 3 */}
              <Pressable
                onPress={() => handleBadgeSelect(3)}
                bg={isDark ? '$backgroundDark900' : '#F5F5F5'}
                borderWidth={0}
                borderRadius={8}
                p="$3"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text
                  color={badge3 ? (isDark ? '$textDark50' : '$textLight900') : (isDark ? '#666' : '#999')}
                  fontSize={11}
                >
                  {badge3 ? getBadgeLabel(badge3) : 'Select Badge 3'}
                </Text>
                <Feather
                  name="chevron-down"
                  size={16}
                  color={isDark ? '#666' : '#999'}
                />
              </Pressable>
            </VStack>
          </VStack>
        </VStack>
      </ScrollView>

      {/* Avatar Change Modal */}
      <Modal isOpen={isAvatarModalVisible} onClose={() => setIsAvatarModalVisible(false)} flex={1}>
        <ModalBackdrop />
        <ModalContent
          width="90%"
          maxWidth={360}
          bg={isDark ? '#1A1A1A' : '#FFFFFF'}
          borderRadius={16}
        >
          <ModalBody p="$0">
            <VStack space="lg" py="$6">
              {/* Large Profile Photo */}
              <VStack alignItems="center" space="md">
                <Box
                  width={110}
                  height={110}
                  borderRadius={70}
                  borderWidth={2}
                  borderColor="#FF0000"
                  overflow="hidden"
                >
                  <Image
                    source={selectedAvatarUri ? { uri: selectedAvatarUri } : mock_user_card.avatar}
                    alt={name}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </Box>

                {/* Name */}
                <Text
                  fontSize={18}
                  fontWeight="$bold"
                  color={isDark ? '#FFFFFF' : '#000000'}
                  textAlign="center"
                >
                  {name}
                </Text>
              </VStack>

              <Box h={1} w="100%" bg={'#DEDEDE'} my={"$3"} />

              {/* Avatar Type Selection */}
              <HStack space="lg" justifyContent="center" px="$6">
                {/* Profile Picture Option */}
                <Pressable
                  onPress={async () => {
                    setSelectedAvatarType('picture');
                    await handlePickAvatarFromGallery();
                  }}
                  alignItems="center"
                  flex={1}
                >
                  <VStack space="xs" alignItems="center">
                    <Box
                      width={64}
                      height={64}
                      borderRadius={40}
                      overflow="hidden"
                      bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                    >
                      <Image
                        source={selectedAvatarUri ? { uri: selectedAvatarUri } : mock_user_card.avatar}
                        alt="Profile Picture"
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </Box>
                    <Text
                      fontSize={12}
                      fontWeight={"#semibold"}
                      color={isDark ? '#FFFFFF' : '#818181'}
                      textAlign="center"
                    >
                      Profile Picture
                    </Text>
                  </VStack>
                </Pressable>

                <Box h="100%" w={1} bg={'#DEDEDE'} mx={"$3"} />

                {/* Profile Cosmetic Option */}
                <Pressable
                  onPress={() => setSelectedAvatarType('cosmetic')}
                  alignItems="center"
                  flex={1}
                >
                  <VStack space="xs" alignItems="center">
                    <Box
                      width={64}
                      height={64}
                      borderRadius={40}
                      borderWidth={2}
                      borderColor="#FF0000"
                      overflow="hidden"
                      bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                    >
                      <Image
                        source={mock_user_card.avatar}
                        alt="Profile Cosmetic"
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </Box>
                    <Text
                      fontSize={12}
                      fontWeight={"#semibold"}
                      color={isDark ? '#FFFFFF' : '#818181'}
                      textAlign="center"
                    >
                      Profile Cosmetic
                    </Text>
                  </VStack>
                </Pressable>
              </HStack>

              {/* Action Buttons */}
              <HStack space="sm" px="$6" mt="$2">
                {/* Cancel Button */}
                <Pressable
                  onPress={() => setIsAvatarModalVisible(false)}
                  flex={1}
                  bg={isDark ? '#2A2A2A' : '#EDEDED'}
                  borderRadius={12}
                  py="$3"
                  alignItems="center"
                >
                  <Text
                    fontSize={14}
                    fontWeight="$semibold"
                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  >
                    Cancel
                  </Text>
                </Pressable>

                {/* Save Button */}
                <Pressable
                  onPress={handleSaveAvatarChange}
                  flex={2}
                  bg={isUploadingAvatar ? '#CCCCCC' : "#E8FF6B"}
                  borderRadius={12}
                  py="$3"
                  alignItems="center"
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text
                      fontSize={12}
                      fontWeight="$bold"
                      color="#000000"
                    >
                      Save
                    </Text>
                  )}
                </Pressable>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
      </Box>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

ProfileEditScreen.displayName = 'ProfileEditScreen';

export default ProfileEditScreen;

