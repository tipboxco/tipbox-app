# Reward Claim API - Frontend Kullanım Kılavuzu

## 🎯 Genel Bakış

Bu kılavuz, Reward Claim sisteminin frontend tarafından nasıl kullanılacağını açıklar. Tüm endpoint'ler `/api/wallets/rewards` altında bulunur.

## 🔐 Authentication

Tüm API çağrıları için `Authorization` header'ı gereklidir:

```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

## 📚 API Endpoints

### 1. Reward Özeti Getir

**Endpoint:** `GET /api/wallets/rewards/summary`

Kullanıcının tüm claimable reward'larının özetini getirir.

```typescript
const getRewardSummary = async () => {
  const response = await fetch('/api/wallets/rewards/summary', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  
  const summary = await response.json();
  return summary;
};

// Response örneği:
{
  "totalPending": 13,
  "totalClaimable": 13,
  "totalAmount": 660,
  "bySourceType": {
    "LADDER_REWARD": {
      "count": 1,
      "amount": 20,
      "claims": [...]
    },
    "TIPS_RECEIVED": {
      "count": 9,
      "amount": 315,
      "claims": [...]
    },
    "SUPPORT_SESSION": {
      "count": 1,
      "amount": 35,
      "claims": [...]
    }
  }
}
```

---

### 2. Claimable Reward'ları Listele

**Endpoint:** `GET /api/wallets/rewards/claimable`

Kullanıcının claim edebileceği tüm reward'ları detaylı olarak getirir.

```typescript
const getClaimableRewards = async () => {
  const response = await fetch('/api/wallets/rewards/claimable', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  
  const rewards = await response.json();
  return rewards;
};

// Response örneği:
[
  {
    "id": "uuid-123",
    "userId": "user-uuid",
    "rewardType": "LADDER",
    "sourceType": "LADDER_REWARD",
    "amount": 20,
    "status": "PENDING",
    "earnedAt": "2025-01-11T10:00:00.000Z",
    "expiresAt": null,
    "metadata": {
      "rank": 3,
      "period": "weekly",
      "description": "Haftalık sıralamada 3. oldunuz"
    },
    "isClaimable": true,
    "rewardTypeDisplay": "Ladder Reward",
    "sourceTypeDisplay": "Ladder Sıralaması",
    "amountFormatted": "20",
    "description": "Haftalık sıralamada 3. oldunuz"
  },
  // ... more rewards
]
```

---

### 3. Kaynak Tipine Göre Filtrele

**Endpoint:** `GET /api/wallets/rewards/source/:sourceType`

Belirli bir kaynak tipine göre reward'ları getirir.

```typescript
type SourceType = 
  | 'LADDER_REWARD'
  | 'TIPS_RECEIVED'
  | 'SUPPORT_SESSION'
  | 'BADGE_EARNED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'EVENT_PARTICIPATION';

const getRewardsBySource = async (sourceType: SourceType) => {
  const response = await fetch(`/api/wallets/rewards/source/${sourceType}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  
  const rewards = await response.json();
  return rewards;
};

// Kullanım:
const ladderRewards = await getRewardsBySource('LADDER_REWARD');
const tipsRewards = await getRewardsBySource('TIPS_RECEIVED');
const supportRewards = await getRewardsBySource('SUPPORT_SESSION');
```

---

### 4. Tek Reward Claim Et

**Endpoint:** `POST /api/wallets/rewards/claim/:rewardId`

Belirli bir reward'ı claim eder.

```typescript
const claimReward = async (rewardId: string) => {
  const response = await fetch(`/api/wallets/rewards/claim/${rewardId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  return result;
};

// Response örneği:
{
  "success": true,
  "rewardClaim": {
    "id": "uuid-123",
    "status": "CLAIMED",
    "claimedAt": "2025-01-13T15:30:00.000Z",
    // ... diğer reward bilgileri
  },
  "transactionId": "transaction-uuid"
}

// Hata durumu:
{
  "success": false,
  "error": "Reward is not claimable"
}
```

---

### 5. Tüm Reward'ları Claim Et

**Endpoint:** `POST /api/wallets/rewards/claim-all`

Kullanıcının tüm claimable reward'larını tek seferde claim eder.

```typescript
const claimAllRewards = async () => {
  const response = await fetch('/api/wallets/rewards/claim-all', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  return result;
};

// Response örneği:
{
  "success": true,
  "totalAmount": 660,
  "claimedCount": 13,
  "failedCount": 0,
  "transactionId": "transaction-uuid",
  "claims": [
    // ... claimed reward'ların listesi
  ],
  "errors": undefined
}
```

---

### 6. Claim History Getir

**Endpoint:** `GET /api/wallets/rewards/history`

Kullanıcının daha önce claim ettiği reward'ların geçmişini getirir.

```typescript
const getClaimHistory = async () => {
  const response = await fetch('/api/wallets/rewards/history', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  
  const history = await response.json();
  return history;
};

// Response: Claim edilmiş reward'ların listesi
```

---

## 🎨 UI Component Örnekleri

### Rewards Screen Component

```typescript
import React, { useEffect, useState } from 'react';

interface RewardSummary {
  totalPending: number;
  totalClaimable: number;
  totalAmount: number;
  bySourceType: Record<string, {
    count: number;
    amount: number;
    claims: any[];
  }>;
}

const RewardsScreen = () => {
  const [summary, setSummary] = useState<RewardSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    const data = await getRewardSummary();
    setSummary(data);
  };

  const handleClaimAll = async () => {
    setLoading(true);
    try {
      const result = await claimAllRewards();
      if (result.success) {
        alert(`${result.totalAmount} TIPS başarıyla claim edildi!`);
        fetchSummary(); // Refresh
      }
    } catch (error) {
      console.error('Claim failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!summary) return <div>Loading...</div>;

  return (
    <div className="rewards-screen">
      <h1>Rewards</h1>
      
      {/* Summary Card */}
      <div className="summary-card">
        <h2>{summary.totalAmount} TIPS</h2>
        <p>{summary.totalClaimable} claimable rewards</p>
      </div>

      {/* Reward Groups */}
      <div className="reward-groups">
        {Object.entries(summary.bySourceType).map(([sourceType, data]) => (
          <RewardGroup 
            key={sourceType}
            title={getSourceTypeTitle(sourceType)}
            amount={data.amount}
            count={data.count}
            claims={data.claims}
          />
        ))}
      </div>

      {/* Claim All Button */}
      <button 
        onClick={handleClaimAll}
        disabled={loading || summary.totalClaimable === 0}
        className="claim-all-button"
      >
        {loading ? 'Claiming...' : 'Claim All'}
      </button>
    </div>
  );
};
```

---

### Collapsible Reward Group

```typescript
interface RewardGroupProps {
  title: string;
  amount: number;
  count: number;
  claims: any[];
}

const RewardGroup: React.FC<RewardGroupProps> = ({ 
  title, 
  amount, 
  count, 
  claims 
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="reward-group">
      <div 
        className="group-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="group-info">
          <h3>{title}</h3>
          <p>{count} rewards</p>
        </div>
        <div className="group-amount">
          <span>{amount} TIPS</span>
          <span className="arrow">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="group-content">
          <h4>Recents</h4>
          {claims.slice(0, 10).map((claim) => (
            <RewardItem key={claim.id} claim={claim} />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

### Individual Reward Item

```typescript
interface RewardItemProps {
  claim: any;
}

const RewardItem: React.FC<RewardItemProps> = ({ claim }) => {
  return (
    <div className="reward-item">
      <div className="reward-info">
        <p className="date">
          {new Date(claim.earnedAt).toLocaleDateString('tr-TR')}
        </p>
        <p className="from">
          {claim.metadata?.fromUserName || claim.description}
        </p>
      </div>
      <div className="reward-amount">
        {claim.amount} TIPS
      </div>
    </div>
  );
};
```

---

## 📊 Data Flow Örneği

### Sayfa Yüklendiğinde:

```typescript
// 1. Summary bilgisini al
const summary = await getRewardSummary();
// → totalAmount: 660 TIPS

// 2. UI'ı render et
<SummaryCard amount={summary.totalAmount} />
<RewardGroups groups={summary.bySourceType} />
```

### Claim All Butonuna Tıklandığında:

```typescript
// 1. Tüm reward'ları claim et
const result = await claimAllRewards();
// → { success: true, totalAmount: 660, claimedCount: 13 }

// 2. Success mesajı göster
toast.success(`${result.totalAmount} TIPS claimed!`);

// 3. Wallet balance'ı güncelle
const newBalance = await getWalletBalance();

// 4. Reward listesini refresh et
const updatedSummary = await getRewardSummary();
```

---

## 🔄 State Management (React Context)

```typescript
// RewardsContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface RewardsContextType {
  summary: RewardSummary | null;
  loading: boolean;
  refreshSummary: () => Promise<void>;
  claimReward: (id: string) => Promise<void>;
  claimAll: () => Promise<void>;
}

const RewardsContext = createContext<RewardsContextType | null>(null);

export const RewardsProvider: React.FC = ({ children }) => {
  const [summary, setSummary] = useState<RewardSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshSummary = async () => {
    const data = await getRewardSummary();
    setSummary(data);
  };

  const claimReward = async (id: string) => {
    setLoading(true);
    try {
      await claimRewardAPI(id);
      await refreshSummary();
    } finally {
      setLoading(false);
    }
  };

  const claimAll = async () => {
    setLoading(true);
    try {
      await claimAllRewardsAPI();
      await refreshSummary();
    } finally {
      setLoading(false);
    }
  };

  return (
    <RewardsContext.Provider value={{
      summary,
      loading,
      refreshSummary,
      claimReward,
      claimAll
    }}>
      {children}
    </RewardsContext.Provider>
  );
};

export const useRewards = () => {
  const context = useContext(RewardsContext);
  if (!context) throw new Error('useRewards must be used within RewardsProvider');
  return context;
};
```

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: Wallet Ekranı

```typescript
const WalletScreen = () => {
  const { summary } = useRewards();

  return (
    <div>
      <WalletBalance />
      
      {/* Claimable Rewards Badge */}
      {summary && summary.totalClaimable > 0 && (
        <div className="claimable-badge">
          <span>{summary.totalAmount} TIPS claimable</span>
          <Link to="/rewards">View Rewards →</Link>
        </div>
      )}
      
      <TransactionHistory />
    </div>
  );
};
```

### Senaryo 2: Notification için Yeni Reward

```typescript
// Kullanıcıya yeni reward geldiğinde
const handleNewReward = async (rewardId: string) => {
  // 1. Summary'yi refresh et
  await refreshSummary();
  
  // 2. Toast notification göster
  toast.info('🎉 Yeni reward aldınız! 20 TIPS');
  
  // 3. Badge count'u güncelle
  setBadgeCount(prev => prev + 1);
};
```

### Senaryo 3: Auto-refresh

```typescript
// Her 30 saniyede bir summary'yi güncelle
useEffect(() => {
  const interval = setInterval(async () => {
    await refreshSummary();
  }, 30000);
  
  return () => clearInterval(interval);
}, []);
```

---

## 🎨 Styling Önerileri

### TailwindCSS

```tsx
// Summary Card
<div className="bg-white rounded-xl shadow-lg p-6 mb-4">
  <div className="text-4xl font-bold text-green-600">
    {summary.totalAmount} TIPS
  </div>
  <div className="text-gray-600 mt-2">
    {summary.totalClaimable} claimable rewards
  </div>
</div>

// Reward Group
<div className="bg-white rounded-lg border border-gray-200 mb-3">
  <button 
    className="w-full p-4 flex items-center justify-between"
    onClick={() => setExpanded(!expanded)}
  >
    <div>
      <h3 className="font-semibold text-lg">Ladder Rewards</h3>
      <p className="text-gray-500 text-sm">1 reward</p>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-green-600 font-bold">20 TIPS</span>
      <span>{expanded ? '▲' : '▼'}</span>
    </div>
  </button>
  {/* ... content ... */}
</div>

// Claim All Button
<button className="w-full bg-lime-400 text-black font-bold py-4 rounded-xl text-lg hover:bg-lime-500 transition-colors">
  Claim All
</button>
```

---

## ⚠️ Hata Yönetimi

```typescript
const claimAllWithErrorHandling = async () => {
  try {
    setLoading(true);
    const result = await claimAllRewards();
    
    if (!result.success) {
      throw new Error(result.error || 'Claim failed');
    }
    
    // Success
    toast.success(`${result.totalAmount} TIPS claimed!`);
    await refreshSummary();
    
  } catch (error: any) {
    // Handle specific errors
    if (error.message.includes('Unauthorized')) {
      // Redirect to login
      router.push('/login');
    } else if (error.message.includes('not claimable')) {
      toast.error('Bu reward claim edilemiyor');
    } else {
      toast.error('Bir hata oluştu, lütfen tekrar deneyin');
    }
  } finally {
    setLoading(false);
  }
};
```

---

## 🔔 Best Practices

1. **Cache Summary**: Summary bilgisini cache'le, her render'da API çağrısı yapma
2. **Optimistic Updates**: Claim'den önce UI'ı güncelle, başarısız olursa geri al
3. **Loading States**: Her API çağrısı için loading state göster
4. **Error Boundaries**: Hata durumlarını graceful handle et
5. **Auto Refresh**: Periyodik olarak summary'yi güncelle
6. **Badge Notifications**: Yeni reward geldiğinde badge göster

---

## 📱 Responsive Tasarım

```typescript
// Mobile-first approach
<div className="
  // Mobile
  px-4 py-6
  // Tablet
  md:px-8 md:py-8
  // Desktop
  lg:max-w-4xl lg:mx-auto
">
  {/* Content */}
</div>
```

---

## 🚀 Test Komutları

```bash
# Backend test
curl -X GET "http://localhost:3000/api/wallets/rewards/summary" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Claim all test
curl -X POST "http://localhost:3000/api/wallets/rewards/claim-all" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 TypeScript Tip Tanımları

```typescript
// types/rewards.ts

export enum RewardClaimType {
  TIPS = 'TIPS',
  BADGE = 'BADGE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  LADDER = 'LADDER',
  SUPPORT = 'SUPPORT',
  EVENT = 'EVENT',
}

export enum RewardSourceType {
  LADDER_REWARD = 'LADDER_REWARD',
  TIPS_RECEIVED = 'TIPS_RECEIVED',
  SUPPORT_SESSION = 'SUPPORT_SESSION',
  BADGE_EARNED = 'BADGE_EARNED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  EVENT_PARTICIPATION = 'EVENT_PARTICIPATION',
  SYSTEM_GRANT = 'SYSTEM_GRANT',
}

export enum RewardClaimStatus {
  PENDING = 'PENDING',
  CLAIMED = 'CLAIMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface RewardClaim {
  id: string;
  userId: string;
  rewardType: RewardClaimType;
  sourceType: RewardSourceType;
  amount: number;
  status: RewardClaimStatus;
  earnedAt: string;
  claimedAt: string | null;
  expiresAt: string | null;
  metadata: Record<string, any> | null;
  isClaimable: boolean;
  rewardTypeDisplay: string;
  sourceTypeDisplay: string;
  amountFormatted: string;
  description: string;
}

export interface RewardSummary {
  totalPending: number;
  totalClaimable: number;
  totalAmount: number;
  bySourceType: Record<string, {
    count: number;
    amount: number;
    claims: RewardClaim[];
  }>;
}

export interface ClaimResult {
  success: boolean;
  rewardClaim?: RewardClaim;
  transactionId?: string;
  error?: string;
}

export interface ClaimAllResult {
  success: boolean;
  totalAmount: number;
  claimedCount: number;
  failedCount: number;
  transactionId?: string;
  claims: RewardClaim[];
  errors?: string[];
}
```

---

Bu kılavuz ile frontend ekibi Reward Claim API'lerini kolayca entegre edebilir! 🎉
