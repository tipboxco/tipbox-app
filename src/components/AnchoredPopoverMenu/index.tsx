import React from 'react';
import {
  Modal,
  Pressable as RNPressable,
  View,
  StyleSheet,
  Dimensions,
  type GestureResponderEvent,
} from 'react-native';
import { VStack, HStack, Text, Pressable, Divider } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

export interface AnchoredPopoverMenuItem {
  key: string;
  label: string;
  /** Önceden renklendirilmiş ikon elementi (ör. <PencilIcon ... />). */
  icon?: React.ReactNode;
  /** Kırmızı/yıkıcı aksiyon stili (ör. silme). */
  destructive?: boolean;
  onPress: () => void;
}

interface AnchoredPopoverMenuProps {
  visible: boolean;
  onClose: () => void;
  /** Modal koordinat sistemine göre menünün sol-üst konumu. */
  position: { top: number; left: number };
  items: AnchoredPopoverMenuItem[];
  width?: number;
}

/**
 * Bir tetikleyicinin (ör. header 3-nokta) yanında açılan, sayfaya sabitlenmiş
 * (anchored) popover menü. Backdrop'a dokununca kapanır.
 *
 * Konum hesaplaması için {@link computeAnchoredMenuPosition} yardımcı fonksiyonu
 * dokunma event'inden uygun top/left üretir.
 */
export const AnchoredPopoverMenu: React.FC<AnchoredPopoverMenuProps> = ({
  visible,
  onClose,
  position,
  items,
  width = 220,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <RNPressable
        style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
        onPress={onClose}
      />
      <View
        style={[
          styles.menuContainer,
          {
            top: position.top,
            left: position.left,
            width,
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            borderWidth: 1,
            borderColor: isDark ? '#333333' : '#E9E9E9',
            shadowOpacity: isDark ? 0.3 : 0.12,
          },
        ]}
      >
        <RNPressable onPress={(e) => e.stopPropagation()} style={{ flex: 1 }}>
          <VStack px={4} py={4} width="100%">
            {items.map((item, index) => (
              <React.Fragment key={item.key}>
                {index > 0 && (
                  <Divider bg={isDark ? '#333333' : '#E9E9E9'} mx={0} />
                )}
                <Pressable
                  onPress={() => {
                    onClose();
                    item.onPress();
                  }}
                  px={12}
                  py={14}
                >
                  <HStack alignItems="center" space="md">
                    {item.icon}
                    <Text
                      color={item.destructive ? '#FF3040' : isDark ? '#FFFFFF' : '#000000'}
                      fontSize="$md"
                      fontWeight="$medium"
                    >
                      {item.label}
                    </Text>
                  </HStack>
                </Pressable>
              </React.Fragment>
            ))}
          </VStack>
        </RNPressable>
      </View>
    </Modal>
  );
};

/**
 * Dokunma event'inden (ör. header 3-nokta onPress) menü için top/left hesaplar.
 * Menü, tetikleyicinin sağ kenarına hizalı ve hemen altında açılır; ekran
 * sınırlarına göre kırpılır.
 */
export const computeAnchoredMenuPosition = (
  event: GestureResponderEvent | undefined,
  menuWidth: number,
  menuHeight: number
): { top: number; left: number } => {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const pageX = event?.nativeEvent?.pageX ?? screenWidth - 24;
  const pageY = event?.nativeEvent?.pageY ?? 56;

  // Dokunulan noktayı tetikleyicinin merkezi varsay; menüyü sağ üst köşeden hizala
  let left = pageX - menuWidth + 12;
  let top = pageY + 18;

  if (left < 12) left = 12;
  if (left + menuWidth > screenWidth - 12) left = screenWidth - menuWidth - 12;
  if (top + menuHeight > screenHeight - 12) {
    top = pageY - menuHeight - 18;
    if (top < 12) top = 12;
  }

  return { top, left };
};

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
});

export default AnchoredPopoverMenu;
