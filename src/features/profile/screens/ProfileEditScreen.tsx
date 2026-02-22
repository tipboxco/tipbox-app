import React, { useState, useCallback, useMemo, memo, useEffect, useReducer } from 'react';
import { ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Modal as RNModal, StyleSheet, Pressable as RNPressable, Dimensions } from 'react-native';
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
} from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { mock_user_card } from '@/src/mock/profile/userCardData';
import { useUpdateProfile, profileKeys } from '../api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useBottomOffset } from '@/src/utils';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { uploadAvatar, uploadBanner } from '../api/profileApi';
import { useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/src/store/appStore';
import type { ProfileStackParamList } from '../navigation';
import type { UserProfile } from '../types';

type ProfileEditScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

// Badge listesi - API'den çekilebilir
const AVAILABLE_BADGES = [
  { id: 'everyday_consumer', label: 'Everyday Consumer' },
  { id: 'home_appliance', label: 'Home Appliance Enthusiast' },
  { id: 'product_reviewer', label: 'Product Reviewer' },
  { id: 'tech_expert', label: 'Tech Expert' },
] as const;

// Avatar çerçevesi (kozmetik) listesi - API'den çekilebilir
const AVAILABLE_COSMETICS = [
  { id: 'frame_red', label: 'Red Frame', borderColor: '#E53935' },
  { id: 'frame_gold', label: 'Gold Frame', borderColor: '#F9A825' },
  { id: 'frame_blue', label: 'Blue Frame', borderColor: '#1E88E5' },
  { id: 'frame_green', label: 'Green Frame', borderColor: '#43A047' },
  { id: 'frame_purple', label: 'Purple Frame', borderColor: '#8E24AA' },
  { id: 'frame_none', label: 'None', borderColor: 'transparent' },
] as const;

// Badge item component - memoized for performance
interface BadgeItemProps {
  badge: typeof AVAILABLE_BADGES[number];
  isSelected: boolean;
  isUsedInOtherSlot: boolean;
  isDark: boolean;
  onSelect: (badgeId: string) => void;
}

const BadgeItem = memo<BadgeItemProps>(({ 
  badge, 
  isSelected, 
  isUsedInOtherSlot, 
  isDark, 
  onSelect 
}) => {
  const handlePress = useCallback(() => {
    if (isUsedInOtherSlot) {
      Alert.alert('Warning', 'This badge is already used in another slot');
      return;
    }
    onSelect(badge.id);
  }, [badge.id, isUsedInOtherSlot, onSelect]);

  return (
    <Pressable
      onPress={handlePress}
      opacity={isUsedInOtherSlot ? 0.5 : 1}
      py="$1.5"
    >
      <HStack 
        justifyContent="space-between" 
        alignItems="center"
        space="md"
      >
        {/* Radio Button */}
        {isSelected ? (
          <Box
            w={20}
            h={20}
            rounded="$full"
            borderWidth={2}
            borderColor="#000000"
            bg="#FFFFFF"
            alignItems="center"
            justifyContent="center"
          >
            <Box
              w={8}
              h={8}
              rounded="$full"
              bg="#000000"
            />
          </Box>
        ) : (
          <Box
            w={20}
            h={20}
            rounded="$full"
            borderWidth={2}
            borderColor={isDark ? '#666666' : '#D4D4D4'}
          />
        )}

        {/* Badge Label */}
        <Text
          fontSize="$sm"
          fontWeight="$semibold"
          color={isSelected 
            ? (isDark ? '#FFFFFF' : '#000000') 
            : (isDark ? '#999999' : '#666666')
          }
          flex={1}
        >
          {badge.label}
        </Text>
      </HStack>
    </Pressable>
  );
});

BadgeItem.displayName = 'BadgeItem';

const ProfileEditScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ProfileEditScreenNavigationProp>();
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });
  const { user, updateUser } = useAppStore();

  // Form state: real user name when available, else mock fallback
  const [name, setName] = useState(() => user?.fullName ?? mock_user_card.name);
  const [bio, setBio] = useState(mock_user_card.description);
  const [badge1, setBadge1] = useState('');
  const [badge2, setBadge2] = useState('');
  const [badge3, setBadge3] = useState('');
  const [cosmetic, setCosmetic] = useState<string | null>(null); // Cosmetic ID
  const [isCosmeticModalVisible, setIsCosmeticModalVisible] = useState(false);
  const [cosmeticPreview, setCosmeticPreview] = useState<string | null>(null); // Modal içinde seçim (Save'e basınca cosmetic'e yazılır)
  const [selectedBadgeSlot, setSelectedBadgeSlot] = useState<1 | 2 | 3 | null>(null);
  // Sahip olunan kozmetikler - API'den gelecek; boşsa Figma 6576-32081: tek dashed + placeholder
  const ownedCosmeticsIds: string[] = []; // TODO: userProfile?.ownedCosmetics ?? []
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(null);
  const [selectedBannerUri, setSelectedBannerUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Update Profile mutation
  const updateProfileMutation = useUpdateProfile();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Sync form name when user loads (e.g. after auth)
  useEffect(() => {
    if (user?.fullName) setName(user.fullName);
  }, [user?.fullName]);

  // Badge seçimi için bottom sheet aç
  const handleBadgeSelect = useCallback((slot: 1 | 2 | 3) => {
    setSelectedBadgeSlot(slot);
    
    // Mevcut seçili badge'leri al
    const currentBadges = [badge1, badge2, badge3];
    const currentSlotValue = currentBadges[slot - 1];
    
    // Badge seçim handler'ı - closure içinde tanımla
    const handleBadgePress = (badgeId: string) => {
      if (slot === 1) setBadge1(badgeId);
      else if (slot === 2) setBadge2(badgeId);
      else if (slot === 3) setBadge3(badgeId);
      closeBottomSheet();
      setSelectedBadgeSlot(null);
    };
    
    // Bottom sheet içeriği
    const badgeContent = (
      <Box 
        bg={isDark ? '$backgroundDark950' : '#FDFDFB'} 
        width="100%"
        px="$4" 
        py="$3" 
        pb={bottomOffset}
      >
        <VStack space="xs">
          {/* Header */}
          <HStack alignItems="center" justifyContent="center" mb="$1">
            <Text
              fontSize="$md"
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              Select Badge {slot}
            </Text>
          </HStack>

          {/* Badge seçenekleri */}
          {AVAILABLE_BADGES.map((badge) => {
            const isSelected = currentSlotValue === badge.id;
            const isUsedInOtherSlot = 
              (slot !== 1 && badge1 === badge.id) ||
              (slot !== 2 && badge2 === badge.id) ||
              (slot !== 3 && badge3 === badge.id);
            
            return (
              <BadgeItem
                key={badge.id}
                badge={badge}
                isSelected={isSelected}
                isUsedInOtherSlot={isUsedInOtherSlot}
                isDark={isDark}
                onSelect={handleBadgePress}
              />
            );
          })}
        </VStack>
      </Box>
    );
    
    openBottomSheet(badgeContent, {
      enablePanDownToClose: true,
      enableDynamicSizing: true,
      backdropPressBehavior: 'close',
      animateOnMount: true,
    });
  }, [badge1, badge2, badge3, isDark, bottomOffset, openBottomSheet, closeBottomSheet]);

  // Badge label'ını al
  const getBadgeLabel = useCallback((badgeId: string) => {
    const badge = AVAILABLE_BADGES.find((b) => b.id === badgeId);
    return badge ? badge.label : 'Badge Seç';
  }, []);

  const openCosmeticModal = useCallback(() => {
    setCosmeticPreview(cosmetic);
    setIsCosmeticModalVisible(true);
  }, [cosmetic]);

  const closeCosmeticModal = useCallback(() => {
    setIsCosmeticModalVisible(false);
    setCosmeticPreview(null);
  }, []);

  const handleSaveCosmetic = useCallback(() => {
    setCosmetic(cosmeticPreview);
    setIsCosmeticModalVisible(false);
    setCosmeticPreview(null);
  }, [cosmeticPreview]);

  const getCosmeticLabel = useCallback((cosmeticId: string | null) => {
    if (!cosmeticId) return 'Avatar Frame Seç';
    const c = AVAILABLE_COSMETICS.find((x) => x.id === cosmeticId);
    return c ? c.label : 'Avatar Frame Seç';
  }, []);

  const getCosmeticBorderColor = useCallback((cosmeticId: string | null) => {
    if (!cosmeticId) return '#E53935';
    const c = AVAILABLE_COSMETICS.find((x) => x.id === cosmeticId);
    if (!c) return '#E53935';
    return c.borderColor === 'transparent' ? '#9E9E9E' : c.borderColor;
  }, []);

  const handleSave = async () => {
    console.log('[ProfileEditScreen] 🚀 handleSave başlatıldı');
    console.log('[ProfileEditScreen] 📋 Mevcut state değerleri:', {
      name: name,
      nameLength: name.trim().length,
      bio: bio,
      bioLength: bio.trim().length,
      badge1,
      badge2,
      badge3,
      cosmetic,
      selectedAvatarUri,
      selectedAvatarUriType: selectedAvatarUri ? (selectedAvatarUri.startsWith('http') ? 'URL' : 'Local') : 'null',
      selectedBannerUri,
      selectedBannerUriType: selectedBannerUri ? (selectedBannerUri.startsWith('http') ? 'URL' : 'Local') : 'null',
    });

    // Validate name (min 2 characters)
    if (name.trim().length < 2) {
      console.log('[ProfileEditScreen] ❌ Validation hatası: Name çok kısa');
      Alert.alert('Error', 'Name must be at least 2 characters');
      return;
    }

    // Validate biography (max 500 characters)
    if (bio.trim().length > 500) {
      console.log('[ProfileEditScreen] ❌ Validation hatası: Bio çok uzun');
      Alert.alert('Error', 'Biography can be at most 500 characters');
      return;
    }

    // Collect badge IDs (filter out empty strings)
    const badgeIds = [badge1, badge2, badge3].filter((badge) => badge.trim().length > 0);
    console.log('[ProfileEditScreen] 🏷️ Badge ID\'leri:', badgeIds);

    try {
      // CRITICAL FIX: Önce avatar ve banner'ı upload et (eğer local URI ise)
      let avatarUrl: string | null = null;
      let bannerUrl: string | null = null;
      let avatarUploaded = false;
      let bannerUploaded = false;

      // Avatar upload - eğer local URI ise (http ile başlamıyorsa)
      if (selectedAvatarUri && !selectedAvatarUri.startsWith('http')) {
        console.log('[ProfileEditScreen] 📤 Avatar upload başlatılıyor (Local URI):', {
          uri: selectedAvatarUri.substring(0, 50) + '...',
          uriLength: selectedAvatarUri.length,
          uriType: typeof selectedAvatarUri,
        });
        setIsUploadingAvatar(true);
        try {
          console.log('[ProfileEditScreen] 📤 uploadAvatar fonksiyonu çağrılıyor...');
          const uploadResponse = await uploadAvatar(selectedAvatarUri);
          
          // CRITICAL: Gönderilen request formatını logla
          console.log('[ProfileEditScreen] 📤 Avatar upload request formatı:', {
            endpoint: 'POST /users/me/avatar',
            contentType: 'multipart/form-data',
            fieldName: 'avatar',
            fileFormat: {
              uri: selectedAvatarUri.substring(0, 50) + '...',
              type: 'image/jpeg',
              name: 'avatar.jpg',
            },
            headers: {
              'Content-Type': 'multipart/form-data (with boundary)',
              'Authorization': 'Bearer <token>',
            },
          });
          
          console.log('[ProfileEditScreen] 📤 uploadAvatar response:', {
            success: uploadResponse.success,
            hasData: !!uploadResponse.data,
            avatarUrl: uploadResponse.data?.avatarUrl,
            fullResponse: JSON.stringify(uploadResponse, null, 2),
          });
          
          if (uploadResponse.success && uploadResponse.data?.avatarUrl) {
            avatarUrl = uploadResponse.data.avatarUrl;
            avatarUploaded = true;
            console.log('[ProfileEditScreen] ✅ Avatar başarıyla yüklendi:', {
              avatarUrl,
              avatarUrlLength: avatarUrl.length,
            });
            
            // CRITICAL FIX: Avatar upload başarılı olduktan sonra cache'i invalidate et ve refetch yap
            // Backend otomatik olarak kullanıcının profilini güncelliyor, cache'i yenile
            if (user?.id) {
              // Cache'i invalidate et
              await queryClient.invalidateQueries({
                queryKey: profileKeys.profile(user.id),
                exact: false,
              });
              console.log('[ProfileEditScreen] ✅ Profile cache invalidated after avatar upload');
              
              // CRITICAL: Cache invalidate sonrası hemen refetch yap - ProfileScreen'de güncel avatar görünsün
              await queryClient.refetchQueries({
                queryKey: profileKeys.profile(user.id),
                exact: false,
              });
              console.log('[ProfileEditScreen] ✅ Profile cache refetched after avatar upload');
            }
            
            // CRITICAL FIX: Store'daki user bilgisini de güncelle
            // Login response'unda avatar bilgisi geliyor, store'da güncellenmeli
            updateUser({
              avatar: avatarUrl,
            });
            console.log('[ProfileEditScreen] ✅ Store user avatar updated:', {
              oldAvatar: user?.avatar,
              newAvatar: avatarUrl,
            });
          } else {
            console.error('[ProfileEditScreen] ❌ Avatar upload başarısız - response formatı hatalı:', {
              success: uploadResponse.success,
              data: uploadResponse.data,
              fullResponse: uploadResponse,
            });
            throw new Error('Avatar yüklenemedi - response formatı hatalı');
          }
        } catch (error: any) {
          const backendError = error?.response?.data;
          console.error('[ProfileEditScreen] ❌ Avatar upload error - detaylı log:', {
            error,
            errorType: typeof error,
            errorMessage: error?.message,
            errorStack: error?.stack,
            // Backend response detayları
            responseStatus: error?.response?.status,
            responseStatusText: error?.response?.statusText,
            responseData: backendError,
            // Backend'den gelen spesifik hata mesajı
            backendErrorMessage: backendError?.message || backendError?.error || backendError,
            backendErrorString: JSON.stringify(backendError, null, 2),
            responseHeaders: error?.response?.headers,
            // Request detayları
            request: error?.request,
            config: error?.config,
            selectedAvatarUri,
          });
          setIsUploadingAvatar(false);
          
          // Hata mesajını kullanıcıya göster - backend'den gelen mesajı öncelikle kullan
          const errorMessage = backendError?.message 
            || backendError?.error
            || (typeof backendError === 'string' ? backendError : null)
            || error?.message 
            || 'Avatar yüklenirken bir hata oluştu';
          
          console.error('[ProfileEditScreen] ❌ Avatar upload hatası - Backend mesajı:', {
            backendError,
            extractedMessage: errorMessage,
            status: error?.response?.status,
          });
          Alert.alert('Avatar Upload Failed', errorMessage);
          return;
        } finally {
          setIsUploadingAvatar(false);
          console.log('[ProfileEditScreen] 📤 Avatar upload işlemi tamamlandı (finally)');
        }
      } else if (selectedAvatarUri && selectedAvatarUri.startsWith('http')) {
        // Zaten upload edilmiş (URL formatında)
        avatarUrl = selectedAvatarUri;
        console.log('[ProfileEditScreen] ℹ️ Avatar zaten yüklenmiş (URL formatında):', avatarUrl);
      }

      // Banner upload - eğer local URI ise (http ile başlamıyorsa)
      if (selectedBannerUri && !selectedBannerUri.startsWith('http')) {
        console.log('[ProfileEditScreen] 📤 Banner upload başlatılıyor (Local URI):', {
          uri: selectedBannerUri.substring(0, 50) + '...',
          uriLength: selectedBannerUri.length,
          uriType: typeof selectedBannerUri,
        });
        setIsUploadingBanner(true);
        try {
          console.log('[ProfileEditScreen] 📤 uploadBanner fonksiyonu çağrılıyor...');
          const uploadResponse = await uploadBanner(selectedBannerUri);
          
          // CRITICAL: Gönderilen request formatını logla
          console.log('[ProfileEditScreen] 📤 Banner upload request formatı:', {
            endpoint: 'POST /users/me/banner',
            contentType: 'multipart/form-data',
            fieldName: 'banner',
            fileFormat: {
              uri: selectedBannerUri.substring(0, 50) + '...',
              type: 'image/jpeg',
              name: 'banner.jpg',
            },
            headers: {
              'Content-Type': 'multipart/form-data (with boundary)',
              'Authorization': 'Bearer <token>',
            },
          });
          
          console.log('[ProfileEditScreen] 📤 uploadBanner response:', {
            success: uploadResponse.success,
            hasData: !!uploadResponse.data,
            bannerUrl: uploadResponse.data?.bannerUrl,
            fullResponse: JSON.stringify(uploadResponse, null, 2),
          });
          
          if (uploadResponse.success && uploadResponse.data?.bannerUrl) {
            bannerUrl = uploadResponse.data.bannerUrl;
            bannerUploaded = true;
            console.log('[ProfileEditScreen] ✅ Banner başarıyla yüklendi:', {
              bannerUrl,
              bannerUrlLength: bannerUrl.length,
            });
            
            if (user?.id) {
              // Cache-bust: aynı URL için Image cache'i eski görseli gösterebilir; query param ile yeni yüklenir
              const bannerUrlWithCacheBust = bannerUrl.includes('?')
                ? `${bannerUrl}&_t=${Date.now()}`
                : `${bannerUrl}?_t=${Date.now()}`;
              console.log('[ProfileEditScreen] 🖼️ Banner URL (API response):', bannerUrl);
              console.log('[ProfileEditScreen] 🖼️ Banner URL (cache’e yazılan, cache-bust’lı):', bannerUrlWithCacheBust);
              const setBannerInCache = () => {
                queryClient.setQueryData<UserProfile>(profileKeys.profile(user.id), (old) =>
                  old ? { ...old, bannerUrl: bannerUrlWithCacheBust } : old
                );
              };
              // Optimistic update: ProfileScreen anında yeni banner görsün
              setBannerInCache();
              const afterSet = queryClient.getQueryData<UserProfile>(profileKeys.profile(user.id));
              console.log('[ProfileEditScreen] 🖼️ Cache’e yazdıktan hemen sonra cache’teki bannerUrl:', afterSet?.bannerUrl);
              await queryClient.invalidateQueries({
                queryKey: profileKeys.profile(user.id),
                exact: false,
              });
              await queryClient.refetchQueries({
                queryKey: profileKeys.profile(user.id),
                exact: false,
              });
              const afterRefetch = queryClient.getQueryData<UserProfile>(profileKeys.profile(user.id));
              console.log('[ProfileEditScreen] 🖼️ Refetch sonrası cache’teki bannerUrl:', afterRefetch?.bannerUrl);
              // Refetch sunucudan eski bannerUrl dönebilir; cache'i tekrar yeni URL ile zorla güncelle
              setBannerInCache();
              const afterFix = queryClient.getQueryData<UserProfile>(profileKeys.profile(user.id));
              console.log('[ProfileEditScreen] 🖼️ setBannerInCache tekrar çağrıldıktan sonra cache’teki bannerUrl:', afterFix?.bannerUrl);
            }
            
            console.log('[ProfileEditScreen] ✅ Banner upload completed, profile cache updated and refetched');
          } else {
            console.error('[ProfileEditScreen] ❌ Banner upload başarısız - response formatı hatalı:', {
              success: uploadResponse.success,
              data: uploadResponse.data,
              fullResponse: uploadResponse,
            });
            throw new Error('Banner yüklenemedi - response formatı hatalı');
          }
        } catch (error: any) {
          const backendError = error?.response?.data;
          console.error('[ProfileEditScreen] ❌ Banner upload error - detaylı log:', {
            error,
            errorType: typeof error,
            errorMessage: error?.message,
            errorStack: error?.stack,
            // Backend response detayları
            responseStatus: error?.response?.status,
            responseStatusText: error?.response?.statusText,
            responseData: backendError,
            // Backend'den gelen spesifik hata mesajı
            backendErrorMessage: backendError?.message || backendError?.error || backendError,
            backendErrorString: JSON.stringify(backendError, null, 2),
            responseHeaders: error?.response?.headers,
            // Request detayları
            request: error?.request,
            config: error?.config,
            selectedBannerUri,
          });
          setIsUploadingBanner(false);
          
          // Hata mesajını kullanıcıya göster - backend'den gelen mesajı öncelikle kullan
          const errorMessage = backendError?.message 
            || backendError?.error
            || (typeof backendError === 'string' ? backendError : null)
            || error?.message 
            || 'Banner yüklenirken bir hata oluştu';
          
          console.error('[ProfileEditScreen] ❌ Banner upload hatası - Backend mesajı:', {
            backendError,
            extractedMessage: errorMessage,
            status: error?.response?.status,
          });
          Alert.alert('Banner Upload Failed', errorMessage);
          return;
        } finally {
          setIsUploadingBanner(false);
          console.log('[ProfileEditScreen] 📤 Banner upload işlemi tamamlandı (finally)');
        }
      } else if (selectedBannerUri && selectedBannerUri.startsWith('http')) {
        // Zaten upload edilmiş (URL formatında)
        bannerUrl = selectedBannerUri;
        console.log('[ProfileEditScreen] ℹ️ Banner zaten yüklenmiş (URL formatında):', bannerUrl);
      }

      // CRITICAL FIX: Eğer sadece avatar veya sadece banner upload edildiyse, profile update çağırma
      // Avatar/banner upload endpoint'leri zaten backend'de profili güncelliyor
      const hasOnlyAvatarUpload = avatarUploaded && !bannerUploaded;
      const hasOnlyBannerUpload = bannerUploaded && !avatarUploaded;
      
      if (hasOnlyAvatarUpload || hasOnlyBannerUpload) {
        const uploadType = hasOnlyAvatarUpload ? 'avatar' : 'banner';
        console.log(`[ProfileEditScreen] ℹ️ Sadece ${uploadType} upload edildi - profile update atlanıyor`);
        // Cache zaten upload sonrası invalidate edildi
        Alert.alert('Success', `${uploadType === 'avatar' ? 'Avatar' : 'Banner'} updated successfully!`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        return;
      }

      // Prepare update data - API formatına uygun
      // NOT: Avatar ve banner ayrı endpoint'lerle yüklenir (POST /users/me/avatar, POST /users/me/banner)
      // Bu endpoint sadece metin alanlarını günceller (name, biography, cosmetic, badge)
      console.log('[ProfileEditScreen] 📝 Profile update data hazırlanıyor...');
      const updateData: {
        name?: string;
        biography?: string;
        badge?: string[];
        cosmetic?: string | null;
      } = {};

      // Name zorunlu - her zaman gönder
      if (name.trim().length > 0) {
        updateData.name = name.trim();
        console.log('[ProfileEditScreen] 📝 Name eklendi:', updateData.name);
      }

      // Biography sadece doluysa ekle (boş string gönderme)
      if (bio.trim().length > 0) {
        updateData.biography = bio.trim();
        console.log('[ProfileEditScreen] 📝 Biography eklendi:', {
          length: updateData.biography.length,
          preview: updateData.biography.substring(0, 50) + '...',
        });
      }

      // Badge array'i sadece varsa ekle
      if (badgeIds.length > 0) {
        updateData.badge = badgeIds;
        console.log('[ProfileEditScreen] 📝 Badge array eklendi:', badgeIds);
      }

      // Cosmetic - seçili cosmetic ID'sini ekle (null olabilir)
      if (cosmetic !== undefined) {
        updateData.cosmetic = cosmetic;
        console.log('[ProfileEditScreen] 📝 Cosmetic eklendi:', cosmetic);
      }

      // NOT: Avatar ve banner URL'leri burada gönderilmez
      // Avatar ve banner upload endpoint'leri (POST /users/me/avatar, POST /users/me/banner)
      // başarılı olduğunda backend otomatik olarak kullanıcının profilini günceller

      // Request data'yı logla
      console.log('[ProfileEditScreen] 📤 Profile update request gönderiliyor:', {
        updateData: JSON.stringify(updateData, null, 2),
        updateDataKeys: Object.keys(updateData),
        hasName: !!updateData.name,
        hasBiography: !!updateData.biography,
        hasBadge: !!updateData.badge,
        badgeCount: updateData.badge?.length || 0,
        hasCosmetic: updateData.cosmetic !== undefined,
        cosmeticValue: updateData.cosmetic,
        avatarUrl,
        bannerUrl,
      });
      
      // CRITICAL FIX: Eğer sadece avatar/banner upload edildiyse ve form alanlarında değişiklik yoksa
      // profile update mutation'ını çağırma - avatar/banner upload endpoint'leri zaten backend'de profili güncelliyor
      const hasFormChanges = Object.keys(updateData).length > 0;
      const hasOnlyAvatarOrBannerUpload = (avatarUploaded || bannerUploaded) && !hasFormChanges;
      
      if (hasOnlyAvatarOrBannerUpload) {
        const uploadTypes = [];
        if (avatarUploaded) uploadTypes.push('avatar');
        if (bannerUploaded) uploadTypes.push('banner');
        console.log(`[ProfileEditScreen] ℹ️ Sadece ${uploadTypes.join(' ve ')} upload edildi, form alanlarında değişiklik yok - profile update atlanıyor`);
        // Cache zaten upload sonrası invalidate edildi
        Alert.alert('Success', `${uploadTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ve ')} updated successfully!`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        return;
      }
      
      // Profile update - sadece form alanlarında değişiklik varsa
      console.log('[ProfileEditScreen] 📤 updateProfileMutation.mutate çağrılıyor...');
      updateProfileMutation.mutate(updateData, {
        onSuccess: (data) => {
          console.log('[ProfileEditScreen] ✅ Profile update başarılı:', {
            data,
            dataType: typeof data,
            hasData: !!data,
            responseKeys: data ? Object.keys(data) : [],
            fullResponse: JSON.stringify(data, null, 2),
          });
          Alert.alert('Success', 'Profile updated successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        },
        onError: (error: any) => {
          console.error('[ProfileEditScreen] ❌ Profile update error - detaylı log:', {
            error,
            errorType: typeof error,
            errorMessage: error?.message,
            errorStack: error?.stack,
            response: error?.response,
            responseData: error?.response?.data,
            responseStatus: error?.response?.status,
            responseHeaders: error?.response?.headers,
            request: error?.request,
            config: error?.config,
            requestData: updateData,
            requestDataString: JSON.stringify(updateData, null, 2),
          });
          
          // Backend'den gelen detaylı hata mesajını göster
          const errorMessage = error?.response?.data?.message 
            || error?.response?.data?.error
            || error?.message 
            || 'Profil güncellenirken bir hata oluştu';
          
          console.error('[ProfileEditScreen] ❌ Profile update hatası - kullanıcıya gösterilecek mesaj:', errorMessage);
          Alert.alert('Error', errorMessage);
        },
      });
    } catch (error: any) {
      console.error('[ProfileEditScreen] ❌ handleSave catch bloğu - beklenmeyen hata:', {
        error,
        errorType: typeof error,
        errorMessage: error?.message,
        errorStack: error?.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      });
      Alert.alert('Error', error?.message || 'An error occurred while saving profile');
    }
  };

  const handleAvatarChange = async () => {
    try {
      const result = await imagePickerService.pickFromGallery();
      
      if (result.success && result.asset) {
        // CRITICAL FIX: Avatar seçildiğinde sadece local URI'yi kaydet, upload etme
        // Upload işlemi Save butonuna tıklandığında yapılacak
        setSelectedAvatarUri(result.asset.uri);
      } else {
        toast.show({
          placement: 'top',
          render: ({ id }: { id: string }) => {
            return (
              <Box maxWidth="90%" alignSelf="center" px="$4">
                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                  <ToastTitle>Error</ToastTitle>
                  <ToastDescription>{result.error || 'An error occurred while selecting photo'}</ToastDescription>
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
                <ToastTitle>Error</ToastTitle>
                <ToastDescription>An error occurred while selecting photo</ToastDescription>
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
                  <ToastTitle>Error</ToastTitle>
                  <ToastDescription>{result.error || 'An error occurred while selecting photo'}</ToastDescription>
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
                <ToastTitle>Error</ToastTitle>
                <ToastDescription>An error occurred while selecting photo</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
    }
  };

  const handleBannerChange = async () => {
    try {
      const result = await imagePickerService.pickFromGallery();
      
      if (result.success && result.asset) {
        // CRITICAL FIX: Banner seçildiğinde sadece local URI'yi kaydet, upload etme
        // Upload işlemi Save butonuna tıklandığında yapılacak
        setSelectedBannerUri(result.asset.uri);
      } else {
        toast.show({
          placement: 'top',
          render: ({ id }: { id: string }) => {
            return (
              <Box maxWidth="90%" alignSelf="center" px="$4">
                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                  <ToastTitle>Error</ToastTitle>
                  <ToastDescription>{result.error || 'An error occurred while selecting photo'}</ToastDescription>
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
                <ToastTitle>Error</ToastTitle>
                <ToastDescription>An error occurred while selecting photo</ToastDescription>
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
        rightButton={{
          text: 'Save',
          backgroundColor: '#D0F205',
          borderWidth: 1,
          borderColor: '#B8CC04',
          textColor: '#111111',
          fontSize: 14,
          borderRadius: 25,
          paddingX: 16, // CreatePostScreen'deki 22'den daha az (sola almak için)
          paddingY: 8,
          onPress: handleSave,
        }}
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

            {/* Avatar Section - seçili kozmetik çerçevesi varsa onu kullan */}
            <Box
              position="absolute"
              bottom={-40}
              left={16}
              borderRadius={100}
              overflow="hidden"
              w={100}
              h={100}
              borderWidth={4}
              borderColor={cosmetic ? getCosmeticBorderColor(cosmetic) : (isDark ? '$backgroundDark950' : '$backgroundLight0')}
            >
              <Image
                source={selectedAvatarUri ? { uri: selectedAvatarUri } : (user?.avatar ? { uri: user.avatar } : mock_user_card.avatar)}
                alt={name}
                w="100%"
                h="100%"
              />
              
              {/* Avatar tıklanınca Figma modal açılır: fotoğraf (kamera+) veya çerçeve seçimi */}
              <Pressable
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="rgba(0, 0, 0, 0.4)"
                justifyContent="center"
                alignItems="center"
                onPress={openCosmeticModal}
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
                fontSize="$sm"
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
                  fontSize="$sm"
                />
              </Input>
            </VStack>

            {/* Bio Field */}
            <VStack space="xs">
              <Text
                color={isDark ? '$textDark200' : '$textLight700'}
                fontSize="$sm"
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
                  fontSize="$sm"
                  multiline
                />
              </Textarea>
            </VStack>

            {/* Badge Section */}
            <VStack space="xs">
              <Text
                color={isDark ? '$textDark200' : '$textLight700'}
                fontSize="$sm"
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
                  fontSize="$sm"
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
                  fontSize="$sm"
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
                  fontSize="$sm"
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

      {/* Avatar + Cosmetics Modal - RNModal (Figma 6576-31958) */}
      <RNModal
        visible={isCosmeticModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCosmeticModal}
      >
        <RNPressable style={styles.avatarModalOverlay} onPress={closeCosmeticModal}>
          <RNPressable style={[styles.avatarModalContent, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]} onPress={(e) => e.stopPropagation()}>
            <VStack space="lg" py="$6" px="$5">
              {/* Avatar + çerçeve; sağ altta kamera+ butonu (Figma) */}
              <VStack alignItems="center" space="md">
                <Box position="relative" alignItems="center" justifyContent="center">
                  <Box
                    width={110}
                    height={110}
                    borderRadius={55}
                    borderWidth={3}
                    borderColor={getCosmeticBorderColor(cosmeticPreview ?? cosmetic)}
                    overflow="hidden"
                  >
                    <Image
                      source={selectedAvatarUri ? { uri: selectedAvatarUri } : (user?.avatar ? { uri: user.avatar } : mock_user_card.avatar)}
                      alt={name}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </Box>
                  {/* Kamera+ butonu - sağ alt köşe (yeşil-sarı daire, Figma) */}
                  <Pressable
                    position="absolute"
                    right={-2}
                    bottom={-2}
                    w={36}
                    h={36}
                    borderRadius={18}
                    bg="#D0F205"
                    borderWidth={2}
                    borderColor={isDark ? '#1A1A1A' : '#FFFFFF'}
                    alignItems="center"
                    justifyContent="center"
                    onPress={handlePickAvatarFromGallery}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <ActivityIndicator size="small" color="#111111" />
                    ) : (
                      <Image
                        source={require('@/assets/icons/camera_plus.png')}
                        alt="Change avatar"
                        w={20}
                        h={20}
                        resizeMode="contain"
                      />
                    )}
                  </Pressable>
                </Box>
                <Text
                  fontSize="$lg"
                  fontWeight="$bold"
                  color={isDark ? '#FFFFFF' : '#000000'}
                  textAlign="center"
                >
                  {name}
                </Text>
              </VStack>

              {/* Cosmetics başlık - sol hizalı, gri (Figma) */}
              <Text
                fontSize="$sm"
                fontWeight="$semibold"
                color={isDark ? '#B3B3B3' : '#737373'}
                alignSelf="flex-start"
              >
                Cosmetics
              </Text>

              {/* Figma 6576-32081: Cosmetic yoksa tek dashed + plus butonu → MarketPlaceScreen'e yönlendir */}
              {ownedCosmeticsIds.length === 0 ? (
                <Pressable
                  alignSelf="flex-start"
                  mt="$1"
                  onPress={() => {
                    closeCosmeticModal();
                    navigationService.navigate(ROOT_ROUTES.MARKETPLACE, {
                      screen: 'MarketPlaceScreen',
                    });
                  }}
                >
                  <Box
                    width={56}
                    height={56}
                    borderRadius={28}
                    borderWidth={2}
                    borderStyle="dashed"
                    borderColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)'}
                    bg={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Feather name="plus" size={24} color={isDark ? '#999' : '#737373'} />
                  </Box>
                </Pressable>
              ) : (
                <VStack space="md" alignItems="center">
                  <HStack space="md" justifyContent="center">
                    {AVAILABLE_COSMETICS.slice(0, 4).map((item) => {
                      const borderColor = item.borderColor === 'transparent' ? (isDark ? '#666' : '#D4D4D4') : item.borderColor;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => setCosmeticPreview(item.id)}
                          width={56}
                          height={56}
                          borderRadius={28}
                          borderWidth={2}
                          borderColor={borderColor}
                          bg={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'}
                          alignItems="center"
                          justifyContent="center"
                        >
                          {item.borderColor === 'transparent' ? (
                            <Feather name="minus" size={18} color={isDark ? '#737373' : '#A3A3A3'} />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </HStack>
                  <HStack space="md" justifyContent="center">
                    {AVAILABLE_COSMETICS.slice(4, 6).map((item) => {
                      const borderColor = item.borderColor === 'transparent' ? (isDark ? '#666' : '#D4D4D4') : item.borderColor;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => setCosmeticPreview(item.id)}
                          width={56}
                          height={56}
                          borderRadius={28}
                          borderWidth={2}
                          borderColor={borderColor}
                          bg={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'}
                          alignItems="center"
                          justifyContent="center"
                        >
                          {item.borderColor === 'transparent' ? (
                            <Feather name="minus" size={18} color={isDark ? '#737373' : '#A3A3A3'} />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </HStack>
                </VStack>
              )}

              {/* Cancel (açık gri) + Save (limon yeşili) - Figma */}
              <HStack space="sm" mt="$2">
                <Pressable
                  onPress={closeCosmeticModal}
                  flex={1}
                  bg={isDark ? '#2A2A2A' : '#EDEDED'}
                  borderRadius={12}
                  py="$3"
                  alignItems="center"
                >
                  <Text fontSize="$md" fontWeight="$semibold" color={isDark ? '#8C8C8C' : '#6B6B6B'}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveCosmetic}
                  flex={1}
                  bg="#D0F205"
                  borderRadius={12}
                  py="$3"
                  alignItems="center"
                >
                  <Text fontSize="$md" fontWeight="$bold" color="#111111">
                    Save
                  </Text>
                </Pressable>
              </HStack>
            </VStack>
          </RNPressable>
        </RNPressable>
      </RNModal>
      </Box>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

ProfileEditScreen.displayName = 'ProfileEditScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_MODAL_MAX_WIDTH = Math.min(360, SCREEN_WIDTH * 0.9);

const styles = StyleSheet.create({
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  avatarModalContent: {
    width: '90%',
    maxWidth: AVATAR_MODAL_MAX_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default ProfileEditScreen;

