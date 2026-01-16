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
 * Frontend Post Type → Backend Filter Parametresi Mapping
 * Catalog posts endpoint'lerinde kullanılan `filter` parametresine çevirir
 * 
 * Backend filter değerleri:
 * - all | free | tips_and_tricks | questions | updates | benchmarks | reviews
 */
export const mapPostTypeToFilter = (
  postType: string,
  contextType: 'sub_category' | 'product_group' | 'product'
): 'all' | 'free' | 'tips_and_tricks' | 'questions' | 'updates' | 'benchmarks' | 'reviews' | undefined => {
  const mapping: Record<string, 'all' | 'free' | 'tips_and_tricks' | 'questions' | 'updates' | 'benchmarks' | 'reviews' | undefined> = {
    'All': 'all',
    'Generals': 'free', // Free posts
    'Tips & Tricks': 'tips_and_tricks',
    'Questions': 'questions',
    'Updates': 'updates',
    'Benchmarks': 'benchmarks',
    'Reviews': 'reviews', // Experience posts
  };
  
  const filter = mapping[postType];
  
  // Context seviyesine göre filtre kontrolü
  if (contextType === 'sub_category' || contextType === 'product_group') {
    // Sub category ve product group'da sadece all, free, tips_and_tricks, questions
    if (filter && !['all', 'free', 'tips_and_tricks', 'questions'].includes(filter)) {
      return 'all'; // Geçersiz filter için default
    }
  }
  
  return filter;
};

/**
 * Backend Filter → Frontend Post Type Mapping
 * Backend'den gelen filter değerini frontend post type'ına çevirir
 */
export const mapFilterToPostType = (filter: string): string => {
  const mapping: Record<string, string> = {
    'all': 'All',
    'free': 'Generals',
    'tips_and_tricks': 'Tips & Tricks',
    'questions': 'Questions',
    'updates': 'Updates',
    'benchmarks': 'Benchmarks',
    'reviews': 'Reviews',
  };
  
  return mapping[filter] || 'All';
};

/**
 * Frontend Sort → Backend Sort Mapping
 * Filter/Sort bottom sheet'te kullanılan sort değerlerini backend sort değerlerine çevirir
 * 
 * Backend sort değerleri: newest | oldest | most_popular
 */
export const mapSortToBackend = (sort: 'newest' | 'oldest' | 'popular'): 'newest' | 'oldest' | 'most_popular' => {
  const mapping: Record<string, 'newest' | 'oldest' | 'most_popular'> = {
    'newest': 'newest',
    'oldest': 'oldest',
    'popular': 'most_popular',
  };
  
  return mapping[sort] || 'newest';
};

/**
 * Backend Sort → Frontend Sort Mapping
 * Backend'den gelen sort değerlerini frontend sort değerlerine çevirir
 */
export const mapSortFromBackend = (sort: string): 'newest' | 'oldest' | 'popular' => {
  const mapping: Record<string, 'newest' | 'oldest' | 'popular'> = {
    'newest': 'newest',
    'oldest': 'oldest',
    'most_popular': 'popular',
  };
  
  return mapping[sort] || 'newest';
};

/**
 * Frontend Post Type → Backend `type` Parametresi Mapping (DEPRECATED)
 * Eski API için geriye dönük uyumluluk - artık filter kullanılıyor
 * @deprecated Use mapPostTypeToFilter instead
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
