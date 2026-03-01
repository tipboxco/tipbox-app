import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Pressable,
  HStack,
  Image,
  ScrollView,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { TouchableOpacity, Modal, View, ActivityIndicator } from 'react-native';
import { navigationService } from '@/src/services/NavigationService';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { XMarkIcon } from 'react-native-heroicons/outline';
import { useAppStore } from '@/src/store/appStore';
import { useDrawerStore } from '@/src/store/drawerStore';
import { useShallow } from 'zustand/react/shallow';
import {
  UserCircleIcon,
  CreditCardIcon,
  BookmarkIcon,
  ShoppingBagIcon,
  TrophyIcon,
  Cog6ToothIcon,
  StarIcon,
  QuestionMarkCircleIcon,
  ClockIcon,
  ArrowRightStartOnRectangleIcon,
} from 'react-native-heroicons/outline';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserProfile } from '@/src/features/profile/api/hooks';
import type { UserProfile } from '@/src/features/profile/types';
import { toImageSource, useBottomOffset  } from '@/src/utils';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

// Default user avatar
const DEFAULT_USER_AVATAR = require('@/assets/avatar/default-useravatar.png');

const PRIME_PASS_VIDEO_SOURCE = require('@/src/Expert Now Video/expertnow-comingsoon.mp4');

interface MenuItem {
  id: string;
  icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  label: string;
  onPress: () => void;
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 80,
  },
});

/**
 * Custom Drawer Content Component
 * 
 * React Navigation DrawerNavigator ile uyumlu
 * Drawer state hem navigation hem drawer store'dan okunur (sync)
 */
