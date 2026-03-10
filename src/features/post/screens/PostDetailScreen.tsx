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
import { useTranslation } from '@/src/hooks/useTranslation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PostStackParamList } from '../navigation';
import PostCard from '@/src/components/PostCards/PostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import { BenchmarkPostCard } from '@/src/components/PostCards/BenchmarkPostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import { UpdatePostCardDetail } from '@/src/features/post/components/UpdatePostCardDetail';
import { Header } from '@/src/components/Header';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import CommentsCard from '@/src/components/CommentsCard';
import { toImageSource, formatRelativeTime, DEFAULT_USER_AVATAR, isSameImageSource } from '@/src/utils';
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
    const { t } = useTranslation('post');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState('Newest');
    const [isSortBottomSheetOpen, setIsSortBottomSheetOpen] = useState(false);
    const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
    
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
    // FIX: Feed'den geldiğinde (postData varsa) fetch etme, sadece notification/deep link'ten geldiğinde fetch et
    const { data: fetchedPostData, isLoading: isLoadingPost, isError: isPostDetailError, error: postDetailError } = usePostDetail(
      postId,
      isFromNotificationOrDeepLink, // Sadece notification/deep link'ten geldiğinde enabled
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
          // Stats merge - upvotes field'ını preserve et (Event posts için)
          stats: {
            ...fetched.stats,
            ...(post.stats?.upvotes !== undefined && { upvotes: post.stats.upvotes }),
          },
          // Interaction states preserve et (Event posts için upvote, diğerleri için like/bookmark/share)
          isLiked: post.isLiked ?? fetched.isLiked,
          isBookmarked: post.isBookmarked ?? fetched.isBookmarked,
          isShared: post.isShared ?? fetched.isShared,
          isUpvoted: post.isUpvoted ?? fetched.isUpvoted,
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
        // Carousel'de sadece kullanıcı yüklediği görseller; ürün görseli gösterilmez
        images: (() => {
          const mapped = Array.isArray(raw.images) ? raw.images.map((img: any) => toImageSource(img)).filter(Boolean) : (raw.images ?? []);
          const productImg = rawProduct ? (toImageSource(rawProduct.image) ?? defaultPostImage) : null;
          return productImg ? mapped.filter((img: any) => !isSameImageSource(img, productImg)) : mapped;
        })(),
      };
    }, [finalType, finalPostData]);

    // Update post: relatedPost (experience) tam yapısını kart formatına çevir ve detayda tam gösterilsin
    const finalUpdateRelatedPostData = useMemo(() => {
      if (finalType !== 'update' || !finalPostData) return undefined;
      const raw = finalPostData as any;
      const rp = raw?.relatedPost;
      if (!rp) return undefined;
      const defaultPostImage = require('@/assets/defaultImages/default-post.png');
      // API formatı (title, content, rating) -> kart formatı (tag, text, rating[])
      const content = (rp.content && Array.isArray(rp.content))
        ? rp.content
            .filter((item: any) => item != null)
            .map((item: any) => {
              let stars = 0;
              if (Array.isArray(item?.rating) && item.rating.every((x: unknown) => typeof x === 'number')) {
                stars = Math.min(5, item.rating.filter((r: number) => r === 1).length);
              } else if (typeof item?.rating === 'number') {
                const v = item.rating;
                stars = v <= 5 ? Math.round(v) : Math.min(5, Math.max(0, Math.round(v / 20)));
              }
              const ratingArray: number[] = Array(5).fill(0);
              for (let i = 0; i < stars; i++) ratingArray[i] = 1;
              return {
                tag: {
                  icon:
                    item?.tag?.icon ??
                    (((item?.title ?? '').toLowerCase().includes('product') ||
                      (item?.title ?? '').toLowerCase().includes('usage'))
                      ? 'package'
                      : 'tag'),
                  title: item?.tag?.title ?? item?.title ?? '',
                },
                text: item?.text ?? item?.content ?? '',
                rating: Array.isArray(item?.rating) && item.rating.every((x: unknown) => typeof x === 'number')
                  ? item.rating
                  : ratingArray,
              };
            })
        : [];
      const product = rp.product
        ? {
            id: rp.product.id ?? '',
            name: rp.product.name ?? '',
            subName: rp.product.subName ?? '',
            image: toImageSource(rp.product.image) ?? defaultPostImage,
            isOwned: rp.product.isOwned ?? false,
          }
        : undefined;
      const tags = Array.isArray(rp.tags) ? rp.tags : [];
      const images = (rp.images && Array.isArray(rp.images))
        ? rp.images.map((img: any) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
        : [];
      return {
        id: rp.id,
        product,
        content,
        tags,
        images,
        stats: rp.stats ?? raw.stats,
      };
    }, [finalType, finalPostData]);

    // Update detayda: related post'u ExperiencePostCard olarak göstermek için ExperiencePostCardData
    const updateRelatedAsExperienceCardData = useMemo(() => {
      if (finalType !== 'update' || !finalPostData || !finalUpdateRelatedPostData?.product) return undefined;
      const raw = finalPostData as any;
      const defaultPostImage = require('@/assets/defaultImages/default-post.png');
      const defaultAvatar = require('@/assets/avatar/default-useravatar.png');
      const user = raw.user ? { ...raw.user, avatar: toImageSource(raw.user.avatar) ?? defaultAvatar } : { id: '', name: '', title: '', avatar: defaultAvatar };
      return {
        id: finalUpdateRelatedPostData.id ?? raw.id,
        user,
        contextData: {
          id: finalUpdateRelatedPostData.product.id,
          name: finalUpdateRelatedPostData.product.name,
          subName: finalUpdateRelatedPostData.product.subName,
          image: finalUpdateRelatedPostData.product.image ?? defaultPostImage,
          isOwned: finalUpdateRelatedPostData.product.isOwned ?? false,
        },
        content: (finalUpdateRelatedPostData.content ?? []).map((c: any) => ({
          tag: c.tag ?? { icon: 'tag' as const, title: '' },
          text: c.text ?? '',
          rating: Array.isArray(c.rating) ? c.rating.map((r: number) => r === 1) : Array(5).fill(false),
        })),
        tags: finalUpdateRelatedPostData.tags ?? [],
        images: finalUpdateRelatedPostData.images ?? [],
        stats: finalUpdateRelatedPostData.stats ?? raw.stats,
        createdAt: raw.createdAt ?? '',
      };
    }, [finalType, finalPostData, finalUpdateRelatedPostData]);

    // Yorum sıralaması: UI (Newest/Oldest/Popular) -> API (newest/oldest/popular)
    const commentSortBy = useMemo(() => {
      const map: Record<string, 'newest' | 'oldest' | 'popular'> = {
        Newest: 'newest',
        Oldest: 'oldest',
        Popular: 'popular',
      };
      return map[selectedOption] ?? 'newest';
    }, [selectedOption]);

    // Fetch comments (sortBy API'ye gönderilir)
    const { data: commentsData, isLoading: isLoadingComments } = useComments(postId, 50, commentSortBy);
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
            { value: 'Newest', label: t('comments.sort.newest') },
            { value: 'Oldest', label: t('comments.sort.oldest') },
            { value: 'Popular', label: t('comments.sort.popular') },
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
                        {t('comments.sort.title')}
                    </Text>
                    {sortOptions.map((option) => (
                        <Pressable
                            key={option.value}
                            onPress={() => {
                                setSelectedOption(option.value);
                                closeBottomSheet();
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
    }, [isDark, selectedOption, openBottomSheet, closeBottomSheet, insets.bottom, t]);

    // Handle empty area press - sadece klavyeyi kapat
    const handleEmptyAreaPress = () => {
        Keyboard.dismiss();
        inputRef.current?.blur();
    };

    // Flatten comments with replies for display, then sort by selectedOption
    type FlattenedCommentItem = {
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
        createdAt: string;
    };

    const flattenedComments = useMemo(() => {
        const flat: FlattenedCommentItem[] = [];
        if (!commentsData?.comments) return flat;

        commentsData.comments.forEach((item: CommentWithReplies) => {
            flat.push({
                id: item.comment.id,
                commentId: item.comment.id,
                userId: item.comment.userId,
                userName: item.user.name || 'Anonymous',
                userTitle: item.user.avatar ? '' : '',
                avatar: item.user.avatar ? toImageSource(item.user.avatar) : DEFAULT_USER_AVATAR,
                timeAgo: formatRelativeTime(item.comment.createdAt),
                content: item.comment.comment,
                likesCount: item.comment.likesCount || 0,
                isLiked: likedCommentIds.has(item.comment.id),
                createdAt: item.comment.createdAt,
            });

            if (item.replies && item.replies.length > 0) {
                item.replies.forEach((reply) => {
                    flat.push({
                        id: reply.id,
                        commentId: reply.id,
                        userId: reply.userId,
                        userName: item.user.name || 'Anonymous',
                        userTitle: '',
                        avatar: item.user.avatar ? toImageSource(item.user.avatar) : DEFAULT_USER_AVATAR,
                        timeAgo: formatRelativeTime(reply.createdAt),
                        content: reply.comment,
                        likesCount: reply.likesCount || 0,
                        isLiked: likedCommentIds.has(reply.id),
                        createdAt: reply.createdAt,
                    });
                });
            }
        });

        // Sort by selectedOption (default: Newest - en yeni en üstte)
        const sorted = [...flat];
        switch (selectedOption) {
            case 'Oldest':
                sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                break;
            case 'Popular':
                sorted.sort((a, b) => (b.likesCount ?? 0) - (a.likesCount ?? 0));
                break;
            case 'Newest':
            default:
                // Default: Newest (en yeni en üstte - descending)
                sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
        }
        return sorted;
    }, [commentsData?.comments, selectedOption, likedCommentIds]);

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

    // Handle like comment - optimistic local tracking, backend confirms via query invalidation
    const handleLikeComment = useCallback((commentId: string, postId: string) => {
        // Mutation devam ederken tekrar like yapılmasını engelle
        if (!commentId || !postId || likeCommentMutation.isPending || unlikeCommentMutation.isPending) return;

        // Optimistic update
        setLikedCommentIds(prev => new Set(prev).add(commentId));

        likeCommentMutation.mutate(
            { commentId, postId },
            {
                onError: (error) => {
                    // Hata durumunda optimistic update'i geri al
                    setLikedCommentIds(prev => {
                        const next = new Set(prev);
                        next.delete(commentId);
                        return next;
                    });
                    console.error('[PostDetailScreen] Like comment error:', error);
                },
            }
        );
    }, [likeCommentMutation, unlikeCommentMutation]);

    // Handle unlike comment - optimistic local tracking, backend confirms via query invalidation
    const handleUnlikeComment = useCallback((commentId: string, postId: string) => {
        // Mutation devam ederken tekrar unlike yapılmasını engelle
        if (!commentId || !postId || likeCommentMutation.isPending || unlikeCommentMutation.isPending) return;

        // Optimistic update
        setLikedCommentIds(prev => {
            const next = new Set(prev);
            next.delete(commentId);
            return next;
        });

        unlikeCommentMutation.mutate(
            { commentId, postId },
            {
                onError: (error) => {
                    // Hata durumunda optimistic update'i geri al
                    setLikedCommentIds(prev => new Set(prev).add(commentId));
                    console.error('[PostDetailScreen] Unlike comment error:', error);
                },
            }
        );
    }, [likeCommentMutation, unlikeCommentMutation]);

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

    // Post kartı ve Comments başlığı FlatList DIŞINDA render edilir; böylece Update post detayda like/comment/share dokunmaları scroll ile çakışmaz.
    const postCardAndCommentsHeader = useMemo(() => (
        <>
            {/* Detail Card */}
            {isLoadingPost && (!postData || !isPostDataComplete) ? (
                <Box flex={1} justifyContent="center" alignItems="center" py="$8">
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={14}>
                        {t('screens.detail.loading')}
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
                        <UpdatePostCardDetail
                            data={finalPostData}
                            showRelatedPost={true}
                            relatedPostData={finalUpdateRelatedPostData || postData?.relatedPost || relatedPostData}
                            onCommentPress={handleCommentInputPress}
                        />
                    ) : (
                        <PostCard data={finalPostData} isDetailMode={true} />
                    )}
                </>
            ) : (
                <Box flex={1} justifyContent="center" alignItems="center" py="$8">
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={14}>
                        {t('screens.detail.notFound')}
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
                    {t('comments.title')}
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
    ), [isLoadingPost, postData, isPostDataComplete, finalPostData, finalType, isDark, selectedOption, handleSortPress]);

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
                <Text color={isDark ? '#FFFFFF' : '#000000'}>{t('comments.loading')}</Text>
            ) : (
                <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>{t('comments.empty')}</Text>
            )}
        </Box>
    ), [isLoadingComments, isDark, t]);

    // FlatList keyExtractor - useCallback ile memoize edildi
    const keyExtractor = useCallback((item: { id: string }) => item.id, []);

    // FlatList contentContainerStyle - useMemo ile memoize edildi (keyboardHeight değişikliğinde sadece style güncellenir)
    const contentContainerStyle = useMemo(() => ({
        paddingBottom: keyboardHeight > 0
            ? keyboardHeight + 100 // Klavye açıkken: klavye yüksekliği + input container height
            : 100 // Klavye kapalıyken: input container için alan bırak (paddingVertical 32 + height 40 + gap)
    }), [keyboardHeight]);

    // 404: Post bulunamadı (silinmiş veya geçersiz ID) - yükleme bittikten sonra göster
    if (!isLoadingPost && is404) {
        return (
            <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#fff' }}>
                <Header title={t('screens.detail.titles.post')} showBackButton onBackPress={() => navigation.goBack()} />
                <Box flex={1} justifyContent="center" alignItems="center" px="$6">
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={16} textAlign="center">
                        {t('screens.detail.notFound')}
                    </Text>
                    <Text color={isDark ? '#A3A3A3' : '#666'} fontSize={14} mt="$2" textAlign="center">
                        {t('screens.detail.notFoundDesc')}
                    </Text>
                </Box>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#fff' }}>

          <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
            {/* Status Bar & Header */}
            <Header
                title={
                    type === 'post' ? t('screens.detail.titles.post') :
                    type === 'tipsAndTricks' ? t('screens.detail.titles.tips') :
                    type === 'question' ? t('screens.detail.titles.question') :
                    type === 'benchmark' ? t('screens.detail.titles.benchmark') :
                    type === 'experience' ? t('screens.detail.titles.experience') :
                    type === 'update' ? t('screens.detail.titles.update') :
                    t('screens.detail.titles.post')
                }
                showBackButton
                onBackPress={() => navigation.goBack()}
            />

            {/* FlatList - Post kartı ve yorumlar birlikte scroll edilebilir */}
            <FlatList
                style={styles.commentsList}
                data={listData}
                renderItem={renderCommentItem}
                keyExtractor={keyExtractor}
                ListHeaderComponent={postCardAndCommentsHeader}
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
                    backgroundColor: isDark ? '#000000' : '#FFFFFF',
                }}
            >
               
                <TextInput
                    ref={inputRef}
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder={t('comments.placeholder')}
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
                            ? '#3A3A3A'
                            : '#E5E5E5',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: commentText.trim() ? 0 : 1,
                        borderColor: isDark ? '#4A4A4A' : '#D0D0D0',
                    }}
                    disabled={!commentText.trim() || createCommentMutation.isPending}
                >
                    {createCommentMutation.isPending ? (
                        <Text style={{ color: isDark ? '#999999' : '#666666' }}>...</Text>
                    ) : (
                        <Feather
                            name="send"
                            size={18}
                            color={
                                commentText.trim()
                                    ? '#FFFFFF'
                                    : isDark
                                    ? '#999999'
                                    : '#666666'
                            }
                        />
                    )}
                </Pressable>
            </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    commentsList: {
        flex: 1,
    },
});
