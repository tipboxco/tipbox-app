import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { View, Modal, Dimensions, StyleSheet, InteractionManager, Pressable as RNPressable } from 'react-native';
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
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { toImageSource, formatRelativeTime } from '@/src/utils';
import { UpdatePost } from '@/src/mock/feed/types';
import {
  useLikePost,
  useUnlikePost,
  useBookmarkPost,
  useUnbookmarkPost,
  useSharePost,
  usePostStatus,
} from '@/src/features/interactions/api/hooks';
import { usePostTranslation } from '@/src/hooks/usePostTranslation';
import { PostOptionsMenu } from '@/src/components/PostOptionsMenu';
import { useTranslation } from '@/src/hooks/useTranslation';

interface UpdatePostCardDetailProps {
  data: UpdatePost;
  showRelatedPost?: boolean;
  relatedPostData?: any;
  onCommentPress?: () => void;
  disableBottomSheet?: boolean;
}

export const UpdatePostCardDetail = ({ data, showRelatedPost, relatedPostData, onCommentPress, disableBottomSheet = false }: UpdatePostCardDetailProps) => {
  const { t, i18n } = useTranslation('post');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Translation hooks
  const {
    translatedContent,
    isTranslating,
    showTranslation,
    toggleTranslation,
    shouldTranslate,
  } = usePostTranslation({
    postId: data.id,
    originalContent: data.content,
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

  // Menu modal state (diğer post tipleri gibi RN Modal)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuTriggerRef = useRef<View>(null);
  const triggerPositionRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleTriggerLayout = useCallback(() => {
    if (menuTriggerRef.current) {
      menuTriggerRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          triggerPositionRef.current = { x, y, width, height };
        }
      });
    }
  }, []);

  const handleMenuOpen = useCallback((event?: any) => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const menuWidth = 260;
    const menuHeight = 200;

    const calculatePosition = (x: number, y: number, width: number, height: number) => {
      let left = x + width - menuWidth - 8;
      let top = y + height + 4;
      if (left < 12) left = 12;
      if (left + menuWidth > screenWidth - 12) left = screenWidth - menuWidth - 12;
      if (top + menuHeight > screenHeight - 12) top = y - menuHeight - 8;
      if (top < 12) top = 12;
      return { top, left };
    };

    if (event?.nativeEvent?.pageX !== undefined && event?.nativeEvent?.pageY !== undefined) {
      const pageX = event.nativeEvent.pageX;
      const pageY = event.nativeEvent.pageY;
      const triggerWidth = 44;
      const triggerHeight = 44;
      const pos = calculatePosition(pageX - triggerWidth / 2, pageY - triggerHeight / 2, triggerWidth, triggerHeight);
      setMenuPosition(pos);
      setIsMenuOpen(true);
      return;
    }
    if (triggerPositionRef.current) {
      const { x, y, width, height } = triggerPositionRef.current;
      setMenuPosition(calculatePosition(x, y, width, height));
      setIsMenuOpen(true);
      return;
    }
    InteractionManager.runAfterInteractions(() => {
      if (menuTriggerRef.current) {
        menuTriggerRef.current.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            triggerPositionRef.current = { x, y, width, height };
            setMenuPosition(calculatePosition(x, y, width, height));
            setIsMenuOpen(true);
          } else {
            setMenuPosition({ top: 56, left: screenWidth - 272 });
            setIsMenuOpen(true);
          }
        });
      } else {
        setMenuPosition({ top: 56, left: screenWidth - 272 });
        setIsMenuOpen(true);
      }
    });
  }, []);

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

  const contextType = (data as any).contextType || (data.relatedPost?.product ? 'product' : undefined);
  const contextId = (data as any).contextId || data.relatedPost?.product?.id || data.product?.id;

  // Transform relatedPost to ExperiencePostCardData for consistent rendering
  const transformedRelatedPost = React.useMemo(() => {
    const rp = data.relatedPost || relatedPostData;
    if (!rp) return null;

    return {
      id: rp.id || '',
      user: data.user,
      contextData: rp.product || { id: '', name: '', subName: '', image: '', isOwned: false },
      contextType: (contextType as any) || ProductInfoType.PRODUCT,
      content: (rp.content && Array.isArray(rp.content)) ? rp.content : [],
      tags: (rp.tags && Array.isArray(rp.tags)) ? rp.tags : [],
      images: (rp.images && Array.isArray(rp.images)) ? rp.images : [],
      stats: rp.stats || { likes: 0, comments: 0, shares: 0, bookmarks: 0 },
      createdAt: new Date().toISOString(),
    };
  }, [data.relatedPost, relatedPostData, data.user, contextType]);

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
            alt={t('altTexts.userPostImage')}
            mr={8}
            width={42}
            height={42}
            borderRadius={100}
          />
          <VStack flex={1}>
            <HStack alignItems="center">
              <Text
                color={isDark ? '$textDark50' : '#000'}
                fontSize="$sm"
                fontWeight="$bold"
              >
                {data.user.name}
              </Text>
              {(data as any).createdAt ? (
                <Text
                  color={isDark ? '$textDark400' : '#A3A3A3'}
                  fontSize={11}
                >
                  {`  •  ${formatRelativeTime((data as any).createdAt, i18n.language)}`}
                </Text>
              ) : null}
            </HStack>
            {data.user.title ? (
              <Text
                color={isDark ? '$textDark400' : '#787878'}
                fontSize="$xs"
                numberOfLines={1}
                maxWidth={250}
              >
                {data.user.title}
              </Text>
            ) : null}
          </VStack>
          <View ref={menuTriggerRef} collapsable={false} onLayout={handleTriggerLayout}>
            <Pressable onPress={(e) => handleMenuOpen(e)}>
              <EllipsisHorizontalIcon width={20} height={20} color={isDark ? '#fff' : '#A3A3A3'} />
            </Pressable>
          </View>
        </HStack>
      </VStack>

      {/* Menu Modal - diğer post tipleri gibi RN Modal */}
      <Modal
        visible={isMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <RNPressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.25)' }]} onPress={() => setIsMenuOpen(false)} />
        <View
          style={[
            detailStyles.menuContainer,
            {
              top: menuPosition.top,
              left: menuPosition.left,
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              zIndex: 1,
              elevation: 10,
            },
          ]}
        >
          <RNPressable style={{ flex: 1 }} onPress={(e) => e.stopPropagation()}>
            <PostOptionsMenu
              postId={data.id}
              postContent={data.content}
              postAuthorName={data.user.name}
              postAuthorId={data.user.id}
              postType="update"
              postContextType={contextType}
              postContextId={contextId}
              onClose={() => setIsMenuOpen(false)}
            />
          </RNPressable>
        </View>
      </Modal>

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
            {t('card.badges.update')}
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

      {/* Translate Button */}
      {shouldTranslate && (
        <Box pb="$3" px="$3" borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <Pressable onPress={toggleTranslation}>
            <HStack alignItems="center" space="xs">
              <Image
                source={require('@/assets/translate.png')}
                alt={t('altTexts.productImage')}
                width={16}
                height={16}
              />
              <Text
                color="#829905"
                fontSize="$sm"
                textDecorationLine="underline"
              >
                {isTranslating
                  ? t('card.translate.translating')
                  : showTranslation
                  ? t('card.translate.hideTranslation')
                  : t('card.translate.translate')}
              </Text>
            </HStack>
          </Pressable>
        </Box>
      )}

      {/* Related Post Section - Render using ExperiencePostCard for consistent display */}
      {transformedRelatedPost && (
        <ExperiencePostCard
          data={transformedRelatedPost}
          showHeader={false}
          showActions={false}
          hideProduct={false}
        />
      )}

      {/* Images - Update post'un kendi görselleri (related post'tan bağımsız her zaman göster) */}
      {data.images && data.images.length > 0 && (
        <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <CardImageCarousel images={data.images} isDetailMode={true} />
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
      </HStack>
    </VStack>
  );
};

const detailStyles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    width: 260,
    maxHeight: 320,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9E9E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
});

