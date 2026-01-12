import React, { useRef, useMemo, useCallback } from 'react';
import { Box, Image, Pressable } from '@gluestack-ui/themed';
import { Dimensions, View } from 'react-native';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import { useSharedValue, useAnimatedStyle, interpolate, SharedValue, interpolateColor, runOnJS } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { FlatList } from 'react-native';
import { useFeedListContext } from '@/src/features/feed/context/FeedListContext';

interface CardImageCarouselProps {
  images: any[];
  width?: number;
  height?: number;
  paddingHorizontal?: number;
}

// Custom Pagination Component - useAnimatedStyle kullanarak Reanimated uyarısını önler
interface CustomPaginationProps {
  progress: SharedValue<number>;
  data: any[];
  onPress: (index: number) => void;
  dotStyle?: {
    width?: number;
    height?: number;
    borderRadius?: number;
    backgroundColor?: string;
    marginHorizontal?: number;
  };
  activeDotStyle?: {
    backgroundColor?: string;
  };
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
  progress,
  data,
  onPress,
  dotStyle = {
    width: 8,
    height: 8,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginHorizontal: 4,
  },
  activeDotStyle = {
    backgroundColor: '#829905',
  },
}) => {
  // Renk değerlerini component seviyesinde tanımla - useAnimatedStyle içinde prop kullanımını önlemek için
  const inactiveColor = dotStyle.backgroundColor || '#FFFFFFE6'; // rgba(255,255,255,0.9) -> #FFFFFFE6 (alpha: 0.9 * 255 = 230 = E6)
  const activeColor = activeDotStyle.backgroundColor || '#829905';
  
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
      }}
    >
      {data.map((_, index) => {
        const animatedStyle = useAnimatedStyle(() => {
          const inputRange = [index - 1, index, index + 1];
          const outputRange = [0.5, 1, 0.5];
          const opacity = interpolate(progress.value, inputRange, outputRange);
          const scale = interpolate(progress.value, inputRange, outputRange);
          
          // Aktif dot için farklı renk - interpolateColor kullanarak
          // interpolateColor hex formatını tercih eder
          const backgroundColor = interpolateColor(
            progress.value,
            [index - 0.5, index, index + 0.5],
            [inactiveColor, activeColor, inactiveColor]
          );
          
          return {
            opacity,
            transform: [{ scale }],
            backgroundColor,
          };
        });

        return (
          <Pressable
            key={index}
            onPress={() => onPress(index)}
            style={{ marginHorizontal: dotStyle.marginHorizontal || 4 }}
          >
            <Animated.View
              style={[
                {
                  width: dotStyle.width || 8,
                  height: dotStyle.height || 8,
                  borderRadius: dotStyle.borderRadius || 50,
                },
                animatedStyle,
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

export const CardImageCarousel = ({ images, paddingHorizontal }: CardImageCarouselProps) => {
  const carouselRef = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);

  // FeedListContext'ten feedListRef'i al (optional - sadece feed ekranında mevcut)
  // Feed ekranı dışında kullanılıyorsa context yok, bu durumda gesture arbitration devre dışı
  // REANIMATED FIX: feedListRef'i direkt kullanmıyoruz, sadece feedListContext üzerinden erişiyoruz
  // Bu sayede ref worklet'e geçirilmez ve Reanimated uyarısı önlenir
  const feedListContext = useFeedListContext();

  // GESTURE ARBITRATION: Direction lock mekanizması (UI thread'de, SharedValue ile)
  // RULE 1: Gesture state asla React state ile tutulmaz, sadece SharedValue
  const gestureDirection = useSharedValue<'none' | 'horizontal' | 'vertical'>('none');
  // Threshold'u düşürdük: Carousel'ın gesture'ından önce devreye girmek için daha agresif
  const DIRECTION_THRESHOLD = 8; // px - İlk hareket yönü tespiti için threshold (düşürüldü)
  const ACTIVE_OFFSET = 5; // px - Gesture'ın aktif olması için minimum offset (daha agresif)
  
  // NOTE: panGestureHandlerProps bu carousel versiyonunda mevcut değil
  // Carousel'ın gesture'ını sınırlandırmak için wrapper View seviyesinde gesture handler kullanıyoruz

  // Feed scroll control: Native thread'den JS thread'e geçiş (sadece gesture bittiğinde)
  // RULE 2: setNativeProps sadece gesture bittiğinde çağrılır, gesture sırasında değil
  // Bu fonksiyonlar worklet callback'lerinde çağrılır, useCallback ile memoize edilir
  // REANIMATED FIX: feedListRef'i worklet'e geçirmemek için, ref'i closure'da yakalıyoruz
  const disableFeedScroll = useCallback(() => {
    // feedListRef'i closure'da yakala - worklet'e geçirilmez
    const ref = feedListContext?.feedListRef;
    if (ref?.current) {
      ref.current.setNativeProps({ scrollEnabled: false });
    }
  }, [feedListContext]);

  const enableFeedScroll = useCallback(() => {
    // feedListRef'i closure'da yakala - worklet'e geçirilmez
    const ref = feedListContext?.feedListRef;
    if (ref?.current) {
      ref.current.setNativeProps({ scrollEnabled: true });
    }
  }, [feedListContext]);

  // Horizontal gesture: Carousel swipe için
  // RULE 3: Aynı anda yalnızca 1 PanGesture ACTIVE olabilir (Race ile garanti)
  // Gesture'ları useMemo ile memoize et - her render'da yeniden oluşturulmamalı
  const horizontalGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          'worklet';
          gestureDirection.value = 'none';
        })
        .onUpdate((event) => {
          'worklet';
          // Direction lock: İlk hareket yönüne göre kilitle (daha hızlı tespit)
          if (gestureDirection.value === 'none') {
            const absX = Math.abs(event.translationX);
            const absY = Math.abs(event.translationY);
            
            // Threshold'u geçtiyse direction'ı kilitle
            if (absX > DIRECTION_THRESHOLD || absY > DIRECTION_THRESHOLD) {
              if (absX > absY) {
                gestureDirection.value = 'horizontal';
                // Feed scroll'u devre dışı bırak (sadece horizontal tespit edildiğinde)
                // runOnJS ile JS thread'e geçiş yap
                // REANIMATED FIX: feedListRef kontrolünü worklet dışında yap (runOnJS callback'inde)
                runOnJS(disableFeedScroll)();
              }
            }
          }
        })
        .onEnd(() => {
          'worklet';
          if (gestureDirection.value === 'horizontal') {
            // REANIMATED FIX: feedListRef kontrolünü worklet dışında yap (runOnJS callback'inde)
            runOnJS(enableFeedScroll)();
          }
          gestureDirection.value = 'none';
        })
        .onFinalize(() => {
          'worklet';
          // Güvenlik: Her durumda feed scroll'u tekrar aktif et
          // REANIMATED FIX: feedListRef kontrolünü worklet dışında yap (runOnJS callback'inde)
          runOnJS(enableFeedScroll)();
          gestureDirection.value = 'none';
        })
        // Horizontal hareketlerde aktif ol - daha agresif threshold
        // Carousel'ın gesture'ından önce devreye girmek için
        .activeOffsetX([-ACTIVE_OFFSET, ACTIVE_OFFSET])
        .failOffsetY([-ACTIVE_OFFSET * 2, ACTIVE_OFFSET * 2])
        // Carousel'ın gesture'ından önce devreye girmek için minPointers
        .minPointers(1)
        .maxPointers(1),
    [disableFeedScroll, enableFeedScroll]
  );

  // Vertical gesture: Feed scroll için
  // RULE 4: Vertical gesture, horizontal başarısız olursa devreye girer
  const verticalGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          'worklet';
          gestureDirection.value = 'none';
        })
        .onUpdate((event) => {
          'worklet';
          // Direction lock: İlk hareket yönüne göre kilitle (daha hızlı tespit)
          if (gestureDirection.value === 'none') {
            const absX = Math.abs(event.translationX);
            const absY = Math.abs(event.translationY);
            
            // Threshold'u geçtiyse direction'ı kilitle
            if (absX > DIRECTION_THRESHOLD || absY > DIRECTION_THRESHOLD) {
              if (absY > absX) {
                gestureDirection.value = 'vertical';
                // Vertical hareket → feed scroll aktif kalır, carousel devre dışı
              }
            }
          }
        })
        .onEnd(() => {
          'worklet';
          gestureDirection.value = 'none';
        })
        .onFinalize(() => {
          'worklet';
          gestureDirection.value = 'none';
        })
        // Vertical hareketlerde aktif ol - daha agresif threshold
        // Carousel'ın gesture'ından önce devreye girmek için
        .activeOffsetY([-ACTIVE_OFFSET, ACTIVE_OFFSET])
        .failOffsetX([-ACTIVE_OFFSET * 2, ACTIVE_OFFSET * 2])
        // Carousel'ın gesture'ından önce devreye girmek için minPointers
        .minPointers(1)
        .maxPointers(1),
    []
  );

  // RULE 5: Gesture.Race - İlk ACTIVE olan kazanır, diğeri otomatik CANCEL
  // Bu %100 crash-safe yaklaşımdır
  const composedGesture = useMemo(() => {
    // REANIMATED FIX: feedListRef kontrolünü worklet dışında yap
    if (!feedListContext?.feedListRef) {
      // Feed ekranı dışında kullanılıyorsa gesture arbitration yok
      return undefined;
    }
    return Gesture.Race(horizontalGesture, verticalGesture);
  }, [feedListContext, horizontalGesture, verticalGesture]);

  const carouselPadding = paddingHorizontal ? paddingHorizontal : 28;
  const carouselWidth = Dimensions.get('window').width;
  const carouselHeight = Dimensions.get('window').width - carouselPadding;

  const onPressPagination = (index: number) => {
    // progress.value okuması callback içinde olduğu için sorun değil
    carouselRef.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  if (!images?.length) return null;

  // Tek görsel varsa sadece Image göster, carousel kullanma
  if (images.length === 1) {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    return (
      <Box
        w={carouselWidth}
        h={carouselHeight}
        paddingHorizontal={carouselPadding}
        overflow="hidden"
        position="relative"
        alignSelf="center"
      >
        <Image
          source={images[0] || defaultPostImage}
          alt="Post image"
          resizeMode="cover"
          style={{
            width: carouselWidth - (carouselPadding * 2),
            height: carouselHeight,
            borderRadius: 8,
          }}
        />
      </Box>
    );
  }

  // Feed ekranı dışında kullanılıyorsa gesture arbitration yok, normal carousel
  if (!composedGesture) {
    return (
      <Box
        w={carouselWidth}
        h={carouselHeight}
        paddingHorizontal={carouselPadding}
        overflow="hidden"
        position="relative"
        alignSelf="center"
      >
        <Carousel
          ref={carouselRef}
          width={carouselWidth}
          height={carouselHeight}
          data={images}
          onProgressChange={progress}
          renderItem={({ index }) => {
            const defaultPostImage = require('@/assets/defaultImages/default-post.png');
            return (
              <Image
                source={images[index] || defaultPostImage}
                alt="Post image"
                resizeMode="cover"
                style={{
                  width: carouselWidth - (carouselPadding * 2),
                  height: carouselHeight,
                  borderRadius: 8,
                }}
              />
            );
          }}
        />

        <CustomPagination
          progress={progress}
          data={images}
          onPress={onPressPagination}
          dotStyle={{
            width: 8,
            height: 8,
            borderRadius: 50,
            backgroundColor: 'rgba(255,255,255,0.9)',
            marginHorizontal: 4,
          }}
          activeDotStyle={{
            backgroundColor: '#829905'
          }}
        />
      </Box>
    );
  }

  // Feed ekranında: Gesture.Race ile crash-safe gesture arbitration
  // CRITICAL FIX: Carousel'ı bir View ile sarmalayıp gesture'ı View'a koyuyoruz
  // Bu sayede carousel'ın internal gesture'ından önce bizim gesture'ımız devreye girer
  return (
    <Box
      w={carouselWidth}
      h={carouselHeight}
      paddingHorizontal={carouselPadding}
      overflow="hidden"
      position="relative"
      alignSelf="center"
    >
      <GestureDetector gesture={composedGesture}>
        <View
          style={{
            width: carouselWidth - (carouselPadding * 2),
            height: carouselHeight,
          }}
          pointerEvents="box-none"
        >
          <Carousel
            ref={carouselRef}
            width={carouselWidth}
            height={carouselHeight}
            data={images}
            onProgressChange={progress}
            // NOTE: panGestureHandlerProps bu carousel versiyonunda mevcut değil
            // Gesture kontrolü wrapper View seviyesinde yapılıyor (GestureDetector ile)
            renderItem={({ index }) => {
              const defaultPostImage = require('@/assets/defaultImages/default-post.png');
              return (
                <Image
                  source={images[index] || defaultPostImage}
                  alt="Post image"
                  resizeMode="cover"
                  style={{
                    width: carouselWidth - (carouselPadding * 2),
                    height: carouselHeight,
                    borderRadius: 8,
                  }}
                />
              );
            }}
          />
        </View>
      </GestureDetector>

      <CustomPagination
        progress={progress}
        data={images}
        onPress={onPressPagination}
        dotStyle={{
          width: 8,
          height: 8,
          borderRadius: 50,
          backgroundColor: 'rgba(255,255,255,0.9)',
          marginHorizontal: 4,
        }}
        activeDotStyle={{
          backgroundColor: '#829905'
        }}
      />
    </Box>
  );
};

export default CardImageCarousel;
