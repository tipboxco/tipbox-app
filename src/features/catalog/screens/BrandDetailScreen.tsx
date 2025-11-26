import React, { useState, useRef, useEffect } from 'react';
import { Dimensions, FlatList, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Image,
    Button,
    ButtonText,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { mock_brand_detail } from '@/src/mock/catalog/brandCatalog';
import { Feather } from '@expo/vector-icons';
import PostCard from '@/src/components/PostCards/PostCard';
import { useSafeAreaValues } from '@/src/utils';

const { width } = Dimensions.get('window');

type BrandDetailScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandDetailScreen'>;
type BrandDetailScreenRouteProp = RouteProp<CatalogStackParamList, 'BrandDetailScreen'>;

const BrandDetailScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<BrandDetailScreenNavigationProp>();
    const route = useRoute<BrandDetailScreenRouteProp>();
    const scrollY = useRef(new Animated.Value(0)).current;

    const { brandId } = route.params;

    // Find the brand from mock data
    const brand = mock_brand_detail;

    // Banner yüksekliği ve içerik başlangıç noktası
    const BANNER_HEIGHT = 250;
    const CONTENT_OFFSET = 20; // mt={-20} nedeniyle içerik banner'ın 20px üstünde başlıyor
    const CONTENT_START = BANNER_HEIGHT - CONTENT_OFFSET; // 230px

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        scrollY.setValue(offsetY);
        
        // Debug: Scroll değerini logla
        console.log('[BrandDetailScreen] Scroll Y:', offsetY);
        
        // Animasyon aralığı kontrolü ve opacity hesaplama
        let calculatedOpacity = 0;
        if (offsetY >= 100 && offsetY < 180) {
            calculatedOpacity = (offsetY - 100) / (180 - 100);
            console.log('[BrandDetailScreen] Header animasyon progress:', (calculatedOpacity * 100).toFixed(1) + '%', 'Opacity:', calculatedOpacity.toFixed(2));
        } else if (offsetY >= 180) {
            calculatedOpacity = 1;
            console.log('[BrandDetailScreen] Header tamamen görünür (opacity: 1)');
        } else {
            calculatedOpacity = 0;
            console.log('[BrandDetailScreen] Header gizli (opacity: 0)');
        }
    };

    // Header animasyonu: İçeriğin başlangıç noktasına yaklaştığında açılır
    // 100px'de başlar, 180px'de tamamen görünür olur
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100, 180],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp',
    });
    
    // Debug: Opacity değerini takip et
    useEffect(() => {
        const listenerId = scrollY.addListener(({ value }) => {
            let opacity = 0;
            if (value >= 100 && value < 180) {
                opacity = (value - 100) / (180 - 100);
            } else if (value >= 180) {
                opacity = 1;
            }
            console.log('[BrandDetailScreen] ScrollY:', value, 'Calculated Opacity:', opacity.toFixed(2));
        });
        
        return () => {
            scrollY.removeListener(listenerId);
        };
    }, []);

    if (!brand) {
        return (
            <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                <Header
                    title="Brand Not Found"
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                />
            </Box>
        );
    }

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            {/* Sticky Animated Header */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    elevation: 10,
                    pointerEvents: 'box-none',
                }}
                collapsable={false}
            >
                <Animated.View
                    style={{
                        opacity: headerOpacity,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        width: '100%',
                        zIndex: 9999,
                    }}
                >
                    <Box 
                        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
                        width="100%"
                    >
                        <Header
                            title={brand.name}
                            showBackButton={true}
                            onBackPress={() => navigation.goBack()}
                            showShare={true}
                            onSharePress={() => console.log('Share pressed')}
                        />
                    </Box>
                </Animated.View>
            </Animated.View>

            <Animated.ScrollView
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                {/* Banner Image */}
                <Box
                    width={width}
                    height={250}
                    position="relative"
                    overflow="hidden"
                >
                    <Image
                        source={brand.bannerImage}
                        alt="Brand Banner"
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />

                    {/* Gradient Overlay */}
                    <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        bg="rgba(0, 0, 0, 0.6)"
                    />

                    {/* Back and Share Buttons */}
                    <HStack
                        position="absolute"
                        top={25}
                        left={16}
                        right={16}
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Pressable
                            onPress={() => navigation.goBack()}
                            width={36}
                            height={36}
                            borderRadius={18}
                            bg="rgba(0, 0, 0, 0.6)"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Feather name="arrow-left" size={20} color="#FFFFFF" />
                        </Pressable>

                        <Pressable
                            width={36}
                            height={36}
                            borderRadius={18}
                            bg="rgba(0, 0, 0, 0.6)"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Feather name="share-2" size={20} color="#FFFFFF" />
                        </Pressable>
                    </HStack>

                    {/* Brand Info Overlay */}
                    <VStack
                        position="absolute"
                        bottom={0}
                        left={0}
                        right={0}
                        bg="rgba(0, 0, 0, 0.6)"
                        p="$4"
                    >
                        <Text
                            color="#FFFFFF"
                            fontSize={9}
                            lineHeight={12}
                            mb="$2"
                        >
                            Discover all experiences related to {brand.name}.
                        </Text>
                    </VStack>
                </Box>

                {/* Content */}
                <VStack
                    bg={isDark ? '#000000' : '#FAFAFA'}
                    borderTopLeftRadius={20}
                    borderTopRightRadius={20}
                    mt={-20}
                    flex={1}
                    px={12}
                    py={16}
                >
                    {/* Brand Header */}
                    <HStack justifyContent="space-between" alignItems="center" mb="$2">
                        <VStack flex={1}>
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={18}
                                fontWeight="$bold"
                                mb="$1"
                            >
                                {brand.name}
                            </Text>
                            <HStack alignItems="center" space="sm">
                                <Feather name="users" size={12} color="#9D9D9D" />
                                <Text
                                    color="#9D9D9D"
                                    fontSize={9}
                                    fontWeight="$medium"
                                >
                                    {brand.followers}
                                </Text>
                            </HStack>
                        </VStack>
                        <Button
                            bg="#C2E607"
                            borderRadius={10}
                            width={65}
                            height={24}
                            onPress={() => console.log('Join')}
                        >
                            <ButtonText
                                color="#000000"
                                fontSize={9}
                                fontWeight="$bold"
                                textAlign="center"
                            >
                                Join
                            </ButtonText>
                        </Button>
                    </HStack>

                    {/* Brand Description */}
                    <Text
                        color={isDark ? '#FFFFFF' : '#343434'}
                        fontSize={9}
                        lineHeight={12}
                        mb="$4"
                    >
                        {brand.description}
                    </Text>

                    {/* Browse Section */}
                    <VStack space="xs" mb="$3">
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text
                                color={isDark ? '#FFFFFF' : '#9D9D9D'}
                                fontSize={12}
                                fontWeight="$bold"
                            >
                                Browse
                            </Text>
                        </HStack>

                        {/* Brand Sections - Horizontal Layout */}
                        <HStack space="md" justifyContent="space-between">
                            {/* Anketler & Oyunlaştırmalar Card */}
                            <Box
                                flex={1}
                                bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                                borderWidth={1}
                                borderColor="#E9E9E9"
                                borderRadius={10}
                                p="$3"
                            >
                                <VStack space="sm" justifyContent="center">
                                    {/* Icon */}
                                    <Image
                                        source={require('@/assets/catalog/lego.png')}
                                        alt="Anketler & Oyunlaştırmalar"
                                        width={24}
                                        height={24}
                                    />

                                    {/* Title */}
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={12}
                                        fontWeight="$bold"
                                        textAlign="left"
                                    >
                                        Anketler & Oyunlaştırmalar
                                    </Text>

                                    {/* Description */}
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#343434'}
                                        fontSize={9}
                                        lineHeight={12}
                                        textAlign="left"
                                    >
                                        Anketler ve Oyunlaştırmalar hakkında küçük bir yazı
                                    </Text>

                                    {/* Button */}
                                    <Button
                                        mt='$2'
                                        bg="rgba(215, 215, 215, 0.8)"
                                        borderWidth={1}
                                        borderColor="#ADADAD"
                                        borderRadius={10}
                                        width={65}
                                        height={24}
                                        onPress={() => navigation.navigate('SurveyScreen')}
                                    >
                                        <HStack alignItems="center" space="xs">
                                            <ButtonText
                                                color="#000000"
                                                fontSize={9}
                                                fontWeight="$bold"
                                            >
                                                Explore
                                            </ButtonText>
                                            <Feather name="chevron-right" size={12} color="#000000" />
                                        </HStack>
                                    </Button>
                                </VStack>
                            </Box>

                            {/* Marka Ürünleri Defteri Card */}
                            <Box
                                flex={1}
                                bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                                borderWidth={1}
                                borderColor="#E9E9E9"
                                borderRadius={10}
                                p="$3"
                            >
                                <VStack space="sm" justifyContent="center">
                                    {/* Icon */}
                                    <Image
                                        source={require('@/assets/catalog/book.png')}
                                        alt="Marka Ürünleri Defteri"
                                        width={24}
                                        height={24}
                                    />

                                    {/* Title */}
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={12}
                                        fontWeight="$bold"
                                        textAlign="left"
                                    >
                                        Marka Ürünleri Defteri
                                    </Text>

                                    {/* Description */}
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#343434'}
                                        fontSize={9}
                                        lineHeight={12}
                                        textAlign="left"
                                    >
                                        Marka Ürünleri Defteri hakkında küçük bir yazı
                                    </Text>

                                    {/* Button */}
                                    <Button
                                        mt='$2'
                                        bg="rgba(215, 215, 215, 0.8)"
                                        borderWidth={1}
                                        borderColor="#ADADAD"
                                        borderRadius={10}
                                        width={65}
                                        height={24}
                                        onPress={() => navigation.navigate('BrandProductBookScreen')}
                                    >
                                        <HStack alignItems="center" space="xs">
                                            <ButtonText
                                                color="#000000"
                                                fontSize={9}
                                                fontWeight="$bold"
                                            >
                                                View
                                            </ButtonText>
                                            <Feather name="chevron-right" size={12} color="#000000" />
                                        </HStack>
                                    </Button>
                                </VStack>
                            </Box>
                        </HStack>
                    </VStack>

                    {/* All Posts Section */}
                    <VStack space="xs" mb="$3">
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text
                                color={isDark ? '#FFFFFF' : '#9D9D9D'}
                                fontSize={12}
                                fontWeight="$bold"
                            >
                                All Posts
                            </Text>
                        </HStack>

                        {/* Posts */}
                        <VStack space="sm">
                            {brand.posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    data={post}
                                />
                            ))}
                        </VStack>
                    </VStack>
                </VStack>
            </Animated.ScrollView>
        </Box>
        </SafeAreaView>
    );
};

export default BrandDetailScreen;
