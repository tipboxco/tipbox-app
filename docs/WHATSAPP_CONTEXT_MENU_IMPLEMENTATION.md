# WhatsApp Tarzı Context Menu Implementasyonu

## Genel Bakış

Bu dokümantasyon, React Native Expo ve Gluestack UI kullanarak WhatsApp tarzı context menu (uzun basma menüsü) implementasyonunu açıklar. Menu, mesaj balonuna uzun basıldığında açılır ve tıklanan yerde konumlanır.

## Özellikler

- ✅ **Reaction Bar**: Mesajın üstünde emoji seçim çubuğu
- ✅ **Context Menu**: Mesajın altında eylem menüsü (Reply, Edit, Delete)
- ✅ **Blur Overlay**: Arka plan bulanıklaştırma efekti
- ✅ **Reanimated Animasyonlar**: Spring ve scale efektleri
- ✅ **Haptic Feedback**: iOS'ta titreşim geri bildirimi
- ✅ **Doğru Pozisyonlama**: Tıklanan yerde açılma

## Teknik Detaylar

### 1. measureInWindow API

Mesaj balonunun ekran koordinatlarını almak için React Native'in `measureInWindow` API'si kullanılır:

```typescript
messageRef.current.measureInWindow((x, y, width, height) => {
  // x, y = Ekrandaki tam koordinatlar (window'a göre)
  // width, height = Mesaj balonunun boyutları
  setMessagePosition({ x, y, width, height });
});
```

**Neden measureInWindow?**
- `measure()` parent container'a göre koordinat verir
- `measureInWindow()` window'a göre koordinat verir (daha doğru)
- Modal içinde absolute positioning için window koordinatları gerekli

### 2. Ref Yapısı

Ref'in doğru çalışması için yapı şu şekilde olmalı:

```typescript
<View ref={messageRef} collapsable={false}>
  <Pressable onLongPress={handleLongPress} delayLongPress={300}>
    <ReanimatedAnimated.View>
      {/* Mesaj içeriği */}
    </ReanimatedAnimated.View>
  </Pressable>
</View>
```

**Neden View ref?**
- `View` ref'i `measureInWindow`'u destekler
- `Pressable` ref'i bazen çalışmayabilir
- `collapsable={false}` ref'in kaybolmasını önler

### 3. Pozisyon Hesaplama

WhatsAppContextMenu component'inde mesajın pozisyonuna göre menu ve reaction bar konumlandırılır:

```typescript
// Reaction bar: Mesajın üstünde
const reactionBarY = messagePosition.y - REACTION_BAR_HEIGHT - 8;
const reactionBarX = isSent 
  ? messagePosition.x + messagePosition.width - (reactionEmojis.length * 40) - 8
  : messagePosition.x + 8;

// Context menu: Mesajın altında
const menuY = messagePosition.y + messagePosition.height + 8;
const menuX = isSent 
  ? messagePosition.x + messagePosition.width - 180
  : messagePosition.x;
```

**Ekran sınırları kontrolü:**
```typescript
// Ekran dışına taşmaması için kontrol
if (menuX < 8) menuX = 8;
if (menuX + menuWidth > screenWidth - 8) menuX = screenWidth - menuWidth - 8;
if (menuY < 8) menuY = 8;
if (menuY + menuHeight > screenHeight - 8) menuY = screenHeight - menuHeight - 8;
```

### 4. Fallback Mekanizması

`measureInWindow` çalışmazsa event'ten pozisyon alınır:

```typescript
const handleLongPressFallback = (event?: any) => {
  if (event?.nativeEvent) {
    const touchX = event.nativeEvent.pageX || event.nativeEvent.locationX || 0;
    const touchY = event.nativeEvent.pageY || event.nativeEvent.locationY || 0;
    
    if (touchX > 0 && touchY > 0) {
      setMessagePosition({ 
        x: touchX - 100, 
        y: touchY - 20, 
        width: 200, 
        height: 40 
      });
      setIsContextMenuOpen(true);
      return;
    }
  }
  
  // Son çare: Yaklaşık pozisyon
  const approximateX = isSent ? screenWidth - 250 : 16;
  const approximateY = screenHeight / 2;
  setMessagePosition({ approximateX, approximateY, width: 200, height: 40 });
};
```

### 5. Modal + Absolute Positioning

WhatsAppContextMenu `Modal` içinde absolute positioned olarak render edilir:

```typescript
<Modal
  visible={visible}
  transparent={true}
  animationType="none"
  onRequestClose={onClose}
>
  <Animated.View style={{ flex: 1 }}>
    {/* Blur Overlay */}
    <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} />
    
    {/* Reaction Bar - Absolute positioned */}
    <Animated.View
      style={{
        position: 'absolute',
        left: reactionBarX,
        top: reactionBarY,
        // ...
      }}
    >
      {/* Emoji buttons */}
    </Animated.View>
    
    {/* Context Menu - Absolute positioned */}
    <Animated.View
      style={{
        position: 'absolute',
        left: menuX,
        top: menuY,
        // ...
      }}
    >
      {/* Menu items */}
    </Animated.View>
  </Animated.View>
</Modal>
```

