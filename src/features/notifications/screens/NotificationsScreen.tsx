import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  View,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Input,
  InputField,
} from '@gluestack-ui/themed';
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from 'react-native-heroicons/outline';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NotificationsStackParamList } from '@/src/features/notifications/navigation';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { notification_filters } from '@/src/mock/notifications';
import { NotificationFilter } from '@/src/mock/notifications/types';
import { Header } from '@/src/components/Header';
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
  notificationKeys,
} from '../api/hooks';
import type { Notification } from '../api/types';
import { NotificationCard } from '../components/NotificationCard';
import {
  groupNotificationsByActivity,
  type GroupedNotification,
} from '@/src/utils/notificationGrouping';
import { useQueryClient } from '@tanstack/react-query';
import { notificationAssetCache } from '@/src/services/NotificationAssetCache';
import { navigationService } from '@/src/services/NavigationService';
import { notificationService } from '@/src/services/NotificationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { useAppStore } from '@/src/store/appStore';
import { useDrawerStore } from '@/src/store/drawerStore';
import { useNotificationStore } from '@/src/store/notificationStore';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/src/providers/AuthProvider';
import { useBottomOffset } from '@/src/utils';

const { width } = Dimensions.get('window');

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

type NotificationsScreenNavigationProp = NativeStackNavigationProp<
  NotificationsStackParamList,
  'NotificationsScreen'
>;

