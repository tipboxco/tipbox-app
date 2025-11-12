import React, { useState } from 'react';
import { ScrollView, Dimensions } from 'react-native';
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

type PostDetailScreenRouteProp = RouteProp<PostStackParamList, 'PostDetailScreen'>;


const renderComments = (item: any, postData: any, isDark: boolean) => {
    return (
        <VStack key={item} position="relative" borderBottomWidth={1} borderBottomColor="#E9E9E9" px={12}>
            <HStack alignItems="flex-start" py={8}>
                <Image
                    source={postData.user.avatar}
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

export const PostDetailScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<NativeStackNavigationProp<PostStackParamList>>();
    const route = useRoute<PostDetailScreenRouteProp>();
    const { postData, type, showRelatedPost, relatedPostData } = route.params;
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState('Newest');

    return (
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
                contentContainerStyle={{ paddingBottom: 100 }}
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
            </ScrollView>
        </VStack>
    );
};
