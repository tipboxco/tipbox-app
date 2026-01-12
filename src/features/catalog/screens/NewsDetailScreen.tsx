import React from 'react';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, VStack, HStack, Text, Image, Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { BookOpenIcon } from 'react-native-heroicons/outline';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { useNewsDetail } from '../api/hooks';

type NewsDetailScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'NewsDetailScreen'>;
type NewsDetailScreenRouteProp = RouteProp<CatalogStackParamList, 'NewsDetailScreen'>;

const NewsDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NewsDetailScreenNavigationProp>();
  const route = useRoute<NewsDetailScreenRouteProp>();
  const bottomInset = useSafeAreaValues('bottom');

  const { newsId } = route.params;

  // API hook
  const { data: newsDetail, isLoading, error } = useNewsDetail(newsId);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title="Marka Ürünleri Defteri"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          flex={1}
          contentContainerStyle={{ paddingBottom: bottomInset }}
        >
          {isLoading ? (
            <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
              <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
                Loading news...
              </Text>
            </VStack>
          ) : error ? (
            <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
              <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
                Error loading news
              </Text>
            </VStack>
          ) : newsDetail ? (
            <VStack space="md" p="$4">
              {/* News Image */}
              {newsDetail.image && (
                <Box
                  width="100%"
                  height={143}
                  borderRadius={5}
                  bg="rgba(0, 0, 0, 0.2)"
                  overflow="hidden"
                  mb="$4"
                >
                  <Image
                    source={toImageSource(newsDetail.image)}
                    alt={newsDetail.title}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    resizeMode="cover"
                  />
                </Box>
              )}

              {/* News Content */}
              <VStack space="md">
                {/* Source and Date */}
                <HStack alignItems="center" space="xs">
                  <BookOpenIcon width={12} height={12} color="#B9B9B9" />
                  <Text
                    color="#B9B9B9"
                    fontSize={9}
                    fontWeight="$medium"
                  >
                    {newsDetail.source} - {new Date(newsDetail.date).toLocaleDateString('tr-TR')}
                  </Text>
                </HStack>

                {/* Title */}
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={16}
                  fontWeight="$bold"
                  lineHeight={20}
                >
                  {newsDetail.title}
                </Text>

                {/* Author (if available) */}
                {newsDetail.author && (
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize={12}
                    fontWeight="$medium"
                  >
                    Yazar: {newsDetail.author}
                  </Text>
                )}

                {/* Tags (if available) */}
                {newsDetail.tags && newsDetail.tags.length > 0 && (
                  <HStack flexWrap="wrap" space="xs">
                    {newsDetail.tags.map((tag, index) => (
                      <Box
                        key={index}
                        bg={isDark ? '#1A1A1A' : '#F0F0F0'}
                        px="$2"
                        py="$1"
                        borderRadius={5}
                      >
                        <Text fontSize={9} color={isDark ? '#FFFFFF' : '#000000'}>
                          #{tag}
                        </Text>
                      </Box>
                    ))}
                  </HStack>
                )}

                {/* Content */}
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={9}
                  lineHeight={12}
                  textAlign="justify"
                >
                  {newsDetail.content}
                </Text>
              </VStack>
            </VStack>
          ) : null}
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default NewsDetailScreen;
