import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Animated, ScrollView, StyleSheet, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Pressable, Image, HStack, VStack } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import ProfileCard from '../components/ProfileCard';
import { ReviewsTab, LadderTab, RepliesTab, TipsTab, FeedTab, BenchmarksTab } from '../components/TabContents';
import { mock_user_card } from '@/src/mock/profile/userCardData';
import { useColorMode } from '@/src/hooks/useColorMode';
import LadderDetail from '../components/LadderDetail';
import { Ladder } from '@/src/mock/profile/ladders/types';

const TABS = [
  { key: 'feed',        title: 'Feed' },
  { key: 'reviews',     title: 'Reviews' },
  { key: 'ladders',     title: 'Ladders' },
  { key: 'benchmarks',  title: 'Benchmarks' },
  { key: 'tips',        title: 'Tips & Tricks' },
  { key: 'replies',     title: 'Replies' }
];

// Top safe area boşluğu olmadığı için banner height'i arttırıyoruz (genellikle ~44-50px)
const TOP_SAFE_AREA_OFFSET = 50; // Status bar + notch alanı için ekstra yükseklik
const STICKY_BANNER_HEIGHT = 90 + TOP_SAFE_AREA_OFFSET; // 140px
const TAB_BAR_HEIGHT = 50;
const BANNER_HEIGHT = 130; // ProfileCard içindeki banner yüksekliği
const SCROLL_TO_TOP_THRESHOLD = 300; // Butonun görünmesi için minimum scroll mesafesi

const ProfileScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [activeTab, setActiveTab] = useState('feed');
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [profileCardHeight, setProfileCardHeight] = useState(530); // Varsayılan yükseklik
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const previousScrollY = useRef(0);
  const scrollToTopButtonOpacity = useRef(new Animated.Value(0)).current;
  const [bannerVisible, setBannerVisible] = useState(false);
  
  // BottomSheet state ve ref'leri
  const [selectedLadder, setSelectedLadder] = useState<Ladder | null>(null);
  const ladderBottomSheetRef = useRef<BottomSheet>(null);

  // ProfileCard yüksekliğini ölç
  const handleProfileCardLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setProfileCardHeight(height);
  };

  // Banner sticky olması için scroll mesafesi - Banner height kadar scroll olunca banner sticky olur
  const bannerFadeStart = BANNER_HEIGHT;
  
  // TabBar'ın sticky olması için scroll mesafesi
  // TabBar scroll'dan çıktığında (ProfileCard'ın altına geldiğinde) sticky TabBar görünür
  // TabBar'ın üst kısmı StickyBanner'ın altına geldiğinde sticky TabBar görünür
  const tabBarExitPoint = profileCardHeight - STICKY_BANNER_HEIGHT;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const scrollDifference = currentScrollY - previousScrollY.current;
        
        // Banner görünürlüğünü kontrol et
        const isBannerVisible = currentScrollY > bannerFadeStart;
        if (isBannerVisible !== bannerVisible) {
          setBannerVisible(isBannerVisible);
        }
        
        // Scroll yukarı gidiyorsa (negatif fark) ve threshold'dan sonra butonu göster
        if (scrollDifference < 0 && currentScrollY > SCROLL_TO_TOP_THRESHOLD && !showScrollToTop) {
          setShowScrollToTop(true);
          Animated.timing(scrollToTopButtonOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
        
        // Scroll aşağı gidiyorsa veya en üstteyse butonu gizle
        if ((scrollDifference > 0 || currentScrollY <= SCROLL_TO_TOP_THRESHOLD) && showScrollToTop) {
          setShowScrollToTop(false);
          Animated.timing(scrollToTopButtonOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
        
        previousScrollY.current = currentScrollY;
      }
    }
  );

  // Banner opacity animasyonu - Banner height kadar scroll olunca banner sticky olur
  const bannerOpacity = scrollY.interpolate({
    inputRange: [bannerFadeStart - 20, bannerFadeStart + 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // TabBar opacity animasyonu - TabBar scroll'dan çıktığında (banner'ın altına geldiğinde) sticky TabBar görünür
  const tabBarOpacity = scrollY.interpolate({
    inputRange: [tabBarExitPoint - 20, tabBarExitPoint + 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Ladder seçildiğinde BottomSheet'i aç
  const handleLadderSelect = useCallback((ladder: Ladder) => {
    console.log('[ProfileScreen] ladder selected ->', ladder);
    setSelectedLadder(ladder);
  }, []);

  // selectedLadder değiştiğinde BottomSheet'i aç
  useEffect(() => {
    if (selectedLadder) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (ladderBottomSheetRef.current) {
            ladderBottomSheetRef.current.expand();
          } else {
            setTimeout(() => {
              if (ladderBottomSheetRef.current) {
                ladderBottomSheetRef.current.expand();
              }
            }, 100);
          }
        }, 50);
      });
    }
  }, [selectedLadder]);

  const handleSheetChanges = useCallback((index: number) => {
    console.log('[ProfileScreen] sheet index ->', index);
    if (index === -1) {
      setSelectedLadder(null);
    }
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.5}
      />
    ),
    []
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedTab />;
      case 'reviews':
        return <ReviewsTab />;
      case 'ladders':
        return <LadderTab onLadderSelect={handleLadderSelect} />;
      case 'benchmarks':
        return <BenchmarksTab />;
      case 'tips':
        return <TipsTab />;
      case 'replies':
        return <RepliesTab />;
      default:
        return <FeedTab />;
    }
  };



  // Scroll to top fonksiyonu
  const handleScrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Sticky Banner */}
      <Animated.View
        style={[
          styles.stickyBanner,
          {
            height: STICKY_BANNER_HEIGHT,
            backgroundColor: isDark ? '#171717' : '#fff',
            opacity: bannerOpacity,
            zIndex: bannerVisible ? 1000 : 1,
          },
        ]}
        pointerEvents={bannerVisible ? 'box-none' : 'none'}
      >
        <Box position="absolute" top={0} left={0} right={0} bottom={0}>
          <Image
            source={require('@/assets/banner/banner_01.png')}
            alt="Profile Banner"
            w="100%"
            h="100%"
            resizeMode="cover"
          />
        </Box>
        <HStack
          alignItems="center"
          px={16}
          pt={TOP_SAFE_AREA_OFFSET}
          h="100%"
          space="md"
        >
          <Box
            w={48}
            h={48}
            borderRadius={48}
            overflow="hidden"
            borderWidth={2}
            borderColor="#fff"
          >
            <Image
              source={mock_user_card.avatar}
              alt={mock_user_card.name}
              w="100%"
              h="100%"
            />
          </Box>
          <VStack flex={1}>
            <Text
              color="#fff"
              fontSize={16}
              fontWeight="$semibold"
            >
              {mock_user_card.name}
            </Text>
            <Text
              color="rgba(255,255,255,0.8)"
              fontSize={12}
              numberOfLines={1}
            >
              {mock_user_card.titles.join(' · ')}
            </Text>
          </VStack>
          <Pressable>
            <Feather name="more-vertical" size={22} color="#fff" />
          </Pressable>
        </HStack>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Profile Card Content */}
        <Box onLayout={handleProfileCardLayout}>
          <ProfileCard userData={mock_user_card} />
        </Box>

        {/* Tab Bar Placeholder - ProfileCard'ın altında sabit */}
        <Box
          height={TAB_BAR_HEIGHT}
          bg={isDark ? '#171717' : '#fff'}
          borderBottomWidth={1}
          borderBottomColor={isDark ? '#333' : '#eee'}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarScrollContent}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={styles.tabButton}
                >
                  <Text
                    fontSize={11}
                    fontWeight={isActive ? '$semibold' : '$normal'}
                    color={isActive ? '#000000' : '#A3A3A3'}
                    textTransform="capitalize"
                  >
                    {tab.title}
                  </Text>
                  {isActive && (
                    <Box
                      position="absolute"
                      bottom={0}
                      left={0}
                      right={0}
                      height={2}
                      bg={isDark ? '#fff' : '#000'}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Box>

        {/* Tab Content */}
        <Box>
          {renderTabContent()}
        </Box>
      </Animated.ScrollView>

      {/* Sticky Tab Bar - TabBar tamamen çıktıktan sonra banner'ın altında */}
      <Animated.View
        style={[
          styles.tabBarSticky,
          {
            opacity: tabBarOpacity,
            top: STICKY_BANNER_HEIGHT,
            backgroundColor: isDark ? '#171717' : '#fff',
            borderBottomColor: isDark ? '#333' : '#eee',
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScrollContent}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={styles.tabButton}
              >
                <Text
                  fontSize={11}
                  fontWeight={isActive ? '$semibold' : '$normal'}
                  color={isActive ? '#000000' : '#A3A3A3'}
                  textTransform="capitalize"
                >
                  {tab.title}
                </Text>
                {isActive && (
                  <Box
                    position="absolute"
                    bottom={0}
                    left={0}
                    right={0}
                    height={2}
                    bg={isDark ? '#fff' : '#000'}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Scroll to Top Button */}
      <Animated.View
        style={[
          styles.scrollToTopButton,
          {
            opacity: scrollToTopButtonOpacity,
          },
        ]}
      >
        <Pressable
          onPress={handleScrollToTop}
          style={({ pressed }) => [
            styles.scrollToTopPressable,
            {
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          {/* Outer Circle */}
          <Box
            width={68}
            height={68}
            borderRadius={34}
            bg="rgba(232, 255, 107, 0.5)"
            borderWidth={1}
            borderColor="rgba(178, 199, 66, 0.5)"
            justifyContent="center"
            alignItems="center"
          >
            {/* Inner Circle */}
            <Box
              width={58}
              height={58}
              borderRadius={29}
              bg="#E8FF6B"
              borderWidth={1}
              borderColor="#B2C742"
              justifyContent="center"
              alignItems="center"
            >
              {/* Arrow Up Icon */}
              <Feather name="arrow-up" size={24} color="#000" />
            </Box>
          </Box>
        </Pressable>
      </Animated.View>

      {/* Ladder BottomSheet */}
      <BottomSheet
        ref={ladderBottomSheetRef}
        index={-1}
        onChange={handleSheetChanges}
        enablePanDownToClose
        enableOverDrag={false}
        enableHandlePanningGesture={true}
        enableContentPanningGesture={true}
        enableDynamicSizing
        animateOnMount={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#333333' : '#CCCCCC',
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView>
          {selectedLadder && (
            <LadderDetail
              ladderId={selectedLadder.id}
              onClose={() => {
                ladderBottomSheetRef.current?.close();
                setSelectedLadder(null);
              }}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
      </Box>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  stickyBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    elevation: 0, // Android için
  },
  tabBarSticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT,
    borderBottomWidth: 1,
    zIndex: 999,
    elevation: 999, // Android için
  },
  tabBarScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
    minWidth: 'auto',
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 30, // Biraz daha aşağı taşıdık
    right: 16,
    zIndex: 800,
  },
  scrollToTopPressable: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default ProfileScreen;
