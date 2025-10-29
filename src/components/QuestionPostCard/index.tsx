import React from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { QuestionPost } from '@/src/mock/profile/questions/types';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';
import CardImageCarousel from '../CardImageCarousel';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/navigation.types';

interface QuestionPostCardProps {
  data: QuestionPost;
  hideProduct?: boolean;
}

export const QuestionPostCard = ({ data, hideProduct = false }: QuestionPostCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <VStack
      bg={isDark ? '$backgroundDark900' : '$white'}
      mb={16}
    >
      {/* Header */}
      <VStack px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderTopWidth={1} borderTopRightRadius={config.tokens.radii['postcard'] as number} borderTopLeftRadius={config.tokens.radii['postcard'] as number} borderColor="#E9E9E9">
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

      {/* Product */}
      {
        !hideProduct && data.category && data.category.product ? (
          <Pressable onPress={() => {
            navigation.navigate('Post', {
              screen: 'PostDetailScreen',
              params: { postData: data, type: 'question' }
            });
          }}>
            <HStack px={12} py={8} borderTopWidth={1} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9" alignItems="center">
            <Image
              width={42}
              height={42}
              mr={8}
              source={data.category.product.image}
              alt={data.category.product.name}
              borderRadius={5}
            />
            <VStack flex={1}>
              <Text
                color={isDark ? '$textDark50' : '#000'}
                fontSize="$xs"
                numberOfLines={2}
              >
                {data.category.product.name}
              </Text>
              <Text
                color={isDark ? '$textDark50' : '#000'}
                fontSize="$xs"
              >
                {data.category.product.subName}
              </Text>
            </VStack>
            <Image
              source={require('@/assets/common/percentage_01.png')}
              alt={'percantage'}
              width={30}
              height={30}
            />
          </HStack>
          </Pressable>
        ) : !hideProduct && data.category ? (
          <Pressable onPress={() => { console.log('Category sayfasına yönlendir'); }}>
            <HStack px={12} py={8} borderTopWidth={1} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9" alignItems="center">
              <Image
                width={42}
                height={42}
                mr={8}
                source={data.category.image}
                alt={data.category.name}
                borderRadius={5}
              />
              <VStack flex={1}>
                <Text
                  color={isDark ? '#A3A3A3' : '#A3A3A3'}
                  fontSize="$xs"
                  numberOfLines={1}
                  fontWeight="$bold"
                >
                  {data.category.name}
                </Text>
                <Text
                  color={isDark ? '#A3A3A3' : '#A3A3A3'}
                  fontSize="$xs"
                  numberOfLines={1}
                >
                  {data.category.subCategory}
                </Text>
              </VStack>
              <Feather name="chevron-right" size={24} color={isDark ? '#fff' : '#A3A3A3'} />
            </HStack>
          </Pressable>
        ) : null
      }

      {/* Badges */}
      <HStack px={12} pb={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
        <Box
          bg={isDark ? '$backgroundDark900' : '$white'}
          borderWidth={2}
          borderColor="#CFE556"
          bgColor='#829905'
          borderRadius={20}
          width={90}
          px={10}
          py={6}
          mr={16}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-evenly"
        >
          <Feather name="help-circle" size={12} color={'#fff'} />
          <Text
            fontSize={config.tokens.fontSizes['4xs'] as number}
            fontWeight="$semibold"
            ml={5}
            color={'#fff'}
          >
            Question
          </Text>
        </Box>

        {data.isBoosted && (
          <Box
            bgColor="#99055E"
            borderWidth={2}
            borderColor="#E059AA"
            borderRadius={20}
            width={90}
            px={10}
            py={6}
            flexDirection="row"
            alignItems="center"
            justifyContent="space-evenly"
          >
            <Feather name="send" size={12} color="#fff" />
            <Text
              fontSize={config.tokens.fontSizes['4xs'] as number}
              fontWeight="$semibold"
              ml={5}
              color="#fff"
            >
              Boosted
            </Text>
          </Box>
        )}
      </HStack>

      {/* Content */}
      <Pressable onPress={() => {
        navigation.navigate('Post', {
          screen: 'PostDetailScreen',
          params: { postData: data, type: 'question' }
        });
      }}>
        <VStack px={12} pb={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize={config.tokens.fontSizes['2xs'] as number}
            numberOfLines={data.images && data.images.length > 0 ? 3 : 6}
          >
            {data.content}
          </Text>
        </VStack>
      </Pressable>

      {/* Images */}
      {data.images && data.images?.length > 0 && (
        <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <CardImageCarousel images={data.images} />
        </VStack>
      )}

      {/* Stats */}
      <HStack
        px={12}
        py={10}
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

export default QuestionPostCard;
