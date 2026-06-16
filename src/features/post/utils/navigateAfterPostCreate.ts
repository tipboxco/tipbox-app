import { CommonActions } from '@react-navigation/native';
import { ProductInfoType } from '@/src/types/common';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';

interface NavigateAfterPostCreateOptions {
  contextType?: ProductInfoType | null;
  contextId?: string | null;
  productInfo?: { image: any; title: string; subName?: string } | null;
  userId?: string | null;
}

/**
 * Post oluşturma başarılı olduktan sonra navigation stack'i resetleyip uygun
 * ekrana yönlendirir.
 * - Context + productInfo varsa → PostsScreen
 * - Yoksa userId varsa → Profile
 * - Hiçbiri yoksa → Feed
 */
export const navigateAfterPostCreate = (
  navigation: any,
  { contextType, contextId, productInfo, userId }: NavigateAfterPostCreateOptions,
) => {
  if (contextType && contextId && productInfo) {
    let stage: 'SubCategories' | 'ProductGroup' | 'Product' = 'SubCategories';
    switch (contextType) {
      case ProductInfoType.PRODUCT:
        stage = 'Product';
        break;
      case ProductInfoType.PRODUCT_GROUP:
        stage = 'ProductGroup';
        break;
      case ProductInfoType.SUB_CATEGORY:
        stage = 'SubCategories';
        break;
    }

    const currentState = navigation.getState();
    const appRoute = currentState?.routes?.find((route: any) => route.name === 'App');

    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'App', state: appRoute?.state },
          {
            name: ROOT_ROUTES.POST as any,
            state: {
              routes: [
                {
                  name: 'PostsScreen' as any,
                  params: {
                    stage,
                    name: productInfo.title,
                    productInfo,
                    contextType,
                    contextId,
                  },
                },
              ],
              index: 0,
            },
          },
        ],
      }),
    );
    return;
  }

  if (userId) {
    const currentState = navigation.getState();
    const appRoute = currentState?.routes?.find((route: any) => route.name === 'App');

    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'App', state: appRoute?.state },
          {
            name: 'Profile',
            params: { screen: 'ProfileMain', params: { userId } },
          },
        ],
      }),
    );
    return;
  }

  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'App',
          state: {
            routes: [{ name: 'MainTabs', state: { routes: [{ name: 'FeedScreen' }], index: 0 } }],
            index: 0,
          },
        },
      ],
    }),
  );
};
