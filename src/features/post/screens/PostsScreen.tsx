import React, { useRef, useMemo, useCallback, useState } from 'react';
import { Box, ScrollView, VStack, Pressable } from '@gluestack-ui/themed';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { CreateButton } from '../components/CreateButton';
import PostCard from '@/src/components/PostCards/PostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import { CreatePostBottomSheet } from '@/src/components/CreatePostBottomSheet';
import { mock_posts } from '@/src/mock/profile/posts';
import { mock_tips_and_tricks_posts } from '@/src/mock/profile/tipsAndTricks';
import { mock_questions } from '@/src/mock/profile/questions';
import { mock_benchmark_posts } from '@/src/mock/profile/benchmark';
import { mock_post_cards } from '@/src/mock/profile/feed';
import { mock_feed_data } from '@/src/mock/feed';
import { UpdatePost } from '@/src/mock/feed/types';
import type { PostStackParamList } from '../navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

// Mock data for product info
const productInfo = {
  image: require('@/assets/product/product_01.png'),
  title: 'Computers & Tablet\nTechnology Subcategories',
};

type PostsScreenRouteProp = RouteProp<PostStackParamList, 'PostsScreen'>;
type PostsScreenNavigationProp = NativeStackNavigationProp<PostStackParamList>;

export const PostsScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<PostsScreenNavigationProp>();
  const route = useRoute<PostsScreenRouteProp>();
  
  const { stage, name } = route.params || { stage: 'SubCategories', name: 'Subcategory Feed' };

  // Bottom sheet refs
  const createPostBottomSheetRef = useRef<BottomSheet>(null);
  const [bottomSheetKey, setBottomSheetKey] = useState(0);

  // Bottom sheet snap points
  const createPostSnapPoints = useMemo(() => ['85%'], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  // Convert stage from PostsScreen to CatalogStage format
  const getCatalogStage = (): 'subcategories' | 'productgroups' | 'products' | undefined => {
    switch (stage) {
      case 'SubCategories':
        return 'subcategories';
      case 'ProductGroup':
        return 'productgroups';
      case 'Product':
        return 'products';
      default:
        return undefined;
    }
  };

  const handleFilterPress = () => {
    // Handle filter/sort action
    console.log('Filter/Sort pressed');
  };

  const handleCreatePress = () => {
    // Reset bottom sheet key to remount component and reset view
    setBottomSheetKey(prev => prev + 1);
    // Open bottom sheet
    if (createPostBottomSheetRef.current) {
      createPostBottomSheetRef.current.snapToIndex(0);
    } else {
      setTimeout(() => {
        if (createPostBottomSheetRef.current) {
          createPostBottomSheetRef.current.snapToIndex(0);
        }
      }, 100);
    }
  };

  const handleSheetChanges = useCallback((index: number) => {
    // Reset bottom sheet key when sheet closes to reset view state
    if (index === -1) {
      setBottomSheetKey(prev => prev + 1);
    }
  }, []);

  const handlePostTypeSelect = (type: string) => {
    console.log('Post type selected:', type);
    
    // Close bottom sheet first
    createPostBottomSheetRef.current?.close();
    
    // Navigate to appropriate screen based on post type
    if (type === 'free') {
      navigation.navigate('CreatePostScreen');
    } else if (type === 'tips') {
      navigation.navigate('CreateTipsAndTrickPostScreen');
    } else if (type === 'question') {
      navigation.navigate('CreateQuestionPostScreen');
    } else if (type === 'comparison') {
      navigation.navigate('CreateBenchmarkPostScreen', {
        product: undefined, // PostsScreen'den gelenlerde product yok, kullanıcı manuel seçecek
      });
    } else if (type === 'update') {
      navigation.navigate('CreateUpdatePostScreen', {
        product: undefined, // PostsScreen'den gelenlerde product yok
      });
    }
    // Handle other post types here if needed
  };

  const handleViewChange = (view: 'options' | 'experience' | 'product-selection') => {
    console.log('BottomSheet view changed:', view);
  };

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
      {/* Header */}
      <Header
        title={name}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightAction={
          <Pressable onPress={handleFilterPress}>
            <Feather
              name="filter"
              size={24}
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </Pressable>
        }
      />

      {/* Content */}
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space="md">
          {/* Product Info Card */}
          <Box px="$4" py="$2">
            <ProductInfoCard
              image={productInfo.image}
              title={productInfo.title}
              type="big"
            />
          </Box>

          {/* Posts */}
          <VStack px={16} space="md">
            {/* PostCard */}
            {mock_posts.length > 0 && (
              <PostCard
                data={mock_posts[0]}
                hideProduct={true}
              />
            )}

            {/* TipsAndTricksPostCard */}
            {mock_tips_and_tricks_posts.length > 0 && (
              <TipsAndTricksPostCard
                data={mock_tips_and_tricks_posts[0]}
                hideProduct={true}
              />
            )}

            {/* QuestionPostCard */}
            {mock_questions.length > 0 && (
              <QuestionPostCard
                data={mock_questions[0]}
                hideProduct={true}
              />
            )}

            {/* BenchmarkPostCard */}
            {mock_benchmark_posts.length > 0 && (
              <BenchmarkPostCard
                data={mock_benchmark_posts[0]}
              />
            )}

            {/* ExperiencePostCard */}
            {mock_post_cards.length > 0 && (
              <ExperiencePostCard
                data={mock_post_cards[0]}
                hideProduct={true}
              />
            )}

            {/* UpdatePostCard */}
            {(() => {
              const updatePost = mock_feed_data.find(item => item.type === 'update') as UpdatePost | undefined;
              return updatePost ? (
                <UpdatePostCard
                  data={updatePost}
                  hideProduct={true}
                />
              ) : null;
            })()}
          </VStack>
        </VStack>
      </ScrollView>

      {/* Create Button */}
      <CreateButton onPress={handleCreatePress} />

      {/* Create Post Bottom Sheet */}
      <BottomSheet
        ref={createPostBottomSheetRef}
        index={-1}
        snapPoints={createPostSnapPoints}
        enablePanDownToClose
        enableOverDrag={false}
        enableHandlePanningGesture={true}
        enableContentPanningGesture={true}
        animateOnMount={true}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
        backgroundStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#333333' : '#CCCCCC',
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView>
          <CreatePostBottomSheet
            key={bottomSheetKey}
            onClose={() => {
              createPostBottomSheetRef.current?.close();
            }}
            onPostTypeSelect={handlePostTypeSelect}
            onViewChange={handleViewChange}
            stage={getCatalogStage()}
          />
        </BottomSheetView>
      </BottomSheet>
    </Box>
  );
};

