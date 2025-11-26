import React, { useState } from 'react';
import { ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack, Text, HStack, Image, Pressable, Box, Popover, PopoverBackdrop, PopoverContent, PopoverBody, PopoverArrow } from '@gluestack-ui/themed';
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
import { config } from '@/src/components/ui/gluestack-ui-provider/config';
import CommentsCard from '@/src/components/CommentsCard';
import { useSafeAreaValues, toImageSource } from '@/src/utils';

type PostDetailScreenRouteProp = RouteProp<PostStackParamList, 'PostDetailScreen'>;


const renderComments = (item: any, postData: any, isDark: boolean) => {
    return (
        <VStack key={item} position="relative" borderWidth={1} borderColor="red" px={12}>
            <HStack alignItems="flex-start" py={8}>
                <Image
                    source={toImageSource(postData.user.avatar)!}
                    alt="User Avatar"
                    width={48}
                    height={48}
                    borderRadius={100}
                    mr={12}
                />
                <VStack flex={1}>
                    <VStack>
                        <Text
                            color={isDark ? '#fff' : '#000'}
                            fontSize={'$xs'}
                            fontWeight="$bold"
                            mr={8}
                        >
                            {postData.user.name}
                        </Text>
                        <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize={config.tokens.fontSizes['3xs'] as number}
                            fontWeight="$medium"
                        >
                            {postData.user.title}
                        </Text>
                    </VStack>
                    <Text
                        color={isDark ? '#fff' : '#000'}
                        fontSize={config.tokens.fontSizes['2xs'] as number}
                        lineHeight={12}
                    >
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.
                    </Text>
                </VStack>
            </HStack>
            <Text
                position="absolute"
                top={8}
                right={12}
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                fontSize={config.tokens.fontSizes['3xs'] as number}
                fontWeight="$medium"
            >
                54m
            </Text>
        </VStack>
    );
};

const MOCK_COMMENTS = [
    {
        id: '1',
        userName: 'Michael Clark',
        userTitle: 'Tech Enthusiast',
        avatar: require('@/assets/avatar/ozan.png'),
        timeAgo: '12m',
        content:
            'Really helpful review, especially the part about battery performance in daily usage. Curious to see how it behaves after a few months. I have been considering this product for quite some time and your detailed explanation about day-to-day usage, charging cycles, and overall reliability over longer periods was exactly what I was looking for. It would be great to hear an update again after a few more weeks of use to understand if there is any noticeable degradation or changes in performance compared to the first days.',
    },
    {
        id: '2',
        userName: 'Sarah Johnson',
        userTitle: 'Early Tech Adopter',
        avatar: require('@/assets/avatar/ozan.png'),
        timeAgo: '1h',
        content:
            'I was between this model and the previous generation. Your detailed comparison really cleared things up for me, thanks!',
    },
    {
        id: '3',
        userName: 'David Miller',
        userTitle: 'Smart Home Explorer',
        avatar: require('@/assets/avatar/ozan.png'),
        timeAgo: '3h',
        content:
            'Would love to hear more about long‑term durability. Have you noticed any issues with build quality or overheating?',
    },
];

export const PostDetailScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<NativeStackNavigationProp<PostStackParamList>>();
    const route = useRoute<PostDetailScreenRouteProp>();
    const { postData, type, showRelatedPost, relatedPostData } = route.params;
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState('Newest');
    const bottomInset = useSafeAreaValues('bottom');

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
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
                contentContainerStyle={{ paddingBottom: bottomInset }}
            >
                {/* Detail Card */}
                {type === 'tipsAndTricks' ? (
                    <TipsAndTricksPostCardDetail data={postData} />
                ) : type === 'question' ? (
                    <QuestionPostCardDetail data={postData} />
                ) : type === 'benchmark' ? (
                    <BenchmarkPostCardDetail data={postData} />
                ) : type === 'experience' ? (
                    <ExperiencePostCardDetail data={postData} />
                ) : type === 'update' ? (
                    <UpdatePostCardDetail 
                        data={postData} 
                        showRelatedPost={showRelatedPost}
                        relatedPostData={relatedPostData}
                    />
                ) : (
                    <PostDetailCard data={postData} />
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
                <VStack space="xs">
                    {MOCK_COMMENTS.map((comment) => (
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
            </ScrollView>
        </VStack>
        </SafeAreaView>
    );
};
