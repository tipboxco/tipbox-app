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
    const { postData, type } = route.params;
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState('Newest');

    return (
        <VStack flex={1} bg={isDark ? '#000000' : '#fff'}>
            {/* Status Bar & Header */}
            <Header
                title={
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
                    <PostDetailCard data={postData} />
                ) : (
                    <PostDetailCard data={postData} />
                )}

                {/* Comments Section */}
                <VStack py={8}>
                    <HStack justifyContent="space-between" alignItems="center" mb={16} px={12}>
                        <Text
                            color={isDark ? '#7D7D7D' : '#7D7D7D'}
                            fontSize={14}
                            fontWeight="$bold"
                        >
                            Comments
                        </Text>
                        <Popover
                            isOpen={isOpen}
                            onClose={() => setIsOpen(false)}
                            placement="left"
                            trigger={(triggerProps) => {
                                return (
                                    <Pressable {...triggerProps} onPress={() => setIsOpen(true)}>
                                        <HStack alignItems="center" bg={isDark ? 'rgba(229, 229, 229, 0.8)' : 'rgba(229, 229, 229, 0.8)'} px={12} py={3} borderRadius={10} borderWidth={1} borderColor="#EFEFEF">
                                            <Text
                                                color={isDark ? '#7D7D7D' : '#7D7D7D'}
                                                fontSize={8}
                                                fontWeight="$semibold"
                                            >
                                                {selectedOption}
                                            </Text>
                                            <Feather name="chevron-down" size={10} color={isDark ? '#7D7D7D' : '#7D7D7D'} />
                                        </HStack>
                                    </Pressable>
                                );
                            }}
                        >
                            <PopoverBackdrop />
                            <PopoverContent>
                                <PopoverArrow />
                                <PopoverBody p={0}>
                                    <VStack>
                                        <Pressable
                                            onPress={() => {
                                                setSelectedOption('Newest');
                                                setIsOpen(false);
                                            }}
                                            disabled={selectedOption === 'Newest'}
                                            opacity={selectedOption === 'Newest' ? 0.5 : 1}
                                            px={16} py={12}
                                            borderBottomWidth={1} borderBottomColor="#E9E9E9"
                                        >
                                            <Text
                                                color={isDark ? '#7D7D7D' : '#7D7D7D'}
                                                fontSize={10}
                                                fontWeight="$semibold"
                                            >
                                                Newest
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => {
                                                setSelectedOption('Oldest');
                                                setIsOpen(false);
                                            }}
                                            disabled={selectedOption === 'Oldest'}
                                            opacity={selectedOption === 'Oldest' ? 0.5 : 1}
                                            px={16} py={12}
                                            borderBottomWidth={1} borderBottomColor="#E9E9E9"
                                        >
                                            <Text
                                                color={isDark ? '#7D7D7D' : '#7D7D7D'}
                                                fontSize={10}
                                                fontWeight="$semibold"
                                            >
                                                Oldest
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => {
                                                setSelectedOption('Most Liked');
                                                setIsOpen(false);
                                            }}
                                            disabled={selectedOption === 'Most Liked'}
                                            opacity={selectedOption === 'Most Liked' ? 0.5 : 1}
                                            px={16} py={12}
                                        >
                                            <Text
                                                color={isDark ? '#7D7D7D' : '#7D7D7D'}
                                                fontSize={10}
                                                fontWeight="$semibold"
                                            >
                                                Most Liked
                                            </Text>
                                        </Pressable>
                                    </VStack>
                                </PopoverBody>
                            </PopoverContent>
                        </Popover>
                    </HStack>

                    {/* Sample Comments */}
                    {[1, 2, 3].map((item) => (
                        <React.Fragment key={item}>
                            {renderComments(item, postData, isDark)}
                        </React.Fragment>
                    ))}
                </VStack>
            </ScrollView>
        </VStack>
    );
};
