import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Pressable, HStack, Input, InputField } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Header } from '@/src/components/Header';
import type { Badge } from '@/src/mock/profile/badges/types';
import CollectionTabs from '../components/CollectionTabs';
import AchievementBadgesTab from '../components/TabsPage/AchievementBadgesTab';
import BridgeBadgesTab from '../components/TabsPage/BridgeBadgesTab';
import BadgeDetail from '../components/BadgeDetail';
import { useSafeAreaValues } from '@/src/utils';
import { useAppStore } from '@/src/store/appStore';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { ProfileStackParamList } from '../navigation';

type CollectionsScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Collections'>;

const CollectionsScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CollectionsScreenNavigationProp>();
  const { user } = useAppStore();
  const userId = user?.id;
  const [activeTab, setActiveTab] = useState<'achievements' | 'bridges'>('achievements');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const safeAreaBottom = useSafeAreaValues('bottom');
  
  // Debounce search query for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

  // Rozete tıklanınca bottom sheet'i aç
  const handleBadgePress = useCallback((badge: Badge) => {
    setSelectedBadge(badge);
    
    const handleClose = () => {
      closeBottomSheet();
      setTimeout(() => setSelectedBadge(null), 300);
    };

    // Badge detail content'i hazırla
    openBottomSheet(
      <Box flex={1}>
        {/* Sticky Header */}
        <Box
          bg={isDark ? '#1F1F1F' : '#FFFFFF'}
          borderBottomWidth={1}
          borderBottomColor={isDark ? '#333333' : '#F0F0F0'}
          px={15}
          py={15}
        >
          <Box flexDirection="row" alignItems="center">
            <Pressable
              onPress={handleClose}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
            <Box flex={1} alignItems="center" mr={24}>
              <Text
                fontSize={16}
                fontWeight="$bold"
                color={isDark ? '$textDark50' : '#000'}
              >
                {badge.title}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Scrollable Content */}
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: safeAreaBottom }}
          showsVerticalScrollIndicator={false}
        >
          <BadgeDetail
            badge={badge}
            onClose={handleClose}
            hideHeader={true}
          />
        </BottomSheetScrollView>
      </Box>,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: false,
        enableDynamicSizing: true,
        animateOnMount: false,
        detached: true,
        bottomInset: 46,
        backgroundStyle: {
          backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF',
          borderRadius: 16,
        },
        handleIndicatorStyle: {
          backgroundColor: isDark ? '#666666' : '#CCCCCC',
        },
        onChange: (index: number) => {
          // Sheet kapandığında selectedBadge'i temizle
          if (index === -1) {
            setTimeout(() => setSelectedBadge(null), 300);
          }
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, isDark, safeAreaBottom]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'achievements':
        return (
          <AchievementBadgesTab
            userId={userId}
            onBadgePress={handleBadgePress}
            searchQuery={debouncedSearchQuery}
          />
        );
      case 'bridges':
        return (
          <BridgeBadgesTab
            userId={userId}
            onBadgePress={handleBadgePress}
            searchQuery={debouncedSearchQuery}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Header */}
      <Header
        title={`${user?.name || 'User'}'s Collections`}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <Box px="$4" py="$2">
        <Box
          bg={isDark ? '#2A2A2A' : '#F2F2F2'}
          borderRadius={20}
          height={36}
          px="$4"
          justifyContent="center"
        >
          <HStack alignItems="center" space="sm">
            <Feather
              name="search"
              size={20}
              color={isDark ? '#FFFFFF' : '#8C8C8C'}
            />
            <Input flex={1} borderWidth={0} bg="transparent">
              <InputField
                placeholder="Search by badge name"
                placeholderTextColor={isDark ? '#8C8C8C' : '#B9B9B9'}
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={9}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </Input>
          </HStack>
        </Box>
      </Box>

      {/* Tabs */}
      <CollectionTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <Box flex={1}>{renderTabContent()}</Box>

      </Box>
    </SafeAreaView>
  );
};

CollectionsScreen.displayName = 'CollectionsScreen';

export default CollectionsScreen;
