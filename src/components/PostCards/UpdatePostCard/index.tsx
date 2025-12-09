import React, { memo, useState } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';
import CardImageCarousel from '../../CardImageCarousel';
import { useNavigation } from '@react-navigation/native';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import type { UpdateCardData } from '@/src/types/UpdateCard';
import { toImageSource } from '@/src/utils';

interface UpdatePostCardProps {
  data: UpdateCardData;
  hideProduct?: boolean;
}

const UpdatePostCard = ({ data, hideProduct = false }: UpdatePostCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<any>();
  const [isTranslated, setIsTranslated] = useState(false);

  // Product'ı relatedPost.product'tan al
  const product = data.relatedPost.product;
  
  // ContextType'a göre ProductInfoType belirle
  const productInfoType = data.contextType || ProductInfoType.PRODUCT;

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
      {!hideProduct && product && (
        <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <ProductInfoCard
            size="small"
            type={productInfoType}
            image={toImageSource(product.image)}
            title={product.name}
            subName={product.subName}
            isOwned={product.isOwned}
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
          // Navigate to PostDetailScreen
          navigation.navigate('Post', {
            screen: 'PostDetailScreen',
            params: { 
              postData: data, 
              type: 'update',
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

        {/* See Related Post Button - Detay sayfasına yönlendirir */}
        {data.relatedPost && (
          <Pressable 
            onPress={() => {
              // Detay sayfasına yönlendir (related post detay sayfasında açılacak)
              navigation.navigate('Post', {
                screen: 'PostDetailScreen',
                params: { 
                  postData: data, 
                  type: 'update',
                }
              });
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

      {/* Related Post Details - Sadece detay sayfasında gösterilecek, burada render edilmiyor */}

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

