import React from 'react';
import { useRef } from 'react';
import { Box, Image } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';
import Carousel, { ICarouselInstance, Pagination } from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';

interface CardImageCarouselProps {
  images: any[];
}

export const CardImageCarousel = ({ images }: CardImageCarouselProps) => {
  const carouselRef = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);

  const onPressPagination = (index: number) => {
    carouselRef.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  if (!images?.length) return null;

  return (
    <Box
      style={{
        width: Dimensions.get('window').width,          
        height: 300,
        borderRadius: 8,
        paddingHorizontal: 28,
        overflow: 'hidden',
        position: 'relative',
        alignSelf: 'center',
      }}
    >
      <Carousel
        ref={carouselRef}
        width={Dimensions.get('window').width}          
        height={300}
        data={images}
        onProgressChange={progress}
        renderItem={({ index }) => (
          <Image
            source={images[index]}
            alt="Post image"
            resizeMode="cover"
            style={{
              width: Dimensions.get('window').width - 56,
              height: 300,
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
