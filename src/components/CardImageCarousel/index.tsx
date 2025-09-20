import React from 'react';
import { useRef } from 'react';
import { Box, Image, Pressable, Text } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';
import Carousel, { ICarouselInstance, Pagination } from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';

interface CardImageCarouselProps {
  images: any[];
  width?: number;
  height?: number;
  paddingHorizontal?: number;
}

export const CardImageCarousel = ({ images, paddingHorizontal }: CardImageCarouselProps) => {
  const carouselRef = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);

  const carouselPadding = paddingHorizontal ? paddingHorizontal : 28;
  const carouselWidth = Dimensions.get('window').width;
  const carouselHeight = Dimensions.get('window').width - carouselPadding;

  const onPressPagination = (index: number) => {
    carouselRef.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  if (!images?.length) return null;

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

      <Pagination.Basic
        progress={progress}
        data={images}
        onPress={onPressPagination}
        containerStyle={{
          position: 'absolute',
          bottom: 10,
          left: 0,
          right: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
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
