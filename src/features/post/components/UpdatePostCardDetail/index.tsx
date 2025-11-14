import React, { useState } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';
import CardImageCarousel from '@/src/components/CardImageCarousel';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { UpdatePost } from '@/src/mock/feed/types';

interface UpdatePostCardDetailProps {
  data: UpdatePost;
  showRelatedPost?: boolean;
  relatedPostData?: any;
}

export const UpdatePostCardDetail = ({ data, showRelatedPost, relatedPostData }: UpdatePostCardDetailProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isTranslated, setIsTranslated] = useState(false);

  return (
    <VStack
      bg={isDark ? '$backgroundDark900' : '$white'}
      mb={16}
    >
      {/* Header */}
      <VStack 
        px={12} 
        py={8} 
        borderWidth={1} 
        borderTopRightRadius={config.tokens.radii['postcard'] as number} 
        borderTopLeftRadius={config.tokens.radii['postcard'] as number} 
        borderColor="#E9E9E9"
      >
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
              color={isDark ? '$textDark50' : '#000'}
              fontSize="$xs"
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
          <Pressable>
            <Feather name="more-horizontal" size={16} color={isDark ? '#fff' : '#A3A3A3'} />
          </Pressable>
        </HStack>
      </VStack>

      {/* Badges */}
      <HStack px='$3' py={10} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9" justifyContent="space-between" alignItems="center">
        <Box
          borderWidth={1}
          borderColor="#9672FA"
          bgColor="#571FDD"
          borderRadius={20}
          flexDirection="row"
          justifyContent="center"
          px='$3'
          py='$2'
        >
          <Feather name="info" size={12} color={'#fff'} />
          <Text
            fontSize={config.tokens.fontSizes['3xs'] as number}
            fontWeight="$bold"
            ml={5}
            color={'#fff'}
          >
            Update
          </Text>
        </Box>
      </HStack>

      {/* Content */}
      <VStack px={12} pb={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
        <Text
          color={isDark ? '$textDark50' : '#000'}
          fontSize={config.tokens.fontSizes['2xs'] as number}
          lineHeight={14}
        >
          {data.content}
        </Text>
      </VStack>

      {/* Translate Button */}
      <Box pb="$3" px="$3" borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
        <Pressable onPress={() => setIsTranslated(!isTranslated)}>
          <HStack alignItems="center" space="xs">
            <Image
              source={require('@/assets/translate.png')}
              alt="translate"
              width={16}
              height={16}
            />
            <Text
              color="#829905"
              fontSize={config.tokens.fontSizes['2xs'] as number}
              textDecorationLine="underline"
            >
              {isTranslated ? 'Automatically translated from English.' : 'Translate'}
            </Text>
          </HStack>
        </Pressable>
      </Box>

      {/* Images */}
      {data.images && data.images.length > 0 && (
        <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <CardImageCarousel images={data.images} paddingHorizontal={12} />
        </VStack>
      )}

      {/* Related Post Section */}
      {(data.relatedPost || relatedPostData) && (
        <>
          {/* Related Post Title */}
          <VStack px={12} pt={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
            <Text
              color={isDark ? '$textDark50' : '#A3A3A3'}
              fontSize={10}
              fontWeight="$bold"
              textDecorationLine="underline"
            >
              Related Post
            </Text>
          </VStack>

          {/* Product Info Card */}
          {(relatedPostData?.product || data.product) && (
            <VStack px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
                <ProductInfoCard
                  image={(relatedPostData?.product || data.product)?.image}
                  title={(relatedPostData?.product || data.product)?.name || ''}
                  subName={(relatedPostData?.product || data.product)?.subName}
                  size="big"
                  type={ProductInfoType.PRODUCT}
                  isOwned={true}
                />
            </VStack>
          )}

          {/* Price and Shopping Experience Card */}
          {((relatedPostData?.content && relatedPostData.content.length > 0) || (data.relatedPost?.content && data.relatedPost.content.length > 0)) && (
              <Box
                bg="##FAFAFA"
                borderRadius={10}
                overflow="hidden"
              >
                {/* Card Header */}
                <VStack px={16} py={8} space="xs">
                  <HStack alignItems="center" space="xs">
                    <Feather name="tag" size={18} color={isDark ? '#FFFFFF' : '#000000'} />
                    <Text
                      fontSize={11}
                      fontWeight="$semibold"
                      color={isDark ? '$textDark50' : '#3B3B3B'}
                    >
                      Price and Shopping Experience
                    </Text>
                  </HStack>
                  <Text
                    color={isDark ? '$textDark50' : '#000000'}
                    fontSize={10}
                    lineHeight={14}
                  >
                    {(relatedPostData?.content || data.relatedPost?.content || []).find((item: any) => item.tag.icon === 'tag')?.text || ''}
                  </Text>
                </VStack>

                {/* Rating Section */}
                <Box px={16} pb={12}>
                  <VStack space="xs">
                    <Text
                      fontSize={11}
                      fontWeight="$semibold"
                      color={isDark ? '$textDark50' : '#3B3B3B'}
                    >
                      Rate Experience
                    </Text>
                    <HStack space="xs">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const content = relatedPostData?.content || data.relatedPost?.content || [];
                        const priceItem = content.find((item: any) => item.tag.icon === 'tag');
                        const rating = priceItem?.rating || [];
                        const isFilled = star <= rating.filter((r: number) => r === 1).length;
                        return (
                          <Feather
                            key={star}
                            name="star"
                            size={24}
                            color={isFilled ? '#829905' : '#E9E9E9'}
                            fill={isFilled ? '#829905' : 'transparent'}
                          />
                        );
                      })}
                    </HStack>
                  </VStack>
                </Box>
              </Box>
          )}

          {/* Product and Usage Experience Card */}
          {((relatedPostData?.content && relatedPostData.content.length > 0) || (data.relatedPost?.content && data.relatedPost.content.length > 0)) && (
              <Box
                bg="##FAFAFA"
                borderRadius={10}
                overflow="hidden"
              >
                {/* Card Header */}
                <VStack px={16} py={8} space="xs">
                  <HStack alignItems="center" space="xs">
                    <Feather name="package" size={18} color={isDark ? '#FFFFFF' : '#000000'} />
                    <Text
                      fontSize={11}
                      fontWeight="$semibold"
                      color={isDark ? '$textDark50' : '#3B3B3B'}
                    >
                      Product and Usage Experience
                    </Text>
                  </HStack>
                  <Text
                    color={isDark ? '$textDark50' : '#000000'}
                    fontSize={10}
                    lineHeight={14}
                  >
                    {(relatedPostData?.content || data.relatedPost?.content || []).find((item: any) => item.tag.icon === 'package')?.text || ''}
                  </Text>
                </VStack>

                {/* Rating Section */}
                <Box px={16} pb={12}>
                  <VStack space="xs">
                    <Text
                      fontSize={11}
                      fontWeight="$semibold"
                      color={isDark ? '$textDark50' : '#3B3B3B'}
                    >
                      Rate Experience
                    </Text>
                    <HStack space="xs">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const content = relatedPostData?.content || data.relatedPost?.content || [];
                        const productItem = content.find((item: any) => item.tag.icon === 'package');
                        const rating = productItem?.rating || [];
                        const isFilled = star <= rating.filter((r: number) => r === 1).length;
                        return (
                          <Feather
                            key={star}
                            name="star"
                            size={24}
                            color={isFilled ? '#829905' : '#E9E9E9'}
                            fill={isFilled ? '#829905' : 'transparent'}
                          />
                        );
                      })}
                    </HStack>
                  </VStack>
                </Box>
              </Box>
          )}

          {/* Tags Section */}
          {((relatedPostData?.tags && relatedPostData.tags.length > 0) || (data.relatedPost?.tags && data.relatedPost.tags.length > 0)) && (
              <HStack px={16} py={10} flexWrap="wrap" gap={4}>
                {(relatedPostData?.tags || data.relatedPost?.tags || []).map((tag: string, index: number) => (
                  <Box
                    key={index}
                    bg={isDark ? '$backgroundDark800' : '#FFFFFF'}
                    borderWidth={1}
                    borderColor="#EFEFEF"
                    $dark-borderColor="$borderDark600"
                    borderRadius={10}
                    px={12}
                    py={3}
                  >
                    <Text
                      fontSize={8}
                      fontWeight="$semibold"
                      color={isDark ? '$textDark50' : '#000000'}
                    >
                      {tag}
                    </Text>
                  </Box>
                ))}
              </HStack>
          )}

          {/* Stats */}
          <HStack
            px={12}
            py={8}
            borderRightWidth={1}
            borderLeftWidth={1}
            borderBottomWidth={1}
            borderBottomRightRadius={config.tokens.radii['postcard'] as number}
            borderBottomLeftRadius={config.tokens.radii['postcard'] as number}
            borderColor="#E9E9E9"
            justifyContent="space-between"
          >
            <HStack>
              <HStack mr={10} alignItems="center">
                <Feather name="heart" size={24} color={isDark ? '#fff' : '#000'} />
                <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">{(relatedPostData?.stats || data.stats)?.likes || 0}</Text>
              </HStack>
              <HStack mr={10} alignItems="center">
                <Feather name="message-circle" size={24} color={isDark ? '#fff' : '#000'} />
                <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">{(relatedPostData?.stats || data.stats)?.comments || 0}</Text>
              </HStack>
              <HStack mr={10} alignItems="center">
                <Feather name="send" size={24} color={isDark ? '#fff' : '#000'} />
                <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">{(relatedPostData?.stats || data.stats)?.shares || 0}</Text>
              </HStack>
              <HStack mr={10} alignItems="center">
                <Feather name="bookmark" size={24} color={isDark ? '#fff' : '#000'} />
                <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">{(relatedPostData?.stats || data.stats)?.bookmarks || 0}</Text>
              </HStack>
            </HStack>
            <Box>
              <Image
                source={require('@/assets/common/Vector.png')}
                alt={'vector'}
                width={24}
                height={24}
              />
            </Box>
          </HStack>
        </>
      )}
    </VStack>
  );
};

