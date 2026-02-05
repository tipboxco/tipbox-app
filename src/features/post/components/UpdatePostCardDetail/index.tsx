import React, { useState, useEffect } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import {
  EllipsisHorizontalIcon,
  InformationCircleIcon,
  TagIcon,
  CubeIcon,
  StarIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
} from 'react-native-heroicons/outline';
import {
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
import { useColorMode } from '@/src/hooks/useColorMode';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import CardImageCarousel from '@/src/components/CardImageCarousel';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';
import { UpdatePost } from '@/src/mock/feed/types';
import {
  useLikePost,
  useUnlikePost,
  useBookmarkPost,
  useUnbookmarkPost,
  useSharePost,
  usePostStatus,
} from '@/src/features/interactions/api/hooks';
import { useDeviceLocale } from '@/src/hooks/useDeviceLocale';
import { usePostTranslation } from '@/src/hooks/usePostTranslation';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { PostOptionsMenu } from '@/src/components/PostOptionsMenu';

interface UpdatePostCardDetailProps {
  data: UpdatePost;
  showRelatedPost?: boolean;
  relatedPostData?: any;
  onCommentPress?: () => void;
  disableBottomSheet?: boolean;
}

export const UpdatePostCardDetail = ({ data, showRelatedPost, relatedPostData, onCommentPress, disableBottomSheet = false }: UpdatePostCardDetailProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  // Translation hooks
  const deviceLocale = useDeviceLocale();
  const {
    translatedContent,
    isTranslating,
    showTranslation,
    toggleTranslation,
    shouldTranslate,
  } = usePostTranslation({
    postId: data.id,
    originalContent: data.content,
    targetLanguage: deviceLocale,
    sourceLanguage: 'en',
  });
  
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isShared, setIsShared] = useState(false);

  // Interaction hooks
  const likePostMutation = useLikePost();
  const unlikePostMutation = useUnlikePost();
  const bookmarkPostMutation = useBookmarkPost();
  const unbookmarkPostMutation = useUnbookmarkPost();
  const sharePostMutation = useSharePost();
  const { data: postStatus } = usePostStatus(data.id);
  const { openBottomSheet } = useGlobalBottomSheet();

  // Sync with post status from API
  useEffect(() => {
    if (postStatus) {
      setIsLiked(postStatus.liked);
      setIsBookmarked(postStatus.favorited);
      setIsShared(postStatus.shared);
    }
  }, [postStatus]);

  // Action handlers
  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      unlikePostMutation.mutate(data.id);
    } else {
      setIsLiked(true);
      likePostMutation.mutate(data.id);
    }
  };

  const handleBookmark = () => {
    if (isBookmarked) {
      setIsBookmarked(false);
      unbookmarkPostMutation.mutate(data.id);
    } else {
      setIsBookmarked(true);
      bookmarkPostMutation.mutate(data.id);
    }
  };

  const handleShare = () => {
    // Zaten paylaşılmışsa tekrar paylaşma
    if (isShared) return;
    
    sharePostMutation.mutate({
      postId: data.id,
      shareType: 'INTERNAL_REPOST',
    });
  };

  const handleOptionsPress = () => {
    // Context bilgilerini relatedPost'tan veya data'dan al
    const contextType = (data as any).contextType || (data.relatedPost?.product ? 'product' : undefined);
    const contextId = (data as any).contextId || data.relatedPost?.product?.id || data.product?.id;
    
    openBottomSheet(
      <PostOptionsMenu
        postId={data.id}
        postContent={data.content}
        postAuthorName={data.user.name}
        postAuthorId={data.user.id}
        postType="update"
        postContextType={contextType}
        postContextId={contextId}
      />
    );
  };

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
        borderTopRightRadius={5} 
        borderTopLeftRadius={5} 
        borderColor="#E9E9E9"
      >
        <HStack alignItems="center" space="xs">
          <Image
            source={toImageSource(data.user.avatar)!}
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
              fontSize="$xs"
              numberOfLines={1}
              maxWidth={250}
            >
              {data.user.title}
            </Text>
          </VStack>
          <Pressable onPress={handleOptionsPress}>
            <EllipsisHorizontalIcon width={20} height={20} color={isDark ? '#fff' : '#A3A3A3'} />
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
          flex={0}
          flexShrink={1}
          minWidth={70}
          px='$3'
          py='$2'
        >
          <InformationCircleIcon width={12} height={12} color="#fff" />
          <Text
            fontSize="$xs"
            fontWeight="$bold"
            ml={5}
            color={'#fff'}
          >
            Update
          </Text>
        </Box>
      </HStack>

      {/* Content */}
      <VStack px={12} pb={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9" space="sm">
        {/* Original Content */}
        <Text
          color={isDark ? '$textDark50' : '#000'}
          fontSize="$sm"
          lineHeight={22}
        >
          {data.content}
        </Text>
        
        {/* Translated Content */}
        {showTranslation && translatedContent && (
          <VStack space="xs" mt="$2">
            <Box height={1} bg={isDark ? '#333' : '#E9E9E9'} />
            <Text
              color={isDark ? '$textDark200' : '#666'}
              fontSize="$sm"
              fontStyle="italic"
            >
              {translatedContent}
            </Text>
          </VStack>
        )}
      </VStack>

      {/* Related Post Section - Experience Post içeriği */}
      {(data.relatedPost || relatedPostData) && (
        <>
          {/* Related Post Title */}
          <VStack px={12} pt={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
            <Text
              color={isDark ? '$textDark50' : '#A3A3A3'}
              fontSize="$sm"
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

          {/* Content Cards - Map ile oluşturuluyor */}
          {((relatedPostData?.content && Array.isArray(relatedPostData.content) && relatedPostData.content.length > 0) || 
            (data.relatedPost?.content && Array.isArray(data.relatedPost.content) && data.relatedPost.content.length > 0)) && (
            <VStack px={16} space="md" borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              {(
                (Array.isArray(relatedPostData?.content) && relatedPostData.content.length > 0) 
                  ? relatedPostData.content 
                  : (Array.isArray(data.relatedPost?.content) ? data.relatedPost.content : [])
              ).map((contentItem: any, index: number) => (
                <Box
                  key={index}
                  bg={isDark ? '$backgroundDark800' : '#FAFAFA'}
                  borderRadius={10}
                  overflow="hidden"
                >
                {/* Card Header - Başlık ve Content aynı hizada */}
                <HStack px={16} py={8} alignItems="flex-start" space="sm">
                  {contentItem.tag.icon === 'tag' ? (
                    <TagIcon width={18} height={18} color={isDark ? '#FFFFFF' : '#000000'} />
                  ) : (
                    <CubeIcon width={18} height={18} color={isDark ? '#FFFFFF' : '#000000'} />
                  )}
                  <VStack flex={1} space="xs">
                    <Text
                      fontSize={11}
                      fontWeight="$semibold"
                      color={isDark ? '$textDark50' : '#3B3B3B'}
                    >
                      {contentItem.tag.title}
                    </Text>
                    <Text
                      color={isDark ? '$textDark50' : '#000000'}
                      fontSize="$sm"
                      lineHeight={22}
                    >
                      {contentItem.text}
                    </Text>
                  </VStack>
                </HStack>

                {/* Rating Section - Başlık ve content ile aynı hizada */}
                <HStack px={16} pb={12} alignItems="flex-start" space="sm">
                  {/* Icon yerine boşluk - hizalama için */}
                  <Box width={18} />
                  <VStack flex={1} space="xs">
                    <Text
                      fontSize={11}
                      fontWeight="$semibold"
                      color={isDark ? '$textDark50' : '#3B3B3B'}
                    >
                      Rate Experience
                    </Text>
                    <HStack space="xs">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const rating = contentItem.rating || [];
                        const isFilled = star <= rating.filter((r: number) => r === 1).length;
                        return isFilled ? (
                          <StarIconSolid
                            key={star}
                            width={24}
                            height={24}
                            color="#829905"
                          />
                        ) : (
                          <StarIcon
                            key={star}
                            width={24}
                            height={24}
                            color="#E9E9E9"
                          />
                        );
                      })}
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
              ))}
            </VStack>
          )}

          {/* Tags Section */}
          {((relatedPostData?.tags && Array.isArray(relatedPostData.tags) && relatedPostData.tags.length > 0) || 
            (data.relatedPost?.tags && Array.isArray(data.relatedPost.tags) && data.relatedPost.tags.length > 0)) && (
              <HStack px={16} py={10} flexWrap="wrap" gap={4} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
                {(
                  (Array.isArray(relatedPostData?.tags) && relatedPostData.tags.length > 0) 
                    ? relatedPostData.tags 
                    : (Array.isArray(data.relatedPost?.tags) ? data.relatedPost.tags : [])
                ).map((tag: string, index: number) => (
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
                      fontSize="$xs"
                      fontWeight="$semibold"
                      color={isDark ? '$textDark50' : '#000000'}
                    >
                      {tag}
                    </Text>
                  </Box>
                ))}
              </HStack>
          )}

          {/* Translate Button - Tags'in altında */}
          {shouldTranslate && (
            <Box pb="$3" px="$3" borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <Pressable onPress={toggleTranslation}>
                <HStack alignItems="center" space="xs">
                  <Image
                    source={require('@/assets/translate.png')}
                    alt="translate"
                    width={16}
                    height={16}
                  />
                  <Text
                    color="#829905"
                    fontSize="$sm"
                    textDecorationLine="underline"
                  >
                    {isTranslating
                      ? 'Çeviriliyor...'
                      : showTranslation
                      ? 'Hide Translation'
                      : 'Translate'}
                  </Text>
                </HStack>
              </Pressable>
            </Box>
          )}
        </>
      )}

      {/* Images - Experience post'tan sonra */}
      {data.images && data.images.length > 0 && (
        <VStack borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <CardImageCarousel images={data.images} paddingHorizontal={0} />
        </VStack>
      )}

      {/* Stats - Actions */}
      <HStack
        px={12}
        py={8}
        borderRightWidth={1}
        borderLeftWidth={1}
        borderBottomWidth={1}
        borderBottomRightRadius={5}
        borderBottomLeftRadius={5}
        borderColor="#E9E9E9"
        justifyContent="space-between"
      >
        <HStack>
          <Pressable onPress={handleLike}>
            <HStack mr={10} alignItems="center">
              {isLiked ? (
                <HeartIconSolid width={24} height={24} color="#FF3040" />
              ) : (
                <HeartIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
              )}
              <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
                {(relatedPostData?.stats || data.stats)?.likes || 0}
              </Text>
            </HStack>
          </Pressable>
          <Pressable 
            onPress={onCommentPress || undefined}
            disabled={!onCommentPress}
            opacity={onCommentPress ? 1 : 0.5}
          >
            <HStack mr={10} alignItems="center">
              <ChatBubbleLeftIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
              <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
                {(relatedPostData?.stats || data.stats)?.comments || 0}
              </Text>
            </HStack>
          </Pressable>
          <Pressable onPress={handleShare}>
            <HStack mr={10} alignItems="center">
              <PaperAirplaneIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
              <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
                {(relatedPostData?.stats || data.stats)?.shares || 0}
              </Text>
            </HStack>
          </Pressable>
          <Pressable onPress={handleBookmark}>
            <HStack mr={10} alignItems="center">
              {isBookmarked ? (
                <BookmarkIconSolid width={24} height={24} color="#829905" />
              ) : (
                <BookmarkIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
              )}
              <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
                {(relatedPostData?.stats || data.stats)?.bookmarks || 0}
              </Text>
            </HStack>
          </Pressable>
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

