# Backend Transaction History Bug Report

## 🐛 Bug: Prisma UUID Validation Error

### Error Details:

```
ERROR [getWalletTransactions] API Error:
{
  "code": "DATABASE_ERROR",
  "message": "Veritabanı hatası oluştu.",
  "path": "/transactions/history",
  "stack": "PrismaClientKnownRequestError: 
    Invalid `this.prisma.transaction.findUnique()` invocation in
    /app/src/infrastructure/repositories/transaction-prisma.repository.ts:50:50
    
    Inconsistent column data: Error creating UUID, 
    invalid character: expected an optional prefix of `urn:uuid:` 
    followed by [0-9a-fA-F-], found `h` at 1"
}
```

---

## 🔍 Root Cause Analysis:

### Problem:
Backend'de `/transactions/history` endpoint'i çağrıldığında, Prisma `findUnique()` ile UUID parse edilmeye çalışılıyor ama **"history"** string'i UUID field'ına geçiliyor.

### Affected File:
```
/app/src/infrastructure/repositories/transaction-prisma.repository.ts:50
```

### Code:
```typescript
// Line 49
async findById(id: string): Promise<Transaction | null> {
  // Line 50 - ❌ Hata burada oluyor
  const record = await this.prisma.transaction.findUnique({
    where: { id: id } // ❌ id = "history" geliyor, UUID olmalı!
  });
}
```

---

## 💡 Likely Issue:

Backend router'da `/transactions/history` route'u yanlış parametrelenmiş olabilir:

### ❌ Yanlış Router Yapısı:
```typescript
// transaction.router.ts
router.get('/transactions/:id', async (req, res) => {
  const id = req.params.id; // "history" geliyor ❌
  const transaction = await transactionService.getTransactionById(id);
  // ...
});
```

Bu durumda:
- `/transactions/history` çağrısı
- `:id` parametresine "history" atanıyor
- `findById("history")` çalışıyor ❌

### ✅ Doğru Router Yapısı:
```typescript
// transaction.router.ts

// Önce spesifik route'lar
router.get('/transactions/history', async (req, res) => {
  // History endpoint logic
  const transactions = await transactionService.getHistory();
  res.json(transactions);
});

// Sonra parametreli route'lar
router.get('/transactions/:id', async (req, res) => {
  const id = req.params.id;
  const transaction = await transactionService.getTransactionById(id);
  res.json(transaction);
});
```

**Önemli:** Express/NestJS'de **route sıralaması** önemlidir!
- Spesifik route'lar (örn. `/history`) önce tanımlanmalı
- Parametreli route'lar (örn. `/:id`) sonra tanımlanmalı

---

## 🔧 Backend Fix (Yapılması Gereken):

### 1. Router Dosyasını Kontrol Edin:
**File:** `/app/src/interfaces/transaction/transaction.router.ts`

Route sıralamasını düzeltin:

```typescript
// ✅ DOĞRU SIRALAMA:

// 1. Spesifik route'lar önce
router.get('/transactions/history', historyHandler);
router.post('/transactions/send-tip', sendTipHandler);
router.post('/transactions/claim', claimHandler);

// 2. Parametreli route'lar sonra
router.get('/transactions/:id', getByIdHandler);
```

### 2. Route Handler'ları Ayırın:

```typescript
// ❌ YANLIŞ:
router.get('/transactions/:id', async (req, res) => {
  const id = req.params.id;
  
  if (id === 'history') {
    // Special case - YA

NLI YAKLASIM!
    return res.json(await getHistory());
  }
  
  return res.json(await getById(id));
});

// ✅ DOĞRU:
router.get('/transactions/history', async (req, res) => {
  const transactions = await transactionService.getTransactionHistory(req.user.id);
  res.json(transactions);
});

router.get('/transactions/:id', async (req, res) => {
  const id = req.params.id;
  // UUID validation ekleyin
  if (!isValidUUID(id)) {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }
  const transaction = await transactionService.getTransactionById(id);
  res.json(transaction);
});
```

---

## ✅ Frontend Fix (Yapıldı):

Frontend'de graceful error handling eklendi:

**File:** `/src/features/wallet/api/hooks.ts`

```typescript
export const useWalletTransactions = () => {
  return useQuery({
    queryKey: walletKeys.transactions(),
    queryFn: async () => {
      try {
        return await getWalletTransactions();
      } catch (error) {
        // Backend hatası durumunda boş data dön
        console.warn('[useWalletTransactions] Backend error, returning empty data');
        return {
          today: [],
          yesterday: [],
          lastWeek: [],
          lastMonth: [],
          total: 0,
          page: 1,
        };
      }
    },
    retry: false, // Backend hatası varsa retry yapma
  });
};
```

**Sonuç:**
- ✅ App crash olmaz
- ✅ "No transactions found" gösterir
- ✅ Kullanıcı diğer özellikleri kullanabilir
- ⏳ Backend düzeltildiğinde otomatik çalışır

---

## 🧪 Test:

### Backend'de Route Sıralamasını Test Edin:

```bash
# 1. History endpoint (spesifik)
curl -X GET 'http://localhost:3000/transactions/history' \
  -H 'Authorization: Bearer <token>'
# Beklenen: Transaction history array ✅

# 2. GetById endpoint (parametreli)
curl -X GET 'http://localhost:3000/transactions/db2bbd73-21c2-4e24-b1f1-90e896def41e' \
  -H 'Authorization: Bearer <token>'
# Beklenen: Single transaction object ✅
```

### Swagger'da Kontrol:

```
GET /transactions/history   → History handler çağrılmalı ✅
GET /transactions/:id        → GetById handler çağrılmalı ✅
```

---

## 📋 Backend Checklist:

- [ ] `/transactions/history` route'unu `:id` route'undan ÖNCE tanımla
- [ ] History handler'ını ayrı fonksiyon olarak yaz
- [ ] GetById handler'ına UUID validation ekle
- [ ] Route testlerini yaz (unit test)
- [ ] Swagger dokümanını güncelle

---

## 🎯 Priority: HIGH

**Reason:**
- ❌ WalletScreen'de transaction history gösterilemiyor
- ❌ Her mount'ta 3 retry yapılıyor (gereksiz yük)
- ⚠️ Log'lar hata mesajlarıyla doluyor

**Impact:**
- Kullanıcı transaction history göremez
- Performance sorunu (retry loop)
- Backend log pollution

---

**Date:** 2026-01-12  
**Status:** ⏳ Backend fix bekleniyor  
**Frontend Status:** ✅ Graceful degradation eklendi


