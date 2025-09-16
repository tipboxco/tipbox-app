import React, { useRef } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { PostCard as PostCardType } from '@/src/mock/profile/feed/types';
import { useSharedValue } from 'react-native-reanimated';
import Carousel, { ICarouselInstance, Pagination } from 'react-native-reanimated-carousel';
import { Dimensions } from 'react-native';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';


interface PostCardProps {
  data: PostCardType;
}

export const ExperiencePostCard = ({ data }: PostCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const carouselRef = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);

  const onPressPagination = (index: number) => {
    carouselRef.current?.scrollTo({
      /**
       * Calculate the difference between the current index and the target index
       * to ensure that the carousel scrolls to the nearest index
       */
      count: index - progress.value,
      animated: true,
    });
  };

  return (
    <VStack
      bg={isDark ? '$backgroundDark900' : '$white'}
      mb={16}
    >
      {/* Action Button */}
      <Pressable
        position="absolute"
        top={12}
        right={15}
        zIndex={1}
      >
        <Feather name="more-horizontal" size={16} color={isDark ? '#fff' : '#A3A3A3'} />
      </Pressable>

      {/* Header */}
      <VStack px={16} py={8} borderRightWidth={1} borderLeftWidth={1} borderTopWidth={1} borderTopRightRadius={config.tokens.radii['postcard'] as number} borderTopLeftRadius={config.tokens.radii['postcard'] as number} borderColor="#E9E9E9">
        <HStack alignItems="center" space="xs">
          <Image
            source={data.user.avatar}
            alt={data.user.name}
            mr={8}
            width={42}
            height={42}
            borderRadius={100}
          />
          <VStack flex={1}>
            <Text
              color={isDark ? '$textDark400' : '#C7C7C7'}
              fontSize={config.tokens.fontSizes['4xs'] as number}
              fontWeight="$semibold"
            >
              {data.user.action}
            </Text>
            <Text
              color={isDark ? '$textDark50' : '#000'}
              fontSize='$xs'
              fontWeight="$bold"
            >
              {data.user.name}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '#787878'}
              fontSize={config.tokens.fontSizes['3xs'] as number}
              numberOfLines={1}
              maxWidth={250}
            >
              {data.user.title}
            </Text>
          </VStack>
        </HStack>
      </VStack>

      {/* Product */}
      <HStack px={16} py={8} borderTopWidth={1} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9" alignItems="center">
        <Image
          width={42}
          height={42}
          mr={8}
          source={data.product.image}
          alt={data.product.name}
          borderRadius={5}
        />
        <VStack flex={1}>
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize={'$xs'}
            numberOfLines={2}
          >
            {data.product.name}
          </Text>
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize={'$xs'}
          >
            {data.product.subName}
          </Text>
        </VStack>
        <Feather name="clock" size={20} color={isDark ? '#fff' : '#A3A3A3'} />
      </HStack>

      {/* Content */}
      <VStack px={16} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
        {data.content.map((item, index) => (
          <VStack key={index} space="xs">
            <HStack space="sm" alignItems="center">
              <Feather name={item.tag.icon === 'tag' ? 'tag' : 'package'} size={18} color={isDark ? '#fff' : '#000'} fill={isDark ? '#fff' : '#000'} />
              <Text
                color={isDark ? '$textDark50' : '#000'}
                fontSize={'$xs'}
                fontWeight="$bold"
              >
                {item.tag.title}
              </Text>
            </HStack>
            <Text
              color={isDark ? '$textDark50' : '#000'}
              fontSize={'$2xs'}
              ml={26}
            >
              {item.text}
            </Text>
            <HStack ml={26}>
              {item.rating.map((star, idx) => (
                <Feather
                  key={idx}
                  name={star ? 'star' : 'star'}
                  size={12}
                  color={star ? (isDark ? '#fff' : '#829905') : (isDark ? '#7E7E7E' : '#E8E8E8')}
                  fill={star ? (isDark ? '#fff' : '#829905') : 'transparent'}
                />
              ))}
            </HStack>
          </VStack>
        ))}
      </VStack>

      {/* Tags */}
      <HStack px={15} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9" flexWrap="wrap">
        {data.tags.map((tag, index) => (
          <HStack
            key={index}
            bg={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'}
            borderWidth={1}
            borderColor={'#E9E9E9'}
            rounded={'$full'}
            px={16}
            py={6}
          >
            <Text
              color={isDark ? '$textDark50' : '#000'}
              fontSize={config.tokens.fontSizes['4xs'] as number}
              fontWeight="$semibold"
            >
              {tag}
            </Text>
          </HStack>
        ))}
      </HStack>

      {data.images?.length > 0 && (
        <VStack px={16} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <Box
            style={{
              width: Dimensions.get('window').width,          
              height: 300,
              borderRadius: 8,
              paddingHorizontal: 16,
              overflow: 'hidden',
              position: 'relative',
              alignSelf: 'center',
            }}
          >
            <Carousel
              ref={carouselRef}
              width={Dimensions.get('window').width}          
              height={300}
              data={data.images}
              onProgressChange={progress}
              renderItem={({ index }) => (
                <Image
                  source={data.images[index]}
                  alt="Post image"
                  resizeMode="cover"
                  style={{
                    width: Dimensions.get('window').width - 32,
                    height: 300,
                    borderRadius: 8,
                  }}
                />
              )}
            />

            <Pagination.Basic
              progress={progress}
              data={data.images}
              onPress={onPressPagination}
              containerStyle={{
                position: 'absolute',
                bottom: 10,
                left: 0,
                right: 0,
                alignItems: 'center',
                justifyContent: 'center',
                // istersen hafif arka plan:
                // paddingHorizontal: 8, paddingVertical: 4,
                // backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 999,
              }}
              dotStyle={{
                width: 8,
                height: 8,
                borderRadius: 50,
                backgroundColor: 'rgba(255,255,255,0.9)',
                marginHorizontal: 4,      // <= nokta aralığı
              }}
            // activeDotStyle={{ backgroundColor: '#fff' }} // opsiyonel
            />
          </Box>
        </VStack>
      )}
      {/* Stats */}
      <HStack px={16} py={8} borderRightWidth={1} borderLeftWidth={1} borderBottomWidth={1} borderBottomRightRadius={config.tokens.radii['postcard'] as number} borderBottomLeftRadius={config.tokens.radii['postcard'] as number} borderColor="#E9E9E9"
      >
        <HStack mr={10} alignItems="center">
          <Feather name="heart" size={24} color={isDark ? '#fff' : '#000'} />
          <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>{data.stats.likes}</Text>
        </HStack>
        <HStack mr={10} alignItems="center">
          <Feather name="message-circle" size={24} color={isDark ? '#fff' : '#000'} />
          <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>{data.stats.comments}</Text>
        </HStack>
        <HStack mr={10} alignItems="center">
          <Feather name="send" size={24} color={isDark ? '#fff' : '#000'} />
          <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>{data.stats.shares}</Text>
        </HStack>
        <HStack mr={10} alignItems="center">
          <Feather name="bookmark" size={24} color={isDark ? '#fff' : '#000'} />
          <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>{data.stats.bookmarks}</Text>
        </HStack>
      </HStack>
    </VStack>
  );
};

export default ExperiencePostCard;