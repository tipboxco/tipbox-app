import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDrawerStore } from '@/src/store/drawerStore';
import { useDrawerGestureEnabled } from '@/src/hooks/useDrawerGestureEnabled';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85; // Twitter: ~85%

// ✅ CRITICAL PERFORMANCE FIX: Ultra-fast animation config
// Drawer açılıp kapanırken donma/kasma önlemek için çok hızlı ve smooth
const SPRING_CONFIG = {
  damping: 30, // Daha fazla damping = daha kontrollü, daha az bounce
  stiffness: 300, // Çok daha yüksek stiffness = çok daha hızlı response
  mass: 0.3, // Çok daha hafif = çok daha responsive
  overshootClamping: true, // Overshoot yok
};

const TIMING_CONFIG = {
  duration: 120, // 120ms - ultra hızlı kapanma
};

// ✅ DOĞRU - Platform-specific edge width (Twitter/Instagram standardı: 24px)
// CRITICAL: Drawer sadece sol kenardan 24px alanından tetiklenir
// Bu sayede yatay scroll içeren ekranlarda gesture çakışması olmaz
const EDGE_WIDTH = 24; // Endüstri standardı: 20-30px arası

const THRESHOLD = DRAWER_WIDTH * 0.2;
const VELOCITY_THRESHOLD = 300;

interface DrawerOverlayProps {
  children: React.ReactNode;
}

/**
 * Custom Drawer Overlay Component
 * 
 * CRITICAL FIXES:
 * 1. ✅ Mount/Unmount stratejisi: Drawer kapalıyken unmount edilir (memory optimization)
 * 2. ✅ Gesture Detector doğru yerde: Sadece drawer açıkken overlay'de, kapalıyken edge detector
 * 3. ✅ Edge swipe kontrolü: Sadece sol kenardan başlayan gesture'lar kabul edilir
 * 4. ✅ Animation config: Production-grade hızlı ve smooth
 * 5. ✅ isDragging state: Carousel ve diğer gesture'ları disable etmek için
 * 6. ✅ Platform-specific edge detection
 */
