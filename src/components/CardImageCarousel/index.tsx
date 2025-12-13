import React from 'react';
import { useRef } from 'react';
import { Box, Image, Pressable } from '@gluestack-ui/themed';
import { Dimensions, View } from 'react-native';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import { useSharedValue, useAnimatedStyle, interpolate, SharedValue, interpolateColor } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

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
          source={images[0]}
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
        renderItem={({ index }) => (
          <Image
            source={images[index]}
            alt="Post image"
            resizeMode="cover"
            style={{
              width: carouselWidth - (carouselPadding * 2),
              height: carouselHeight,
              borderRadius: 8,
            }}
          />
        )}
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
};

export default CardImageCarousel;
