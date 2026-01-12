import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, Keyboard, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { VStack, Text, HStack, Pressable, Box } from '@gluestack-ui/themed';
import {
  ChevronDownIcon,
} from 'react-native-heroicons/outline';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PostStackParamList } from '../navigation';
import { PostDetailCard } from '../components/PostDetailCard';
import { TipsAndTricksPostCardDetail } from '../components/TipsAndTricksPostCardDetail';
import { QuestionPostCardDetail } from '../components/QuestionPostCardDetail';
import { BenchmarkPostCardDetail } from '../components/BenchmarkPostCardDetail';
import { ExperiencePostCardDetail } from '../components/ExperiencePostCardDetail';
import { UpdatePostCardDetail } from '../components/UpdatePostCardDetail';
import { Header } from '@/src/components/Header';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import CommentsCard from '@/src/components/CommentsCard';
import { toImageSource, formatRelativeTime, DEFAULT_USER_AVATAR } from '@/src/utils';
import { useComments, useCreateComment } from '@/src/features/interactions/api/hooks';
import type { CommentWithReplies } from '@/src/features/interactions/types';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { usePostDetail } from '../api/hooks';
import { CommentBottomSheet } from '../components/CommentBottomSheet';

type PostDetailScreenRouteProp = RouteProp<PostStackParamList, 'PostDetailScreen'>;

