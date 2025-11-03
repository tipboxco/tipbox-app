import React, { useState } from 'react';
import { ScrollView, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import BrandProductInfoCard from '../components/BrandProductInfoCard';
import FilterTabs from '../components/FilterTabs';
import { ExperiencePostCard } from '@/src/components/PostCards/ExperiencePostCard';
import NewsCard from '../components/NewsCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import { mock_brand_product_experience_posts } from '@/src/mock/catalog/brandProductDetail/experiencePosts';
import { mock_news_data } from '@/src/mock/catalog/brandProductDetail/news';
import { mock_benchmark_posts } from '@/src/mock/catalog/brandProductDetail/benchmark';

type BrandProductDetailScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandProductDetailScreen'>;
type BrandProductDetailScreenRouteProp = RouteProp<CatalogStackParamList, 'BrandProductDetailScreen'>;

const BrandProductDetailScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<BrandProductDetailScreenNavigationProp>();
    const route = useRoute<BrandProductDetailScreenRouteProp>();
    const [selectedTab, setSelectedTab] = useState('Deneyim Paylaşımı');

    const { productId } = route.params;

    const filterTabs = ['Deneyim Paylaşımı', 'Yorumlar', 'Karşılaştırmalar', 'Haberler'];

    const handleTabChange = (tab: string) => {
        setSelectedTab(tab);
    };

    const renderContent = () => {
        if (selectedTab === 'Haberler') {
            return (
                <VStack space="md">
                    {mock_news_data.map((news) => (
                        <NewsCard
                            key={news.id}
                            id={news.id}
                            title={news.title}
                            description={news.description}
                            source={news.source}
                            date={news.date}
                            image={news.image}
                            onPress={() => navigation.navigate('NewsDetailScreen', { newsId: news.id })}
                        />
                    ))}
                </VStack>
            );
        }

        if (selectedTab === 'Karşılaştırmalar') {
            return (
                <VStack space="md">
                    {mock_benchmark_posts.map((post) => (
                        <BenchmarkPostCard
                            key={post.id}
                            data={post}
                        />
                    ))}
                </VStack>
            );
        }

        // Default: Deneyim Paylaşımı posts
        return (
            <VStack space="md">
                {mock_brand_product_experience_posts.map((post) => (
                    <ExperiencePostCard
                        key={post.id}
                        data={post}
                    />
                ))}
            </VStack>
        );
    };

    return (
        <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            {/* Header */}
            <Header
                title="Marka Ürünleri Defteri"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView flex={1}>
                <VStack space="md" p="$4">
                    {/* Product Info Card */}
                    <BrandProductInfoCard
                        productName="iPhone 16 Pro Max"
                        productImage={require('@/assets/events/card-icon.png')}
                    />

                    {/* Filter Tabs */}
                    <FilterTabs
                        tabs={filterTabs}
                        onTabChange={handleTabChange}
                    />

                    {/* Dynamic Content */}
                    {renderContent()}
                </VStack>
            </ScrollView>
        </VStack>
    );
};

export default BrandProductDetailScreen;
