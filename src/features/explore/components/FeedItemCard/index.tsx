import React from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from '@/src/hooks/useTranslation';
import PostCard from '@/src/components/PostCards/PostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import { CardType, ProductInfoType } from '@/src/types/common';
import { toImageSource, isSameImageSource } from '@/src/utils';
import type { FeedApiItem } from '@/src/features/feed/api/feedApi';
import type { BenchmarkApiItem, BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { ProfilePost } from '@/src/features/profile/types';
import type { TipsApiItem, TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem, QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ExperiencePostApiItem, ExperiencePostCardData, ExperiencePostCardContentItem } from '@/src/types/ExperienceCard';
import type { UpdateApiItem, UpdateCardData } from '@/src/types/UpdateCard';
import type { PostCardData } from '@/src/types/PostCard';

/**
 * FeedItemCard
 * Bir feed item'ını (post/experience/benchmark/tips/question/update) doğru
 * kart bileşenine map'leyip render eder. Hottest tab ve arama sonuçları gibi
 * feed item listeleyen ekranlar tarafından paylaşılır (tek kaynak, kod tekrarı yok).
 */

// Map Feed to PostCardData
const mapFeedToCardData = (item: ProfilePost): PostCardData => {
  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const contentString = Array.isArray(item.content)
    ? item.content.map((contentItem) => contentItem.content || '').join(' ')
    : (item.content || '');

  // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
  // Kullanıcı post oluştururken görsel eklemek istememiş olabilir, bu durumda görsel alanı gösterilmemeli
  const mappedImages = Array.isArray(item.images)
    ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
    : [];
  const images = mappedImages;

  // contextData.image için fallback
  const contextImage = item.contextData?.image
    ? toImageSource(item.contextData.image)
    : undefined;
  const contextData = item.contextData
    ? {
        ...item.contextData,
        image: contextImage || item.contextData.image || defaultPostImage,
      }
    : undefined;

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: toImageSource(item.user.avatar)!,
    },
    content: contentString,
    images,
    stats: item.stats,
    createdAt: item.createdAt,
    contextType: item.contextType,
    contextData,
  };
};

// Map Experience (ExperiencePostApiItem) to ExperiencePostCardData
const mapExperienceToCardData = (
  item: ExperiencePostApiItem & { type: 'experience' },
  t: TFunction,
): ExperiencePostCardData => {
  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const avatarSource = toImageSource(item.user.avatar)!;
  const ctx = item.contextData as { product?: { id?: string; name?: string; image?: string | null; subName?: string; isOwned?: boolean } } | undefined;
  const rawProduct = ctx?.product ?? item.contextData ?? item.product;
  const productImage = rawProduct?.image ? toImageSource(rawProduct.image) : undefined;

  const contentBlocks = item.experienceContent ?? (Array.isArray(item.content) ? item.content : []);
  const content: ExperiencePostCardContentItem[] = Array.isArray(contentBlocks)
    ? contentBlocks.map((contentItem) => ({
        tag: {
          icon: (contentItem.title?.toLowerCase?.().includes('product') || contentItem.title?.toLowerCase?.().includes('usage')) ? 'package' : 'tag',
          title: contentItem.title,
        },
        text: contentItem.content,
        rating: Array(5)
          .fill(false)
          .map((_, index) => index < (contentItem.rating || 0)),
      }))
    : [];

  const mappedImages = item.images
    ?.map((img) => toImageSource(img))
    .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
  // Carousel'de sadece kullanıcı yüklediği görseller; ürün görseli gösterilmez
  const filteredImages = mappedImages.filter((img) => !isSameImageSource(img, productImage ?? defaultPostImage));
  const images = filteredImages;

  const isOwned = item.status === 'own' || rawProduct?.isOwned || false;
  const subNameRaw = rawProduct?.subName ?? '';
  const subName = subNameRaw && !/^Status:\s*(tested|own)$/i.test(String(subNameRaw)) ? subNameRaw : '';
  const tagsFromApi = Array.isArray(item.tags) ? item.tags : [];
  const tags =
    tagsFromApi.length >= 3
      ? tagsFromApi
      : [item.durationName, item.locationName, item.purposeName].filter((s): s is string => !!s);

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: avatarSource,
      action: t('card.addedToInventory'),
    },
    contextData: {
      id: rawProduct?.id || '',
      name: rawProduct?.name || '',
      subName,
      image: productImage ?? defaultPostImage,
      isOwned,
    },
    content,
    tags,
    images,
    stats: item.stats,
    createdAt: item.createdAt,
  };
};

