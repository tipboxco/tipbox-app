import React from 'react';
import { ScrollView, VStack, HStack, Text, Image, Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import { mock_news_detail } from '@/src/mock/catalog/brandProductDetail/newsDetail';

type NewsDetailScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'NewsDetailScreen'>;
type NewsDetailScreenRouteProp = RouteProp<CatalogStackParamList, 'NewsDetailScreen'>;

const NewsDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NewsDetailScreenNavigationProp>();
  const route = useRoute<NewsDetailScreenRouteProp>();

  const { newsId } = route.params;

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
          {/* News Image */}
          <Box
            width="100%"
            height={143}
            borderRadius={5}
            bg="rgba(0, 0, 0, 0.2)"
            overflow="hidden"
            mb="$4"
          >
            <Image
              source={mock_news_detail.image}
              alt={mock_news_detail.title}
              style={{
                width: '100%',
                height: '100%',
              }}
              resizeMode="cover"
            />
          </Box>

          {/* News Content */}
          <VStack space="md">
            {/* Source and Date */}
            <HStack alignItems="center" space="xs">
              <Feather name="book-open" size={12} color="#B9B9B9" />
              <Text
                color="#B9B9B9"
                fontSize={9}
                fontWeight="$medium"
              >
                {mock_news_detail.source} - {mock_news_detail.date}
              </Text>
            </HStack>

            {/* Title */}
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={16}
              fontWeight="$bold"
              lineHeight={20}
            >
              {mock_news_detail.title}
            </Text>

            {/* Content */}
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={9}
              lineHeight={12}
              textAlign="justify"
            >
              {mock_news_detail.content}
            </Text>
          </VStack>
        </VStack>
      </ScrollView>
    </VStack>
  );
};

export default NewsDetailScreen;
