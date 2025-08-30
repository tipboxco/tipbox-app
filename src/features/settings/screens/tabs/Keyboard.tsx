// SlackComposer.tsx
import React, { useMemo } from 'react';
import { StyleSheet, Platform, Keyboard, useWindowDimensions, TextInput, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  clamp,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAnimatedKeyboard } from 'react-native-reanimated';

type Props = {
  placeholder?: string;
  onSend?: (text: string) => void;
};

export const SlackComposer: React.FC<Props> = ({ placeholder = 'Mesaj yaz…', onSend }) => {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  // Klavye takibi (yükseklik/visibility)
  const kb = useAnimatedKeyboard(); // Reanimated 3: keyboard.height, .state
  const keyboardH = useDerivedValue(() => kb.height.value, [kb]);

  // Snap noktaları
  const COLLAPSED = 56; // alt bar yüksekliği
  const MAX_HEIGHT = useDerivedValue(() => {
    // "Yarım ekran klavye + yarım ekran composer" hedefi: ekrandan klavye yüksekliğini düşelim
    const max = Math.max(200, screenH - keyboardH.value - insets.top * 0.5);
    return max;
  }, [screenH, insets.top]);

  // Yükseklik animasyonu (başlangıçta collapsed)
  const height = useSharedValue(COLLAPSED);

  // İçerik metni (kontrollü değil, basit tutuyoruz — istersen state ekleyebilirsin)
  const textRef = React.useRef<string>('');

  // Pan jesti: yukarı çekince büyür, aşağı çekince küçülür
  const drag = Gesture.Pan()
    .onUpdate((e) => {
      // Yukarı drag => e.translationY negatif, yüksekliği arttır
      const next = height.value - e.translationY; // translationY: frame-to-frame delta
      height.value = clamp(next, COLLAPSED, MAX_HEIGHT.value);
    })
    .onEnd(() => {
      // Snap: ara değerlerden yakın olana atla
      const mid = COLLAPSED + (MAX_HEIGHT.value - COLLAPSED) * 0.35;
      const dest = height.value >= mid ? MAX_HEIGHT.value : COLLAPSED;
      height.value = withSpring(dest, { damping: 18, stiffness: 220 });
    });

  // Composer'a dokununca klavye açık değilse açılmasını istersen:
  const tap = Gesture.Tap().onEnd(() => {
    if (Platform.OS === 'android') {
      // Android'de genelde otomatik açılıyor; garanti için:
    }
  });

  const composed = Gesture.Simultaneous(drag, tap);

  const containerStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
      borderTopLeftRadius: withSpring(height.value > COLLAPSED + 8 ? 16 : 10),
      borderTopRightRadius: withSpring(height.value > COLLAPSED + 8 ? 16 : 10),
    };
  });

  const handleSend = () => {
    const txt = textRef.current?.trim?.() ?? '';
    if (txt.length === 0) return;
    onSend?.(txt);
    textRef.current = '';
    // Gönderdikten sonra istersen collapse et:
    height.value = withSpring(COLLAPSED);
    Keyboard.dismiss();
  };

  return (
    <Animated.View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      {/* Arkaplan tıklanınca collapse etmek istersen bir backdrop ekleyebilirsin */}
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.composer, containerStyle]}>
          {/* Tutacak alan (Slack'te üstte ince bir bar/handle vardır) */}
          <Animated.View style={styles.handleHit}>
            <Animated.View style={styles.handle} />
          </Animated.View>

          {/* Çok satırlı metin alanı */}
          <Animated.ScrollView
            bounces
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor="#8F9BB3"
              multiline
              scrollEnabled
              onChangeText={(t: string) => {
                textRef.current = t;
              }}
              // iOS'ta satır üstten başlasın
              textAlignVertical="top"
              // Otomatik odak istersen:
              // autoFocus
              // return tuşu yerine "send":
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
          </Animated.ScrollView>

          {/* Alt aksiyon barı */}
          <Animated.View style={styles.bottomBar}>
            {/* Ek butonları koy (dosya, foto, @, # vs.) */}
            <TouchableOpacity style={styles.action} onPress={handleSend}>
              <Animated.Text style={styles.sendText}>Gönder</Animated.Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
  },
  composer: {
    backgroundColor: '#101114',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  handleHit: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#2B2F36',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  input: {
    minHeight: 28,
    fontSize: 16,
    color: '#E6E8EB',
    padding: 10,
    backgroundColor: '#161A20',
    borderRadius: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#23262D',
  },
  action: {
    marginLeft: 'auto',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2F6FED',
  },
  sendText: { color: 'white', fontWeight: '600' },
});
