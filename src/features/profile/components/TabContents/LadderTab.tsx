import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { FlatList, Dimensions, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { VStack, HStack, Text, Image, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useColorMode } from '@/src/hooks/useColorMode';
import { mock_ladders } from '@/src/mock/profile/ladders';
import { Ladder } from '@/src/mock/profile/ladders/types';
import LadderDetail from '../../components/LadderDetail';
import { Portal } from '@gorhom/portal';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 10;
const NUM_COLUMNS = 2;
const CARD_MARGIN = 15;
const CARD_WIDTH = (width - (CARD_MARGIN * 2) - (COLUMN_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

// Android için layout animasyonlarını etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LadderTab = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [selectedLadder, setSelectedLadder] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const bottomSheetRef = useRef<BottomSheet>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Filtreleme değiştiğinde animasyon için
  const handleFilterChange = (newFilter: 'all' | 'in_progress' | 'completed') => {
    // Önce fade out animasyonu
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Layout animasyonunu yapılandır
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      // Filtre değerini güncelle
      setSelectedFilter(newFilter);
      
      // Fade in animasyonu
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  // variables
  const snapPoints = useMemo(() => ['90%'], []);

  // callbacks
  const handlePresentModalPress = useCallback((id: string) => {
    console.log('[LadderTab] item press -> id:', id);
    setSelectedLadder(id);
    bottomSheetRef.current?.expand();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log('[LadderTab] sheet index ->', index);
    if (index === -1) {
      setSelectedLadder(null);
    }
  }, []);

  const renderItem = ({ item: ladder }: { item: Ladder }) => (
    <TouchableOpacity onPress={() => handlePresentModalPress(ladder.id)} activeOpacity={0.7}>
      <Box
        bg={isDark ? '$backgroundDark800' : '$white'}
        borderWidth={1}
        borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
        borderRadius={10}
        h={250}
        w={CARD_WIDTH}
        overflow="hidden"
        position="relative"
        shadowColor={isDark ? '$backgroundDark950' : '#000'}
        shadowOffset={{ width: 0, height: 0 }}
        shadowOpacity={0.25}
        shadowRadius={3}
        mb={10}
      >
        <Image
          source={ladder.image}
          alt={ladder.title}
          w={150}
          h={150}
          resizeMode="contain"
          alignSelf="center"
          mt={5}
        />

        <VStack space="xs" position="absolute" bottom={15} left={15} right={15}>
          <HStack space="sm" alignItems="center">
            <Text
              color={isDark ? '$textDark50' : '#000'}
              fontSize={12}
              fontWeight="$semibold"
              textAlign="center"
              w="100%"
            >
              {ladder.title}
            </Text>
          </HStack>

          <Text
            color={isDark ? '$textDark400' : '#575757'}
            fontSize={9}
            lineHeight={11}
            textAlign="center"
            w="100%"
          >
            {ladder.description}
          </Text>

          <VStack space="xs" mt={10}>
            <Box
              w="100%"
              h={5}
              bg={isDark ? '$backgroundDark700' : '#E0E0E0'}
              borderRadius={10}
              overflow="hidden"
            >
              <Box
                w={`${(ladder.progress.current / ladder.progress.total) * 100}%`}
                h="100%"
                bg={ladder.isCompleted ? '#0C7A24' : '#686868'}
              />
            </Box>
            <Text
              color={isDark ? '$textDark400' : '#797979'}
              fontSize={9}
              textAlign="center"
            >
              {ladder.isCompleted ? 'Completed' : `${ladder.progress.current}/${ladder.progress.total}`}
            </Text>
          </VStack>
        </VStack>

        {ladder.isCompleted && (
          <>
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="rgba(47, 61, 36, 0.25)"
            />
            <Box
              position="absolute"
              top={12}
              right={12}
              bg="$success600"
              borderRadius={100}
              w={18}
              h={18}
              alignItems="center"
              justifyContent="center"
              zIndex={10}
            >
              <Feather name="check" size={16} color="#fff" />
            </Box>
          </>
        )}
      </Box>
    </TouchableOpacity>
  );

  const filteredLadders = useMemo(() => {
    switch (selectedFilter) {
      case 'in_progress':
        return mock_ladders.filter(ladder => !ladder.isCompleted);
      case 'completed':
        return mock_ladders.filter(ladder => ladder.isCompleted);
      default:
        return mock_ladders;
    }
  }, [selectedFilter]);

  return (
    <VStack flex={1} px={CARD_MARGIN} py={10}>
      <HStack space="sm" mb={15}>
        <Box
          bg={selectedFilter === 'all' ? (isDark ? '$backgroundDark800' : 'rgba(229, 229, 229, 0.8)') : 'transparent'}
          borderWidth={1}
          borderColor={isDark ? '$borderDark700' : '#EFEFEF'}
          borderRadius={100}
          px={16}
          py={8}
        >
          <TouchableOpacity onPress={() => handleFilterChange('all')}>
            <Text
              fontSize={12}
              fontWeight="$semibold"
              color={isDark ? '$textDark50' : '#000'}
            >
              All
            </Text>
          </TouchableOpacity>
        </Box>

        <Box
          bg={selectedFilter === 'in_progress' ? (isDark ? '$backgroundDark800' : 'rgba(229, 229, 229, 0.8)') : 'transparent'}
          borderWidth={1}
          borderColor={isDark ? '$borderDark700' : '#EFEFEF'}
          borderRadius={100}
          px={16}
          py={8}
        >
          <TouchableOpacity onPress={() => handleFilterChange('in_progress')}>
            <Text
              fontSize={12}
              fontWeight="$semibold"
              color={isDark ? '$textDark50' : '#000'}
            >
              In Progress
            </Text>
          </TouchableOpacity>
        </Box>

        <Box
          bg={selectedFilter === 'completed' ? (isDark ? '$backgroundDark800' : 'rgba(229, 229, 229, 0.8)') : 'transparent'}
          borderWidth={1}
          borderColor={isDark ? '$borderDark700' : '#EFEFEF'}
          borderRadius={100}
          px={16}
          py={8}
        >
          <TouchableOpacity onPress={() => handleFilterChange('completed')}>
            <Text
              fontSize={12}
              fontWeight="$semibold"
              color={isDark ? '$textDark50' : '#000'}
            >
              Completed
            </Text>
          </TouchableOpacity>
        </Box>
      </HStack>
      <Animated.View style={{ opacity: fadeAnim }}>
        <FlatList
          data={filteredLadders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            gap: COLUMN_GAP,
          }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          // Layout animasyonu için
          onLayout={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          }}
        />
      </Animated.View>

      <Portal>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          enablePanDownToClose
          backdropComponent={BottomSheetBackdrop}
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
                ladderId={selectedLadder}
                onClose={() => {
                  bottomSheetRef.current?.close();
                  setSelectedLadder(null);
                }}
              />
            )}
          </BottomSheetView>
        </BottomSheet>
      </Portal>
    </VStack>
  );
};

export default LadderTab;