# Catalog Context Posts API - Hızlı Kullanım Kılavuzu

## ✅ Sorun Çözüldü!

Sub-category ID'si (`pcat_01KGM792RYV601GBQ5ZFN2CB8C`) ile post'ları getirmeye çalıştığınızda aldığınız hata çözüldü.

## 🎯 Çözüm: Smart Context Endpoint

Artık **tek bir endpoint** ile tüm context tiplerinden (product, sub-category, product group, main category) post'ları getirebilirsiniz:

```
GET /catalog/context/{contextId}/posts
```

### Kullanım Örnekleri

```bash
# Sub-category posts
GET /catalog/context/pcat_01KGM792RYV601GBQ5ZFN2CB8C/posts?limit=20

# Product posts
GET /catalog/context/prod_01KGM792ABCD1234567890/posts?limit=20

# Product group posts (UUID)
GET /catalog/context/550e8400-e29b-41d4-a716-446655440000/posts?limit=20
```

### Response Format

```json
{
  "items": [...],
  "pagination": {
    "cursor": "...",
    "hasMore": true,
    "limit": 20
  },
  "contextType": "sub_category"  // 👈 Backend hangi tip olduğunu söyler
}
```

**contextType** değerleri:
- `"product"` - Ürün
- `"sub_category"` - Alt kategori
- `"product_group"` - Ürün grubu
- `"main_category"` - Ana kategori

## 📱 Mobile Implementation

### Seçenek 1: Smart Endpoint (Önerilen)

Tüm context'ler için aynı endpoint'i kullanın:

```typescript
// API Service
export async function getCatalogPosts(contextId: string, options?: {
  limit?: number;
  sort?: 'newest' | 'oldest' | 'most_popular';
  filter?: 'all' | 'tips_and_tricks' | 'questions' | 'updates';
  cursor?: string;
}) {
  const params = new URLSearchParams({
    limit: String(options?.limit || 20),
    ...(options?.sort && { sort: options.sort }),
    ...(options?.filter && { filter: options.filter }),
    ...(options?.cursor && { cursor: options.cursor }),
  });

  const response = await apiClient.get(
    `/catalog/context/${contextId}/posts?${params}`
  );

  return response.data; // { items, pagination, contextType }
}

// React Native Screen
function PostsScreen({ route }) {
  const { contextId } = route.params;
  const { data, isLoading } = useQuery(
    ['catalog-posts', contextId],
    () => getCatalogPosts(contextId, { limit: 20, sort: 'newest' })
  );

  return (
    <View>
      <Text>Context Type: {data?.contextType}</Text>
      <FlatList
        data={data?.items}
        renderItem={({ item }) => <PostCard post={item.data} />}
      />
    </View>
  );
}
```

### Seçenek 2: Prefix-Based Routing

ID prefix'ine göre endpoint seçimi:

```typescript
// utils/catalogApi.ts
export function getCatalogPostsEndpoint(contextId: string): string {
  if (contextId.startsWith('prod_')) {
    return `/catalog/products/${contextId}/posts`;
  }
  if (contextId.startsWith('pcat_')) {
    return `/catalog/sub-categories/${contextId}/posts`;
  }
  // UUID format - fallback to smart endpoint
  return `/catalog/context/${contextId}/posts`;
}
```

## 🔧 Backend Changes

### Yeni Endpoint
- ✅ `/catalog/context/:contextId/posts` - Smart context endpoint eklendi

### Mevcut Endpoint'ler (Backward Compatible)
- `/catalog/main-categories/:mainCategoryId/posts`
- `/catalog/sub-categories/:subCategoryId/posts`
- `/catalog/product-groups/:productGroupId/posts`
- `/catalog/products/:productId/posts`

Tüm mevcut endpoint'ler çalışmaya devam ediyor!

## 🧪 Test

### Backend Test (Local)
```bash
# Server başlatıldıktan sonra
curl -H "Authorization: Bearer YOUR_TOKEN" \
  'http://localhost:3000/catalog/context/pcat_01KGM792RYV601GBQ5ZFN2CB8C/posts?limit=5'
```

### Veritabanı Kontrol
```bash
# Sub-category'yi kontrol et
docker exec tipbox_postgres psql -U postgres -d tipbox_dev -c \
  "SELECT id, name, parent_id FROM categories WHERE id = 'pcat_01KGM792RYV601GBQ5ZFN2CB8C';"

# Sonuç:
# id: pcat_01KGM792RYV601GBQ5ZFN2CB8C
# name: Television & Video
# parent_id: pcat_01KGM792HAHWZDEY5C90J573JC (Electronics)
```

## 📝 Query Parameters

Tüm endpoint'ler aynı parametreleri kabul eder:

| Parameter | Type | Options | Default | Description |
|-----------|------|---------|---------|-------------|
| `limit` | number | 1-50 | 20 | Sayfa başına item sayısı |
| `sort` | string | newest, oldest, most_popular | newest | Sıralama |
| `filter` | string | all, tips_and_tricks, questions, updates, benchmarks, reviews | all | Post tipi filtresi |
| `cursor` | string | - | - | Pagination cursor |

## ❓ Sık Sorulan Sorular

### Q: Eski endpoint'ler hala çalışıyor mu?
**A:** Evet! Backward compatibility korundu. Tüm eski endpoint'ler çalışmaya devam ediyor.

### Q: Hangi endpoint'i kullanmalıyım?
**A:** 
- **Yeni projeler:** `/catalog/context/:contextId/posts` (Smart endpoint)
- **Mevcut kod:** Eski endpoint'ler çalışmaya devam ediyor
- **Performans kritikse:** Spesifik endpoint'ler (örn: `/catalog/products/:productId/posts`)

### Q: contextType field'ı ne işe yarıyor?
**A:** Frontend'de UI'ı ayarlamak için kullanılabilir. Örneğin, product context'inde "Karşılaştır" butonu gösterebilirsiniz.

### Q: Error handling nasıl yapmalıyım?
**A:** 
```typescript
try {
  const data = await getCatalogPosts(contextId);
} catch (error) {
  if (error.response?.status === 404) {
    // Context bulunamadı
  } else if (error.response?.status === 401) {
    // Auth gerekli
  }
}
```

## 📚 Daha Fazla Bilgi

Detaylı dokümantasyon için:
- [CATALOG_CONTEXT_ROUTING.md](./CATALOG_CONTEXT_ROUTING.md) - Kapsamlı mimari rehberi
- API Swagger Docs: `http://localhost:3000/api-docs`

## 🚀 Sonraki Adımlar

1. ✅ Backend değişiklikleri tamamlandı
2. 📱 Mobile app'te endpoint güncellemesi yapın
3. 🧪 Tüm context tiplerini test edin
4. 📊 Performance monitoring ekleyin

---

**Not:** Bu değişiklikler backend'de aktif. Mobile app'i güncelledikten sonra artık hiçbir "Product not found" hatası almayacaksınız! 🎉
