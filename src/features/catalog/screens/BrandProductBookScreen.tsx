import React from 'react';
import { ScrollView, FlatList, Dimensions } from 'react-native';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { mock_brand_product_data } from '@/src/mock/catalog/brandProduct';
import { Feather } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 2 cards per row with padding
const imageSize = cardWidth - 16; // Square image with padding

type BrandProductBookScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandProductBookScreen'>;

const BrandProductBookScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<BrandProductBookScreenNavigationProp>();

    const renderProductCard = ({ item }: { item: any }) => (
        <Pressable
            onPress={() => navigation.navigate('BrandProductDetailScreen', { productId: item.id })}
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
                    bg="rgba(0, 0, 0, 0.2)"
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
                        source={item.image}
                        alt={item.name}
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
                    {item.name}
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
                            {item.stats.reviews}
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
                            {item.stats.likes}
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
                            {item.stats.shares}
                        </Text>
                    </HStack>
                </HStack>
            </VStack>
            </Box>
        </Pressable>
    );

    const renderProductGroup = (productGroup: any) => (
        <VStack key={productGroup.id} space="xs" mb="$4">
            {/* Group Header */}
            <HStack justifyContent="space-between" alignItems="center">
                <Text
                    color={isDark ? '#FFFFFF' : '#9D9D9D'}
                    fontSize={12}
                    fontWeight="$bold"
                >
                    {productGroup.title}
                </Text>
                <Feather name="chevron-right" size={20} color={isDark ? '#FFFFFF' : '#9D9D9D'} />
            </HStack>

            {/* Horizontal Scrollable Products */}
            <FlatList
                data={productGroup.products}
                renderItem={renderProductCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
            />
        </VStack>
    );

    return (
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            <Header
                title={mock_brand_product_data.title}
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
            <ScrollView>
                <VStack space="md" pb="$4" px="$4">
                    {mock_brand_product_data.productGroups.map(renderProductGroup)}
                </VStack>
            </ScrollView>
        </Box>
    );
};

export default BrandProductBookScreen;
