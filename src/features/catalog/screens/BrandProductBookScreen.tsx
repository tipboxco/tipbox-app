import React, { useMemo, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Image,
    Input,
    InputField,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  BookOpenIcon,
} from 'react-native-heroicons/outline';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { useBrandProductBook } from '../api/hooks';
import type { BrandProductCategory, BrandProduct } from '../types';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { ProductInfoType } from '@/src/types/common';

const { width: screenWidth } = Dimensions.get('window');
// Card genişliği: 2.4 card görünür (2 tam + 0.4 kısım) - scrollable olduğunu göstermek için
const cardWidth = (screenWidth - 48) / 2.4; // 2.4 cards visible per row with padding
const imageSize = cardWidth - 16; // Square image with padding

type BrandProductBookScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandProductBookScreen'>;
type BrandProductBookScreenRouteProp = RouteProp<CatalogStackParamList, 'BrandProductBookScreen'>;

const BrandProductBookScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<BrandProductBookScreenNavigationProp>();
    const route = useRoute<BrandProductBookScreenRouteProp>();
    const bottomInset = useSafeAreaValues('bottom');
    
    const brandId = route.params?.brandId;
    
    // Brand Product Book API hook (infinite query)
    const {
        data: productBookData,
        isLoading: isProductBookLoading,
        error: productBookError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useBrandProductBook(brandId);

    // İlk mount'ta cache'i yenile (test sonuçları için)
    useEffect(() => {
        if (brandId) {
            // Sadece ilk mount'ta refetch yap
            refetch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [brandId]); // brandId değiştiğinde de refetch yap

    // Flatten all pages into a single array (kategoriler)
    const allCategories = useMemo(() => {
        if (!productBookData?.pages) return [];
        return productBookData.pages.flatMap((page) => page.items);
    }, [productBookData?.pages]);

    // Map BrandProduct to component format
    const mapProductToCardData = (product: BrandProduct) => {
        const imageSource = toImageSource(product.image) || require('@/assets/avatar/default-useravatar.png');
        
        return {
            id: product.productId,
            name: product.name,
            image: imageSource,
            stats: {
                posts: product.stats.posts || 0,
                news: product.stats.news || 0,
            },
        };
    };

    const renderProductCard = ({ item }: { item: BrandProduct }) => {
        const cardData = mapProductToCardData(item);
        
        return (
        <Pressable
            onPress={() => navigation.navigate('BrandProductDetailScreen', { 
                brandId: route.params.brandId,
                productId: cardData.id,
                productName: cardData.name,
                productImage: cardData.image,
            })}
        >
            <Box
                bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                borderWidth={1}
                borderColor="#E9E9E9"
                borderRadius={10}
                width={cardWidth}
                height={imageSize + 80} // Square image + text + stats space
                mr="$2"
            >
            <VStack flex={1} p="$2">
                {/* Product Image - Square */}
                <Box
                    width={imageSize}
                    height={imageSize}
                    borderRadius={5}
                    mb="$2"
                    alignItems="center"
                    justifyContent="center"
                    alignSelf="center"
                >
                    <Image
                        style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 5,
                        }}
                        source={cardData.image}
                        alt={cardData.name}
                        resizeMode="cover"
                    />
                </Box>

                {/* Product Name */}
                <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize="$xs"
                    fontWeight="$semibold"
                    mb="$2"
                    textAlign="center"
                    numberOfLines={2}
                >
                    {cardData.name}
                </Text>

                {/* Divider Line */}
                <Box
                    width="100%"
                    height={1}
                    bg="#E9E9E9"
                    mb="$2"
                />

                {/* Stats */}
                <HStack justifyContent="space-between" alignItems="center">
                    <HStack alignItems="center" space="xs" flex={1}>
                        <DocumentTextIcon
                            width={12}
                            height={12}
                            color={isDark ? '#FFFFFF' : '#000000'}
                        />
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize="$2xs"
                            fontWeight="$medium"
                            numberOfLines={1}
                        >
                            {cardData.stats.posts}
                        </Text>
                    </HStack>

                    <HStack alignItems="center" space="xs" flex={1}>
                        <BookOpenIcon
                            width={12}
                            height={12}
                            color={isDark ? '#FFFFFF' : '#000000'}
                        />
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize="$2xs"
                            fontWeight="$medium"
                            numberOfLines={1}
                        >
                            {cardData.stats.news}
                        </Text>
                    </HStack>
                </HStack>
            </VStack>
            </Box>
        </Pressable>
        );
    };

    const renderCategory = (category: BrandProductCategory) => (
        <VStack key={category.categoryId} space="xs" mb='$2'>
            {/* Kategori Header */}
            <Pressable
                onPress={() => {
                    // Kategori için PostsScreen'e navigate et (SubCategory context)
                    navigationService.navigate(ROOT_ROUTES.POST, {
                        screen: 'PostsScreen',
                        params: {
                            stage: 'SubCategories',
                            name: category.categoryName,
                            productInfo: {
                                image: require('@/assets/events/card-icon.png'),
                                title: category.categoryName,
                                subName: category.categoryName,
                            },
                            contextType: ProductInfoType.SUB_CATEGORY,
                            contextId: category.categoryId,
                        },
                    });
                }}
            >
                <HStack justifyContent="space-between" alignItems="center" pr='$4'>
                    <Text
                        color={isDark ? '#FFFFFF' : '#9D9D9D'}
                        fontSize="$sm"
                        fontWeight="$bold"
                    >
                        {category.categoryName}
                    </Text>
                    <ChevronRightIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#9D9D9D'} />
                </HStack>
            </Pressable>

            {/* Horizontal Scrollable Products */}
            <FlatList
                data={category.products}
                renderItem={renderProductCard}
                keyExtractor={(item) => item.productId}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ 
                    paddingRight: 16,
                    paddingLeft: 0,
                }}
                style={{ marginRight: -16 }}
            />
        </VStack>
    );

    // Loading state
    if (isProductBookLoading) {
        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
                <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                    <Header
                        title="Brand Products Book"
                        showBackButton={true}
                        onBackPress={() => navigation.goBack()}
                    />
                    <Box flex={1} justifyContent="center" alignItems="center">
                        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                        <Text color={isDark ? '#FFFFFF' : '#000000'} mt="$4" fontSize="$sm">
                            Loading...
                        </Text>
                    </Box>
                </Box>
            </SafeAreaView>
        );
    }

    // Error state
    if (productBookError) {
        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
                <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                    <Header
                        title="Brand Products Book"
                        showBackButton={true}
                        onBackPress={() => navigation.goBack()}
                    />
                    <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                        <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
                            {productBookError ? `Error: ${productBookError.message}` : 'Product list not found'}
                        </Text>
                    </Box>
                </Box>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
            <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                <Header
                    title="Brand Products Book"
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                />

                {/* Search Bar */}
                <Box px="$4" py="$3">
                    <Box
                        bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                        borderRadius={20}
                        height={36}
                        px="$4"
                        justifyContent="center"
                    >
                        <HStack alignItems="center" space="sm">
                            <MagnifyingGlassIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#B9B9B9'} />
                            <Input flex={1} borderWidth={0} bg="transparent">
                                <InputField
                                    placeholder="Select product group or search product name"
                                    placeholderTextColor={isDark ? '#8C8C8C' : '#B9B9B9'}
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    fontSize="$2xs"
                                />
                            </Input>
                        </HStack>
                    </Box>
                </Box>

                {/* Content */}
                <ScrollView
                    contentContainerStyle={{ paddingBottom: bottomInset }}
                    onScroll={(event) => {
                        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                        const paddingToBottom = 20;
                        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
                        
                        if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    scrollEventThrottle={400}
                >
                    <VStack space="md" pb="$4" pl="$4">
                        {allCategories.length === 0 ? (
                            <Box py="$4" alignItems="center">
                                <Text color={isDark ? '#FFFFFF' : '#9D9D9D'} fontSize="$sm">
                                    No products yet
                                </Text>
                            </Box>
                        ) : (
                            <>
                                {allCategories.map(renderCategory)}
                                {isFetchingNextPage && (
                                    <Box py="$4" alignItems="center">
                                        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                                    </Box>
                                )}
                            </>
                        )}
                    </VStack>
                </ScrollView>
            </Box>
        </SafeAreaView>
    );
};

export default BrandProductBookScreen;
