import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Box, Text, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps
} from '@gorhom/bottom-sheet';
import { ChevronLeft } from 'lucide-react-native';
import { Header } from '@/src/components/Header';
import { mockBadgesData } from '@/src/mock/profile/badges';
import type { Badge } from '@/src/mock/profile/badges/types';
import CollectionTabs from '../components/CollectionTabs';
import AchievementBadgesTab from '../components/TabsPage/AchievementBadgesTab';
import BridgeBadgesTab from '../components/TabsPage/BridgeBadgesTab';
import BadgeDetail from '../components/BadgeDetail';

type CollectionsScreenNavigationProp = NativeStackNavigationProp<any, 'CollectionsScreen'>;

const CollectionsScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CollectionsScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<'achievements' | 'bridges'>('achievements');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Tek sabit snap point
  const snapPoints = useMemo(() => ['90%'], []);

  // Rozete tıklanınca sabit indexe getir
  const handleBadgePress = useCallback((badge: Badge) => {
    setSelectedBadge(badge);
    // State update'inin tamamlanmasını bekle
    requestAnimationFrame(() => {
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 50);
    });
  }, []);

  // Sheet kapatma (programatik)
  const handleCloseBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    setTimeout(() => setSelectedBadge(null), 300);
  }, []);

  // Backdrop
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        onPress={handleCloseBottomSheet}
      />
    ),
    [handleCloseBottomSheet]
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'achievements':
        return (
          <AchievementBadgesTab
            badges={mockBadgesData.achievements}
            onBadgePress={handleBadgePress}
          />
        );
      case 'bridges':
        return (
          <BridgeBadgesTab
            badges={mockBadgesData.bridges}
            onBadgePress={handleBadgePress}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Header */}
      <Header
        title="Michael Clark's Collections"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {/* Tabs */}
      <CollectionTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <Box flex={1}>{renderTabContent()}</Box>

      {/* Badge Detail Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}                      // ['80%'] sabit
        enablePanDownToClose={true}                  // aşağı çekerek kapatma açık
        enableOverDrag={false}                       // sınır ötesi esneme kapalı
        overDragResistanceFactor={0}
        enableHandlePanningGesture={true}            // handle sürükleme açık
        enableContentPanningGesture={false}          // içerikten sheet sürükleme kapalı (scroll yine çalışır)
        enableDynamicSizing={false}                  // dinamik boyutlandırmayı kapat
        animateOnMount={false}                       // mount animasyonunu devre dışı bırak
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF',
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#666666' : '#CCCCCC',
        }}
      >
        {selectedBadge && (
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
                  onPress={handleCloseBottomSheet}
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
                    {selectedBadge.title}
                  </Text>
                </Box>
              </Box>
            </Box>

            {/* Scrollable Content */}
            <BottomSheetScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <BadgeDetail
                badge={selectedBadge}
                onClose={handleCloseBottomSheet}
                hideHeader={true}
              />
            </BottomSheetScrollView>
          </Box>
        )}
      </BottomSheet>
    </Box>
  );
};

CollectionsScreen.displayName = 'CollectionsScreen';

export default CollectionsScreen;