const NotificationsScreenComponent: React.FC = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('inbox');
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAppStore();
  const { isAuthReady } = useAuth();
  const pagerRef = useRef<PagerView>(null);
  const tabContainerRef = useRef<any>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  // Figma sırası: All Notifications, Replies, Trust - Truster, TIPS
  const [filters] = useState<NotificationFilter[]>(() => [
    ...notification_filters,
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // CRITICAL: Mark all as read işleminin sadece bir kez çalışması için ref
  const hasMarkedAllAsReadRef = useRef(false);

  // Bottom offset for content padding (NotificationsScreen tab bar içinde olduğu için includeTabBar: true)
  const bottomOffset = useBottomOffset({
    includeTabBar: true,
    extraPadding: 24,
  });

  // CRITICAL: Drawer gesture'ı disable et (yatay PagerView swipe ile çakışmasını önle)
  const setGestureEnabled = useDrawerStore(state => state.setGestureEnabled);

  // API hooks - shouldFetchNotifications tanımı useFocusEffect'ten önce olmalı
  const shouldFetchNotifications = isAuthenticated && isAuthReady;

  // Debounce search query for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // CRITICAL FIX: Tüm query'leri enable et - React Query cache mekanizması gereksiz request'leri önler
  // staleTime: 30s ayarı sayesinde cache varsa kullanır, yoksa fetch eder
  // Bu sayede tab geçişlerinde anında cache'den gösterir, sürekli loading olmaz

  // Filter 0: All Notifications
  const allFilter = filters[0];
  const allUnreadOnly = allFilter?.id === 'unread';
  const allNotificationType:
    | 'all'
    | 'tips'
    | 'truster'
    | 'replies'
    | undefined = undefined;
  const allQuery = useNotifications(
    {
      limit: 20,
      unreadOnly: allUnreadOnly,
      type: allNotificationType,
      search: debouncedSearchQuery || undefined,
    },
    shouldFetchNotifications
  );

  // Filter 1: Replies
  const repliesFilter = filters[1];
  const repliesUnreadOnly = repliesFilter?.id === 'unread';
  const repliesNotificationType:
    | 'all'
    | 'tips'
    | 'truster'
    | 'replies'
    | undefined = 'replies';
  const repliesQuery = useNotifications(
    {
      limit: 20,
      unreadOnly: repliesUnreadOnly,
      type: repliesNotificationType,
      search: debouncedSearchQuery || undefined,
    },
    shouldFetchNotifications
  );

  // Filter 2: Trust - Truster
  const trustFilter = filters[2];
  const trustUnreadOnly = trustFilter?.id === 'unread';
  const trustNotificationType:
    | 'all'
    | 'tips'
    | 'truster'
    | 'replies'
    | undefined = 'truster';
  const trustQuery = useNotifications(
    {
      limit: 20,
      unreadOnly: trustUnreadOnly,
      type: trustNotificationType,
      search: debouncedSearchQuery || undefined,
    },
    shouldFetchNotifications
  );

  // Filter 3: TIPS
  const tipsFilter = filters[3];
  const tipsUnreadOnly = tipsFilter?.id === 'unread';
  const tipsNotificationType:
    | 'all'
    | 'tips'
    | 'truster'
    | 'replies'
    | undefined = 'tips';
  const tipsQuery = useNotifications(
    {
      limit: 20,
      unreadOnly: tipsUnreadOnly,
      type: tipsNotificationType,
      search: debouncedSearchQuery || undefined,
    },
    shouldFetchNotifications
  );

  // Figma sırası: All, Replies, Trust, TIPS
  const filterQueryResults = useMemo(
    () => [allQuery, repliesQuery, trustQuery, tipsQuery],
    [allQuery, repliesQuery, trustQuery, tipsQuery]
  );

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const markAllAsReadMutationRef = useRef(markAllAsReadMutation);

  // Ref'i güncelle
  useEffect(() => {
    markAllAsReadMutationRef.current = markAllAsReadMutation;
  }, [markAllAsReadMutation]);

  // PERFORMANCE FIX: Tab değiştiğinde aktif tab'ın query'sini refetch et (cache invalid ise)
  // CRITICAL FIX: filterQueryResults dependency'den kaldırıldı - useRef ile wrap edildi
  const filterQueryResultsRef = useRef(filterQueryResults);
  useEffect(() => {
    filterQueryResultsRef.current = filterQueryResults;
  }, [filterQueryResults]);

  useFocusEffect(
    useCallback(() => {
      // Ekran focus aldığında drawer gesture'ı disable et
      setGestureEnabled(false);

      // Ekran focus aldığında tüm bildirimleri okunmuş olarak işaretle
      // CRITICAL: Sadece bir kez çalışması için ref kontrolü (sonsuz döngü önleme)
      if (shouldFetchNotifications && !hasMarkedAllAsReadRef.current) {
        hasMarkedAllAsReadRef.current = true;

        // Optimistic update: Unread count'u 0'a düşür (anında görünsün)
        const notificationStore = useNotificationStore.getState();

        // Store'daki unread count'u 0'a düşür
        notificationStore.setUnreadCountCache(0);

        // React Query cache'deki unread count'u da 0'a düşür
        queryClient.setQueryData(notificationKeys.unreadCount(), {
          success: true,
          data: { count: 0 },
        });

        // Tüm bildirimleri okunmuş olarak işaretle (optimistic update)
        const queryCache = queryClient.getQueryCache();
        const listQueries = queryCache.findAll({
          queryKey: notificationKeys.lists(),
        });

        listQueries.forEach(query => {
          const cachedData = query.state.data as
            | { success: boolean; data: Notification[] }
            | undefined;

          if (cachedData && Array.isArray(cachedData.data)) {
            const updatedData = cachedData.data.map(notification => ({
              ...notification,
              read: true,
            }));

            queryClient.setQueryData(query.queryKey, {
              ...cachedData,
              data: updatedData,
            });
          }
        });

        // API'ye istek gönder (background'da)
        // CRITICAL FIX: ref ile çağır - dependency array'den kaldırıldı
        markAllAsReadMutationRef.current.mutate(undefined, {
          onError: error => {
            // Hata durumunda cache'i geri yükle (refetch yapacak)
            console.warn(
              '[NotificationsScreen] ⚠️ Failed to mark all as read:',
              error
            );
            queryClient.invalidateQueries({
              queryKey: notificationKeys.lists(),
            });
            queryClient.invalidateQueries({
              queryKey: notificationKeys.unreadCount(),
            });
          },
        });
      }

      return () => {
        // Ekran blur olduğunda drawer gesture'ı tekrar enable et
        setGestureEnabled(true);
        // CRITICAL FIX: Ref'i resetleme - sadece component unmount olduğunda resetlensin
        // Her blur'da resetlenmemeli (tab değişikliğinde sürekli mark-all-read yapılmasını önler)
      };
    }, [setGestureEnabled, shouldFetchNotifications, queryClient])
  );

  // PERFORMANCE FIX: Memoize background colors to prevent re-renders
  const backgroundColor = useMemo(
    () => (isDark ? '$backgroundDark950' : '#FFFFFF'),
    [isDark]
  );
  const tabHeaderBgColor = useMemo(() => '#FFFFFF', []); // Tab header her zaman beyaz

  // 🎯 CORE: Shared progress value (0 = All, 1 = Replies, 2 = Trust, 3 = Tips)
  const progress = useSharedValue(0);

  // Helper function: Infinite query response'dan notifications array'i çıkar
  const extractNotificationsFromResponse = useCallback(
    (response: any): Notification[] => {
      if (!response) {
        return [];
      }

      const pages = response.pages;
      if (pages && Array.isArray(pages) && pages.length > 0) {
        const allNotifications = pages.flatMap((page: any) => {
          if (!page) {
            return [];
          }
          if (page.data && Array.isArray(page.data)) {
            return page.data;
          }
          return [];
        });
        return allNotifications;
      }

      return [];
    },
    []
  );

  // Helper function: Bildirimleri tarihe göre grupla (Instagram benzeri)
  // Hem Notification hem de GroupedNotification kabul eder
  const groupNotificationsByDate = useCallback(
    (
      notifications: Array<Notification | GroupedNotification>
    ): Array<{ type: 'header' | 'notification'; data: any }> => {
      if (!notifications || notifications.length === 0) {
        return [];
      }

      // CRITICAL FIX: Bildirimleri önce tarihe göre sırala (en yeni en üstte - descending)
      const sortedNotifications = [...notifications].sort((a, b) => {
        const createdAtA =
          'createdAt' in a ? a.createdAt : (a as any).createdAt;
        const createdAtB =
          'createdAt' in b ? b.createdAt : (b as any).createdAt;
        const dateA = new Date(createdAtA).getTime();
        const dateB = new Date(createdAtB).getTime();
        return dateB - dateA; // Descending: en yeni en üstte
      });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);
      const thisMonth = new Date(today);
      thisMonth.setMonth(thisMonth.getMonth() - 1);

      // Grup sıralama önceliği (daha yüksek sayı = daha üstte)
      const getGroupPriority = (groupLabel: string): number => {
        if (groupLabel === 'Today') return 4;
        if (groupLabel === 'Yesterday') return 3;
        if (groupLabel === 'This Week') return 2;
        if (groupLabel === 'This Month') return 1;
        return 0; // Eski aylar/yıllar
      };

      const grouped: Array<{ type: 'header' | 'notification'; data: any }> = [];
      let currentGroup: string | null = null;

      sortedNotifications.forEach(notification => {
        // Hem Notification hem de GroupedNotification için createdAt alanını al
        const createdAt =
          'createdAt' in notification
            ? notification.createdAt
            : (notification as any).createdAt;
        const notificationDate = new Date(createdAt);
        const notificationDateOnly = new Date(
          notificationDate.getFullYear(),
          notificationDate.getMonth(),
          notificationDate.getDate()
        );

        let groupLabel: string;
        if (notificationDateOnly.getTime() === today.getTime()) {
          groupLabel = t('notifications.dateGroups.today');
        } else if (notificationDateOnly.getTime() === yesterday.getTime()) {
          groupLabel = t('notifications.dateGroups.yesterday');
        } else if (notificationDateOnly >= thisWeek) {
          groupLabel = t('notifications.dateGroups.thisWeek');
        } else if (notificationDateOnly >= thisMonth) {
          groupLabel = t('notifications.dateGroups.thisMonth');
        } else {
          // Month and year format: "January 2024"
          const monthKeys = [
            'january',
            'february',
            'march',
            'april',
            'may',
            'june',
            'july',
            'august',
            'september',
            'october',
            'november',
            'december',
          ];
          const monthKey = monthKeys[notificationDate.getMonth()];
          groupLabel = `${t(`messageDetail.months.${monthKey}`)} ${notificationDate.getFullYear()}`;
        }

        // Yeni grup başladıysa header ekle
        if (currentGroup !== groupLabel) {
          currentGroup = groupLabel;
          grouped.push({ type: 'header', data: groupLabel });
        }

        // Bildirimi ekle
        grouped.push({ type: 'notification', data: notification });
      });

      return grouped;
    },
    [t]
  );

  // Tab press handler - PagerView native animasyonu ile geçiş
  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  // PagerView scroll handler - realtime progress güncelleme
  const handlePageScroll = useCallback(
    (e: any) => {
      'worklet';
      const { position, offset } = e.nativeEvent;
      progress.value = position + offset;
    },
    [progress]
  );

  // PagerView page selected handler - snap sonrası progress'i sync et
  const handlePageSelected = useCallback(
    (e: any) => {
      const position = e.nativeEvent.position;
      progress.value = withTiming(position, { duration: 0 });
      setCurrentPage(position);

      // Tab değiştiğinde scroll pozisyonunu sıfırla (otomatik olarak FlashList key değişimi ile)
      // FlashList her tab için ayrı instance olduğu için otomatik sıfırlanır
    },
    [progress]
  );

  /**
   * Notification'a tıklandığında navigation action'ı al
   * NotificationService kullanarak domain logic'i merkezi hale getiriyoruz
   */
  const getNavigationAction = useCallback((notification: Notification) => {
    // NotificationService'den navigation action'ı al
    // Bu sayede navigation logic tek bir yerde (domain service) tutuluyor
    return notificationService.getNavigationAction(notification);
  }, []);

  /**
   * Notification'a tıklandığında navigation yap
   * Yeni hibrit mimariye göre NavigationService kullanır
   *
   * Navigation Flow:
   * 1. NotificationService'den navigation action al
   * 2. Global screens (Post, Profile, Wallet, vb.) → Root'tan açılır
   * 3. Tab screens (Feed, Explore, vb.) → Nested navigation ile açılır
   */
  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      try {
        const action = getNavigationAction(notification);

        if (!action) {
          return;
        }

        const { route, params } = action;

        // Global screens (RootStackParamList) → NavigationService.navigate()
        // Bu ekranlar GlobalStackGroup'ta tanımlı: Post, Profile, Wallet, MessageDetail, vb.
        const rootRouteValues = Object.values(ROOT_ROUTES) as string[];
        if (rootRouteValues.includes(route)) {
          navigationService.navigate(route as any, params, {
            priority: 'high', // Kullanıcı tıklaması yüksek öncelikli
            force: false, // App State Awareness kontrolü yapılır
          });
          return;
        }

        // Tab screens (MainStackParamList) → NavigationService.navigateNested()
        // Bu ekranlar TabNavigator içinde: Feed, Explore, Catalog, Events, vb.
        const tabRouteValues = Object.values(TAB_ROUTES) as string[];
        if (tabRouteValues.includes(route)) {
          const tabRoute = route as keyof typeof TAB_ROUTES;
          const screenName = params?.screen || 'FeedScreen';
          const screenParams = params?.params || {};

          navigationService.navigateNested(tabRoute as any, screenName as any, {
            params: screenParams,
            priority: 'high', // Kullanıcı tıklaması yüksek öncelikli
            force: false, // App State Awareness kontrolü yapılır
          });
          return;
        }

        // Fallback: Bilinmeyen route (backward compatibility)
        console.warn(
          '[NotificationsScreen] ⚠️ Unknown route, using fallback navigation:',
          route
        );
        navigation.navigate(route as any, params);
      } catch (error) {
        console.error('[NotificationsScreen] ❌ Navigation error:', error);
        console.error('[NotificationsScreen] Notification:', notification);
      }
    },
    [getNavigationAction, navigation]
  );

  const handleMarkAsRead = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
  }, [queryClient]);

  const handleDelete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
  }, [queryClient]);

  // Asset pre-caching - tüm tab'lardaki notifications yüklendiğinde images'ı cache'le
  // CRITICAL FIX: filterQueryResults dependency'den kaldırıldı - her query'nin data'sını dependency olarak kullan
  useEffect(() => {
    const allNotifications = filterQueryResultsRef.current.flatMap(
      queryResult => {
        return extractNotificationsFromResponse(queryResult.data);
      }
    );

    if (allNotifications.length > 0) {
      notificationAssetCache.cacheBatchNotifications(allNotifications);
    }
  }, [
    allQuery.data,
    tipsQuery.data,
    trustQuery.data,
    repliesQuery.data,
    extractNotificationsFromResponse,
  ]);

  // DESIGN: SupportRequestFilterGroup ile aynı tasarım
  // Active = açık gri arka plan, siyah text
  // Inactive = transparent arka plan, siyah text
  const tabActiveBg = '#F1F1F1';
  const tabInactiveBg = 'transparent';
  const tabActiveText = '#000000';
  const tabInactiveText = '#000000';
  const tabBorderColor = '#EFEFEF';

  // Her tab için seçili mi (animasyonlu)
  const tab0Active = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        progress.value,
        [-0.5, 0, 0.5],
        [tabActiveBg, tabActiveBg, tabInactiveBg]
      ),
    }),
    []
  );
  const tab1Active = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        progress.value,
        [0.5, 1, 1.5],
        [tabInactiveBg, tabActiveBg, tabInactiveBg]
      ),
    }),
    []
  );
  const tab2Active = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        progress.value,
        [1.5, 2, 2.5],
        [tabInactiveBg, tabActiveBg, tabInactiveBg]
      ),
    }),
    []
  );
  const tab3Active = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        progress.value,
        [2.5, 3, 3.5],
        [tabInactiveBg, tabActiveBg, tabActiveBg]
      ),
    }),
    []
  );

  const tab0TextStyle = useAnimatedStyle(
    () => ({
      color: interpolateColor(
        progress.value,
        [-0.5, 0, 0.5],
        [tabActiveText, tabActiveText, tabInactiveText]
      ),
    }),
    []
  );
  const tab1TextStyle = useAnimatedStyle(
    () => ({
      color: interpolateColor(
        progress.value,
        [0.5, 1, 1.5],
        [tabInactiveText, tabActiveText, tabInactiveText]
      ),
    }),
    []
  );
  const tab2TextStyle = useAnimatedStyle(
    () => ({
      color: interpolateColor(
        progress.value,
        [1.5, 2, 2.5],
        [tabInactiveText, tabActiveText, tabInactiveText]
      ),
    }),
    []
  );
  const tab3TextStyle = useAnimatedStyle(
    () => ({
      color: interpolateColor(
        progress.value,
        [2.5, 3, 3.5],
        [tabInactiveText, tabActiveText, tabActiveText]
      ),
    }),
    []
  );

  const getTabBgStyle = (index: number) => {
    switch (index) {
      case 0:
        return tab0Active;
      case 1:
        return tab1Active;
      case 2:
        return tab2Active;
      case 3:
        return tab3Active;
      default:
        return tab0Active;
    }
  };
  const getTabTextStyle = (index: number) => {
    switch (index) {
      case 0:
        return tab0TextStyle;
      case 1:
        return tab1TextStyle;
      case 2:
        return tab2TextStyle;
      case 3:
        return tab3TextStyle;
      default:
        return tab0TextStyle;
    }
  };

  // FlatList renderItem - useCallback ile memoize et
  const renderNotificationItem = React.useCallback(
    ({ item }: { item: { type: 'header' | 'notification'; data: any } }) => {
      if (item.type === 'header') {
        return (
          <Box px={16} py={12} bg={backgroundColor}>
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize={13}
              fontWeight='$semibold'
            >
              {item.data}
            </Text>
          </Box>
        );
      }

      return (
        <NotificationCard
          notification={item.data}
          onPress={() => handleNotificationPress(item.data)}
          onMarkAsRead={handleMarkAsRead}
          onDelete={handleDelete}
        />
      );
    },
    [
      handleNotificationPress,
      handleMarkAsRead,
      handleDelete,
      isDark,
      backgroundColor,
    ]
  );

  // Key extractor - unique ID kullan
  const keyExtractor = React.useCallback(
    (item: { type: 'header' | 'notification'; data: any }, index: number) => {
      if (item.type === 'header') {
        return `header-${item.data}-${index}`;
      }
      return item.data.id;
    },
    []
  );

  // Render notifications list for a specific filter
  // CRITICAL FIX: Her tab kendi query'sini kullanır - cache invalid olana kadar backend'e istek atmaz
  const renderNotificationsList = useCallback(
    (filterIndex: number) => {
      const filter = filters[filterIndex];
      // CRITICAL FIX: ref ile çağır - dependency array'den kaldırıldı (sonsuz döngü önleme)
      const queryResult = filterQueryResultsRef.current[filterIndex];

      if (!queryResult) {
        return (
          <Box flex={1} justifyContent='center' alignItems='center' px='$4'>
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={14}
              textAlign='center'
            >
              {t('notifications.errors.loading')}
            </Text>
          </Box>
        );
      }

      const {
        data: notificationsResponse,
        isLoading,
        isFetching,
        error,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isPending,
        status,
      } = queryResult;

      // CRITICAL FIX: Feed/Profile pattern - sadece ilk loading'de göster (cache yoksa)
      // isFetching kaldırıldı - background refetch sırasında loading göstermesin
      const isInitialLoading = isLoading && !notificationsResponse;

      // Her tab için kendi notifications'ını çıkar
      const notifications = extractNotificationsFromResponse(
        notificationsResponse
      );

      // Log bildirim verileri
      if (notifications && notifications.length > 0) {
        console.log(
          `[NotificationsScreen] 📨 Tab ${filterIndex} (${filter?.label}) - ${notifications.length} bildirim:`,
          JSON.stringify(notifications, null, 2)
        );
      }

      // SAFETY FIX: notifications her zaman array olmalı
      const safeNotifications = Array.isArray(notifications)
        ? notifications
        : [];

      // CRITICAL FIX: Tips tabında client-side filtering kaldırıldı
      // Backend'den zaten type=tips ile filtrelenmiş veriler geliyor
      // Endpoint: GET /notifications?limit=10&offset=0&type=tips
      let filtered = safeNotifications;

      // Search query için client-side filtering (backend'den zaten filtrelenmiş geliyor)
      // Minimal yapı: title, userName ve message field'ları kaldırıldı
      // Mesajlar getNotificationMessage ile dinamik oluşturuluyor
      // Arama için username ve postContent kullanılır
      if (searchQuery && Array.isArray(filtered)) {
        filtered = filtered.filter(notification => {
          if (!notification || typeof notification !== 'object') {
            return false;
          }

          const query = searchQuery.toLowerCase();
          const username = notification.username?.toLowerCase() || '';
          const data = notification.data || notification.metadata || {};
          const postContent = data.postContent?.toLowerCase() || '';

          // Username veya postContent'te arama yap
          return username.includes(query) || postContent.includes(query);
        });
      }

      // SAFETY FIX: Ensure filtered is always an array
      if (!Array.isArray(filtered)) {
        console.warn(
          '[NotificationsScreen] ⚠️ filtered is not an array:',
          filtered
        );
        return (
          <Box flex={1} justifyContent='center' alignItems='center' px='$4'>
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={14}
              textAlign='center'
            >
              {t('notifications.errors.loading')}
            </Text>
          </Box>
        );
      }

      // CRITICAL FIX: Feed/Profile pattern - Error önce kontrol edilir
      if (error && !isInitialLoading) {
        console.error(`[NotificationsScreen] Tab ${filterIndex} Error:`, error);
        return (
          <Box flex={1} justifyContent='center' alignItems='center' px='$4'>
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={14}
              textAlign='center'
              mb='$2'
            >
              {t('notifications.errors.loading')}
            </Text>
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize={12}
              textAlign='center'
              mb='$4'
            >
              {(error as any)?.response?.status === 401
                ? t('notifications.errors.loginRequired')
                : (error as any)?.message || t('notifications.errors.unknown')}
            </Text>
            <Pressable
              onPress={() => refetch()}
              bg='#E8FF6B'
              px='$4'
              py='$2'
              borderRadius={10}
            >
              <Text color='#000000' fontSize={12} fontWeight='$semibold'>
                {t('notifications.actions.tryAgain')}
              </Text>
            </Pressable>
          </Box>
        );
      }

      // CRITICAL FIX: Feed/Profile pattern - Sadece ilk yüklemede loading göster (cache yoksa)
      if (isInitialLoading) {
        return (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <ActivityIndicator
              size='large'
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </View>
        );
      }

      if (filtered.length === 0) {
        return (
          <Box flex={1} justifyContent='center' alignItems='center' px='$4'>
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={14}
              textAlign='center'
            >
              {searchQuery
                ? t('notifications.emptySearch')
                : t('notifications.empty')}
            </Text>
          </Box>
        );
      }

      // CRITICAL FIX: Backend'den gelen gruplandırılmış verileri önceliklendir
      // Eğer backend'den isGrouped: true ile bildirim geliyorsa, client-side gruplamayı atla
      const hasBackendGrouping = filtered.some(n => n.isGrouped === true);

      let activityGrouped: Array<Notification | GroupedNotification>;
      if (hasBackendGrouping) {
        // Backend'den gruplandırılmış veriler geliyor, client-side gruplamayı sadece gruplandırılmamış bildirimler için yap
        const ungroupedNotifications = filtered.filter(n => !n.isGrouped);
        const groupedNotifications = filtered.filter(n => n.isGrouped === true);

        // Gruplandırılmamış bildirimleri client-side'da grupla
        const clientGrouped = groupNotificationsByActivity(
          ungroupedNotifications
        );

        // Backend'den gelen gruplandırılmış bildirimleri GroupedNotification formatına çevir
        const backendGrouped: GroupedNotification[] = groupedNotifications.map(
          notif => ({
            id: notif.id,
            type: notif.type,
            postId: notif.data?.postId,
            commentId: notif.data?.commentId,
            primaryUser: notif.primaryUser || {
              id: notif.userId,
              username: notif.username,
              avatar: notif.avatar,
            },
            otherUsers: notif.otherUsers || [],
            count: notif.count || 1,
            createdAt: notif.createdAt,
            read: notif.read,
            data: notif.data,
            // CRITICAL FIX: imageUrl sadece data içinden alınmalı (root seviyede olmamalı)
            imageUrl: notif.data?.imageUrl || null,
          })
        );

        // Birleştir
        activityGrouped = [...backendGrouped, ...clientGrouped];
      } else {
        // Backend'den gruplandırılmış veri yok, client-side gruplama yap
        activityGrouped = groupNotificationsByActivity(filtered);
      }

      // Sonra tarihe göre grupla (Instagram benzeri)
      const groupedData = groupNotificationsByDate(activityGrouped);

      // DEBUG: hasNextPage değerini kontrol et
      // CRITICAL FIX: hasNextPage undefined olabilir, bu durumda false olarak değerlendir
      // Backend'den pagination gelmeyebilir, bu durumda hasNextPage false olur
      // Eğer data varsa ve son sayfada limit kadar bildirim varsa, muhtemelen daha fazla sayfa var
      const currentPageData =
        notificationsResponse?.pages?.[notificationsResponse.pages.length - 1];
      const currentPageNotifications = currentPageData?.data || [];
      // Son sayfada limit kadar bildirim varsa, muhtemelen daha fazla sayfa var
      const limit = 20;
      const hasMoreData = currentPageNotifications.length >= limit;

      // hasNextPage true ise göster, yoksa ama data limit kadar varsa da göster (backend pagination sorunu olabilir)
      const shouldShowLoadMore =
        hasNextPage === true ||
        (hasNextPage !== false && hasMoreData && filtered.length > 0);

      // DEBUG: Console log ekle (production'da kaldırılabilir)
      if (__DEV__) {
        console.log(
          '[NotificationsScreen] hasNextPage:',
          hasNextPage,
          'hasMoreData:',
          hasMoreData,
          'filtered.length:',
          filtered.length,
          'currentPageNotifications.length:',
          currentPageNotifications.length,
          'limit:',
          limit,
          'shouldShowLoadMore:',
          shouldShowLoadMore
        );
      }

      // Estimated item height: avatar (48px) + content + extra content (post card, comment, etc.) + margins (~150px)
      const estimatedItemHeight = 150;

      return (
        <FlashList
          data={groupedData}
          renderItem={renderNotificationItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            paddingHorizontal: 0,
            paddingTop: 8,
            // paddingBottom kaldırıldı - sadece ListFooterComponent'te padding var
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                refetch().finally(() => setRefreshing(false));
              }}
              tintColor={isDark ? '#E2FF46' : '#8B5CF6'}
            />
          }
          ListFooterComponent={
            shouldShowLoadMore ? (
              <Box px={16} py={24} pb={bottomOffset} alignItems='center'>
                <Pressable
                  onPress={() => {
                    if (!isFetchingNextPage && hasNextPage) {
                      fetchNextPage();
                    }
                  }}
                  disabled={isFetchingNextPage}
                >
                  <HStack
                    alignItems='center'
                    justifyContent='center'
                    space='sm'
                  >
                    <Text
                      color={isDark ? '#FFFFFF' : '#000000'}
                      fontSize={14}
                      fontWeight='$medium'
                    >
                      {t('notifications.actions.showMore')}
                    </Text>
                    <ChevronDownIcon
                      width={20}
                      height={20}
                      color={isDark ? '#FFFFFF' : '#000000'}
                    />
                  </HStack>
                </Pressable>
                {isFetchingNextPage && (
                  <View style={{ marginTop: 8 }}>
                    <ActivityIndicator
                      size='small'
                      color={isDark ? '#FFFFFF' : '#000000'}
                    />
                  </View>
                )}
              </Box>
            ) : null
          }
          style={{ flex: 1 }}
        />
      );
    },
    [
      filters,
      extractNotificationsFromResponse,
      groupNotificationsByDate,
      searchQuery,
      isDark,
      renderNotificationItem,
      keyExtractor,
      refreshing,
      bottomOffset,
    ]
  );

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1 }}
    >
      <Box flex={1} bg={backgroundColor}>
        {/* Header */}
        <Header title={t('notifications.title')} leftAction='menu' />

        {/* Search Bar - Fixed at top */}
        <VStack space='md' pb='$4' px='$4' bg={backgroundColor}>
          <HStack
            alignItems='center'
            bg={isDark ? '#2A2A2A' : '#F2F2F2'}
            borderWidth={1}
            borderColor='#E9E9E9'
            borderRadius={20}
            px={14}
            space='sm'
          >
            <MagnifyingGlassIcon
              width={24}
              height={24}
              color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'}
            />
            <Input flex={1} borderWidth={0} bg='transparent'>
              <InputField
                placeholder={t('notifications.search.placeholder')}
                placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
                color={isDark ? '#000' : '#000'}
                fontSize='$xs'
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </Input>
          </HStack>
        </VStack>

        {/* Tab Header - Figma: pill/chip style with horizontal scroll */}
        <Box
          pt={0}
          pb='$2'
          bg={tabHeaderBgColor}
          ref={tabContainerRef}
          onLayout={event => {
            const width = event.nativeEvent.layout.width;
            setTabContainerWidth(width);
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 8,
            }}
            bounces={false}
          >
            {filters.map((filter, index) => (
              <Pressable
                key={filter.id}
                onPress={() => handleTabPress(index)}
              >
                <Animated.View
                  style={[
                    {
                      paddingVertical: 3,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: tabBorderColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 28,
                    },
                    getTabBgStyle(index),
                  ]}
                >
                  <Animated.Text
                    style={[
                      {
                        fontSize: 12,
                        fontWeight: '600',
                      },
                      getTabTextStyle(index),
                    ]}
                    numberOfLines={1}
                  >
                    {filter.label}
                  </Animated.Text>
                </Animated.View>
              </Pressable>
            ))}
          </ScrollView>
        </Box>

        {/* PagerView - Native swipe tab switching */}
        <AnimatedPagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageScroll={handlePageScroll}
          onPageSelected={handlePageSelected}
        >
          {filters.map((filter, index) => (
            <Box key={filter.id} flex={1}>
              {renderNotificationsList(index)}
            </Box>
          ))}
        </AnimatedPagerView>
      </Box>
    </SafeAreaView>
  );
};

// PERFORMANCE FIX: Memoize NotificationsScreen to prevent unnecessary re-renders during tab transitions
const NotificationsScreen = React.memo(NotificationsScreenComponent);

NotificationsScreen.displayName = 'NotificationsScreen';

export default NotificationsScreen;
