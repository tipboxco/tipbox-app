# Kategori Navigasyon Akışı ve Hiyerarşi Yapısı

Bu doküman, katalog sistemindeki kategori hiyerarşisi ve navigasyon akışını detaylı olarak açıklar.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Hiyerarşi Yapısı](#hiyerarşi-yapısı)
3. [Navigasyon Akışı](#navigasyon-akışı)
4. [Örnek Senaryolar](#örnek-senaryolar)
5. [Gönderi Oluşturma ve Görüntüleme](#gönderi-oluşturma-ve-görüntüleme)

---

## 🎯 Genel Bakış

Kullanıcılar, kategorilerden başlayarak giderek daha spesifik ürünlere doğru ilerleyebilir. Her seviyede, o seviyeye ait gönderileri görüntüleyebilir veya yeni gönderi oluşturabilir.

**Temel Prensipler:**
- Her seviye, bir üst seviyeye ait alt kategorileri/ürünleri gösterir
- Her seviyede gönderi oluşturma ve görüntüleme yapılabilir
- Breadcrumb navigasyon ile geri dönüş mümkündür
- Marka bağımsız kategorilerden, marka spesifik ürünlere kadar derinleşebilir

---

## 🏗️ Hiyerarşi Yapısı

### Seviye Tanımları

```
Level 0: Categories (Root)
  └── Level 1: Category (Kategori)
      └── Level 2: SubCategory (Alt Kategori)
          └── Level 3: ProductGroup (Ürün Grubu)
              └── Level 4: Product (Ürün)
                  └── Level 5: Product Variant (Ürün Varyantı - Opsiyonel)
```

### Örnek Hiyerarşi

```
Categories (Root)
  └── Electronics
      ├── Telefonlar
      │   ├── Akıllı Telefonlar
      │   │   ├── iPhone
      │   │   │   ├── iPhone 15
      │   │   │   ├── iPhone 15 Pro
      │   │   │   └── iPhone 14
      │   │   ├── Samsung
      │   │   │   ├── Galaxy S24
      │   │   │   └── Galaxy S23
      │   │   └── Xiaomi
      │   │       └── Mi 14
      │   ├── Cep Telefonları
      │   │   ├── Nokia
      │   │   ├── Samsung
      │   │   └── LG
      │   └── Sabit Telefonlar
      │       ├── Kablosuz Telefonlar
      │       └── Kablolu Telefonlar
      ├── Giyilebilir Teknoloji
      │   ├── Akıllı Saatler
      │   │   ├── Apple Watch
      │   │   │   ├── Apple Watch Series 9
      │   │   │   ├── Apple Watch Series 8
      │   │   │   └── Apple Watch Ultra
      │   │   ├── Samsung Galaxy Watch
      │   │   └── Fitbit
      │   ├── Fitness Takipçileri
      │   │   ├── Fitbit
      │   │   ├── Garmin
      │   │   └── Polar
      │   └── Akıllı Gözlükler
      │       ├── Apple Vision Pro
      │       ├── Meta Quest
      │       └── Google Glass
      └── TV ve Ses Sistemleri
          ├── Televizyonlar
          └── Hoparlörler
```

---

## 🔄 Navigasyon Akışı

### Flow Diagram

```mermaid
flowchart TD
    Start([Kullanıcı Katalog Ekranına Giriş]) --> Categories[Categories - Tüm Kategoriler]
    
    Categories --> |Kategori Seçimi| Category[Category - Örn: Electronics]
    Category --> |Alt Kategori Seçimi| SubCategory1[SubCategory - Örn: Telefonlar]
    SubCategory1 --> |Alt Kategori Seçimi| SubCategory2[SubCategory - Örn: Akıllı Telefonlar]
    SubCategory2 --> |Ürün Grubu Seçimi| ProductGroup[ProductGroup - Örn: iPhone]
    ProductGroup --> |Ürün Seçimi| Product[Product - Örn: iPhone 15]
    Product --> |Varyant Seçimi| Variant[Product Variant - Opsiyonel]
    
    Category --> |Gönderi Oluştur| CreatePost1[Gönderi Oluştur<br/>Context: Electronics]
    Category --> |Gönderileri Görüntüle| ViewPosts1[Gönderileri Görüntüle<br/>Context: Electronics]
    
    SubCategory1 --> |Gönderi Oluştur| CreatePost2a[Gönderi Oluştur<br/>Context: Telefonlar]
    SubCategory1 --> |Gönderileri Görüntüle| ViewPosts2a[Gönderileri Görüntüle<br/>Context: Telefonlar]
    
    SubCategory2 --> |Gönderi Oluştur| CreatePost2[Gönderi Oluştur<br/>Context: Akıllı Telefonlar]
    SubCategory2 --> |Gönderileri Görüntüle| ViewPosts2[Gönderileri Görüntüle<br/>Context: Akıllı Telefonlar]
    
    ProductGroup --> |Gönderi Oluştur| CreatePost3[Gönderi Oluştur<br/>Context: iPhone]
    ProductGroup --> |Gönderileri Görüntüle| ViewPosts3[Gönderileri Görüntüle<br/>Context: iPhone]
    
    Product --> |Gönderi Oluştur| CreatePost4[Gönderi Oluştur<br/>Context: iPhone 15]
    Product --> |Gönderileri Görüntüle| ViewPosts4[Gönderileri Görüntüle<br/>Context: iPhone 15]
    
    Variant --> |Gönderi Oluştur| CreatePost5[Gönderi Oluştur<br/>Context: iPhone 15 Pro Max 256GB]
    Variant --> |Gönderileri Görüntüle| ViewPosts5[Gönderileri Görüntüle<br/>Context: iPhone 15 Pro Max 256GB]
    
    CreatePost1 --> PostCreated[Gönderi Oluşturuldu]
    CreatePost2a --> PostCreated
    CreatePost2 --> PostCreated
    CreatePost3 --> PostCreated
    CreatePost4 --> PostCreated
    CreatePost5 --> PostCreated
    
    ViewPosts1 --> PostList[Gönderi Listesi]
    ViewPosts2a --> PostList
    ViewPosts2 --> PostList
    ViewPosts3 --> PostList
    ViewPosts4 --> PostList
    ViewPosts5 --> PostList
    
    PostCreated --> |Geri Dön| Breadcrumb[Breadcrumb Navigasyon]
    PostList --> |Geri Dön| Breadcrumb
    Breadcrumb --> Categories
    
    style Categories fill:#C2E607,stroke:#000,stroke-width:2px
    style Category fill:#E8F5A0,stroke:#000,stroke-width:2px
    style SubCategory1 fill:#F0F9B0,stroke:#000,stroke-width:2px
    style SubCategory2 fill:#F0F9B0,stroke:#000,stroke-width:2px
    style ProductGroup fill:#F5FCC0,stroke:#000,stroke-width:2px
    style Product fill:#FAFED0,stroke:#000,stroke-width:2px
    style Variant fill:#FFFEE0,stroke:#000,stroke-width:2px
    style CreatePost1 fill:#FFE6E6,stroke:#000,stroke-width:2px
    style CreatePost2a fill:#FFE6E6,stroke:#000,stroke-width:2px
    style CreatePost2 fill:#FFE6E6,stroke:#000,stroke-width:2px
    style CreatePost3 fill:#FFE6E6,stroke:#000,stroke-width:2px
    style CreatePost4 fill:#FFE6E6,stroke:#000,stroke-width:2px
    style CreatePost5 fill:#FFE6E6,stroke:#000,stroke-width:2px
    style ViewPosts1 fill:#E6F3FF,stroke:#000,stroke-width:2px
    style ViewPosts2a fill:#E6F3FF,stroke:#000,stroke-width:2px
    style ViewPosts2 fill:#E6F3FF,stroke:#000,stroke-width:2px
    style ViewPosts3 fill:#E6F3FF,stroke:#000,stroke-width:2px
    style ViewPosts4 fill:#E6F3FF,stroke:#000,stroke-width:2px
    style ViewPosts5 fill:#E6F3FF,stroke:#000,stroke-width:2px
```

### Detaylı Hiyerarşi Grafiği

```mermaid
graph TD
    Root[Categories Root] --> Cat1[Electronics]
    Root --> Cat2[Fashion]
    Root --> Cat3[Home & Living]
    
    Cat1 --> SubCat1[Telefonlar]
    Cat1 --> SubCat2[Giyilebilir Teknoloji]
    Cat1 --> SubCat3[TV ve Ses Sistemleri]
    
    SubCat1 --> SubCat1a[Akıllı Telefonlar]
    SubCat1 --> SubCat1b[Cep Telefonları]
    SubCat1 --> SubCat1c[Sabit Telefonlar]
    
    SubCat1a --> PG1[iPhone]
    SubCat1a --> PG2[Samsung Galaxy]
    SubCat1a --> PG3[Xiaomi]
    
    SubCat2 --> PG4[Akıllı Saatler]
    SubCat2 --> PG5[Fitness Takipçileri]
    SubCat2 --> PG6[Akıllı Gözlükler]
    
    PG1 --> Prod1[iPhone 15]
    PG1 --> Prod2[iPhone 15 Pro]
    PG1 --> Prod3[iPhone 14]
    
    PG4 --> Prod4[Apple Watch]
    PG4 --> Prod5[Samsung Galaxy Watch]
    
    Prod4 --> Var1[Apple Watch Series 9]
    Prod4 --> Var2[Apple Watch Series 8]
    Prod4 --> Var3[Apple Watch Ultra]
    
    style Root fill:#C2E607,stroke:#000,stroke-width:3px
    style Cat1 fill:#E8F5A0,stroke:#000,stroke-width:2px
    style Cat2 fill:#E8F5A0,stroke:#000,stroke-width:2px
    style Cat3 fill:#E8F5A0,stroke:#000,stroke-width:2px
    style SubCat1 fill:#F0F9B0,stroke:#000,stroke-width:2px
    style SubCat1a fill:#F0F9B0,stroke:#000,stroke-width:2px
    style SubCat1b fill:#F0F9B0,stroke:#000,stroke-width:2px
    style SubCat1c fill:#F0F9B0,stroke:#000,stroke-width:2px
    style SubCat2 fill:#F0F9B0,stroke:#000,stroke-width:2px
    style SubCat3 fill:#F0F9B0,stroke:#000,stroke-width:2px
    style PG1 fill:#F5FCC0,stroke:#000,stroke-width:2px
    style PG2 fill:#F5FCC0,stroke:#000,stroke-width:2px
    style PG3 fill:#F5FCC0,stroke:#000,stroke-width:2px
    style PG4 fill:#F5FCC0,stroke:#000,stroke-width:2px
    style PG5 fill:#F5FCC0,stroke:#000,stroke-width:2px
    style PG6 fill:#F5FCC0,stroke:#000,stroke-width:2px
    style Prod1 fill:#FAFED0,stroke:#000,stroke-width:2px
    style Prod2 fill:#FAFED0,stroke:#000,stroke-width:2px
    style Prod3 fill:#FAFED0,stroke:#000,stroke-width:2px
    style Prod4 fill:#FAFED0,stroke:#000,stroke-width:2px
    style Prod5 fill:#FAFED0,stroke:#000,stroke-width:2px
    style Var1 fill:#FFFEE0,stroke:#000,stroke-width:2px
    style Var2 fill:#FFFEE0,stroke:#000,stroke-width:2px
    style Var3 fill:#FFFEE0,stroke:#000,stroke-width:2px
```

---

## 📱 Örnek Senaryolar

### Senaryo 1: Electronics → Telefonlar → Akıllı Telefonlar → Tüm Telefonlar

```
1. Kullanıcı Categories ekranında "Electronics" seçer
   → Electronics kategorisi açılır
   → Bu seviyede: "Electronics hakkında gönderi oluştur" veya "Electronics gönderilerini görüntüle"

2. Kullanıcı "Telefonlar" alt kategorisini seçer
   → Telefonlar alt kategorisi açılır
   → Bu seviyede: "Telefonlar hakkında gönderi oluştur" veya "Telefonlar gönderilerini görüntüle"
   → Alt kategoriler görüntülenir: Akıllı Telefonlar, Cep Telefonları, Sabit Telefonlar

3. Kullanıcı "Akıllı Telefonlar" alt kategorisini seçer
   → Akıllı Telefonlar alt kategorisi açılır
   → Bu seviyede: "Akıllı Telefonlar hakkında gönderi oluştur" veya "Akıllı Telefonlar gönderilerini görüntüle"
   → Tüm akıllı telefonlar listelenir (iPhone, Samsung, Xiaomi, vb.)

4. Kullanıcı herhangi bir telefonu seçebilir veya bu seviyede gönderi oluşturabilir
```

### Senaryo 1a: Electronics → Telefonlar → Cep Telefonları

```
1. Categories → Electronics
   → Context: Electronics

2. Electronics → Telefonlar
   → Context: Telefonlar
   → Alt kategoriler: Akıllı Telefonlar, Cep Telefonları, Sabit Telefonlar

3. Telefonlar → Cep Telefonları
   → Context: Cep Telefonları
   → Gönderi: "Cep Telefonları hakkında gönderiler"
   → Ürün grupları: Nokia, Samsung, LG
```

### Senaryo 1b: Electronics → Telefonlar → Sabit Telefonlar

```
1. Categories → Electronics → Telefonlar → Sabit Telefonlar
   → Context: Sabit Telefonlar
   → Gönderi: "Sabit Telefonlar hakkında gönderiler"
   → Alt kategoriler: Kablosuz Telefonlar, Kablolu Telefonlar
```

### Senaryo 2: Electronics → Giyilebilir Teknoloji → Akıllı Saatler → Apple Watch → Apple Watch Series 8

```
1. Categories → Electronics
   → Context: Electronics
   → Gönderi: "Electronics hakkında genel gönderiler"

2. Electronics → Giyilebilir Teknoloji
   → Context: Giyilebilir Teknoloji
   → Gönderi: "Giyilebilir teknoloji hakkında gönderiler"
   → Alt kategoriler: Akıllı Saatler, Fitness Takipçileri, Akıllı Gözlükler

3. Giyilebilir Teknoloji → Akıllı Saatler
   → Context: Akıllı Saatler
   → Gönderi: "Tüm akıllı saatler hakkında gönderiler"

4. Akıllı Saatler → Apple Watch
   → Context: Apple Watch (ProductGroup)
   → Gönderi: "Apple Watch hakkında gönderiler"

5. Apple Watch → Apple Watch Series 8
   → Context: Apple Watch Series 8 (Product)
   → Gönderi: "Apple Watch Series 8 hakkında gönderiler"
```

### Senaryo 2a: Electronics → Giyilebilir Teknoloji → Fitness Takipçileri

```
1. Categories → Electronics → Giyilebilir Teknoloji → Fitness Takipçileri
   → Context: Fitness Takipçileri
   → Gönderi: "Fitness Takipçileri hakkında gönderiler"
   → Ürün grupları: Fitbit, Garmin, Polar
```

### Senaryo 2b: Electronics → Giyilebilir Teknoloji → Akıllı Gözlükler

```
1. Categories → Electronics → Giyilebilir Teknoloji → Akıllı Gözlükler
   → Context: Akıllı Gözlükler
   → Gönderi: "Akıllı Gözlükler hakkında gönderiler"
   → Ürün grupları: Apple Vision Pro, Meta Quest, Google Glass
```

### Senaryo 3: Marka Bağımsız → Marka Spesifik

```
Level 1: Electronics (Marka bağımsız)
  → "Tüm elektronik ürünler hakkında gönderiler"

Level 2: Telefonlar (Marka bağımsız)
  → "Tüm telefonlar hakkında gönderiler"

Level 3: Akıllı Telefonlar (Marka bağımsız)
  → "Tüm akıllı telefonlar hakkında gönderiler"

Level 4: iPhone (Marka spesifik - ProductGroup)
  → "iPhone hakkında gönderiler"

Level 5: iPhone 15 (Model spesifik - Product)
  → "iPhone 15 hakkında gönderiler"
```

---

## ✍️ Gönderi Oluşturma ve Görüntüleme

### Her Seviyede Yapılabilecekler

| Seviye | Context Type | Gönderi Oluşturma | Gönderi Görüntüleme |
|--------|-------------|------------------|---------------------|
| **Category** | `category` | Electronics hakkında gönderi oluştur | Electronics'e ait tüm gönderiler |
| **SubCategory** | `subcategory` | Telefonlar, Akıllı Telefonlar, Cep Telefonları, Sabit Telefonlar, Giyilebilir Teknoloji, Akıllı Saatler, Fitness Takipçileri, Akıllı Gözlükler hakkında gönderi oluştur | İlgili alt kategoriye ait tüm gönderiler |
| **ProductGroup** | `productGroup` | iPhone hakkında gönderi oluştur | iPhone'e ait tüm gönderiler |
| **Product** | `product` | iPhone 15 hakkında gönderi oluştur | iPhone 15'e ait tüm gönderiler |
| **Product Variant** | `productVariant` | iPhone 15 Pro Max 256GB hakkında gönderi oluştur | iPhone 15 Pro Max 256GB'ye ait tüm gönderiler |

### Context Data Yapısı

Her seviyede gönderi oluşturulurken, context bilgisi şu şekilde olmalıdır:

```typescript
// Category seviyesi
{
  contextType: 'category',
  contextData: {
    id: 'electronics',
    name: 'Electronics',
    type: 'category'
  }
}

// SubCategory seviyesi (Telefonlar)
{
  contextType: 'subcategory',
  contextData: {
    id: 'phones',
    name: 'Telefonlar',
    type: 'subcategory',
    parentCategory: {
      id: 'electronics',
      name: 'Electronics'
    }
  }
}

// SubCategory seviyesi (Akıllı Telefonlar)
{
  contextType: 'subcategory',
  contextData: {
    id: 'smartphones',
    name: 'Akıllı Telefonlar',
    type: 'subcategory',
    parentCategory: {
      id: 'phones',
      name: 'Telefonlar'
    }
  }
}

// SubCategory seviyesi (Cep Telefonları)
{
  contextType: 'subcategory',
  contextData: {
    id: 'feature-phones',
    name: 'Cep Telefonları',
    type: 'subcategory',
    parentCategory: {
      id: 'phones',
      name: 'Telefonlar'
    }
  }
}

// SubCategory seviyesi (Sabit Telefonlar)
{
  contextType: 'subcategory',
  contextData: {
    id: 'landline-phones',
    name: 'Sabit Telefonlar',
    type: 'subcategory',
    parentCategory: {
      id: 'phones',
      name: 'Telefonlar'
    }
  }
}

// SubCategory seviyesi (Fitness Takipçileri)
{
  contextType: 'subcategory',
  contextData: {
    id: 'fitness-trackers',
    name: 'Fitness Takipçileri',
    type: 'subcategory',
    parentCategory: {
      id: 'wearable-tech',
      name: 'Giyilebilir Teknoloji'
    }
  }
}

// SubCategory seviyesi (Akıllı Gözlükler)
{
  contextType: 'subcategory',
  contextData: {
    id: 'smart-glasses',
    name: 'Akıllı Gözlükler',
    type: 'subcategory',
    parentCategory: {
      id: 'wearable-tech',
      name: 'Giyilebilir Teknoloji'
    }
  }
}

// ProductGroup seviyesi
{
  contextType: 'productGroup',
  contextData: {
    id: 'iphone',
    name: 'iPhone',
    type: 'productGroup',
    parentSubCategory: {
      id: 'smartphones',
      name: 'Akıllı Telefonlar'
    }
  }
}

// Product seviyesi
{
  contextType: 'product',
  contextData: {
    id: 'iphone-15',
    name: 'iPhone 15',
    subName: 'Apple',
    image: '...',
    type: 'product',
    parentProductGroup: {
      id: 'iphone',
      name: 'iPhone'
    }
  }
}
```

### Breadcrumb Navigasyon

Her seviyede breadcrumb gösterilir ve kullanıcı geri dönebilir:

```
Categories > Electronics > Telefonlar > Akıllı Telefonlar > iPhone > iPhone 15
```

- Her breadcrumb item'ına tıklanabilir
- Tıklanan seviyeye geri dönülür
- O seviyeye ait gönderiler ve alt kategoriler gösterilir

---

## 🎨 UI/UX Önerileri

### Her Seviyede Gösterilecekler

1. **Breadcrumb Bar** (Üstte)
   - Mevcut navigasyon yolunu gösterir
   - Her item'a tıklanabilir

2. **Action Buttons** (Üstte veya Floating)
   - "Gönderi Oluştur" butonu
   - "Gönderileri Görüntüle" butonu

3. **Content Area**
   - Alt kategoriler/ürünler grid veya list formatında
   - Her item'da:
     - Görsel
     - İsim
     - Alt öğe sayısı (varsa)
     - Gönderi sayısı

4. **Filter/Search** (Opsiyonel)
   - Arama çubuğu
   - Filtreleme seçenekleri

---

## 🔧 Teknik Detaylar

### State Management

```typescript
interface CatalogNavigationState {
  // Breadcrumb
  breadcrumbItems: BreadcrumbItem[];
  
  // Seçili seviyeler
  selectedCategoryId?: string;
  selectedSubCategoryId?: string;
  selectedProductGroupId?: string;
  selectedProductId?: string;
  
  // Mevcut görünüm
  currentView: 'categories' | 'subcategories' | 'productgroups' | 'products';
  
  // Arama
  searchQuery: string;
}
```

### API Endpoints (Örnek)

```
GET /api/catalog/categories
GET /api/catalog/categories/:categoryId/subcategories
GET /api/catalog/subcategories/:subCategoryId/productgroups
GET /api/catalog/productgroups/:productGroupId/products
GET /api/catalog/products/:productId

GET /api/posts?contextType=category&contextId=electronics
GET /api/posts?contextType=subcategory&contextId=phones
GET /api/posts?contextType=subcategory&contextId=smartphones
GET /api/posts?contextType=subcategory&contextId=feature-phones
GET /api/posts?contextType=subcategory&contextId=landline-phones
GET /api/posts?contextType=subcategory&contextId=wearable-tech
GET /api/posts?contextType=subcategory&contextId=smart-watches
GET /api/posts?contextType=subcategory&contextId=fitness-trackers
GET /api/posts?contextType=subcategory&contextId=smart-glasses
GET /api/posts?contextType=productGroup&contextId=iphone
GET /api/posts?contextType=product&contextId=iphone-15
```

### Navigation Routes

```typescript
type CatalogStackParamList = {
  CatalogScreen: undefined;
  CategoryDetailScreen: { categoryId: string };
  SubCategoryDetailScreen: { subCategoryId: string };
  ProductGroupDetailScreen: { productGroupId: string };
  ProductDetailScreen: { productId: string };
  CategoryPostsScreen: { categoryId: string };
  SubCategoryPostsScreen: { subCategoryId: string };
  ProductGroupPostsScreen: { productGroupId: string };
  ProductPostsScreen: { productId: string };
};
```

---

## 📝 Notlar

- Her seviye, bir üst seviyenin alt öğelerini gösterir
- Gönderi oluşturma her seviyede mümkündür
- Gönderi görüntüleme, seçili context'e göre filtrelenir
- Breadcrumb navigasyon ile herhangi bir seviyeye geri dönülebilir
- Marka bağımsız kategorilerden, marka spesifik ürünlere kadar derinleşme mümkündür

---

**Son Güncelleme:** 2024-12-19