**Neden Modal?**
- Absolute positioned View sadece parent container içinde çalışır
- Modal ekranın tamamını kaplar, scroll view'ların dışında bile çalışır
- Boşluğa tıklayınca menu kapanır (kullanıcı deneyimi için kritik)

### 6. Layout Gecikmesi

Layout tamamlanması için kısa bir timeout kullanılır:

```typescript
setTimeout(() => {
  if (messageRef.current) {
    messageRef.current.measureInWindow((x, y, width, height) => {
      // Ölçüm başarılı
      if (x !== 0 || y !== 0 || width !== 0 || height !== 0) {
        setMessagePosition({ x, y, width, height });
        setIsContextMenuOpen(true);
      }
    });
  }
}, 50);
```

**Neden timeout?**
- React Native'de layout asenkron çalışır
- Ref hazır olsa bile ölçüm doğru olmayabilir
- 50ms gecikme layout'un tamamlanmasını sağlar

### 7. Reanimated Animasyonlar

Menu açılırken spring animasyonları kullanılır:

```typescript
const overlayOpacity = useSharedValue(0);
const reactionBarScale = useSharedValue(0);
const menuScale = useSharedValue(0);
const messageScale = useSharedValue(1);

useEffect(() => {
  if (visible) {
    overlayOpacity.value = withTiming(1, { duration: 200 });
    messageScale.value = withSpring(1.05, SPRING_CONFIG);
    reactionBarScale.value = withSpring(1, SPRING_CONFIG);
    menuScale.value = withDelay(50, withSpring(1, SPRING_CONFIG));
  } else {
    // Kapanma animasyonları
    overlayOpacity.value = withTiming(0, { duration: 150 });
    messageScale.value = withSpring(1, SPRING_CONFIG);
    reactionBarScale.value = withTiming(0, { duration: 150 });
    menuScale.value = withTiming(0, { duration: 150 });
  }
}, [visible]);
```

**Spring Config:**
```typescript
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 200,
  mass: 0.8,
};
```

### 8. Haptic Feedback

iOS'ta uzun basma anında titreşim geri bildirimi:

```typescript
// Haptic feedback - opsiyonel
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // expo-haptics yoksa sessizce devam et
}

const handleLongPress = () => {
  if (Haptics && Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
  // ...
};
```

## Dosya Yapısı

```
src/features/inbox/components/MessageItem/
├── MessageBubble.tsx          # Ana mesaj balonu component'i
├── WhatsAppContextMenu.tsx     # Context menu component'i
└── types.ts                   # Type definitions
```

## Kullanım

```typescript
// MessageBubble.tsx içinde
<Pressable
  ref={messageRef}
  onLongPress={handleLongPress}
  delayLongPress={300}
>
  {/* Mesaj içeriği */}
</Pressable>

{isContextMenuOpen && (
  <WhatsAppContextMenu
    visible={isContextMenuOpen}
    onClose={closeContextMenu}
    messagePosition={messagePosition}
    reactionBarPosition={null}
    actions={menuActions}
    reactionEmojis={emojis}
    onReactionPress={(emoji) => {
      onReact?.(item.id, emoji);
      closeContextMenu();
    }}
    isDark={isDark}
    isSent={isSent}
  />
)}
```

## Önemli Notlar

1. **Box Component Sorunu**: Gluestack `Box` component'i touch event'lerini engelleyebilir. Bu yüzden mesaj balonu için native `View` kullanılmalı.

2. **Ref Timing**: Ref'in hazır olması için `onLayout` callback'i veya timeout kullanılabilir.

3. **Modal vs Absolute**: Menu'nun ekranın tamamını kaplaması için `Modal` kullanılmalı, sadece absolute positioning yeterli değil.

4. **Performance**: Reanimated worklet'ler native thread'de çalışır, performanslıdır.

5. **Platform Differences**: iOS ve Android'de `measureInWindow` davranışı farklı olabilir, test edilmeli.

## Sorun Giderme

### Menu ekranın ortasında açılıyor
- Ref'in doğru bağlandığından emin olun
- `measureInWindow`'un çalıştığını console log'larından kontrol edin
- Fallback mekanizmasının çalıştığını kontrol edin

### Long press algılanmıyor
- Box component'i yerine native View kullanın
- Pressable'ı en üst seviyeye taşıyın
- `delayLongPress` değerini artırın (300ms → 500ms)

### Menu yanlış pozisyonda açılıyor
- `measureInWindow` koordinatlarını kontrol edin
- Ekran sınırları kontrolünü ekleyin
- FlatList inverted ise Y koordinatını ters çevirin

## Kaynaklar

- [React Native measureInWindow](https://reactnative.dev/docs/direct-manipulation#measureinwindowcallback)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Expo Blur](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)