// Map Benchmark to BenchmarkCardData
const mapBenchmarkToCardData = (item: BenchmarkApiItem & { type: 'benchmark' }): BenchmarkCardData => {
  const avatarSource = toImageSource(item.user.avatar)!;

  const products: BenchmarkProduct[] = (item.products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    subName: p.subName,
    image: toImageSource(p.image)!,
    isOwned: p.isOwned,
    choice: p.choice,
  }));

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: avatarSource,
    },
    products,
    content: item.content,
    stats: item.stats,
    createdAt: item.createdAt,
  };
};

// Map Tips to TipsCardData
const mapTipsToCardData = (item: TipsApiItem & { type: 'tipsAndTricks' }): TipsCardData => {
  const avatarSource = toImageSource(item.user.avatar)!;
  const contextImage = toImageSource(item.contextData.image)!;

  // CRITICAL: contextType'a göre product veya category mapping yap
  let category: TipsCategory;

  if (item.contextType === 'sub_category') {
    // SubCategory: sadece category bilgisi, product YOK
    category = {
      id: item.contextData.id,
      name: item.contextData.name,
      subCategory: item.contextData.subName,
      image: contextImage,
      // product undefined bırak
    };
  } else {
    // Product veya ProductGroup: category.product dolu
    const product: TipsProduct = {
      id: item.contextData.id,
      name: item.contextData.name,
      subName: item.contextData.subName,
      image: contextImage,
      isOwned: item.contextData.isOwned,
    };

    category = {
      id: item.contextData.id,
      name: item.contextData.name,
      subCategory: item.contextData.subName,
      image: contextImage,
      product,
    };
  }

  // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
  const mappedImages = item.images
    ?.map((img) => toImageSource(img))
    .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
  const images = mappedImages;

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: avatarSource,
    },
    category,
    content: item.content,
    images,
    stats: item.stats,
    tag: item.tag,
    benefitCategory: item.benefitCategory,
    createdAt: item.createdAt,
  };
};

// Map Question to QuestionCardData
const mapQuestionToCardData = (item: QuestionApiItem & { type: 'question' }): QuestionCardData => {
  const avatarSource = toImageSource(item.user.avatar)!;
  const contextImage = toImageSource(item.contextData.image)!;

  // CRITICAL: contextType'a göre product veya category mapping yap
  let category: QuestionCardCategory;

  if (item.contextType === 'sub_category') {
    // SubCategory: category dolu, product YOK
    category = {
      id: item.contextData.id,
      name: item.contextData.name,
      subCategory: item.contextData.subName,
      image: contextImage,
      // product undefined bırak
    };
  } else {
    // Product veya ProductGroup: category.product dolu
    const product: QuestionCardProduct = {
      id: item.contextData.id,
      name: item.contextData.name,
      subName: item.contextData.subName,
      image: contextImage,
      isOwned: item.contextData.isOwned,
    };

    category = {
      id: item.contextData.id,
      name: item.contextData.name,
      subCategory: item.contextData.subName,
      image: contextImage,
      product,
    };
  }

  // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
  const mappedImages = item.images
    ?.map((img) => toImageSource(img))
    .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
  const images = mappedImages;

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: avatarSource,
    },
    category,
    content: item.content,
    isBoosted: item.isBoosted,
    boostedUntil: item.boostedUntil,
    boostPrice: item.boostPrice,
    images,
    stats: item.stats,
    createdAt: item.createdAt,
  };
};

