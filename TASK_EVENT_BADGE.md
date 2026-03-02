# Event Badge Implementation Task

## Problem
Event post'lar feed'de görünüyor ama kullanıcı:
- Post'un hangi event'e ait olduğunu bilemiyor
- Event adına tıklayıp EventDetailScreen'e gidemiyorEvent bilgisi eksik!

## Gerekli Değişiklikler

### 1. Backend API Changes

#### a) ProfilePost Type (src/features/profile/types.ts)
```typescript
export interface ProfilePost {
  id: string;
  type: string;
  user: ProfilePostUser;
  stats: ProfilePostStats;
  createdAt: string;
  contextType?: ProductInfoType;
  contextData?: ProfilePostContextData;
  content: string | ProfilePostContentBlock[];
  images?: string[];
  isLiked?: boolean;
  isBookmarked?: boolean;
  isShared?: boolean;
  source?: string;

  // ✅ YENİ: Event bilgileri
  eventId?: string;
  event?: {
    id: string;
    title: string;
    eventType?: string;
    status?: string;
  };
}
```

#### b) PostCardData Type (src/types/PostCard.ts)
```typescript
export interface PostCardData {
  id: string;
  user: LegacyPostUser;
  content: string;
  images?: (string | ImageSourcePropType)[];
  stats: PostStats;
  tag?: string;
  createdAt: string;
  isPromoted?: boolean;
  category?: LegacyPostCategory;
  contextType?: ProductInfoType;
  contextData?: PostContextData;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isShared?: boolean;
  source?: string;

  // Event-related fields
  eventId?: string;
  isUpvoted?: boolean;
  upvotesCount?: number;

  // ✅ YENİ: Event bilgisi
  event?: {
    id: string;
    title: string;
    eventType?: string;
    status?: string;
  };
}
```

### 2. Backend API Response

Backend endpoint'leri event bilgisini döndürmeli:

**Etkilenen Endpoint'ler:**
- `/feed` - Ana feed
- `/feed/filtered` - Filtered feed
- `/feed?contextType=product&contextId=xxx` - Product feed
- `/feed?contextType=sub_category&contextId=xxx` - Sub-category feed
- `/feed?contextType=product_group&contextId=xxx` - Product group feed
- `/users/{userId}/posts` - User posts

**Backend SQL/Prisma Query:**
```typescript
// Backend'de post query'sine event join ekle
const posts = await prisma.contentPost.findMany({
  where: { ... },
  select: {
    id: true,
    content: true,
    // ... diğer field'lar
    eventId: true,
    event: {
      select: {
        id: true,
        title: true,
        eventType: true,
        status: true,
      }
    }
  }
});
```

### 3. Frontend - PostCard Component Changes

#### a) Event Badge UI (src/components/PostCards/PostCard/index.tsx)

**Ekleme Yeri:** Header'ın altına, content'in üstüne

```typescript
const PostCard = ({ data, hideProduct = false, isDetailMode = false }: PostCardProps) => {
  // ... mevcut kod

  // ✅ YENİ: Event navigation handler
  const handleEventPress = useCallback(() => {
    if (data.event?.id) {
      navigationService.navigate(ROOT_ROUTES.EVENT, {
        screen: 'EventDetailScreen',
        params: { eventId: data.event.id },
      });
    }
  }, [data.event?.id]);

  // ✅ YENİ: Event badge
  const hasEvent = !!data.event;

  return (
    <View style={{ ... }}>
      {/* Header */}
      <VStack px={12} py={8}>
        {/* ... mevcut user header */}
      </VStack>

      {/* ✅ YENİ: Event Badge - Header ile Content arasına ekle */}
      {hasEvent && (
        <Box px={12} py={6} bg={isDark ? '#1A1A1A' : '#F5F5F5'}>
          <Pressable onPress={handleEventPress}>
            <HStack alignItems="center" space="xs">
              {/* Event Icon */}
              <Box
                width={20}
                height={20}
                borderRadius={4}
                bg="rgba(144, 8, 255, 0.8)"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={10} color="#FFFFFF">🎯</Text>
              </Box>

              {/* Event Title */}
              <Text
                fontSize={12}
                fontWeight="$semibold"
                color={isDark ? '#FFFFFF' : '#000000'}
                flex={1}
                numberOfLines={1}
              >
                {data.event.title}
              </Text>

              {/* Event Type Badge (optional) */}
              {data.event.eventType && (
                <Box
                  px={6}
                  py={2}
                  borderRadius={4}
                  bg="rgba(144, 8, 255, 0.2)"
                  borderWidth={1}
                  borderColor="rgba(144, 8, 255, 0.4)"
                >
                  <Text
                    fontSize={9}
                    fontWeight="$bold"
                    color="rgba(144, 8, 255, 1)"
                  >
                    {data.event.eventType.toUpperCase()}
                  </Text>
                </Box>
              )}

              {/* Chevron Right Icon */}
              <Image
                source={require('@/assets/icons/chevron-right.svg')}
                width={16}
                height={16}
                tintColor={isDark ? '#666' : '#999'}
              />
            </HStack>
          </Pressable>
        </Box>
      )}

      {/* Content - Mevcut content devam eder */}
      <VStack px={12} py={8}>
        {/* ... mevcut content */}
      </VStack>
    </View>
  );
};
```

