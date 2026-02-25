# Profile Tabs Backend Requirements

## Son Değişiklikler

### Tab Yapısı
```
KALDIRILDI: Ladders
EKLENDİ: Badge, Collections
```

### Yeni Tab'lar
- **Badge Tab**: Kullanıcının kazandığı tüm badge'ler
- **Collections Tab**: Kullanıcının collection progress'i

---

## Database Tabloları

### 1. badges
```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  image_url VARCHAR(500),
  badge_type VARCHAR(50), -- 'achievement', 'ladder', 'collection', 'special'
  category VARCHAR(100),
  rarity VARCHAR(50) -- 'common', 'rare', 'epic', 'legendary'
);
```

### 2. user_badges
```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMP,
  is_highlighted BOOLEAN DEFAULT FALSE,
  highlight_order INTEGER CHECK (highlight_order BETWEEN 0 AND 3),
  progress INTEGER DEFAULT 0,
  
  UNIQUE(user_id, badge_id)
);
```

### 3. collections
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  image_url VARCHAR(500),
  collection_type VARCHAR(50), -- 'achievement', 'bridge'
  total_items INTEGER DEFAULT 0
);
```

### 4. collection_items
```sql
CREATE TABLE collection_items (
  id UUID PRIMARY KEY,
  collection_id UUID REFERENCES collections(id),
  badge_id UUID REFERENCES badges(id),
  title VARCHAR(255),
  image_url VARCHAR(500),
  unlock_requirement JSONB,
  order_index INTEGER
);
```

### 5. user_collection_items
```sql
CREATE TABLE user_collection_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  collection_item_id UUID REFERENCES collection_items(id),
  unlocked_at TIMESTAMP,
  progress INTEGER DEFAULT 0,
  
  UNIQUE(user_id, collection_item_id)
);
```

---

## API Endpoints

### Badge Tab
```
GET /api/v1/users/:userId/badges
Query: cursor, limit, badgeType, rarity

Response:
{
  items: [{
    id: string,
    badge: {
      id: string,
      title: string,
      image: string,
      badgeType: string,
      rarity: string
    },
    earnedAt: string,
    progress: number,
    isHighlighted: boolean,
    highlightOrder: number | null
  }],
  pagination: {
    cursor: string | null,
    hasMore: boolean,
    total: number
  }
}
```

### Highlight Badges
```
PATCH /api/v1/users/:userId/badges/highlights
Body: { badgeIds: string[] } // Max 4

Response:
{
  success: boolean,
  highlights: [{ badgeId: string, highlightOrder: number }]
}
```

### Collections Tab
```
GET /api/v1/users/:userId/collections
Query: cursor, limit, collectionType

Response:
{
  items: [{
    id: string,
    collection: {
      id: string,
      title: string,
      image: string,
      collectionType: string,
      totalItems: number
    },
    unlockedCount: number,
    totalCount: number,
    progress: number,
    items: [{
      id: string,
      title: string,
      image: string,
      isUnlocked: boolean,
      unlockedAt: string | null,
      progress: number
    }]
  }],
  pagination: {
    cursor: string | null,
    hasMore: boolean,
    total: number
  }
}
```

### Profile Endpoint Güncellemesi
```
GET /api/v1/users/:userId/profile

stats'a eklenmeli:
{
  badgeCount: number,
  collectionProgress: number
}
```

---

## Frontend Hooks

### Yeni Hook'lar
```typescript
// Badge tab için
useUserBadges(userId, limit, badgeType?, rarity?)

// Highlight badge güncelleme
useUpdateHighlightBadges()

// Collections tab için
useUserCollections(userId, limit, collectionType?)
```

### ProfileScreen Tab Content
```typescript
// Badge tab render
if (tabKey === 'badge') {
  const { data } = useUserBadges(userId);
  return <BadgeList badges={data} />;
}

// Collections tab render
if (tabKey === 'collections') {
  const { data } = useUserCollections(userId);
  return <CollectionsList collections={data} />;
}
```

---

## UI/UX Değişiklikleri

### Badge Highlight Section
```
Kendi profil:
- "Edit Highlight Badges" (tıklanabilir → ProfileEdit)

Başkasının profil:
- "Highlight Badges" (tıklanamaz)
```

### Tab Sıralaması
```
1. Feed
2. Experience
3. Benchmarks
4. Tips & Tricks
5. Questions
6. Badge (YENİ)
7. Collections (YENİ)
```

---

## Notlar

- Max 4 badge highlight edilebilir
- Badge progress 0-100 arası
- Collection progress = (unlockedCount / totalCount) * 100
- Tüm endpointler cursor-based pagination kullanır
- highlighted badge'ler profile endpoint'inde döner (max 4)