export const DrawerOverlay: React.FC<DrawerOverlayProps> = ({ children }) => {
  const { isOpen, isDragging, closeDrawer, openDrawer, setDragging, gestureEnabled } = useDrawerStore();
  
  // CRITICAL: Drawer gesture sadece root tab ekranlarında aktif
  const isNavigationGestureEnabled = useDrawerGestureEnabled();
  
  // ✅ PERFORMANCE FIX: isDrawerGestureEnabled'i useMemo ile memoize et
  // Her render'da hesaplanmasını önle (gereksiz re-render'ları azalt)
  const isDrawerGestureEnabled = useMemo(
    () => isNavigationGestureEnabled && gestureEnabled,
    [isNavigationGestureEnabled, gestureEnabled]
  );
  
  // ✅ DOĞRU - Mount/Unmount stratejisi
  const [shouldRender, setShouldRender] = useState(false);
  
  const translateX = useSharedValue(-DRAWER_WIDTH);
  const overlayOpacity = useSharedValue(0);

  // ✅ CRITICAL PERFORMANCE FIX: setShouldRender'ı optimize et
  // DrawerContent render'ı animasyon başladıktan sonra yapılmalı (kasma önleme)
  useEffect(() => {
    if (isOpen) {
      // CRITICAL: Animasyonu önce başlat, sonra render et (kasma önleme)
      translateX.value = withSpring(0, SPRING_CONFIG);
      overlayOpacity.value = withTiming(1, TIMING_CONFIG);
      
      // PERFORMANCE FIX: setShouldRender'ı hemen çağır ama DrawerContent lazy render yapsın
      // Animasyon başladıktan hemen sonra render et (delay kaldırıldı - daha hızlı)
      // DrawerContent kendi içinde isDrawerReady ile ağır işlemleri erteleyecek
      setShouldRender(true);
    } else {
      translateX.value = withSpring(-DRAWER_WIDTH, SPRING_CONFIG, (finished) => {
        if (finished) {
          runOnJS(setShouldRender)(false); // ← Animasyon bittikten sonra unmount
        }
      });
      overlayOpacity.value = withTiming(0, TIMING_CONFIG);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Shared value'lar dependency array'de olmamalı

  const closeDrawerJS = useCallback(() => {
    closeDrawer();
  }, [closeDrawer]);

  const openDrawerJS = useCallback(() => {
    openDrawer();
  }, [openDrawer]);

  // ✅ DOĞRU - Edge Swipe Gesture (drawer kapalıyken, SOL KENARDAN)
  // CRITICAL: Gesture'ı useMemo ile memoize et - her render'da yeniden oluşturulmasını önle
  const edgeSwipeGesture = useMemo(() => {
    return Gesture.Pan()
      .enabled(isDrawerGestureEnabled && !isOpen) // Sadece drawer kapalıyken ve gesture enabled iken
      .activeOffsetX([5, Infinity]) // Daha hassas - 5px sağa hareket
      .failOffsetX([-5, 0]) // Sola swipe iptal
      .failOffsetY([-20, 20]) // Vertical scroll her zaman kazanmalı (daha toleranslı)
      .onBegin((e) => {
        'worklet';
        // CRITICAL: Sadece sol kenardan başlamalı (endüstri standardı: 24px)
        if (e.absoluteX > EDGE_WIDTH) {
          // Sol kenar dışında - gesture'ı iptal et
          // PERFORMANCE FIX: console.log worklet içinde her frame'de çalışır - kaldırıldı
          return;
        }
        // Edge swipe başladığında drawer'ı görünür yap ve başlangıç pozisyonunu ayarla
        translateX.value = -DRAWER_WIDTH;
        overlayOpacity.value = 0;
        // PERFORMANCE FIX: setShouldRender'ı hemen çağır (gesture sırasında render gerekli)
        // Ama DrawerContent ağır işlemleri yapmamalı (isDrawerReady kontrolü ile)
        runOnJS(setShouldRender)(true);
        runOnJS(setDragging)(true); // Carousel'ı disable et
      })
      .onUpdate((e) => {
        'worklet';
        // PERFORMANCE FIX: Gereksiz hesaplamaları optimize et
        if (e.translationX > 0) {
          const newX = e.translationX > DRAWER_WIDTH ? 0 : -DRAWER_WIDTH + e.translationX;
          translateX.value = newX;
          // PERFORMANCE FIX: Math.abs yerine direkt hesaplama (daha hızlı)
          overlayOpacity.value = -newX / DRAWER_WIDTH;
        }
      })
      .onEnd((e) => {
        'worklet';
        // PERFORMANCE FIX: console.log worklet içinde her frame'de çalışır - kaldırıldı
        
        if (e.translationX > THRESHOLD || e.velocityX > VELOCITY_THRESHOLD) {
          translateX.value = withSpring(0, SPRING_CONFIG);
          overlayOpacity.value = withTiming(1, TIMING_CONFIG);
          runOnJS(setDragging)(false); // Carousel'ı enable et - gesture bitti
          runOnJS(openDrawerJS)();
        } else {
          translateX.value = withSpring(-DRAWER_WIDTH, SPRING_CONFIG);
          overlayOpacity.value = withTiming(0, TIMING_CONFIG, (finished) => {
            'worklet';
            if (finished) {
              runOnJS(setShouldRender)(false); // Animasyon bittikten sonra unmount
            }
          });
          runOnJS(setDragging)(false); // Carousel'ı enable et - gesture bitti
        }
      })
  }, [isDrawerGestureEnabled, isOpen, openDrawerJS, setShouldRender, setDragging]);
  // CRITICAL FIX: Shared value'lar (translateX, overlayOpacity) dependency array'den çıkarıldı
  // Worklet'ler shared value'ları otomatik olarak capture eder, dependency array'de olmamalı
  // Dokümantasyon: https://docs.swmansion.com/react-native-reanimated/docs/2.x/fundamentals/worklets/

  // ✅ PERFORMANCE FIX: Close Swipe Gesture memoize edilmeli
  // Her render'da yeniden oluşturulması drawer'ın kasarak kapanmasına neden olur
  const closeSwipeGesture = useMemo(() => {
    return Gesture.Pan()
    .enabled(isOpen) // Sadece drawer açıkken
    .activeOffsetX([-5, -Infinity]) // Sadece sola swipe
    .failOffsetY([-10, 10]) // Vertical scroll her zaman kazanmalı
    .onBegin(() => {
      'worklet';
      runOnJS(setDragging)(true); // Carousel'ı disable et
    })
    .onUpdate((e) => {
      'worklet';
        // PERFORMANCE FIX: Gereksiz hesaplamaları optimize et
      if (e.translationX < 0) {
          const clampedX = e.translationX < -DRAWER_WIDTH ? -DRAWER_WIDTH : e.translationX;
          translateX.value = clampedX;
          // PERFORMANCE FIX: Math.max yerine direkt hesaplama (daha hızlı)
          const opacity = 1 + clampedX / DRAWER_WIDTH;
          overlayOpacity.value = opacity > 0 ? opacity : 0;
      }
    })
    .onEnd((e) => {
      'worklet';
        // PERFORMANCE FIX: setDragging'i onEnd sonunda değil, animasyon başlamadan önce çağır
        // Çünkü animasyon başladıktan sonra zaten gesture bitiyor
      
      if (e.translationX < -THRESHOLD || e.velocityX < -VELOCITY_THRESHOLD) {
        translateX.value = withSpring(-DRAWER_WIDTH, SPRING_CONFIG);
        overlayOpacity.value = withTiming(0, TIMING_CONFIG);
          runOnJS(setDragging)(false); // Carousel'ı enable et - animasyon başlamadan önce
        runOnJS(closeDrawerJS)();
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
        overlayOpacity.value = withTiming(1, TIMING_CONFIG);
          runOnJS(setDragging)(false); // Carousel'ı enable et
      }
    });
  }, [isOpen, closeDrawerJS, setDragging]);
  // CRITICAL FIX: Shared value'lar (translateX, overlayOpacity) dependency array'den çıkarıldı
  // Worklet'ler shared value'ları otomatik olarak capture eder, dependency array'de olmamalı

  // ✅ CRITICAL FIX: useAnimatedStyle dependency array'i kaldır
  // Reanimated otomatik olarak shared value değişikliklerini takip eder
  // Dependency array eklemek gereksiz re-creation'a neden olur
  // Dokümantasyon: https://docs.swmansion.com/react-native-reanimated/docs/2.x/fundamentals/worklets/
  const drawerStyle = useAnimatedStyle(() => {
    'worklet';
    return {
    transform: [{ translateX: translateX.value }],
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    'worklet';
    return {
    opacity: overlayOpacity.value,
    };
  });

  // PERFORMANCE FIX: Debug log'u kaldır - her render'da çalışıyor
  // Gereksiz re-render'lara neden olabilir

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* ✅ DOĞRU - Sol kenar edge swipe detector - SADECE drawer kapalıyken */}
      {/* CRITICAL: Edge detector her zaman render edilmeli (shouldRender kontrolünden bağımsız) */}
      {!isOpen && isDrawerGestureEnabled && (
        <GestureDetector gesture={edgeSwipeGesture}>
          <View 
            style={[styles.edgeDetector, { zIndex: 9999 }]} 
            pointerEvents="auto" // CRITICAL: Gesture algılamak için auto olmalı
          />
        </GestureDetector>
      )}
      
      {/* DEBUG: Gesture enabled durumunu görsel olarak göster (sadece development) */}
      {__DEV__ && !isOpen && isDrawerGestureEnabled && (
        <View style={{ position: 'absolute', left: 0, top: 100, width: EDGE_WIDTH * 2, height: 50, backgroundColor: 'rgba(255,0,0,0.3)', zIndex: 10000 }} />
      )}

      {/* ✅ DOĞRU - Drawer açıkken overlay gesture */}
      {shouldRender && isOpen && (
        <GestureDetector gesture={closeSwipeGesture}>
          <Animated.View 
            style={[styles.overlay, overlayStyle]}
            pointerEvents={isOpen ? 'auto' : 'none'} // Worklet dışında kontrol
          >
            <View style={StyleSheet.absoluteFill} onTouchEnd={closeDrawerJS} />
          </Animated.View>
        </GestureDetector>
      )}

      {/* Drawer Content - Sadece shouldRender true olduğunda render et */}
      {/* CRITICAL: SafeAreaView ile status bar'ın altından başla */}
      {shouldRender && (
        <Animated.View style={[styles.drawer, drawerStyle]}>
          <SafeAreaView edges={['top']} style={styles.drawerSafeArea}>
            {children}
          </SafeAreaView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerSafeArea: {
    flex: 1,
  },
  edgeDetector: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: EDGE_WIDTH, // Endüstri standardı: 24px edge swipe alanı
    backgroundColor: 'transparent', // Görünmez ama touchable
  },
});