// Map Update to UpdateCardData
const mapUpdateToCardData = (item: UpdateApiItem & { type: 'update' }): UpdateCardData => {
  const avatarSource = toImageSource(item.user.avatar)!;

  let productInfoType: ProductInfoType = ProductInfoType.PRODUCT;
  if (item.contextType === 'product_group') {
    productInfoType = ProductInfoType.PRODUCT_GROUP;
  } else if (item.contextType === 'sub_category') {
    productInfoType = ProductInfoType.SUB_CATEGORY;
  }

  // relatedPost null check
  if (!item.relatedPost) {
    console.warn('[mapUpdateToCardData] Missing relatedPost for item:', item.id);
    const mappedImages = item.images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img) ?? [];
    const images = mappedImages.length > 0 ? mappedImages : [require('@/assets/defaultImages/default-post.png')];

    return {
      id: item.id,
      user: {
        id: item.user.id,
        name: item.user.name,
        title: item.user.title,
        avatar: avatarSource,
      },
      stats: item.stats,
      createdAt: item.createdAt,
      contextType: productInfoType,
      product: {
        id: '',
        name: '',
        subName: '',
        image: require('@/assets/inventory/product_01.png'),
        isOwned: false,
      },
      content: item.content || '',
      experienceContent: item.experienceContent,
      images,
      relatedPost: undefined,
    };
  }

  const relatedPostContent = (item.relatedPost?.content && Array.isArray(item.relatedPost.content))
    ? item.relatedPost.content
        .filter((contentItem) => contentItem != null)
        .map((contentItem) => {
          const ratingArray: number[] = Array(5).fill(0);
          const ratingValue = Math.min(Math.max(Math.round((contentItem?.rating || 0) / 20), 0), 5);
          for (let i = 0; i < ratingValue; i++) {
            ratingArray[i] = 1;
          }

          return {
            tag: {
              icon: 'tag',
              title: contentItem?.title || '',
            },
            text: contentItem?.content || '',
            rating: ratingArray,
          };
        })
    : [];

  // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
  // Kullanıcı post oluştururken görsel eklemek istememiş olabilir, bu durumda görsel alanı gösterilmemeli
  const mappedImages = Array.isArray(item.images)
    ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
    : [];
  const images = mappedImages;

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: avatarSource,
    },
    stats: item.stats,
    createdAt: item.createdAt,
    contextType: productInfoType,
    product: {
      id: item.relatedPost?.product?.id || '',
      name: item.relatedPost?.product?.name || '',
      subName: item.relatedPost?.product?.subName || '',
      image: toImageSource(item.relatedPost?.product?.image) || require('@/assets/inventory/product_01.png'),
      isOwned: item.relatedPost?.product?.isOwned || false,
    },
    content: item.content,
    experienceContent: item.experienceContent,
    images,
    relatedPost: item.relatedPost ? {
      id: item.relatedPost.id,
      product: {
        id: item.relatedPost.product?.id || '',
        name: item.relatedPost.product?.name || '',
        subName: item.relatedPost.product?.subName || '',
        image: toImageSource(item.relatedPost.product?.image) || require('@/assets/inventory/product_01.png'),
        isOwned: item.relatedPost.product?.isOwned || false,
      },
      content: relatedPostContent,
      tags: item.relatedPost.tags || [],
      images: item.relatedPost.images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img),
    } : undefined,
  };
};

interface FeedItemCardProps {
  item: FeedApiItem;
}

const FeedItemCardComponent: React.FC<FeedItemCardProps> = ({ item }) => {
  const { t } = useTranslation('post');

  switch (item.type) {
    case CardType.EXPERIENCE:
    case 'experience':
      if (('contextData' in item.data || 'product' in item.data || 'contextType' in item.data) &&
          ('experienceContent' in item.data || 'content' in item.data)) {
        return (
          <ExperiencePostCard
            data={mapExperienceToCardData(item.data as ExperiencePostApiItem & { type: 'experience' }, t)}
          />
        );
      }
      return null;
    case CardType.POST:
      return (
        <PostCard
          data={mapFeedToCardData(item.data as ProfilePost)}
        />
      );
    case CardType.BENCHMARK:
      return (
        <BenchmarkPostCard
          data={mapBenchmarkToCardData(item.data as BenchmarkApiItem & { type: 'benchmark' })}
        />
      );
    case CardType.QUESTION:
      if ('contextType' in item.data && 'contextData' in item.data && 'isBoosted' in item.data) {
        return (
          <QuestionPostCard
            data={mapQuestionToCardData(item.data as QuestionApiItem & { type: 'question' })}
          />
        );
      }
      return null;
    case CardType.TIPS_AND_TRICKS:
      return (
        <TipsAndTricksPostCard
          data={mapTipsToCardData(item.data as TipsApiItem & { type: 'tipsAndTricks' })}
        />
      );
    case CardType.UPDATE:
      if ('relatedPost' in item.data && 'contextType' in item.data) {
        return (
          <UpdatePostCard
            data={mapUpdateToCardData(item.data as UpdateApiItem & { type: 'update' })}
          />
        );
      }
      return null;
    default:
      return null;
  }
};

// React.memo ile gereksiz re-render'ları önle (item referansı sabit kaldığında re-render yok)
export const FeedItemCard = React.memo(FeedItemCardComponent);

export default FeedItemCard;
