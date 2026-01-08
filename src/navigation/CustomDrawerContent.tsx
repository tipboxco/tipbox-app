import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  VStack,
  Text,
  Pressable,
  HStack,
  Image,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { DrawerContentComponentProps, useDrawerStatus } from '@react-navigation/drawer';
import { ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useAppStore } from '@/src/store/appStore';
import { useShallow } from 'zustand/react/shallow';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '@/src/features/profile/api/profileApi';
import { profileKeys } from '@/src/features/profile/api/hooks';
import { toImageSource, useBottomOffset } from '@/src/utils';

interface MenuItem {
  id: string;
  icon: FeatherIconName;
  label: string;
  onPress: () => void;
}

type FeatherIconName = keyof typeof FeatherIcon.glyphMap;

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 80,
  },
});

export const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { colorMode } = useColorMode();
  const navigation = useNavigation<any>();
  const isDark = colorMode === 'dark';
  
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
  
  // PERFORMANCE FIX: Drawer durumunu ref ile sakla - handler'ların dependency'sinden çıkar
  // useDrawerStatus her frame'de değişebilir, bu yüzden ref ile saklayıp handler'larda runtime'da kontrol ediyoruz
  const drawerStatus = useDrawerStatus();
  const drawerStatusRef = useRef(drawerStatus);
  
  // Drawer status'ü ref'te güncelle (her render'da)
  useEffect(() => {
    drawerStatusRef.current = drawerStatus;
  }, [drawerStatus]);
  
  // Store'daki user değişikliğini takip et (sonsuz döngüyü önlemek için)
  const previousUserRef = useRef<{ id?: string; fullName?: string; avatar?: string } | null>(null);
  const isUpdatingFromProfileRef = useRef(false);
  const isRefetchingFromUserChangeRef = useRef(false);
  const updateUserTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Profile bilgilerini getir (screen-based caching ile)
  const { data: userProfile, refetch } = useQuery({
    queryKey: user?.id ? profileKeys.profile(user.id) : ['profile', 'profile', 'disabled'],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      return getUserProfile(user.id);
    },
    enabled: !!user?.id,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 5 * 60 * 1000,  // 5 dakika - ekran değişimlerinde anında göster
    gcTime: 15 * 60 * 1000,    // 15 dakika - cache'de tut
    refetchOnMount: false,      // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
  
  // Store'daki user değişikliğini dinle ve profile query'sini yeniden fetch et
  // SADECE user.id değiştiğinde veya profile'dan kaynaklanmayan değişikliklerde
  useEffect(() => {
    if (!user?.id) {
      previousUserRef.current = null;
      return;
    }

    const currentUser = {
      id: user.id,
      fullName: user.fullName,
      avatar: user.avatar,
    };
    
    const previousUser = previousUserRef.current;
    
    // İlk render veya user.id değiştiyse - sadece ref'i güncelle, refetch yapma
    if (!previousUser || previousUser.id !== currentUser.id) {
      previousUserRef.current = currentUser;
      return;
    }
    
    // User değiştiğinde (fullName veya avatar) ve bu değişiklik userProfile'dan kaynaklanmadıysa
    // Profile query'sini yeniden fetch et
    const userChanged = 
      previousUser.fullName !== currentUser.fullName || 
      previousUser.avatar !== currentUser.avatar;
    
    // Eğer user değişti ve bu değişiklik profile'dan kaynaklanmadıysa
    if (userChanged && !isUpdatingFromProfileRef.current && !isRefetchingFromUserChangeRef.current) {
      // Store'dan gelen değişiklik - profile query'sini yeniden fetch et
      isRefetchingFromUserChangeRef.current = true;
      refetch().finally(() => {
        // Flag'i resetle
        setTimeout(() => {
          isRefetchingFromUserChangeRef.current = false;
        }, 500);
      });
    }
    
    previousUserRef.current = currentUser;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.fullName, user?.avatar]);
  
  // Profile bilgisi geldiğinde store'daki user'ı güncelle (sadece değişiklik varsa)
  const previousProfileRef = useRef<{ name?: string; avatar?: string } | null>(null);
  
  useEffect(() => {
    // Cleanup: Önceki timeout'u temizle
    if (updateUserTimeoutRef.current) {
      clearTimeout(updateUserTimeoutRef.current);
      updateUserTimeoutRef.current = null;
    }

    if (!userProfile || !user?.id) {
      return;
    }

    const currentProfile = {
      name: userProfile.name,
      avatar: userProfile.avatar,
    };
    
    const previousProfile = previousProfileRef.current;
    
    // İlk render - sadece ref'i güncelle ve store'u sync et
    if (!previousProfile) {
      previousProfileRef.current = currentProfile;
      // İlk yüklemede store'u güncelle (sadece farklıysa)
      const needsUpdate = 
        user.fullName !== currentProfile.name ||
        user.avatar !== currentProfile.avatar;
      
      if (needsUpdate && !isRefetchingFromUserChangeRef.current) {
        isUpdatingFromProfileRef.current = true;
        updateUser({
          fullName: currentProfile.name,
          avatar: currentProfile.avatar,
        });
        // Flag'i resetle (debounce ile)
        updateUserTimeoutRef.current = setTimeout(() => {
          isUpdatingFromProfileRef.current = false;
        }, 200);
      }
      return;
    }
    
    // Sadece değerler gerçekten değiştiyse güncelle
    const hasChanged = 
      previousProfile.name !== currentProfile.name ||
      previousProfile.avatar !== currentProfile.avatar;
    
    if (hasChanged) {
      // Store'daki mevcut değerlerle karşılaştır - sadece farklıysa güncelle
      const needsUpdate = 
        user.fullName !== currentProfile.name ||
        user.avatar !== currentProfile.avatar;
      
      if (needsUpdate && !isRefetchingFromUserChangeRef.current) {
        // Profile'dan gelen güncelleme olduğunu işaretle (sonsuz döngüyü önlemek için)
        isUpdatingFromProfileRef.current = true;
        
        updateUser({
          fullName: currentProfile.name,
          avatar: currentProfile.avatar,
        });
        
        // Flag'i resetle (debounce ile)
        updateUserTimeoutRef.current = setTimeout(() => {
          isUpdatingFromProfileRef.current = false;
        }, 200);
      }
      
      previousProfileRef.current = currentProfile;
    }

    // Cleanup function
    return () => {
      if (updateUserTimeoutRef.current) {
        clearTimeout(updateUserTimeoutRef.current);
        updateUserTimeoutRef.current = null;
      }
    };
    // user?.fullName ve user?.avatar dependency'den kaldırıldı çünkü updateUser() bunları değiştiriyor
    // ve bu sonsuz döngüye neden oluyor. Sadece userProfile değişikliklerini dinliyoruz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.name, userProfile?.avatar, user?.id]);
  
  // PERFORMANCE FIX: Computed değerleri useMemo ile memoize et
  // Avatar source - profile'dan gelen avatar URL'i veya store'dan veya default avatar
  const avatarSource = useMemo(() => 
    toImageSource(userProfile?.avatar) ||
    toImageSource(user?.avatar || null) ||
    require('@/assets/avatar/ozan.png'),
    [userProfile?.avatar, user?.avatar]
  );
  
  // Kullanıcı adı - profile'dan gelen name veya store'dan gelen fullName veya email
  const displayName = useMemo(() => 
    userProfile?.name || user?.fullName || user?.email || 'Kullanıcı',
    [userProfile?.name, user?.fullName, user?.email]
  );
  
  // Tagler (titles) - profile'dan gelen titles
  const tags = useMemo(() => userProfile?.titles || [], [userProfile?.titles]);
  
  // Stats - profile'dan gelen stats
  const stats = useMemo(() => 
    userProfile?.stats || { posts: 0, trust: 0, truster: 0 },
    [userProfile?.stats]
  );

  // PERFORMANCE FIX: Navigation handler'larını useCallback ile memoize et
  // drawerStatusRef kullanarak handler'ları sabit tutuyoruz (dependency'den çıkardık)
  const handleNavigateToProfile = useCallback(() => {
    // Drawer durumunu runtime'da ref'ten kontrol et
    if (drawerStatusRef.current !== 'open') return;
    props.navigation.closeDrawer();
    navigation.navigate('Profile');
  }, [props.navigation, navigation]);

  const handleNavigateToWallet = useCallback(() => {
    if (drawerStatusRef.current !== 'open') return;
    props.navigation.closeDrawer();
    navigation.navigate('Wallet');
  }, [props.navigation, navigation]);

  const handleNavigateToBookmarks = useCallback(() => {
    if (drawerStatusRef.current !== 'open') return;
    props.navigation.closeDrawer();
    navigation.navigate('Bookmarks');
  }, [props.navigation, navigation]);

  const handleNavigateToMarketplace = useCallback(() => {
    if (drawerStatusRef.current !== 'open') return;
    props.navigation.closeDrawer();
    navigation.navigate('Marketplace');
  }, [props.navigation, navigation]);

  const handleNavigateToSettings = useCallback(() => {
    if (drawerStatusRef.current !== 'open') return;
    props.navigation.closeDrawer();
    navigation.navigate('Settings');
  }, [props.navigation, navigation]);

  const handleNavigateToMoreSchoise = useCallback(() => {
    if (drawerStatusRef.current !== 'open') return;
    props.navigation.closeDrawer();
    navigation.navigate('MoreSchoise');
  }, [props.navigation, navigation]);

  const handleCloseDrawer = useCallback(() => {
    if (drawerStatusRef.current !== 'open') return;
    props.navigation.closeDrawer();
  }, [props.navigation]);

  // PERFORMANCE FIX: Profile section handler'ını memoize et
  const handleProfilePress = useCallback(() => {
    if (drawerStatusRef.current !== 'open') return;
    props.navigation.closeDrawer();
    navigation.navigate('Profile');
  }, [props.navigation, navigation]);

  // PERFORMANCE FIX: Stats section handler'ını memoize et
  const handleStatsPress = useCallback(() => {
    if (drawerStatusRef.current !== 'open') return;
    props.navigation.closeDrawer();
    navigation.navigate('Profile');
  }, [props.navigation, navigation]);

  // PERFORMANCE FIX: Bottom menu handler'larını memoize et
  const handleBottomMenuPress = useCallback(() => {
    if (drawerStatusRef.current !== 'open') return;
    props.navigation.closeDrawer();
  }, [props.navigation]);

  const handleLogout = useCallback(async () => {
    if (drawerStatusRef.current !== 'open') return;
    
    // Drawer'ı hemen kapat
    props.navigation.closeDrawer();
    
    // Navigation'ı hemen reset et (kullanıcı anında çıkış görsün)
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'Auth',
        state: {
          routes: [{ name: 'Welcome' }]
        }
      }],
    });
    
    // Logout işlemini arka planda yap (token temizleme vs.)
    // State zaten logout() içinde güncelleniyor, bu yüzden navigation reset yeterli
    logout().catch((error) => {
      console.error('❌ Logout hatası (arka plan):', error);
    });
  }, [logout, props.navigation, navigation]);

  // PERFORMANCE FIX: MENU_ITEMS array'ini useMemo ile memoize et
  // Handler'lar useCallback ile memoize edildi, bu yüzden array sadece bir kez oluşturulur
  const MENU_ITEMS: MenuItem[] = useMemo(() => [
    {
      id: 'account',
      icon: 'user',
      label: 'Account',
      onPress: handleNavigateToProfile,
    },
    {
      id: 'wallet',
      icon: 'credit-card',
      label: 'Wallet',
      onPress: handleNavigateToWallet,
    },
    {
      id: 'bookmarks',
      icon: 'bookmark',
      label: 'Bookmarks',
      onPress: handleNavigateToBookmarks,
    },
    {
      id: 'marketplace',
      icon: 'shopping-bag',
      label: 'Marketplace',
      onPress: handleNavigateToMarketplace,
    },
    {
      id: 'prime-pass',
      icon: 'award',
      label: 'Prime Pass',
      onPress: handleCloseDrawer,
    },
    {
      id: 'settings',
      icon: 'settings',
      label: 'Settings',
      onPress: handleNavigateToSettings,
    },
    {
      id: 'more-schoise',
      icon: 'more-horizontal',
      label: 'MoreSchoise',
      onPress: handleNavigateToMoreSchoise,
    },
  ], [
    handleNavigateToProfile,
    handleNavigateToWallet,
    handleNavigateToBookmarks,
    handleNavigateToMarketplace,
    handleNavigateToSettings,
    handleNavigateToMoreSchoise,
    handleCloseDrawer,
  ]);

  return (
    <Box flex={1} bg={isDark ? '#000000' : '#FFFFFF'} w="100%" m={0} p={0}>
      <ScrollView
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingTop: 0,
          paddingBottom: bottomPadding,
          paddingLeft: 0,
          paddingRight: 0,
          margin: 0,
          width: '100%',
        }}
        contentInsetAdjustmentBehavior="never"
        scrollEnabled
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={{
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          margin: 0,
          padding: 0,
          flex: 1,
          width: '100%',
        }}
      >
        <Box flex={1} bg={isDark ? '#000000' : '#FFFFFF'} w="100%" m={0} p={0}>
          {/* Banner Section – FULL BLEED */}
          <Box h={280} w="100%" position="relative" bg={isDark ? '#000000' : '#FFFFFF'}>
          {/* Banner */}
          <Box h={120} w="100%" overflow="hidden">
            <LinearGradient
              colors={['#4A1D96', '#1E293B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gradient, { height: 120 }]}
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
            onPress={handleProfilePress}
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
                  />
                </Box>
                <Text
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize={18}
                  fontWeight="$bold"
                  mt="$2"
                >
                  {displayName}
                </Text>
                {tags.length > 0 && (
                  <Text
                    mt="$1"
                    fontSize={9}
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
          <TouchableOpacity
            activeOpacity={1}
            style={{ opacity: 0.9, zIndex: 2 }}
            onPress={handleStatsPress}
          >
            <Box mt={-40} mb="$4">
              <HStack justifyContent="center" alignItems="center" px="$6">
              <VStack alignItems="center" space="xs" flex={1}>
                <Text
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize={14}
                  fontWeight="$bold"
                >
                  {stats.posts}
                </Text>
                <Text color={isDark ? '$textDark400' : '$textLight600'} fontSize={11}>
                  Posts
                </Text>
              </VStack>
              <Box w={1} h={30} bg={isDark ? '#DFDFDF' : '#DFDFDF'} />
              <VStack alignItems="center" space="xs" flex={1}>
                <Text
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize={14}
                  fontWeight="$bold"
                >
                  {stats.trust}
                </Text>
                <Text color={isDark ? '$textDark400' : '$textLight600'} fontSize={11}>
                  Trust
                </Text>
              </VStack>
              <Box w={0.5} h={30} bg={isDark ? '$backgroundDark200' : '$backgroundLight200'} />
              <VStack alignItems="center" space="xs" flex={1}>
                <Text
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize={14}
                  fontWeight="$bold"
                >
                  {stats.truster}
                </Text>
                <Text color={isDark ? '$textDark400' : '$textLight600'} fontSize={11}>
                  Truster
                </Text>
              </VStack>
              </HStack>
            </Box>
          </TouchableOpacity>

          {/* Premium Banner – FULL BLEED, içte padding */}
          <Box w="100%" mb="$3">
          <Box
            w="100%"
            h={0.5}
            bg={isDark ? '$backgroundDark200' : '$backgroundLight200'}
          />
          <Box
            w="100%"
            h={57}
            bg={isDark ? '$backgroundDark800' : '$backgroundLight50'}
            justifyContent="center"
            px="$6"
          >
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize={12}
              fontWeight="$semibold"
            >
              Premium Selling Design Small Banner
            </Text>
          </Box>
        </Box>

          {/* Menu Items – DIŞTA px yok, SATIRDA px var */}
          <VStack px="$0">
            {MENU_ITEMS.map((item: MenuItem) => (
              <Pressable
                key={item.id}
                onPress={item.onPress}
                h={48}
                justifyContent="center"
                bg="transparent"
                px="$6"
                $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
              >
              <HStack space="md" alignItems="center">
                <Box w={24} h={24} justifyContent="center" alignItems="center">
                  <FeatherIcon name={item.icon} size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
                <Text 
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize={12}
                  fontWeight="$semibold"
                  w={110}
                >
                  {item.label}
                </Text>
              </HStack>
            </Pressable>
            ))}
          </VStack>

          {/* Bottom Line – FULL BLEED */}
          <Box h={0.5} w="100%" bg={isDark ? '$backgroundDark200' : '$backgroundLight200'} mt={20} />

          {/* Settings and Help – DIŞTA px yok, SATIRDA px var */}
          <VStack px="$0">
            <Pressable
              onPress={handleBottomMenuPress}
              h={48}
              justifyContent="center"
              bg="transparent"
              px="$6"
              $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
            >
            <HStack space="md" alignItems="center">
              <Box w={20} h={20} justifyContent="center" alignItems="center">
                <FeatherIcon name="star" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
              </Box>
              <Text 
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize={10}
                fontWeight="$semibold"
                w={110}
              >
                Vote New Features
              </Text>
            </HStack>
          </Pressable>
          <Pressable
            onPress={handleBottomMenuPress}
            h={48}
            justifyContent="center"
            bg="transparent"
            px="$6"
            $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
          >
            <HStack space="md" alignItems="center">
              <Box w={20} h={20} justifyContent="center" alignItems="center">
                <FeatherIcon name="help-circle" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
              </Box>
              <Text 
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize={10}
                fontWeight="$semibold"
                w={110}
              >
                Help Center
              </Text>
            </HStack>
          </Pressable>
          <Pressable
            onPress={handleBottomMenuPress}
            h={48}
            justifyContent="center"
            bg="transparent"
            px="$6"
            $hover={{ bg: isDark ? '$backgroundDark100' : '$backgroundLight100' }}
          >
            <HStack space="md" alignItems="center">
              <Box w={20} h={20} justifyContent="center" alignItems="center">
                <FeatherIcon name="clock" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
              </Box>
              <Text 
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize={10}
                fontWeight="$semibold"
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
                <FeatherIcon name="log-out" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
              </Box>
              <Text 
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize={10}
                fontWeight="$semibold"
                w={110}
              >
                Log out
              </Text>
            </HStack>
          </Pressable>
        </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
};