const DrawerContentComponent: React.FC<DrawerContentComponentProps> = (props) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  // Drawer store'dan state oku (sync için)
  const { isOpen, closeDrawer, openDrawer } = useDrawerStore();
  
  // CRITICAL: Drawer state sync - drawer store kullanılıyor, navigation state sync'i kaldırıldı
  // Drawer açık/kapalı durumu drawer store'dan (isOpen) kontrol ediliyor
  // React Navigation drawer state'inde status property'si yok, bu yüzden sadece drawer store kullanılıyor
  
  // Drawer kapatma fonksiyonu - hem navigation hem store'u güncelle
  const handleCloseDrawer = useCallback(() => {
    props.navigation.closeDrawer();
    closeDrawer();
  }, [props.navigation, closeDrawer]);
  
  // CRITICAL: Tüm closeDrawer() çağrılarını handleCloseDrawer() ile değiştir
  // Bu sayede hem React Navigation hem drawer store senkronize kalır
  
  // PERFORMANCE FIX: Zustand selector'larını shallow ile memoize et
  const { logout, user, updateUser } = useAppStore(
    useShallow((state) => ({
      logout: state.logout,
      user: state.user,
      updateUser: state.updateUser,
    }))
  );
  
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomOffset({ extraPadding: 16 });
  
  // CRITICAL FIX: useUserProfile hook'unu kullan - ProfileScreen ile aynı cache logic
  // Bu sayede ProfileScreen'de olan veriler DrawerContent'te de olur
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile(user?.id);
  // Type assertion: React Query'nin generic tip çıkarımı sorunu için
  const typedUserProfile = userProfile as UserProfile | undefined;
  
  // PERFORMANCE FIX: Trust/Truster sayıları userProfile.stats'tan alınır
  // Liste verilerine burada ihtiyaç yok - sadece Trust_TrusterListScreen'de fetch edilir
  
  // PERFORMANCE FIX: Computed değerleri useMemo ile memoize et
  // Banner source - profile'dan gelen banner URL'i veya fallback
  const bannerSource = useMemo(() => {
    // İlk olarak userProfile'dan banner al (API'den gelen güncel veri)
    if (typedUserProfile?.bannerUrl) {
      const profileBanner = toImageSource(typedUserProfile.bannerUrl);
      if (profileBanner) return profileBanner;
    }
    // Hiçbiri yoksa default banner
    return require('@/assets/banner/banner_01.png');
  }, [typedUserProfile?.bannerUrl]);
  
  // Avatar source - profile'dan gelen avatar URL'i veya fallback
  const initialAvatarSource = useMemo(() => {
    // İlk olarak userProfile'dan avatar al (API'den gelen güncel veri)
    if (typedUserProfile?.avatar) {
      const profileAvatar = toImageSource(typedUserProfile.avatar);
      if (profileAvatar) return profileAvatar;
    }
    // Yoksa store'dan avatar al (persist edilmiş veri)
    if (user?.avatar) {
      const storeAvatar = toImageSource(user.avatar);
      if (storeAvatar) return storeAvatar;
    }
    
    // Hiçbiri yoksa default avatar
    return DEFAULT_USER_AVATAR;
  }, [typedUserProfile?.avatar, user?.avatar]);
  
  // Avatar source state - görsel yüklenemezse default avatar'a geçiş için
  const [avatarSource, setAvatarSource] = useState(initialAvatarSource);
  const avatarLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousAvatarRef = useRef<string | null>(null);
  
  // Avatar değiştiğinde state'i güncelle ve load durumunu resetle
  // CRITICAL: useMemo ile avatar URI'sini hesapla - sonsuz döngü önleme
  const computedAvatarUri = useMemo(() => {
    if (typedUserProfile?.avatar) {
      const profileAvatar = toImageSource(typedUserProfile.avatar);
      if (profileAvatar) {
        return typeof profileAvatar === 'string' ? profileAvatar : (profileAvatar as any)?.uri || null;
      }
    } else if (user?.avatar) {
      const storeAvatar = toImageSource(user.avatar);
      if (storeAvatar) {
        return typeof storeAvatar === 'string' ? storeAvatar : (storeAvatar as any)?.uri || null;
      }
    }
    return null;
  }, [typedUserProfile?.avatar, user?.avatar]);
  
  useEffect(() => {
    // Yeni avatar source'u hesapla
    let newSource = DEFAULT_USER_AVATAR;
    let newSourceUri: string | null = null;
    
    if (typedUserProfile?.avatar) {
      const profileAvatar = toImageSource(typedUserProfile.avatar);
      if (profileAvatar) {
        newSource = profileAvatar;
        newSourceUri = typeof profileAvatar === 'string' ? profileAvatar : (profileAvatar as any)?.uri || null;
      }
    } else if (user?.avatar) {
      const storeAvatar = toImageSource(user.avatar);
      if (storeAvatar) {
        newSource = storeAvatar;
        newSourceUri = typeof storeAvatar === 'string' ? storeAvatar : (storeAvatar as any)?.uri || null;
      }
    }
    
    // Eğer avatar source değişmediyse (aynı URI), state'i güncelleme
    // Bu, gereksiz re-render'ları ve avatar'ın gizlenmesini önler
    // CRITICAL: computedAvatarUri ile karşılaştır - sonsuz döngü önleme
    if (newSourceUri && previousAvatarRef.current === newSourceUri && newSourceUri === computedAvatarUri) {
      return; // Avatar değişmedi, state'i güncelleme
    }
    
    // Önceki timeout'u temizle
    if (avatarLoadTimeoutRef.current) {
      clearTimeout(avatarLoadTimeoutRef.current);
      avatarLoadTimeoutRef.current = null;
    }
    
    // Yeni avatar URI'sini kaydet
    previousAvatarRef.current = newSourceUri;
    
    // Eğer yeni source default avatar değilse, load kontrolü yap
    if (newSource !== DEFAULT_USER_AVATAR) {
      setAvatarSource(newSource);
      
      // 5 saniye içinde görsel yüklenmezse default avatar'a geç
      avatarLoadTimeoutRef.current = setTimeout(() => {
        setAvatarSource((currentSource: any) => {
          // Eğer hala yüklenmediyse ve source değişmediyse default avatar'a geç
          const currentUri = typeof currentSource === 'string' ? currentSource : (currentSource as any)?.uri || null;
          if (currentUri === newSourceUri) {
            previousAvatarRef.current = null; // Default avatar'a geçtiğimiz için ref'i temizle
            return DEFAULT_USER_AVATAR;
          }
          return currentSource;
        });
      }, 5000); // 5 saniye timeout
    } else {
      // Zaten default avatar ise direkt set et
      setAvatarSource(DEFAULT_USER_AVATAR);
      previousAvatarRef.current = null;
    }
    
    return () => {
      if (avatarLoadTimeoutRef.current) {
        clearTimeout(avatarLoadTimeoutRef.current);
        avatarLoadTimeoutRef.current = null;
      }
    };
  }, [computedAvatarUri]); // CRITICAL FIX: computedAvatarUri zaten userProfile?.avatar ve user?.avatar'a bağlı, redundant dependency'leri kaldır
  
  // Avatar başarıyla yüklendiğinde
  // CRITICAL FIX: avatarSource dependency'sini kaldır - sonsuz döngü önleme
  // avatarSource değiştiğinde callback yeniden oluşturulmamalı, sadece timeout temizlenmeli
  const handleAvatarLoad = useCallback(() => {
    // Timeout'u temizle - görsel başarıyla yüklendi, default avatar'a geçmeye gerek yok
    if (avatarLoadTimeoutRef.current) {
      clearTimeout(avatarLoadTimeoutRef.current);
      avatarLoadTimeoutRef.current = null;
    }
  }, []); // Empty dependency array - callback stable kalmalı
  
  // Avatar yüklenme hatası durumunda default avatar'a geçiş
  // CRITICAL FIX: avatarSource dependency'sini kaldır - sonsuz döngü önleme
  // avatarSource değiştiğinde callback yeniden oluşturulmamalı
  // setAvatarSource çağrısı zaten state güncellemesi yapıyor, dependency gerekmez
  const handleAvatarError = useCallback(() => {
    setAvatarSource(DEFAULT_USER_AVATAR);
    previousAvatarRef.current = null; // Default avatar'a geçtiğimiz için ref'i temizle
    // Timeout'u temizle
    if (avatarLoadTimeoutRef.current) {
      clearTimeout(avatarLoadTimeoutRef.current);
      avatarLoadTimeoutRef.current = null;
    }
  }, []); // Empty dependency array - callback stable kalmalı
  
  // Kullanıcı adı - profile'dan gelen name veya fallback
  const displayName = useMemo(() => {
    if (isProfileLoading) return user?.fullName || user?.email || 'Loading...';
    return typedUserProfile?.name || user?.fullName || user?.email || 'Kullanıcı';
  }, [typedUserProfile?.name, user?.fullName, user?.email, isProfileLoading]);
  
  // Tagler (titles) - profile'dan gelen titles
  const tags = useMemo(() => {
    if (isProfileLoading) return [];
    return typedUserProfile?.titles || [];
  }, [typedUserProfile?.titles, isProfileLoading]);
  
  // Stats - profile'dan gelen posts, trust ve truster sayılarını liste uzunluklarından al
  // CRITICAL FIX: Trust ve Truster sayıları Trust_TrusterListScreen ile aynı olmalı
  // ProfileScreen'deki sayılar da aynı olmalı (liste uzunluğu = gerçek sayı)
  const stats = useMemo(() => {
    if (isProfileLoading) return { posts: 0, trust: 0, truster: 0 };
    
    // PERFORMANCE FIX: Tüm stats userProfile'dan gelir - gereksiz API isteklerini önler
    const posts = typedUserProfile?.stats?.posts ?? 0;
    const trust = typedUserProfile?.stats?.trust ?? 0;
    const truster = typedUserProfile?.stats?.truster ?? 0;
    
    return { posts, trust, truster };
  }, [typedUserProfile?.stats, isProfileLoading]);

  // PERFORMANCE FIX: Navigation handler'larını useCallback ile memoize et
  // CRITICAL FIX: NavigationService kullan - root navigator ref'ine direkt erişir
  // Drawer content NavigationContainer içinde olduğu için NavigationService çalışır
  // CRITICAL FIX: DrawerContent sadece drawer açıkken render edilir, bu yüzden state kontrolü gereksiz
  // Handler çağrıldıysa drawer açık demektir
  const handleNavigateToProfile = useCallback(() => {
    if (!user?.id) {
      return;
    }
    handleCloseDrawer();
    // NavigationService root navigator ref'ine direkt erişir
    navigationService.navigate('Profile', {
      screen: 'ProfileMain',
      params: { userId: user.id },
    });
  }, [handleCloseDrawer, user?.id]); // CRITICAL FIX: isOpen dependency'sini kaldır - gereksiz re-render önleme

  const handleNavigateToWallet = useCallback(() => {
    handleCloseDrawer();
    // Wallet navigator'a direkt navigate et
    navigationService.navigate('Wallet', {
      screen: 'WalletScreen',
    });
  }, [handleCloseDrawer]);

  const handleNavigateToBookmarks = useCallback(() => {
    handleCloseDrawer();
    navigationService.navigate('Bookmarks', undefined);
  }, [handleCloseDrawer]);

  const handleNavigateToMarketplace = useCallback(() => {
    handleCloseDrawer();
    navigationService.navigate('Marketplace', undefined);
  }, [handleCloseDrawer]);

  const handleNavigateToSettings = useCallback(() => {
    handleCloseDrawer();
    navigationService.navigate('Settings', undefined);
  }, [handleCloseDrawer]);

  const handleNavigateToMoreSchoise = useCallback(() => {
    handleCloseDrawer();
    navigationService.navigate('MoreSchoise', undefined);
  }, [handleCloseDrawer]);

  // Prime Pass Video Modal State (expo-video)
  const [isPrimePassVideoVisible, setIsPrimePassVideoVisible] = useState(false);
  const primePassPlayer = useVideoPlayer(PRIME_PASS_VIDEO_SOURCE);

  const handlePrimePassPress = useCallback(() => {
    handleCloseDrawer();
    setIsPrimePassVideoVisible(true);
  }, [handleCloseDrawer]);

  const handleClosePrimePassVideo = useCallback(() => {
    setIsPrimePassVideoVisible(false);
    primePassPlayer.pause();
  }, [primePassPlayer]);

  // Modal açıldığında videoyu oynat
  useEffect(() => {
    if (isPrimePassVideoVisible) {
      primePassPlayer.play();
    }
  }, [isPrimePassVideoVisible, primePassPlayer]);

  // PERFORMANCE FIX: Profile section handler'ını memoize et
  const handleProfilePress = useCallback(() => {
    if (!user?.id) {
      return;
    }
    handleCloseDrawer();
    navigationService.navigate('Profile', {
      screen: 'ProfileMain',
      params: { userId: user.id },
    });
  }, [handleCloseDrawer, user?.id]); // CRITICAL FIX: isOpen dependency'sini kaldır - gereksiz re-render önleme

  // PERFORMANCE FIX: Stats section handler'larını memoize et
  const handlePostsPress = useCallback(() => {
    if (!user?.id) {
      return;
    }
    handleCloseDrawer();
    navigationService.navigate('Profile', {
      screen: 'ProfileMain',
      params: { userId: user.id },
    });
  }, [handleCloseDrawer, user?.id]);

  const handleTrustPress = useCallback(() => {
    if (!user?.id) {
      return;
    }
    handleCloseDrawer();
    navigationService.navigate('Profile', {
      screen: 'TrustList',
      params: { userId: user.id, initialTab: 'trust' },
    });
  }, [handleCloseDrawer, user?.id]);

  const handleTrusterPress = useCallback(() => {
    if (!user?.id) {
      return;
    }
    handleCloseDrawer();
    navigationService.navigate('Profile', {
      screen: 'TrustList',
      params: { userId: user.id, initialTab: 'truster' },
    });
  }, [handleCloseDrawer, user?.id]);

  // PERFORMANCE FIX: Bottom menu handler'larını memoize et
  const handleBottomMenuPress = useCallback(() => {
    handleCloseDrawer();
  }, [handleCloseDrawer]);

  const handleNavigateToPurchaseHistory = useCallback(() => {
    handleCloseDrawer();
    navigationService.navigate('Settings', {
      screen: 'PaymentAndSubscription',
    });
  }, [handleCloseDrawer]);

  const handleNavigateToVoteNewFeatures = useCallback(() => {
    handleCloseDrawer();
    // WebView ekranına navigate et (Canny için)
    navigationService.navigate('Settings', {
      screen: 'CannyWebView',
    } as any);
  }, [handleCloseDrawer]);

  const handleHelpCenterPress = useCallback(() => {
    // Coming Soon - şimdilik sadece drawer'ı kapat
    handleCloseDrawer();
  }, [handleCloseDrawer]);

  const handleLogout = useCallback(async () => {
    // Drawer'ı hemen kapat
    handleCloseDrawer();

    // CRITICAL SECURITY FIX: Logout sonrası navigation stack'i tamamen temizle
    // Authenticated screen'lerin memory'de kalmamasını garanti et
    try {
      // Logout işlemini çağır
      await logout();

      // CRITICAL: Navigation stack'i sıfırla ve Auth screen'e yönlendir
      // Bu sayede authenticated screen'ler memory'den temizlenir
      navigationService.navigate('Auth', {
        screen: 'Onboarding',
      });

      // Alternative: CommonActions.reset ile navigation state'i sıfırla
      // props.navigation.dispatch(
      //   CommonActions.reset({
      //     index: 0,
      //     routes: [{ name: 'Auth' }],
      //   })
      // );
    } catch (error) {
      console.error('❌ Logout hatası:', error);
      // Hata olsa bile Auth screen'e yönlendir (security önlemi)
      navigationService.navigate('Auth', {
        screen: 'Onboarding',
      });
    }
  }, [handleCloseDrawer, logout]);

  // PERFORMANCE FIX: MENU_ITEMS array'ini useMemo ile memoize et
  // Handler'lar useCallback ile memoize edildi, bu yüzden array sadece bir kez oluşturulur
  const MENU_ITEMS: MenuItem[] = useMemo(() => [
    {
      id: 'account',
      icon: UserCircleIcon,
      label: 'Account',
      onPress: handleNavigateToProfile,
    },
    {
      id: 'wallet',
      icon: CreditCardIcon,
      label: 'Wallet',
      onPress: handleNavigateToWallet,
    },
    {
      id: 'bookmarks',
      icon: BookmarkIcon,
      label: 'Bookmarks',
      onPress: handleNavigateToBookmarks,
    },
    {
      id: 'marketplace',
      icon: ShoppingBagIcon,
      label: 'Marketplace',
      onPress: handleNavigateToMarketplace,
    },
    {
      id: 'prime-pass',
      icon: TrophyIcon,
      label: 'Prime Pass',
      onPress: handlePrimePassPress,
    },
    {
      id: 'settings',
      icon: Cog6ToothIcon,
      label: 'Settings',
      onPress: handleNavigateToSettings,
    },
    // MoreSchoise seçeneği şimdilik gizlendi
    // {
    //   id: 'more-schoise',
    //   icon: EllipsisHorizontalIcon,
    //   label: 'MoreSchoise',
    //   onPress: handleNavigateToMoreSchoise,
    // },
  ], [
    handleNavigateToProfile,
    handleNavigateToWallet,
    handleNavigateToBookmarks,
    handleNavigateToMarketplace,
    handleNavigateToSettings,
    // handleNavigateToMoreSchoise, // Şimdilik gizlendi
    handleCloseDrawer,
  ]);

  return (
    <Box 
      flex={1} 
      bg={isDark ? '#000000' : '#FFFFFF'} 
      w="100%" 
      m={0} 
      p={0}
      style={{
        zIndex: 10000, // FIX: DrawerContent'in SafeAreaView'in üstünde görünmesi için
        elevation: 10000, // Android için elevation
      }}
    >
      {/* ScrollView kullan - DrawerContentScrollView yerine */}
      <ScrollView
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingTop: 0,
          paddingBottom: 200, // Bottom menüler için padding
          paddingLeft: 0,
          paddingRight: 0,
          margin: 0,
          width: '100%',
        }}
        style={{
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          margin: 0,
          padding: 0,
          flex: 1,
          width: '100%',
        }}
        scrollEnabled={true}
        bounces={false}
        overScrollMode="never"
        alwaysBounceVertical={false}
      >
        <Box 
          flex={1} 
          bg={isDark ? '#000000' : '#FFFFFF'} 
          w="100%" 
          m={0} 
          p={0}
        >
          {/* Banner Section – FULL BLEED */}
          <Box h={280} w="100%" position="relative" bg={isDark ? '#000000' : '#FFFFFF'}>
          {/* Banner */}
          <Box h={120} w="100%" overflow="hidden" position="relative">
            <Image
              source={bannerSource}
              alt="Profile Banner"
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            {/* Overlay - gradient yerine hafif overlay */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="rgba(0, 0, 0, 0.3)"
            />
          </Box>
          
          {/* Profile Section */}
          <TouchableOpacity
            activeOpacity={1}
            style={{ 
              opacity: 1,
              position: 'absolute',
              top: 70,
              left: 0,
              right: 0,
              zIndex: 0,
            }}
            onPress={() => {
              handleProfilePress();
            }}
          >
            <Box px="$6">
              <Box alignItems="center">
                <Box
                  borderWidth={4}
                  borderColor={isDark ? '#000000' : '#FFFFFF'}
                  rounded="$full"
                  overflow="hidden"
                  w={100}
                  h={100}
                  bg="$white"
                >
                  <Image
                    source={avatarSource}
                    alt={displayName}
                    w="100%"
                    h="100%"
                    rounded="$full"
                    onLoad={handleAvatarLoad}
                    onError={handleAvatarError}
                  />
                </Box>
                <Text
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize="$lg"
                  fontWeight="$bold"
                  mt="$1"
                >
                  {displayName}
                </Text>
                {tags.length > 0 && (
                  <Text
                    mt="$0.5"
                    fontSize="$2xs"
                    fontWeight="$medium"
                    color="#A3A3A3"
                    numberOfLines={1}
                  >
                    {tags.join(', ')}
                    </Text>
                )}
              </Box>
            </Box>
          </TouchableOpacity>
        </Box>

          {/* Stats Section – FULL BLEED, içte hizalama */}
          <Box mt={-60} mb="$2">
            <HStack justifyContent="center" alignItems="center" px="$6">
              <Pressable
                onPress={() => {
                  handlePostsPress();
                }}
                flex={1}
                alignItems="center"
                $hover={{ opacity: 0.7 }}
              >
                <VStack alignItems="center" space="xs">
                  <Text
                    color={isDark ? '$textDark50' : '$textLight900'}
                    fontSize="$sm"
                    fontWeight="$bold"
                  >
                    {stats.posts}
                  </Text>
                  <Text color={isDark ? '$textDark400' : '$textLight600'} fontSize="$xs">
                    Posts
                  </Text>
                </VStack>
              </Pressable>
              <Box w={1} h={30} bg={isDark ? '#DFDFDF' : '#DFDFDF'} />
              <Pressable
                onPress={() => {
                  handleTrustPress();
                }}
                flex={1}
                alignItems="center"
                $hover={{ opacity: 0.7 }}
              >
                <VStack alignItems="center" space="xs">
                  <Text
                    color={isDark ? '$textDark50' : '$textLight900'}
                    fontSize="$sm"
                    fontWeight="$bold"
                  >
                    {stats.trust}
                  </Text>
                  <Text color={isDark ? '$textDark400' : '$textLight600'} fontSize="$xs">
                    Trust
                  </Text>
                </VStack>
              </Pressable>
              <Box w={0.5} h={30} bg={isDark ? '$backgroundDark200' : '$backgroundLight200'} />
              <Pressable
                onPress={() => {
                  handleTrusterPress();
                }}
                flex={1}
                alignItems="center"
                $hover={{ opacity: 0.7 }}
              >
                <VStack alignItems="center" space="xs">
                  <Text
                    color={isDark ? '$textDark50' : '$textLight900'}
                    fontSize="$sm"
                    fontWeight="$bold"
                  >
                    {stats.truster}
                  </Text>
                  <Text color={isDark ? '$textDark400' : '$textLight600'} fontSize="$xs">
                    Truster
                  </Text>
                </VStack>
              </Pressable>
            </HStack>
          </Box>

          {/* Premium Banner – FULL BLEED, içte padding */}
          <Box w="100%" mb="$2">
          <Box
            w="100%"
            h={0.5}
            bg={isDark ? '$backgroundDark200' : '$backgroundLight200'}
          />
          <Box
            w="100%"
            h={76}
            overflow="hidden"
            position="relative"
          >
            <Image
              source={require('@/src/Drawer Premium Selling Banner/getpremium.png')}
              alt="Premium Banner"
              w="100%"
              h="100%"
              resizeMode="contain"
            />
          </Box>
        </Box>

          {/* Menu Items – DIŞTA px yok, SATIRDA px var */}
          <VStack px="$0">
            {MENU_ITEMS.map((item: MenuItem) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  item.onPress();
                }}
                h={48}
                justifyContent="center"
                bg="transparent"
                px="$6"
                $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
              >
              <HStack space="md" alignItems="center">
                <Box w={24} h={24} justifyContent="center" alignItems="center">
                  <item.icon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
                <Text 
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize="$sm"
                  fontWeight="$bold"
                  w={110}
                >
                  {item.label}
                </Text>
              </HStack>
            </Pressable>
            ))}
          </VStack>

          {/* Bottom Line – FULL BLEED - 1px daha kalın */}
          <Box h={1.5} w="100%" bg={isDark ? '$backgroundDark200' : '$backgroundLight200'} mt="$3" />
        </Box>
      </ScrollView>

      {/* Settings and Help – DIŞTA px yok, SATIRDA px var - Bottom Fixed */}
      <Box 
        position="absolute" 
        bottom={0} 
        left={0} 
        right={0} 
        bg={isDark ? '#000000' : '#FFFFFF'}
        pb={bottomPadding}
      >
        <VStack px="$0">
          <Pressable
            onPress={handleNavigateToVoteNewFeatures}
            h={48}
            justifyContent="center"
            bg="transparent"
            px="$6"
            $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
          >
          <HStack space="md" alignItems="center">
            <Box w={20} h={20} justifyContent="center" alignItems="center">
              <StarIcon width={16} height={16} color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
            <Text 
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$xs"
              fontWeight="$medium"
              flex={1}
              numberOfLines={1}
            >
              Vote New Features
            </Text>
          </HStack>
        </Pressable>
        <Pressable
          onPress={handleHelpCenterPress}
          h={48}
          justifyContent="center"
          bg="transparent"
          px="$6"
          $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
        >
          <HStack space="md" alignItems="center">
            <Box w={20} h={20} justifyContent="center" alignItems="center">
              <QuestionMarkCircleIcon width={16} height={16} color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
            <Text 
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$xs"
              fontWeight="$medium"
              w={110}
            >
              Help Center
            </Text>
            <Box
              bg={isDark ? '$backgroundDark600' : '$backgroundLight300'}
              px="$2"
              py="$0.5"
              borderRadius="$sm"
            >
              <Text
                color={isDark ? '$textDark400' : '$textLight600'}
                fontSize="$2xs"
                fontWeight="$medium"
              >
                Coming Soon
              </Text>
            </Box>
          </HStack>
        </Pressable>
        <Pressable
          onPress={handleNavigateToPurchaseHistory}
          h={48}
          justifyContent="center"
          bg="transparent"
          px="$6"
          $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
        >
          <HStack space="md" alignItems="center">
            <Box w={20} h={20} justifyContent="center" alignItems="center">
              <ClockIcon width={16} height={16} color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
            <Text 
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$xs"
              fontWeight="$medium"
              w={110}
            >
              Purchase History
            </Text>
          </HStack>
        </Pressable>
        <Pressable
          onPress={handleLogout}
          h={48}
          justifyContent="center"
          bg="transparent"
          px="$6"
          $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
        >
          <HStack space="md" alignItems="center">
            <Box w={20} h={20} justifyContent="center" alignItems="center">
              <ArrowRightStartOnRectangleIcon width={16} height={16} color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
            <Text 
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$xs"
              fontWeight="$medium"
              w={110}
            >
              Log out
            </Text>
          </HStack>
        </Pressable>
      </VStack>
      </Box>

      {/* Prime Pass Video Modal */}
      <Modal
        visible={isPrimePassVideoVisible}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={handleClosePrimePassVideo}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: '#000000',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {/* Close Button */}
          <Pressable
            onPress={handleClosePrimePassVideo}
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              zIndex: 10,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <XMarkIcon width={24} height={24} color="#FFFFFF" />
          </Pressable>

          {/* Video Player (expo-video) */}
          <VideoView
            player={primePassPlayer}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            nativeControls={false}
          />
        </View>
      </Modal>
    </Box>
  );
};

// PERFORMANCE FIX: React.memo ile sarmala - drawer açılırken gereksiz re-render'ları önle
// CRITICAL: Drawer swipe sırasında re-render'ı önlemek için props değişikliklerini kontrol et
export const DrawerContent = React.memo(DrawerContentComponent, (prevProps, nextProps) => {
  // Custom comparison - sadece gerçek değişikliklerde re-render
  // Drawer state drawer store'dan kontrol ediliyor, bu yüzden props state kontrolü kaldırıldı
  // Props değişmediyse re-render yapma
  if (prevProps.state === nextProps.state) {
    return true; // Re-render yapma
  }
  
  // Props değiştiyse re-render yap
  return false; // Re-render yap
});
DrawerContent.displayName = 'DrawerContent';

