import React, { useRef } from 'react';
import { FlatList, View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CenteredScrollableListProps<T> {
  data: T[];
  itemWidth?: number;
  itemHeight?: number;
  horizontal?: boolean;
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  onItemPress?: (item: T, index: number) => void;
  snapToInterval?: number;
  snapToAlignment?: 'start' | 'center' | 'end';
  decelerationRate?: 'fast' | 'normal';
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  contentContainerStyle?: object;
  style?: object;
}

function CenteredScrollableList<T>({
  data,
  itemWidth = 120,
  itemHeight = 50,
  horizontal = true,
  renderItem,
  keyExtractor,
  onItemPress,
  snapToInterval,
  snapToAlignment = 'center',
  decelerationRate = 'fast',
  showsHorizontalScrollIndicator = false,
  showsVerticalScrollIndicator = false,
  contentContainerStyle,
  style,
}: CenteredScrollableListProps<T>) {
  const flatListRef = useRef<FlatList>(null);

  const centerItem = (index: number) => {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5, // 0: sol/üst, 0.5: merkez, 1: sağ/alt
    });
  };

  const handleItemPress = (item: T, index: number) => {
    centerItem(index);
    onItemPress?.(item, index);
  };

  const getItemLayout = (_data: T[] | null | undefined, index: number) => {
    if (horizontal) {
      return {
        length: itemWidth,
        offset: itemWidth * index,
        index,
      };
    } else {
      return {
        length: itemHeight,
        offset: itemHeight * index,
        index,
      };
    }
  };

  const defaultSnapToInterval = horizontal
    ? itemWidth + 20 // Genişlik + Margin
    : itemHeight + 20; // Yükseklik + Margin

  return (
    <View style={[styles.container, style]}>
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal={horizontal}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        getItemLayout={getItemLayout}
        snapToInterval={snapToInterval ?? defaultSnapToInterval}
        snapToAlignment={snapToAlignment}
        decelerationRate={decelerationRate}
        contentContainerStyle={contentContainerStyle}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => handleItemPress(item, index)}
            activeOpacity={0.7}
          >
            {renderItem(item, index)}
          </TouchableOpacity>
        )}
        onScrollToIndexFailed={(info) => {
          // Eğer scrollToIndex başarısız olursa, offset kullanarak fallback yap
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
});

export default CenteredScrollableList;
