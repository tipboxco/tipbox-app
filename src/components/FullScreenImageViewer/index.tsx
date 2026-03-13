import React from 'react';
import { Modal, StyleSheet, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { XMarkIcon } from 'react-native-heroicons/outline';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FullScreenImageViewerProps {
  visible: boolean;
  imageSource: any;
  onClose: () => void;
}

export const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  visible,
  imageSource,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  if (!imageSource) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Image
          source={imageSource}
          style={styles.image}
          contentFit="contain"
          cachePolicy="memory-disk"
        />

        <Pressable
          onPress={onClose}
          style={[
            styles.closeButton,
            { top: insets.top + 16 },
          ]}
          hitSlop={12}
        >
          <XMarkIcon size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FullScreenImageViewer;
