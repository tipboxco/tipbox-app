import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PostDetailScreen, PostsScreen, CreatePostScreen, CreateTipsAndTrickPostScreen, CreateQuestionPostScreen, CreateExperiencePostScreen, CreateBenchmarkPostScreen, CreateUpdatePostScreen } from './screens';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ProductInfoType } from '@/src/types/common';
import { Product } from '@/src/mock/catalog/productCatalog/types';
import { InventoryItem } from '@/src/features/profile/types';
import { AddProductFromInventory } from '@/src/components/AddProductFromInventory';
import { AddProductFromCatalog } from '@/src/components/AddProductFromCatalog';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { ImageSourcePropType } from 'react-native';

// Post Stack için type tanımlaması
export type PostStackParamList = {
  PostDetailScreen: { 
    postData?: any; 
    postId?: string; // Deep link veya notification'dan gelen postId
    type?: 'post' | 'tipsAndTricks' | 'question' | 'benchmark' | 'experience' | 'update'; 
    showRelatedPost?: boolean; 
    relatedPostData?: any;
    commentId?: string; // Notification'dan gelen commentId (yorumu highlight etmek için)
  };
  PostsScreen: { 
    stage: 'SubCategories' | 'ProductGroup' | 'Product'; 
    name: string;
    productInfo: {
      image: any;
      title: string;
      subName?: string;
    };
    selectedProduct?: {
      id: string;
      name: string;
      description?: string;
      image: any;
    };
    contextType?: ProductInfoType; // Sadece type gönderiliyor, ID store'dan okunacak
    contextId?: string; // Backward compatibility için optional (fallback)
  };
  CreatePostScreen: {
    contextType?: ProductInfoType; // Sadece type gönderiliyor, ID store'dan okunacak
    contextId?: string; // Backward compatibility için optional (fallback)
    productInfo?: {
      image: any;
      title: string;
      subName?: string;
    };
  };
  CreateTipsAndTrickPostScreen: undefined;
  CreateQuestionPostScreen: undefined;
  CreateExperiencePostScreen: { product?: { id: string; name: string; description?: string; image: any; brand?: string }; fromInventory?: boolean; experienceOption?: 'own' | 'tried' };
  CreateBenchmarkPostScreen: { 
    product?: { id: string; name: string; description?: string; image: any };
    selectedProduct?: { id: string; name: string; brand?: string; description?: string; image: any };
    selectedProductField?: 'selectedProduct1' | 'selectedProduct2';
  };
  CreateUpdatePostScreen: { 
    product?: { id: string; name: string; description?: string; image: any; brand?: string }; 
    postId?: string; // Update modu için (mevcut update post'u düzenleme)
    experiencePostId?: string; // Experience post ID (update oluştururken bağlanacak experience post)
    experiencePost?: {
      id: string;
      content: Array<{ tag: { icon: string; title: string }; text: string; rating: boolean[] }>;
      images?: ImageSourcePropType[];
      product: { id: string; name: string; subName: string; image: any };
    };
  };
  AddProductFromInventory: { 
    returnScreen: 'CreateBenchmarkPostScreen';
    selectedProductField: 'selectedProduct1' | 'selectedProduct2';
  };
  AddProductFromCatalog: { 
    returnScreen: 'CreateBenchmarkPostScreen';
    selectedProductField: 'selectedProduct1' | 'selectedProduct2';
  };
};

const Stack = createNativeStackNavigator<PostStackParamList>();

// Wrapper component for AddProductFromInventory navigation screen
const AddProductFromInventoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<PostStackParamList, 'AddProductFromInventory'>>();
  const { returnScreen, selectedProductField } = route.params || {};

  const handleProductSelect = (product: InventoryItem) => {
    // Navigate back to CreateBenchmarkPostScreen with selected product
    navigation.navigate(returnScreen as any, {
      selectedProduct: {
        id: product.productId || product.id,
        name: product.brand?.model || product.brand?.name || 'Unknown',
        brand: product.brand?.name,
        description: product.brand?.specs || '',
        image: product.image,
      },
      selectedProductField,
    } as any);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <AddProductFromInventory
      onProductSelect={handleProductSelect}
      onClose={handleClose}
    />
  );
};

// Wrapper component for AddProductFromCatalog navigation screen
const AddProductFromCatalogScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<PostStackParamList, 'AddProductFromCatalog'>>();
  const { returnScreen, selectedProductField } = route.params || {};

  const handleProductSelect = (product: Product) => {
    const nameParts = product.name.split(' ');
    const brand = nameParts.length > 1 ? nameParts[0] : undefined;
    const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : product.name;
    
    // Navigate back to CreateBenchmarkPostScreen with selected product
    navigation.navigate(returnScreen as any, {
      selectedProduct: {
        id: product.id,
        name: productName,
        brand: brand,
        description: product.description || '',
        image: product.image,
      },
      selectedProductField,
    } as any);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <AddProductFromCatalog
      onProductSelect={handleProductSelect}
      onClose={handleClose}
    />
  );
};

export const PostNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
        },
      }}
    >
      <Stack.Screen
        name="PostDetailScreen"
        component={PostDetailScreen}
      />
      <Stack.Screen
        name="PostsScreen"
        component={PostsScreen}
      />
      <Stack.Screen
        name="CreatePostScreen"
        component={CreatePostScreen}
      />
      <Stack.Screen
        name="CreateTipsAndTrickPostScreen"
        component={CreateTipsAndTrickPostScreen}
      />
      <Stack.Screen
        name="CreateQuestionPostScreen"
        component={CreateQuestionPostScreen}
      />
      <Stack.Screen
        name="CreateExperiencePostScreen"
        component={CreateExperiencePostScreen}
      />
      <Stack.Screen
        name="CreateBenchmarkPostScreen"
        component={CreateBenchmarkPostScreen}
      />
      <Stack.Screen
        name="CreateUpdatePostScreen"
        component={CreateUpdatePostScreen}
      />
      <Stack.Screen
        name="AddProductFromInventory"
        component={AddProductFromInventoryScreen}
      />
      <Stack.Screen
        name="AddProductFromCatalog"
        component={AddProductFromCatalogScreen}
      />
    </Stack.Navigator>
  );
};
