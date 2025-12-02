import React, { memo, useState } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';
import CardImageCarousel from '../../CardImageCarousel';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/navigation.types';
import { UpdatePost } from '@/src/mock/feed/types';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';

interface UpdatePostCardProps {
  data: UpdatePost;
  hideProduct?: boolean;
}

const UpdatePostCard = ({ data, hideProduct = false }: UpdatePostCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showRelatedPost, setShowRelatedPost] = useState(false);
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
          {toImageSource(data.user.avatar) && (
            <Image
              source={toImageSource(data.user.avatar)!}
              alt={data.user.name}
              mr={8}
              width={42}
              height={42}
              borderRadius={100}
            />
          )}
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

      {/* Product */}
      {!hideProduct && data.product && (
        <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <ProductInfoCard
            size="small"
            type={ProductInfoType.PRODUCT}
            image={toImageSource(data.product.image)}
            title={data.product.name}
            subName={data.product.subName}
            onPress={() => {
              navigation.navigate('Post', {
                screen: 'PostDetailScreen',
                params: { postData: data, type: 'update' }
              });
            }}
          />
        </Box>
      )}

      {/* Badges */}
      <HStack px={12} pb={8} pt={hideProduct ? 10 : 2} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9" justifyContent="space-between" alignItems="center">
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
        <Pressable onPress={() => {
          // Create relatedPostData if relatedPost exists
          const relatedPostData = data.relatedPost ? {
            ...data,
            content: data.relatedPost.content,
            tags: data.relatedPost.tags || [],
            images: data.relatedPost.images || [],
          } : undefined;

          navigation.navigate('Post', {
            screen: 'PostDetailScreen',
            params: { 
              postData: data, 
              type: 'update',
              relatedPostData: relatedPostData,
            }
          });
        }}>
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize={config.tokens.fontSizes['2xs'] as number}
            numberOfLines={data.images && data.images.length > 0 ? 3 : 6}
          >
            {data.content}
          </Text>
        </Pressable>

        {/* Translate Button */}
        <Box mt={10}>
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

        {/* See Related Post / Hide Related Post Button */}
        {data.relatedPost && (
          <Pressable 
            onPress={() => {
              // Navigate to PostDetailScreen with showRelatedPost flag
              if (data.relatedPost) {
                // Create a post data object compatible with ExperiencePostCardDetail
                const relatedPostData = {
                  ...data,
                  content: data.relatedPost.content,
                  tags: data.relatedPost.tags || [],
                  images: data.relatedPost.images || [],
                };
                
                navigation.navigate('Post', {
                  screen: 'PostDetailScreen',
                  params: { 
                    postData: data, // Original update post data
                    relatedPostData: relatedPostData, // Related post data
                    type: 'update',
                    showRelatedPost: true
                  }
                });
              }
            }} 
            mt={10}
          >
            <Text
              color={isDark ? '$textDark50' : '#A3A3A3'}
              fontSize={config.tokens.fontSizes['2xs'] as number}
              textDecorationLine="underline"
              fontWeight="$bold"
            >
              See Related Post {'>'}
            </Text>
          </Pressable>
        )}
      </VStack>

      {/* Images */}
      {data.images && data.images.length > 0 && (
        <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <CardImageCarousel images={data.images.map(img => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)} />
        </VStack>
      )}

      {/* Related Post Details - Shown when See Related Post is clicked */}
      {showRelatedPost && data.relatedPost && (
        <>
          {/* Related Post Content */}
          <VStack px={12} pb={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
            {data.relatedPost.content.map((item, index) => (
              <VStack key={index} py={8}>
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
                  numberOfLines={data.relatedPost?.images && data.relatedPost.images.length > 0 ? 3 : 6}
                  fontSize={'$2xs'}
                  ml={26}
                >
                  {item.text}
                </Text>
                <HStack ml={26} mt={8}>
                  {item.rating.map((star, idx) => (
                    <Feather
                      key={idx}
                      name="star"
                      size={12}
                      color={star ? (isDark ? '#fff' : '#829905') : (isDark ? '#7E7E7E' : '#E8E8E8')}
                      fill={star ? (isDark ? '#fff' : '#829905') : 'transparent'}
                    />
                  ))}
                </HStack>
              </VStack>
            ))}
          </VStack>

          {/* Related Post Tags */}
          {data.relatedPost.tags && data.relatedPost.tags.length > 0 && (
            <HStack px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9" flexWrap="wrap">
              {data.relatedPost.tags.map((tag, index) => (
                <HStack
                  key={index}
                  bg={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'}
                  borderWidth={1}
                  borderColor={'#E9E9E9'}
                  rounded={'$full'}
                  px={16}
                  py={6}
                  mr={4}
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
          )}

          {/* Related Post Images */}
          {data.relatedPost.images && data.relatedPost.images.length > 0 && (
            <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <CardImageCarousel images={data.relatedPost.images.map(img => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)} />
            </VStack>
          )}
        </>
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
            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">{data.stats.likes}</Text>
          </HStack>
          <HStack mr={10} alignItems="center">
            <Feather name="message-circle" size={24} color={isDark ? '#fff' : '#000'} />
            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">{data.stats.comments}</Text>
          </HStack>
          <HStack mr={10} alignItems="center">
            <Feather name="send" size={24} color={isDark ? '#fff' : '#000'} />
            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">{data.stats.shares}</Text>
          </HStack>
          <HStack mr={10} alignItems="center">
            <Feather name="bookmark" size={24} color={isDark ? '#fff' : '#000'} />
            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">{data.stats.bookmarks}</Text>
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
    </VStack>
  );
};

export default memo(UpdatePostCard);