export const PostDetailScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<NativeStackNavigationProp<PostStackParamList>>();
    const route = useRoute<PostDetailScreenRouteProp>();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState('Newest');
    const insets = useSafeAreaInsets();
    
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
    const showRelatedPost = params?.showRelatedPost;
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
    const { data: fetchedPostData, isLoading: isLoadingPost } = usePostDetail(
      postId,
      true, // Her zaman enabled
      isFromNotificationOrDeepLink // Notification/deep link'ten geldiğinde force refresh
    );

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
        };
      } else {
        finalPostData = fetched || post;
      }
    }
    const finalType = type || (fetchedPostData as any)?.type || 'post';

    // Fetch comments
    const { data: commentsData, isLoading: isLoadingComments } = useComments(postId);
    const createCommentMutation = useCreateComment();

    // Global bottom sheet hook
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

    // Bottom sheet açık mı kontrolü - sadece bir kez açılması için
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

    // Input yüksekliği + padding + safe area = yaklaşık 60-70px
    const inputMinHeight = 60 + insets.bottom;
    
    // Ekran yüksekliğinin %80'i - klavyeden bağımsız
    const screenHeight = Dimensions.get('window').height;
    const snapPoint80Percent = screenHeight * 0.8;

    // Handle comment input press - bottom sheet'i %80'e çıkar (klavyeden bağımsız)
    const handleCommentInputPress = useCallback(() => {
        // Input'a tıklandığında bottom sheet'i %80'e çıkar
        // Bottom sheet'i kapatıp yeniden aç (snap point değişikliği için)
        if (isBottomSheetOpen) {
            closeBottomSheet();
            setIsBottomSheetOpen(false);
            
            // Kısa bir delay ile yeniden aç (snap point %80)
            setTimeout(() => {
                console.log('[PostDetailScreen] 📝 Opening bottom sheet with snap point:', snapPoint80Percent, 'input height:', inputMinHeight);
                
                openBottomSheet(
                    <CommentBottomSheet
                        postId={postId}
                        onCommentSubmit={(comment) => {
                            createCommentMutation.mutate(
                                {
                                    postId,
                                    comment,
                                },
                                {
                                    onSuccess: () => {
                                        closeBottomSheet();
                                        Keyboard.dismiss();
                                        setIsBottomSheetOpen(false);
                                    },
                                    onError: (error) => {
                                        console.error('[PostDetailScreen] Error creating comment:', error);
                                    },
                                }
                            );
                        }}
                        isSubmitting={createCommentMutation.isPending}
                        autoFocus={true} // Input'a focus yap ve klavyeyi aç
                        onInputPress={handleCommentInputPress}
                    />,
                    {
                        enablePanDownToClose: true,
                        enableOverDrag: false,
                        enableHandlePanningGesture: true,
                        enableContentPanningGesture: true,
                        enableDynamicSizing: false,
                        snapPoints: [inputMinHeight, snapPoint80Percent], // Min height ve %80
                        initialSnapIndex: 1, // %80'de başla
                        animateOnMount: true,
                        paddingBottom: insets.bottom,
                        keyboardBehavior: 'extend', // Klavye bottom sheet'in gerisinde açılsın (z-index düşük)
                        keyboardBlurBehavior: 'restore',
                        android_keyboardInputMode: 'adjustResize',
                        backdropOpacity: 0,
                        onChange: (index) => {
                            // Snap point değiştiğinde (kullanıcı aşağı kaydırdığında)
                            if (index === -1) {
                                setIsBottomSheetOpen(false);
                            }
                        },
                    }
                );
                setIsBottomSheetOpen(true);
            }, 100);
        }
    }, [postId, isBottomSheetOpen, openBottomSheet, closeBottomSheet, createCommentMutation, inputMinHeight, snapPoint80Percent, insets.bottom]);

    // Ekran açıldığında bottom sheet'i sadece input yüksekliği kadar aç (sadece bir kez)
    useEffect(() => {
        if (postId && !isBottomSheetOpen) {
            openBottomSheet(
                <CommentBottomSheet
                    postId={postId}
                    onCommentSubmit={(comment) => {
                        createCommentMutation.mutate(
                            {
                                postId,
                                comment,
                            },
                            {
                                onSuccess: () => {
                                    closeBottomSheet();
                                    Keyboard.dismiss();
                                    setIsBottomSheetOpen(false);
                                },
                                onError: (error) => {
                                    console.error('[PostDetailScreen] Error creating comment:', error);
                                },
                            }
                        );
                    }}
                    isSubmitting={createCommentMutation.isPending}
                    autoFocus={false} // Başlangıçta focus yapma, sadece input'a tıklandığında
                    onInputPress={handleCommentInputPress} // Input'a tıklandığında snap point'i değiştir
                />,
                {
                    enablePanDownToClose: true,
                    enableOverDrag: false,
                    enableHandlePanningGesture: true,
                    enableContentPanningGesture: true,
                    enableDynamicSizing: false, // Snap points kullanıyoruz
                    snapPoints: [inputMinHeight, snapPoint80Percent], // İki snap point: min height ve %80
                    initialSnapIndex: 0, // Başlangıçta min height (0)
                    animateOnMount: true,
                    paddingBottom: insets.bottom,
                    keyboardBehavior: 'extend', // Klavye bottom sheet'in gerisinde açılsın (z-index düşük)
                    keyboardBlurBehavior: 'restore',
                    android_keyboardInputMode: 'adjustResize',
                    backdropOpacity: 0, // Backdrop hiç kararmasın
                    onChange: (index) => {
                        // Snap point değiştiğinde (kullanıcı aşağı kaydırdığında veya kapattığında)
                        if (index === -1) {
                            setIsBottomSheetOpen(false);
                        }
                    },
                }
            );
            setIsBottomSheetOpen(true);
        }

        // Cleanup: Ekran kapanırken bottom sheet'i kapat
        return () => {
            if (isBottomSheetOpen) {
                closeBottomSheet();
                setIsBottomSheetOpen(false);
            }
        };
    }, [postId]); // Sadece postId değiştiğinde çalışsın, isBottomSheetOpen dependency'ye ekleme (sonsuz döngü olmasın)

    // Flatten comments with replies for display
    const flattenedComments: Array<{
        id: string;
        userName: string;
        userTitle: string;
        avatar: any;
        timeAgo: string;
        content: string;
    }> = [];

    if (commentsData?.comments) {
        commentsData.comments.forEach((item: CommentWithReplies) => {
            // Main comment
            flattenedComments.push({
                id: item.comment.id,
                userName: item.user.name || 'Anonymous',
                userTitle: item.user.avatar ? '' : '', // API'de title yok, boş bırakıyoruz
                avatar: item.user.avatar ? toImageSource(item.user.avatar) : DEFAULT_USER_AVATAR,
                timeAgo: formatRelativeTime(item.comment.createdAt),
                content: item.comment.comment,
            });

            // Replies
            if (item.replies && item.replies.length > 0) {
                item.replies.forEach((reply) => {
                    // Reply'ler için user bilgisi yok, main comment'in user'ını kullanıyoruz
                    flattenedComments.push({
                        id: reply.id,
                        userName: item.user.name || 'Anonymous',
                        userTitle: '',
                        avatar: item.user.avatar ? toImageSource(item.user.avatar) : DEFAULT_USER_AVATAR,
                        timeAgo: formatRelativeTime(reply.createdAt),
                        content: reply.comment,
                    });
                });
            }
        });
    }

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
        <VStack flex={1} bg={isDark ? '#000000' : '#fff'}>
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

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Detail Card */}
                {/* Loading state: Post detail fetch ediliyorsa göster */}
                {/* Deep link veya notification'dan geldiğinde (postData yoksa) loading göster */}
                {isLoadingPost && (!postData || !isPostDataComplete) ? (
                    <Box flex={1} justifyContent="center" alignItems="center" py="$8">
                        <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={14}>
                            Post yükleniyor...
                        </Text>
                    </Box>
                ) : finalPostData && finalPostData.id ? (
                    <>
                        {finalType === 'tipsAndTricks' ? (
                            <TipsAndTricksPostCardDetail data={finalPostData} onCommentPress={handleCommentInputPress} />
                        ) : finalType === 'question' ? (
                            <QuestionPostCardDetail data={finalPostData} onCommentPress={handleCommentInputPress} />
                        ) : finalType === 'benchmark' ? (
                            <BenchmarkPostCardDetail data={finalPostData} onCommentPress={handleCommentInputPress} />
                        ) : finalType === 'experience' ? (
                            <ExperiencePostCardDetail data={finalPostData} onCommentPress={handleCommentInputPress} />
                        ) : finalType === 'update' ? (
                            <UpdatePostCardDetail 
                                data={finalPostData} 
                                showRelatedPost={showRelatedPost}
                                relatedPostData={relatedPostData}
                                onCommentPress={handleCommentInputPress}
                            />
                        ) : (
                            <PostDetailCard data={finalPostData} onCommentPress={handleCommentInputPress} />
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
                    >
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={11}
                            fontWeight="$medium"
                            mr={6}
                        >
                            Newest
                        </Text>
                        <ChevronDownIcon
                            width={14}
                            height={14}
                            color={isDark ? '#FFFFFF' : '#000000'}
                        />
                    </Pressable>
                </HStack>

                {/* Comments List */}
                {isLoadingComments ? (
                    <Box px="$4" py="$4">
                        <Text color={isDark ? '#FFFFFF' : '#000000'}>Loading comments...</Text>
                    </Box>
                ) : flattenedComments.length === 0 ? (
                    <Box px="$4" py="$4">
                        <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>No comments yet. Be the first to comment!</Text>
                    </Box>
                ) : (
                    <VStack space="xs">
                        {flattenedComments.map((comment) => (
                            <CommentsCard
                                key={comment.id}
                                userName={comment.userName}
                                userTitle={comment.userTitle}
                                avatar={comment.avatar}
                                timeAgo={comment.timeAgo}
                                content={comment.content}
                            />
                        ))}
                    </VStack>
                )}
            </ScrollView>
        </VStack>
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
};
