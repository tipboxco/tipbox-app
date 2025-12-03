import React from 'react';
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
import { Feather } from '@expo/vector-icons';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { useBrandProductBook } from '../api/hooks';
import type { BrandProductGroup, BrandProduct } from '../types';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 2 cards per row with padding
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
    
    // Brand Product Book API hook
    const {
        data: productBookData,
        isLoading: isProductBookLoading,
        error: productBookError,
    } = useBrandProductBook(brandId);

    // Map BrandProduct to component format
    const mapProductToCardData = (product: BrandProduct) => {
        const imageSource = toImageSource(product.image) || require('@/assets/avatar/ozan.png');
        
        return {
            id: product.productId,
            name: product.name,
            image: imageSource,
            stats: {
                reviews: product.stats.reviews,
                likes: product.stats.likes,
                shares: product.stats.share, // API'de "share" (tekil) olarak geliyor
            },
        };
    };

    const renderProductCard = ({ item }: { item: BrandProduct }) => {
        const cardData = mapProductToCardData(item);
        
        return (
        <Pressable
            onPress={() => navigation.navigate('BrandProductDetailScreen', { productId: cardData.id })}
        >
            <Box
                bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                borderWidth={1}
                borderColor="#E9E9E9"
                borderRadius={10}
                width={cardWidth}
                height={imageSize + 80} // Square image + text + stats space
                mr="$3"
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
                    fontSize={11}
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
                <HStack justifyContent="space-between" alignItems="center" flexWrap="wrap">
                    <HStack alignItems="center" space="xs" flex={1} minWidth="30%">
                        <Box
                            width={12}
                            height={12}
                            bg="#D9D9D9"
                            borderRadius={2}
                        />
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={8}
                            fontWeight="$medium"
                            numberOfLines={1}
                        >
                            {cardData.stats.reviews}
                        </Text>
                    </HStack>

                    <HStack alignItems="center" space="xs" flex={1} minWidth="30%">
                        <Box
                            width={12}
                            height={12}
                            bg="#D9D9D9"
                            borderRadius={2}
                        />
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={8}
                            fontWeight="$medium"
                            numberOfLines={1}
                        >
                            {cardData.stats.likes}
                        </Text>
                    </HStack>

                    <HStack alignItems="center" space="xs" flex={1} minWidth="30%">
                        <Box
                            width={12}
                            height={12}
                            bg="#D9D9D9"
                            borderRadius={2}
                        />
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={8}
                            fontWeight="$medium"
                            numberOfLines={1}
                        >
                            {cardData.stats.shares}
                        </Text>
                    </HStack>
                </HStack>
            </VStack>
            </Box>
        </Pressable>
        );
    };

    const renderProductGroup = (productGroup: BrandProductGroup) => (
        <VStack key={productGroup.productGroupId} space="xs" mb='$2'>
            {/* Group Header */}
            <HStack justifyContent="space-between" alignItems="center" pr='$4'>
                <Text
                    color={isDark ? '#FFFFFF' : '#9D9D9D'}
                    fontSize={12}
                    fontWeight="$bold"
                >
                    {productGroup.productGroupName}
                </Text>
                <Feather name="chevron-right" size={20} color={isDark ? '#FFFFFF' : '#9D9D9D'} />
            </HStack>

            {/* Horizontal Scrollable Products */}
            <FlatList
                data={productGroup.products}
                renderItem={renderProductCard}
                keyExtractor={(item) => item.productId}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
            />
        </VStack>
    );

    // Loading state
    if (isProductBookLoading) {
        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
                <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                    <Header
                        title="Marka Ürünleri Defteri"
                        showBackButton={true}
                        onBackPress={() => navigation.goBack()}
                    />
                    <Box flex={1} justifyContent="center" alignItems="center">
                        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                        <Text color={isDark ? '#FFFFFF' : '#000000'} mt="$4">
                            Yükleniyor...
                        </Text>
                    </Box>
                </Box>
            </SafeAreaView>
        );
    }

    // Error state
    if (productBookError || !productBookData) {
        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
                <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                    <Header
                        title="Marka Ürünleri Defteri"
                        showBackButton={true}
                        onBackPress={() => navigation.goBack()}
                    />
                    <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                        <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
                            {productBookError ? `Hata: ${productBookError.message}` : 'Ürün listesi bulunamadı'}
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
                    title="Marka Ürünleri Defteri"
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
                            <Feather name="search" size={24} color={isDark ? '#FFFFFF' : '#B9B9B9'} />
                            <Input flex={1} borderWidth={0} bg="transparent">
                                <InputField
                                    placeholder="Ürün Grubu seçin veya ürün adı arayın"
                                    placeholderTextColor={isDark ? '#8C8C8C' : '#B9B9B9'}
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    fontSize={9}
                                />
                            </Input>
                        </HStack>
                    </Box>
                </Box>

                {/* Content */}
                <ScrollView
                    contentContainerStyle={{ paddingBottom: bottomInset }}
                >
                    <VStack space="md" pb="$4" pl="$4">
                        {productBookData.length === 0 ? (
                            <Box py="$4" alignItems="center">
                                <Text color={isDark ? '#FFFFFF' : '#9D9D9D'} fontSize={12}>
                                    Henüz ürün bulunmuyor
                                </Text>
                            </Box>
                        ) : (
                            productBookData.map(renderProductGroup)
                        )}
                    </VStack>
                </ScrollView>
            </Box>
        </SafeAreaView>
    );
};

export default BrandProductBookScreen;