#### b) EventDetailScreen Navigation Route

ROOT_ROUTES.EVENT zaten tanımlı mı kontrol et, yoksa ekle:

```typescript
// src/navigation/constants/rootRoutes.ts (varsa)
export const ROOT_ROUTES = {
  FEED: 'Feed',
  PROFILE: 'Profile',
  EVENT: 'Event', // ✅ Ekle (yoksa)
  // ...
};
```

### 4. mapFeedToCardData Güncelleme

EventDetailScreen'de post mapping fonksiyonunu güncelle:

```typescript
// src/features/events/screens/EventDetailScreen.tsx:216
const mapFeedToCardData = (item: ProfilePost): PostCardData => {
  // ... mevcut mapping

  return {
    id: item.id,
    user: { ... },
    content: contentString,
    images,
    stats: item.stats,
    createdAt: item.createdAt,
    contextType: mappedContextType,
    contextData,

    // ✅ YENİ: Event bilgisi ekle
    eventId: item.eventId,
    event: item.event ? {
      id: item.event.id,
      title: item.event.title,
      eventType: item.event.eventType,
      status: item.event.status,
    } : undefined,
  };
};
```

### 5. Test Scenarios

#### Test 1: Event Post Badge Görünürlüğü
- [ ] FeedScreen'de event post'larda event badge görünüyor mu?
- [ ] EventDetailScreen'de event post'larda event badge görünüyor mu?
- [ ] Product feed'de event post'larda event badge görünüyor mu?

#### Test 2: Event Badge Tıklama
- [ ] Event badge'e tıklayınca EventDetailScreen açılıyor mu?
- [ ] Doğru eventId ile navigate oluyor mu?
- [ ] Back button düzgün çalışıyor mu?

#### Test 3: Event Upvote
- [ ] Event post'larda upvote butonu görünüyor mu?
- [ ] Upvote sayısı doğru gösteriliyor mu?
- [ ] Upvote toggle düzgün çalışıyor mu?

#### Test 4: Normal Post (Event Olmayan)
- [ ] Normal post'larda event badge görünmüyor mu?
- [ ] Normal post'larda upvote butonu görünmüyor mu?

## UI Design Mock

```
┌─────────────────────────────────────┐
│ 👤 John Doe                    ⋯   │
│    Coffee Expert                    │
├─────────────────────────────────────┤
│ 🎯 Coffee Roasting Challenge  →    │ ← YENİ: Event Badge (tıklanabilir)
│    [ROASTS]                         │
├─────────────────────────────────────┤
│ This is my post content...          │
│ [images]                            │
├─────────────────────────────────────┤
│ ❤️ 45  💬 12  📤 5  🔖 3  ⬆️ 28    │ ← Event Upvote butonu (en sağda)
└─────────────────────────────────────┘
```

## Implementation Priority

1. **P0 (Critical)**: Backend API - Event bilgisi ekleme
2. **P0 (Critical)**: Type değişiklikleri (ProfilePost, PostCardData)
3. **P1 (High)**: PostCard - Event badge UI
4. **P1 (High)**: Navigation - Event badge tıklama
5. **P2 (Medium)**: Styling polish
6. **P2 (Medium)**: Test coverage

## Backend Developer Action Items

### 1. Database Schema Check
ContentPost tablosunda event relation var mı kontrol et:
```prisma
model ContentPost {
  id       String   @id
  eventId  String?  @map("event_id")
  event    Event?   @relation(fields: [eventId], references: [id])
  // ...
}
```

### 2. Post Query Update
Tüm feed endpoint'lerinde event bilgisini include et:
```typescript
// feed.service.ts - buildFeedQuery veya benzeri
select: {
  id: true,
  // ... diğer field'lar
  eventId: true,
  event: {
    select: {
      id: true,
      title: true,
      eventType: true,
      status: true,
    }
  }
}
```

### 3. API Response Format
Feed response'unda event bilgisinin döndüğünü doğrula:
```json
{
  "items": [
    {
      "type": "post",
      "data": {
        "id": "post-123",
        "eventId": "event-456",
        "event": {
          "id": "event-456",
          "title": "Coffee Roasting Challenge",
          "eventType": "roasts",
          "status": "active"
        }
      }
    }
  ]
}
```

## Notes

- Event badge sadece eventId varsa görünmeli
- Normal post'lar etkilenmemeli (backward compatible)
- Event badge tıklama opsiyonel (event bilgisi yoksa disabled)
- Upvote butonu zaten var, sadece event badge ekleniyor
- Dark mode desteği gerekli

## Estimated Effort

- Backend: 2-3 hours (event relation + query update)
- Frontend: 3-4 hours (types + UI + navigation)
- Testing: 1-2 hours
- **Total: 6-9 hours**
