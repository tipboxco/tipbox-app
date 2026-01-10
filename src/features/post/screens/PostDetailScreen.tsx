import React, { useState, useEffect } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { VStack, Text, HStack, Pressable, Box, Input, InputField } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
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
    const { postData, type, showRelatedPost, relatedPostData } = route.params;
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState('Newest');
    const insets = useSafeAreaInsets();

    // Get post ID from postData
    const postId = postData.id;

    // Check if postData is complete (has stats, user, etc.) or just an ID
    // Notification'dan gelen postData sadece { id: "..." } formatında olabilir
    const isPostDataComplete = postData.stats !== undefined && postData.user !== undefined;
    
    // Instagram gibi davranış: Bildirimlerden geldiğinde her zaman en güncel veriyi göster
    // Notification'dan geldiğinde (postData sadece ID içeriyorsa) forceRefresh = true
    // Bu sayede eski bildirimlere tıklandığında bile en güncel beğeni/yorum sayısı gösterilir
    const isFromNotification = !isPostDataComplete;
    
    // Fetch post detail - Notification'dan geldiğinde her zaman en güncel veriyi fetch et
    const { data: fetchedPostData, isLoading: isLoadingPost } = usePostDetail(
      postId,
      true, // Her zaman enabled
      isFromNotification // Notification'dan geldiğinde force refresh
    );

    // Use fetched post data if available, otherwise use the passed postData
    // Notification'dan geldiğinde her zaman fetched data kullan (en güncel)
    const finalPostData = isFromNotification 
      ? (fetchedPostData || postData) // Notification'dan geldiğinde fetched data öncelikli
      : (fetchedPostData || postData); // Feed'den geldiğinde de fetched data varsa onu kullan
    const finalType = type || fetchedPostData?.type || 'post';

    // Fetch comments
    const { data: commentsData, isLoading: isLoadingComments } = useComments(postId);
    const createCommentMutation = useCreateComment();

    // Global bottom sheet hook
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

    // Klavye yüksekliği için state
    const [keyboardHeight, setKeyboardHeight] = useState(Platform.OS === 'ios' ? 300 : 250);

    // Klavye event listener'ları - klavye yüksekliğini güncellemek için
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (event) => {
                const height = event.endCoordinates.height;
                setKeyboardHeight(height);
                console.log('[PostDetailScreen] Keyboard opened, height:', height);
            }
        );

        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardHeight(Platform.OS === 'ios' ? 300 : 250); // Default değere dön
                console.log('[PostDetailScreen] Keyboard closed');
            }
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    // Handle comment input press - bottom sheet'i aç ve input'a focus yap
    const handleCommentInputPress = () => {
        // ARCHITECTURE FIX: Use enableDynamicSizing instead of snapPoints
        // Dynamic sizing adapts to content height automatically
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
                            },
                            onError: (error) => {
                                console.error('[PostDetailScreen] Error creating comment:', error);
                            },
                        }
                    );
                }}
                isSubmitting={createCommentMutation.isPending}
                autoFocus={true} // Bottom sheet açıldığında input'a focus yap ve klavyeyi aç
            />,
            {
                enablePanDownToClose: true,
                enableOverDrag: false,
                enableHandlePanningGesture: true,
                enableContentPanningGesture: true,
                enableDynamicSizing: true, // ARCHITECTURE FIX: Use dynamic sizing instead of snapPoints
                animateOnMount: true,
                // Bottom sheet'in bottom uzaklığı klavye yüksekliği + safe area bottom inset kadar olacak
                paddingBottom: keyboardHeight + insets.bottom, // Klavye yüksekliği + safe area bottom inset
                keyboardBehavior: 'extend', // Klavye açıldığında bottom sheet genişler
                keyboardBlurBehavior: 'restore',
                android_keyboardInputMode: 'adjustResize',
                backdropOpacity: 0, // Backdrop hiç kararmasın
            }
        );
    };

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
                    type === 'tipsAndTricks' ? "Tips & Tricks Details" : 
                    type === 'question' ? "Question Details" : 
                    type === 'benchmark' ? "Benchmark Details" :
                    type === 'experience' ? "Experience Details" :
                    type === 'update' ? "Update Details" :
                    "Product Details"
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
                {isLoadingPost && !isPostDataComplete ? (
                    <Box flex={1} justifyContent="center" alignItems="center" py="$8">
                        <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={14}>
                            Post yükleniyor...
                        </Text>
                    </Box>
                ) : (
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
                        <Feather
                            name="chevron-down"
                            size={14}
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

            {/* Comment Input Button - Opens Bottom Sheet */}
            <Pressable
                onPress={handleCommentInputPress}
                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                borderTopWidth={1}
                borderColor={isDark ? '#333' : '#E9E9E9'}
                px="$4"
                py="$3"
                style={{
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12,
                }}
            >
                <HStack space="sm" alignItems="center">
                    {/* Comment Input Placeholder */}
                    <Input
                        flex={1}
                        bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                        borderWidth={0}
                        borderRadius={20}
                        height={40}
                        pointerEvents="none"
                    >
                        <InputField
                            placeholder="Write a comment..."
                            placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={14}
                            editable={false}
                        />
                    </Input>

                    {/* Send Button (disabled - opens bottom sheet) */}
                    <Box
                        width={40}
                        height={40}
                        borderRadius={20}
                        bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Feather
                            name="send"
                            size={18}
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                        />
                    </Box>
                </HStack>
            </Pressable>
        </VStack>
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
};
