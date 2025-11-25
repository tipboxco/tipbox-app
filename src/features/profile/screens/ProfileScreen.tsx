import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Animated, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Pressable, Image, HStack, VStack } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import ProfileCard from '../components/ProfileCard';
import { ReviewsTab, LadderTab, RepliesTab, TipsTab, FeedTab, BenchmarksTab } from '../components/TabContents';
import { useColorMode } from '@/src/hooks/useColorMode';
import LadderDetail from '../components/LadderDetail';
import { Ladder } from '@/src/mock/profile/ladders/types';
import { useUserProfile } from '../api/hooks';
import { useAppStore } from '@/src/store/appStore';

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
const TAB_BAR_HEIGHT = 50;
const SCROLL_TO_TOP_THRESHOLD = 300; // Butonun görünmesi için minimum scroll mesafesi

const ProfileScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { user } = useAppStore();
  const userId = user?.id;
  
  // Profile API hook
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useUserProfile(userId);
  
  const [activeTab, setActiveTab] = useState('feed');
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const previousScrollY = useRef(0);
  const scrollToTopButtonOpacity = useRef(new Animated.Value(0)).current;
  
  // BottomSheet state ve ref'leri
  const [selectedLadder, setSelectedLadder] = useState<Ladder | null>(null);
  const ladderBottomSheetRef = useRef<BottomSheet>(null);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const scrollDifference = currentScrollY - previousScrollY.current;
        
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
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Animated.ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Banner */}
        <Box position="relative" h={TOP_SAFE_AREA_OFFSET + 90} mb="$4">
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
            bg="rgba(0,0,0,0.3)"
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
                source={userProfile?.avatarUrl ? { uri: userProfile.avatarUrl } : require('@/assets/avatar/ozan.png')}
                alt={userProfile?.name || 'User'}
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
                {userProfile?.name || 'Kullanıcı'}
              </Text>
              <Text
                color="rgba(255,255,255,0.8)"
                fontSize={12}
                numberOfLines={1}
              >
                {userProfile?.titles?.join(' · ') || ''}
              </Text>
            </VStack>
            <Pressable>
              <Feather name="more-vertical" size={22} color="#fff" />
            </Pressable>
          </HStack>
        </Box>

        {/* Profile Card Content */}
        {isProfileLoading ? (
          <Box py={20} alignItems="center">
            <Text color={isDark ? '#fff' : '#000'}>Yükleniyor...</Text>
          </Box>
        ) : profileError ? (
          <Box py={20} alignItems="center">
            <Text color="#CE4A4A">Hata: {profileError.message}</Text>
          </Box>
        ) : userProfile ? (
          <Box>
            <ProfileCard userData={userProfile} userId={userProfile.id} />
          </Box>
        ) : null}

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
