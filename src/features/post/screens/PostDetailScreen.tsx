import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Keyboard, Platform, TextInput, FlatList, StyleSheet, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { VStack, Text, HStack, Pressable, Box } from '@gluestack-ui/themed';
import {
  ChevronDownIcon,
} from 'react-native-heroicons/outline';
import { Feather } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PostStackParamList } from '../navigation';
import PostCard from '@/src/components/PostCards/PostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import { BenchmarkPostCard } from '@/src/components/PostCards/BenchmarkPostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import { Header } from '@/src/components/Header';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import CommentsCard from '@/src/components/CommentsCard';
import { toImageSource, formatRelativeTime, DEFAULT_USER_AVATAR } from '@/src/utils';
import { useComments, useCreateComment, useDeleteComment, useLikeComment, useUnlikeComment, useUpdateComment } from '@/src/features/interactions/api/hooks';
import type { CommentWithReplies } from '@/src/features/interactions/types';
import { usePostDetail } from '../api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useKeyboard } from '@/src/hooks/useKeyboard';
import ShareBottomSheet from '../components/ShareBottomSheet';
import { useAppStore } from '@/src/store/appStore';

type PostDetailScreenRouteProp = RouteProp<PostStackParamList, 'PostDetailScreen'>;

export const PostDetailScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<NativeStackNavigationProp<PostStackParamList>>();
    const route = useRoute<PostDetailScreenRouteProp>();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState('Newest');
    const [isSortBottomSheetOpen, setIsSortBottomSheetOpen] = useState(false);
    
    // FIX: route.params undefined kontrolü - güvenli erişim
    // Deep link veya notification'dan gelen durumlarda params undefined olabilir
    const params = route.params || {};
    
    // PostId'yi belirle: önce params.postId'den, sonra postData.id'den
    // Deep link durumu: route.params.postId (linking.config.ts'de path: 'post/:postId' tanımlı)
    // Normal navigation: params.postData.id
    const postId = params?.postId || params?.postData?.id;
    
    // Normal navigation durumu: postData'dan postId al
    const postData = params?.postData;
    
    // Type'ı belirle: params'dan veya default 'post'
    const type = params?.type || 'post';
    // Update post için detay ekranında her zaman related post (experience) gösterilmeli
    const showRelatedPost = params?.showRelatedPost !== undefined ? params.showRelatedPost : (type === 'update' ? true : false);
    const relatedPostData = params?.relatedPostData;
    
    // FIX: postId kontrolü - postId yoksa geri dön (sadece bir kez kontrol et)
    useEffect(() => {
        if (!postId) {
            // Sadece development'ta log'la, production'da sessizce geri dön
            if (__DEV__) {
                console.warn('[PostDetailScreen] ⚠️ Missing postId. Route params:', params);
            }
            // Geri dönülecek ekran yoksa App (MainTabs) ekranına git
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                // Root navigator'a reset yap - PostStackParamList'te 'App' yok, Root navigator'a erişmek için any kullan
                (navigation as any).getParent()?.reset({
                    index: 0,
                    routes: [{ name: 'App' }],
                });
            }
        }
    }, [postId, navigation]);
    
    if (!postId) {
        return null;
    }

    // Check if postData is complete (has stats, user, etc.) or just an ID
    // Notification'dan veya deep link'ten gelen postData sadece { id: "..." } formatında olabilir veya hiç olmayabilir
    const isPostDataComplete = postData && postData.stats !== undefined && postData.user !== undefined;
    
    // Instagram gibi davranış: Bildirimlerden veya deep link'ten geldiğinde her zaman en güncel veriyi göster
    // Notification/deep link'ten geldiğinde (postData yoksa veya sadece ID içeriyorsa) forceRefresh = true
    // Bu sayede eski bildirimlere tıklandığında bile en güncel beğeni/yorum sayısı gösterilir
    const isFromNotificationOrDeepLink = !postData || !isPostDataComplete;
    
    // Fetch post detail - Notification/deep link'ten geldiğinde her zaman en güncel veriyi fetch et
    const { data: fetchedPostData, isLoading: isLoadingPost, isError: isPostDetailError, error: postDetailError } = usePostDetail(
      postId,
      true, // Her zaman enabled
      isFromNotificationOrDeepLink // Notification/deep link'ten geldiğinde force refresh
    );
    const is404 = isPostDetailError && (postDetailError as any)?.response?.status === 404;

    // Use fetched post data if available, otherwise use the passed postData
    // Notification/deep link'ten geldiğinde her zaman fetched data kullan (en güncel)
    // FIX: Category/contextData/product bilgilerini ve görsellerini koru - FeedScreen'den gelen postData'da bu bilgiler var ve görseller dönüştürülmüş
    // Type assertion: PostDetailResponse tipinde bu alanlar yok ama API'den gelebilir veya postData'dan gelir
    let finalPostData: any;
    if (isFromNotificationOrDeepLink) {
      // Notification/deep link'ten geldiğinde fetched data öncelikli
      finalPostData = (fetchedPostData as any) || (postData as any) || { id: postId };
    } else {
      // Feed'den geldiğinde: fetched data varsa onu kullan, ama category/contextData/product bilgilerini postData'dan koru
      const fetched = fetchedPostData as any;
      const post = postData as any;
      
      if (fetched && post) {
        // Fetched data'yı kullan, ama category/contextData/product bilgilerini postData'dan al (görseller zaten dönüştürülmüş)
        // Experience post için content (split bloklar), tags (3 durum) ve images postData'dan korunmalı
        const isExperience = (post.type || fetched.type) === 'experience';
        finalPostData = {
          ...fetched,
          // Category bilgisi (Tips & Tricks, Question, Post için) - postData'dan öncelikli (görseller dönüştürülmüş)
          category: post.category || fetched.category,
          // ContextType ve ContextData bilgisi (Post, Experience için) - postData'dan öncelikli
          contextType: post.contextType || fetched.contextType,
          contextData: post.contextData || fetched.contextData,
          // Product bilgisi (Update için) - postData'dan öncelikli
          product: post.product || fetched.product,
          // Products bilgisi (Benchmark için) - postData'dan öncelikli
          products: post.products || fetched.products,
          // RelatedPost bilgisi (Update için) - postData'dan öncelikli
          relatedPost: post.relatedPost || fetched.relatedPost,
          // Experience: split content, 3 tag ve images postData'dan (zaten kart formatında)
          ...(isExperience && {
            content: Array.isArray(post.content) ? post.content : (fetched.content ?? []),
            tags: Array.isArray(post.tags) ? post.tags : (fetched.tags ?? []),
            images: post.images ?? fetched.images,
          }),
        };
      } else {
        finalPostData = fetched || post;
      }
    }
    const finalType = type || (fetchedPostData as any)?.type || 'post';

    // Experience post: API'den gelen veriyi kart formatına çevir (experienceContent -> content array, product/contextData, tags)
    const finalExperienceData = useMemo(() => {
      if (finalType !== 'experience' || !finalPostData) return finalPostData;
      const raw = finalPostData as any;
      const trimTrailingParen = (s: string) => (s || '').replace(/\s*\(\s*$/, '').trim();
      const contentBlocks = raw.experienceContent ?? (Array.isArray(raw.content) ? raw.content : []);
      const content = Array.isArray(contentBlocks)
        ? contentBlocks.map((item: any) => ({
            tag: {
              icon: (item?.title?.toLowerCase?.().includes('product') || item?.title?.toLowerCase?.().includes('usage')) ? 'package' as const : 'tag' as const,
              title: item?.title ?? '',
            },
            text: trimTrailingParen(item?.content ?? item?.text ?? ''),
            rating: Array(5).fill(false).map((_, i) => i < (Math.min(5, Math.max(0, Number(item?.rating) || 0)))),
          }))
        : [];
      const tags = Array.isArray(raw.tags) ? raw.tags : [];
      const defaultPostImage = require('@/assets/defaultImages/default-post.png');
      const defaultAvatar = require('@/assets/avatar/default-useravatar.png');
      const rawProduct = raw.contextData?.product ?? raw.contextData ?? raw.product;
      const subNameRaw = rawProduct?.subName ?? '';
      const subName = subNameRaw && !/^Status:\s*(tested|own)$/i.test(String(subNameRaw)) ? subNameRaw : '';
      return {
        ...raw,
        content,
        tags,
        user: raw.user ? {
          ...raw.user,
          avatar: toImageSource(raw.user.avatar) ?? defaultAvatar,
        } : raw.user,
        contextData: rawProduct ? {
          id: rawProduct.id ?? '',
          name: rawProduct.name ?? '',
          subName,
          image: toImageSource(rawProduct.image) ?? defaultPostImage,
          isOwned: raw.status === 'own' || rawProduct.isOwned,
        } : raw.contextData,
        images: Array.isArray(raw.images) ? raw.images.map((img: any) => toImageSource(img)).filter(Boolean) : raw.images,
      };
    }, [finalType, finalPostData]);

    // Fetch comments
    const { data: commentsData, isLoading: isLoadingComments } = useComments(postId);
    const createCommentMutation = useCreateComment();
    const deleteCommentMutation = useDeleteComment();
    const likeCommentMutation = useLikeComment();
    const unlikeCommentMutation = useUnlikeComment();
    const updateCommentMutation = useUpdateComment();
    
    // Current user ID
    const currentUserId = useAppStore((state) => state.user?.id);

    // Safe area insets
    const insets = useSafeAreaInsets();
    
    // Keyboard height tracking for dynamic padding
    const keyboardHeight = useKeyboard();
    // Son klavye yüksekliğini sakla (klavye kapalıyken de kullanmak için)
    const lastKeyboardHeightRef = useRef<number>(Platform.OS === 'ios' ? 336 : 300); // Default klavye yüksekliği
    useEffect(() => {
        if (keyboardHeight > 0) {
            lastKeyboardHeightRef.current = keyboardHeight;
        }
    }, [keyboardHeight]);

    // Global bottom sheet
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

    // Comment input state
    const [commentText, setCommentText] = useState('');
    const inputRef = useRef<TextInput>(null);

    // Handle comment submit
    const handleCommentSubmit = () => {
        if (!commentText.trim() || createCommentMutation.isPending) return;

        createCommentMutation.mutate(
            {
                postId: postId!,
                comment: commentText.trim(),
            },
            {
                onSuccess: () => {
                    // Comment gönderildikten sonra input'u temizle
                    setCommentText('');
                    Keyboard.dismiss();
                },
            }
        );
    };

    // Handle comment input press - boş fonksiyon (artık bottom sheet yok) - useCallback ile memoize edildi
    const handleCommentInputPress = useCallback(() => {
        // Bottom sheet kaldırıldı - boş fonksiyon
    }, []);

    // Handle share button press - share bottom sheet aç
    const handleSharePress = () => {
        if (!finalPostData) return;
        
        openBottomSheet(
            <ShareBottomSheet
                postId={postId!}
                postContent={finalPostData.content}
                postAuthorName={finalPostData.user?.name}
                onShareSuccess={() => {
                    // Share başarılı olduğunda yapılacak işlemler (opsiyonel)
                }}
            />,
            {
                enablePanDownToClose: true,
                enableOverDrag: false,
                enableHandlePanningGesture: true,
                enableContentPanningGesture: true,
                enableDynamicSizing: true,
                animateOnMount: false,
                paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 16,
            }
        );
    };

    // Handle sort option press - sort bottom sheet aç
    const handleSortPress = useCallback(() => {
        const sortOptions = [
            { value: 'Newest', label: 'Newest First' },
            { value: 'Oldest', label: 'Oldest First' },
            { value: 'Popular', label: 'Most Popular' },
        ];

        openBottomSheet(
            <Box bg={isDark ? '#1A1A1A' : '#FFFFFF'} pb={insets.bottom + 16}>
                <VStack px="$4" py="$4" space="md">
                    <Text
                        fontSize={16}
                        fontWeight="$bold"
                        color={isDark ? '#FFFFFF' : '#000000'}
                        mb="$2"
                    >
                        Sort Comments
                    </Text>
                    {sortOptions.map((option) => (
                        <Pressable
                            key={option.value}
                            onPress={() => {
                                setSelectedOption(option.value);
                                closeBottomSheet();
                                // TODO: Implement actual sorting logic
                            }}
                            py="$3"
                            px="$2"
                            borderRadius={8}
                            bg={selectedOption === option.value 
                                ? (isDark ? '#2A2A2A' : '#F5F5F5')
                                : 'transparent'
                            }
                        >
                            <Text
                                fontSize={14}
                                fontWeight={selectedOption === option.value ? '$bold' : '$normal'}
                                color={isDark ? '#FFFFFF' : '#000000'}
                            >
                                {option.label}
                            </Text>
                        </Pressable>
                    ))}
                </VStack>
            </Box>,
            {
                enablePanDownToClose: true,
                enableOverDrag: false,
                enableHandlePanningGesture: true,
                enableContentPanningGesture: true,
                enableDynamicSizing: true,
                animateOnMount: false,
                paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 16,
            }
        );
    }, [isDark, selectedOption, openBottomSheet, closeBottomSheet, insets.bottom]);

    // Handle empty area press - sadece klavyeyi kapat
    const handleEmptyAreaPress = () => {
        Keyboard.dismiss();
        inputRef.current?.blur();
    };

    // Flatten comments with replies for display
    const flattenedComments: Array<{
        id: string;
        commentId: string;
        userId: string;
        userName: string;
        userTitle: string;
        avatar: any;
        timeAgo: string;
        content: string;
        likesCount: number;
        isLiked: boolean;
    }> = [];

    if (commentsData?.comments) {
        commentsData.comments.forEach((item: CommentWithReplies) => {
            // Main comment
            flattenedComments.push({
                id: item.comment.id,
                commentId: item.comment.id,
                userId: item.comment.userId,
                userName: item.user.name || 'Anonymous',
                userTitle: item.user.avatar ? '' : '', // API'de title yok, boş bırakıyoruz
                avatar: item.user.avatar ? toImageSource(item.user.avatar) : DEFAULT_USER_AVATAR,
                timeAgo: formatRelativeTime(item.comment.createdAt),
                content: item.comment.comment,
                likesCount: item.comment.likesCount || 0,
                isLiked: false, // Backend doesn't provide isLiked, will be updated after like/unlike via query invalidation
            });

            // Replies
            if (item.replies && item.replies.length > 0) {
                item.replies.forEach((reply) => {
                    // Reply'ler için user bilgisi yok, main comment'in user'ını kullanıyoruz
                    flattenedComments.push({
                        id: reply.id,
                        commentId: reply.id,
                        userId: reply.userId,
                        userName: item.user.name || 'Anonymous',
                        userTitle: '',
                        avatar: item.user.avatar ? toImageSource(item.user.avatar) : DEFAULT_USER_AVATAR,
                        timeAgo: formatRelativeTime(reply.createdAt),
                        content: reply.comment,
                        likesCount: reply.likesCount || 0,
                        isLiked: false, // Backend doesn't provide isLiked, will be updated after like/unlike via query invalidation
                    });
                });
            }
        });
    }

    // Handle delete comment
    const handleDeleteComment = useCallback((commentId: string, postId: string) => {
        if (!commentId || !postId) return;
        
        deleteCommentMutation.mutate(
            { commentId, postId },
            {
                onSuccess: () => {
                    // Comment başarıyla silindi
                },
                onError: (error) => {
                    console.error('[PostDetailScreen] Delete comment error:', error);
                },
            }
        );
    }, [deleteCommentMutation]);

    // Handle like comment - no optimistic update, wait for backend response
    const handleLikeComment = useCallback((commentId: string, postId: string) => {
        if (!commentId || !postId) return;
        
        likeCommentMutation.mutate(
            { commentId, postId },
            {
                onSuccess: () => {
                    // Backend response will update the UI via query invalidation
                },
                onError: (error) => {
                    console.error('[PostDetailScreen] Like comment error:', error);
                },
            }
        );
    }, [likeCommentMutation]);

    // Handle unlike comment - no optimistic update, wait for backend response
    const handleUnlikeComment = useCallback((commentId: string, postId: string) => {
        if (!commentId || !postId) return;
        
        unlikeCommentMutation.mutate(
            { commentId, postId },
            {
                onSuccess: () => {
                    // Backend response will update the UI via query invalidation
                },
                onError: (error) => {
                    console.error('[PostDetailScreen] Unlike comment error:', error);
                },
            }
        );
    }, [unlikeCommentMutation]);

    // Handle edit comment
    const handleEditComment = useCallback((commentId: string, postId: string, newContent: string) => {
        if (!commentId || !postId || !newContent.trim()) return;
        
        updateCommentMutation.mutate(
            { commentId, postId, comment: newContent },
            {
                onError: (error) => {
                    console.error('[PostDetailScreen] Update comment error:', error);
                },
            }
        );
    }, [updateCommentMutation]);

    // FlatList için data hazırla
    const listData = flattenedComments;
    
    // Post detail header component - useMemo ile memoize edildi (keyboardHeight değişikliğinde re-render olmaz)
    const renderHeader = useMemo(() => (
        <>
            {/* Detail Card */}
            {isLoadingPost && (!postData || !isPostDataComplete) ? (
                <Box flex={1} justifyContent="center" alignItems="center" py="$8">
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={14}>
                        Post yükleniyor...
                    </Text>
                </Box>
            ) : finalPostData && finalPostData.id ? (
                <>
                    {finalType === 'tipsAndTricks' ? (
                        <TipsAndTricksPostCard data={finalPostData} isDetailMode={true} />
                    ) : finalType === 'question' ? (
                        <QuestionPostCard data={finalPostData} isDetailMode={true} />
                    ) : finalType === 'benchmark' ? (
                        <BenchmarkPostCard data={finalPostData} onCommentPress={handleCommentInputPress} isDetailMode={true} />
                    ) : finalType === 'experience' ? (
                        <ExperiencePostCard data={finalExperienceData ?? finalPostData} isDetailMode={true} />
                    ) : finalType === 'update' ? (
                        <UpdatePostCard 
                            data={finalPostData} 
                            isDetailMode={true}
                            showRelatedPost={showRelatedPost}
                            relatedPostData={relatedPostData}
                        />
                    ) : (
                        <PostCard data={finalPostData} isDetailMode={true} />
                    )}
                </>
            ) : (
                <Box flex={1} justifyContent="center" alignItems="center" py="$8">
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={14}>
                        Post bulunamadı.
                    </Text>
                </Box>
            )}

            {/* Comments Header + Filter */}
            <HStack
                px="$4"
                mt="$4"
                mb="$2"
                alignItems="center"
                justifyContent="space-between"
            >
                <Text
                    color="#A3A3A3"
                    fontSize={14}
                    fontWeight="$bold"
                >
                    Comments
                </Text>
                <Pressable
                    px={12}
                    py={6}
                    borderRadius={999}
                    borderWidth={1}
                    borderColor={isDark ? '#333333' : '#E0E0E0'}
                    bg={isDark ? '#111111' : '#F5F5F5'}
                    flexDirection="row"
                    alignItems="center"
                    onPress={handleSortPress}
                >
                    <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize={11}
                        fontWeight="$medium"
                        mr={6}
                    >
                        {selectedOption}
                    </Text>
                    <ChevronDownIcon
                        width={14}
                        height={14}
                        color={isDark ? '#FFFFFF' : '#000000'}
                    />
                </Pressable>
            </HStack>
        </>
    ), [isLoadingPost, postData, isPostDataComplete, finalPostData, finalType, showRelatedPost, relatedPostData, isDark, selectedOption, handleSortPress]);

    // FlatList render item - useCallback ile memoize edildi
    const renderCommentItem = useCallback(({ item }: { item: typeof flattenedComments[0] }) => (
        <CommentsCard
            userName={item.userName}
            userTitle={item.userTitle}
            avatar={item.avatar}
            timeAgo={item.timeAgo}
            content={item.content}
            commentId={item.commentId}
            userId={item.userId}
            currentUserId={currentUserId}
            postId={postId}
            likesCount={item.likesCount}
            isLiked={item.isLiked}
            onDelete={handleDeleteComment}
            onLike={handleLikeComment}
            onUnlike={handleUnlikeComment}
            onEdit={handleEditComment}
            isDeleting={deleteCommentMutation.isPending}
            isLiking={likeCommentMutation.isPending || unlikeCommentMutation.isPending}
            isEditing={updateCommentMutation.isPending}
        />
    ), [currentUserId, postId, handleDeleteComment, handleLikeComment, handleUnlikeComment, handleEditComment, deleteCommentMutation.isPending, likeCommentMutation.isPending, unlikeCommentMutation.isPending, updateCommentMutation.isPending]);

    // FlatList empty component - useMemo ile memoize edildi
    const renderEmpty = useMemo(() => (
        <Box px="$4" py="$4">
            {isLoadingComments ? (
                <Text color={isDark ? '#FFFFFF' : '#000000'}>Loading comments...</Text>
            ) : (
                <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>No comments yet. Be the first to comment!</Text>
            )}
        </Box>
    ), [isLoadingComments, isDark]);

    // FlatList keyExtractor - useCallback ile memoize edildi
    const keyExtractor = useCallback((item: { id: string }) => item.id, []);

    // FlatList contentContainerStyle - useMemo ile memoize edildi (keyboardHeight değişikliğinde sadece style güncellenir)
    const contentContainerStyle = useMemo(() => ({ 
        paddingBottom: keyboardHeight > 0 
            ? keyboardHeight + 80
            : lastKeyboardHeightRef.current + 80
    }), [keyboardHeight]);

    // 404: Post bulunamadı (silinmiş veya geçersiz ID) - yükleme bittikten sonra göster
    if (!isLoadingPost && is404) {
        return (
            <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#fff' }}>
                <Header title="Post Details" showBackButton onBackPress={() => navigation.goBack()} />
                <Box flex={1} justifyContent="center" alignItems="center" px="$6">
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={16} textAlign="center">
                        Post bulunamadı.
                    </Text>
                    <Text color={isDark ? '#A3A3A3' : '#666'} fontSize={14} mt="$2" textAlign="center">
                        Bu post silinmiş veya artık mevcut değil.
                    </Text>
                </Box>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#fff' }}>
          
          <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
            {/* Status Bar & Header */}
            <Header
                title={
                    showRelatedPost ? "Related Post" :
                    type === 'post' ? "Post Details" :
                    type === 'tipsAndTricks' ? "Tips & Tricks Details" : 
                    type === 'question' ? "Question Details" : 
                    type === 'benchmark' ? "Benchmark Details" :
                    type === 'experience' ? "Experience Details" :
                    type === 'update' ? "Update Details" :
                    "Post Details"
                }
                showBackButton
                onBackPress={() => navigation.goBack()}
            />

            {/* FlatList for Comments */}
            <FlatList
                data={listData}
                renderItem={renderCommentItem}
                keyExtractor={keyExtractor}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={contentContainerStyle}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                onScrollBeginDrag={handleEmptyAreaPress}
                showsVerticalScrollIndicator={false}
            />

            {/* Input Container - Video'daki gibi */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    alignSelf: 'flex-end',
                    marginBottom: keyboardHeight === 0 ? (Platform.OS === 'ios' ? insets.bottom : 16) : 0,
                }}
            >
               
                <TextInput
                    ref={inputRef}
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Type a message..."
                    placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                    style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 20,
                        
                        paddingHorizontal: 12,
                        backgroundColor: isDark ? '#2A2A2A' : '#F2F2F2',
                        color: isDark ? '#FFFFFF' : '#000000',
                        fontSize: 14,
                    }}
                    multiline={false}
                    returnKeyType="send"
                    onSubmitEditing={handleCommentSubmit}
                />
                <Pressable
                    onPress={handleCommentSubmit}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: commentText.trim() && !createCommentMutation.isPending
                            ? '#6366F1'
                            : isDark
                            ? '#2A2A2A'
                            : '#F2F2F2',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    disabled={!commentText.trim() || createCommentMutation.isPending}
                >
                    {createCommentMutation.isPending ? (
                        <Text style={{ color: isDark ? '#8C8C8C' : '#8C8C8C' }}>...</Text>
                    ) : (
                        <Feather
                            name="send"
                            size={18}
                            color={
                                commentText.trim()
                                    ? '#FFFFFF'
                                    : isDark
                                    ? '#8C8C8C'
                                    : '#8C8C8C'
                            }
                        />
                    )}
                </Pressable>
            </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};
