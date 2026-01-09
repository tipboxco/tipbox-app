import { ProductInfoType } from '@/src/types/common';

/**
 * API Context Type - Backend'de kullanılan context type formatı
 */
export type ApiContextType = 'sub_category' | 'product_group' | 'product';

/**
 * ProductInfoType'ı API contextType'a çevir
 */
export const mapProductInfoTypeToContextType = (
  productInfoType: ProductInfoType
): ApiContextType => {
  switch (productInfoType) {
    case ProductInfoType.SUB_CATEGORY:
      return 'sub_category';
    case ProductInfoType.PRODUCT_GROUP:
      return 'product_group';
    case ProductInfoType.PRODUCT:
      return 'product';
    default:
      return 'sub_category';
  }
};

/**
 * Create Post Request Body
 */
export interface CreatePostRequest {
  contextType: ApiContextType;
  contextId: string;
  description: string;
  images?: string[]; // Array of image URIs or base64 strings
  eventId?: string; // Optional - Event ID for event-related posts
}

/**
 * Create Post Response
 */
export interface CreatePostResponse {
  id: string;
  message: string;
  success: boolean;
}

