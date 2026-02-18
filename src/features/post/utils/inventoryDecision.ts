/**
 * Inventory Decision Logic Utility
 * Determines what action to take based on product inventory status
 */

/**
 * Possible actions when creating a post with a product
 * - 'create_post': Product already in inventory, just create the post
 * - 'add_to_inventory': Need to add product to inventory first (skip post creation for now)
 * - 'add_and_create_post': Add to inventory AND create post immediately
 */
export type InventoryAction = 'create_post' | 'add_to_inventory' | 'add_and_create_post';

export interface InventoryDecisionParams {
  /** Product ID to check */
  productId: string;
  /** Set of product IDs already in user's inventory */
  existingInventoryIds: Set<string>;
  /** Experience option (only for experience posts) */
  experienceOption?: 'own' | 'tried';
  /** Whether product is being selected from existing inventory */
  fromInventory?: boolean;
  /** Post type being created */
  postType: 'experience' | 'benchmark' | 'question' | 'tips' | 'update';
}

export interface InventoryDecisionResult {
  action: InventoryAction;
  message: string;
  requiresInventoryAdd: boolean;
  proceedWithPostCreation: boolean;
}

/**
 * Determines what action to take based on product inventory status
 * @param params - Decision parameters
 * @returns Decision result with action and human-readable message
 */
export const getInventoryDecision = (
  params: InventoryDecisionParams
): InventoryDecisionResult => {
  const {
    productId,
    existingInventoryIds,
    experienceOption,
    fromInventory,
    postType,
  } = params;

  const isInInventory = existingInventoryIds.has(productId);

  // For experience posts with 'own' option
  if (postType === 'experience') {
    if (experienceOption === 'own') {
      if (isInInventory) {
        // Already in inventory, just create post
        return {
          action: 'create_post',
          message: 'Ürün envanterinizde zaten var. Hemen post oluşturuluyor...',
          requiresInventoryAdd: false,
          proceedWithPostCreation: true,
        };
      } else if (!fromInventory) {
        // Not in inventory, need to add it first
        return {
          action: 'add_and_create_post',
          message: 'Ürün envanterine eklenecek ve post oluşturulacak...',
          requiresInventoryAdd: true,
          proceedWithPostCreation: true, // Will happen after inventory add succeeds
        };
      }
    }

    // Experience with 'tried' option - no inventory requirement
    if (experienceOption === 'tried') {
      return {
        action: 'create_post',
        message: 'Post oluşturuluyor...',
        requiresInventoryAdd: false,
        proceedWithPostCreation: true,
      };
    }
  }

  // For benchmark posts
  if (postType === 'benchmark') {
    // First product must be in inventory (backend validates this)
    // For second product, user can choose from catalog
    if (isInInventory) {
      return {
        action: 'create_post',
        message: 'Ürün envanterinizde var. Post oluşturuluyor...',
        requiresInventoryAdd: false,
        proceedWithPostCreation: true,
      };
    } else {
      // For benchmark, if first product not in inventory, need to select from inventory
      return {
        action: 'add_to_inventory',
        message: 'Bu ürün envanterinizde olmalıdır. Lütfen envanterinizdeki ürünü seçiniz.',
        requiresInventoryAdd: true,
        proceedWithPostCreation: false,
      };
    }
  }

  // For other post types (question, tips, update) - no inventory requirement
  return {
    action: 'create_post',
    message: 'Post oluşturuluyor...',
    requiresInventoryAdd: false,
    proceedWithPostCreation: true,
  };
};

/**
 * Helper to check if inventory add is required before proceeding
 */
export const shouldAddToInventoryFirst = (decision: InventoryDecisionResult): boolean => {
  return decision.requiresInventoryAdd;
};

/**
 * Helper to check if post creation can proceed
 */
export const canProceedWithPostCreation = (decision: InventoryDecisionResult): boolean => {
  return decision.proceedWithPostCreation;
};
