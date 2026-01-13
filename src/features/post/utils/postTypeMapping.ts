/**
 * Post Type Mapping Utilities
 * Frontend post type ↔ Backend tag/type mapping fonksiyonları
 * 
 * @see docs/MOBILE_API_COMPATIBILITY.md - Backend endpoint dokümantasyonu
 * @see docs/POST_TYPE_FILTER_ANALYSIS.md - Post type filtreleme analizi
 */

/**
 * Frontend Post Type → Backend Tag Mapping
 * Filter/Sort bottom sheet'te kullanılan post type'ları backend tag'lerine çevirir
 */
export const mapPostTypeToTag = (postType: string): string | undefined => {
  const mapping: Record<string, string> = {
    'All': undefined,
    'Generals': 'Review', // Free posts
    'Reviews': 'Review', // Experience posts (product seviyesinde)
    'Tips & Tricks': 'Tips',
    'Questions': 'Question',
    'Benchmarks': 'Benchmark',
    'Updates': 'Update',
  };
  
  return mapping[postType];
};

/**
 * Backend Tag → Frontend Post Type Mapping
 * Backend'den gelen tag'leri frontend post type'larına çevirir
 */
export const mapTagToPostType = (tag: string): string => {
  const mapping: Record<string, string> = {
    'Review': 'Generals', // Free posts
    'Tips': 'Tips & Tricks',
    'Question': 'Questions',
    'Experience': 'Reviews', // Experience posts
    'Update': 'Updates',
    'Benchmark': 'Benchmarks',
  };
  
  return mapping[tag] || tag;
};

/**
 * Frontend Post Type → Backend `type` Parametresi Mapping
 * Catalog posts endpoint'lerinde kullanılan `type` parametresine çevirir
 */
export const mapPostTypeToCatalogType = (postType: string): 'tips' | 'experience' | 'comments' | 'benchmark' | undefined => {
  const mapping: Record<string, 'tips' | 'experience' | 'comments' | 'benchmark' | undefined> = {
    'All': undefined,
    'Generals': 'comments', // Free ve Question gönderileri
    'Reviews': 'experience', // Experience ve Update gönderileri
    'Tips & Tricks': 'tips',
    'Questions': 'comments', // Free ve Question gönderileri
    'Benchmarks': 'benchmark',
    'Updates': 'experience', // Experience ve Update gönderileri
  };
  
  return mapping[postType];
};

/**
 * Backend `type` Parametresi → Frontend Post Type Mapping
 * Catalog posts endpoint'lerinden gelen `type` parametresini frontend post type'ına çevirir
 */
export const mapCatalogTypeToPostType = (type: string): string => {
  const mapping: Record<string, string> = {
    'tips': 'Tips & Tricks',
    'experience': 'Reviews', // Experience ve Update gönderileri
    'comments': 'Generals', // Free ve Question gönderileri
    'benchmark': 'Benchmarks',
  };
  
  return mapping[type] || type;
};

/**
 * Context Seviyesine Göre İzin Verilen Post Type'lar
 * Her context seviyesi için hangi post type'ların gösterilebileceğini belirler
 */
export const getAllowedPostTypesForContext = (
  contextType: 'sub_category' | 'product_group' | 'product'
): string[] => {
  switch (contextType) {
    case 'sub_category':
    case 'product_group':
      // Sadece Free, Tips, Question (Experience, Update, Benchmark hariç)
      return ['All', 'Generals', 'Tips & Tricks', 'Questions'];
    case 'product':
      // Tüm post type'lar
      return ['All', 'Reviews', 'Tips & Tricks', 'Benchmarks', 'Updates', 'Questions'];
    default:
      return [];
  }
};

/**
 * Frontend Sort → Backend Sort Mapping
 * Filter/Sort bottom sheet'te kullanılan sort değerlerini backend sort değerlerine çevirir
 */
export const mapSortToBackend = (sort: 'newest' | 'oldest' | 'popular'): 'recent' | 'top' => {
  const mapping: Record<string, 'recent' | 'top'> = {
    'newest': 'recent',
    'oldest': 'recent', // Backend'de oldest için ayrı bir sort yok, recent kullanılır
    'popular': 'top',
  };
  
  return mapping[sort] || 'recent';
};

/**
 * Backend Sort → Frontend Sort Mapping
 * Backend'den gelen sort değerlerini frontend sort değerlerine çevirir
 */
export const mapSortFromBackend = (sort: 'recent' | 'top'): 'newest' | 'oldest' | 'popular' => {
  const mapping: Record<string, 'newest' | 'oldest' | 'popular'> = {
    'recent': 'newest',
    'top': 'popular',
  };
  
  return mapping[sort] || 'newest';
};

/**
 * Post Type Filter Options
 * Context seviyesine göre filter bottom sheet'te gösterilecek post type seçenekleri
 */
export const getPostTypeFilterOptions = (
  contextType: 'sub_category' | 'product_group' | 'product'
): Array<{ value: string; label: string }> => {
  const allowedTypes = getAllowedPostTypesForContext(contextType);
  
  return allowedTypes.map(type => ({
    value: type,
    label: type,
  }));
};

/**
 * Sort Options
 * Filter/Sort bottom sheet'te gösterilecek sort seçenekleri
 */
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'popular', label: 'Most Popular' },
] as const;
