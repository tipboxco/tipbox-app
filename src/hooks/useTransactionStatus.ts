import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/ApiService';

/**
 * Transaction Status Response
 */
export interface TransactionStatus {
  id: string;
  actionType: 'TIP_SEND' | 'TIP_RECEIVE' | 'CLAIM' | 'NFT_LIST' | 'NFT_DELIST' | 'SWAP';
  status: 'created' | 'pending' | 'confirmed' | 'failed';
  amount: number;
  from: string;
  to: string;
  txHash: string | null;
  metadata?: Record<string, any>;
  errorMessage?: string;
  createdAt: string;
  confirmedAt: string | null;
  failedAt: string | null;
}

/**
 * Get Transaction By ID
 * 
 * Backend endpoint: GET /api/transactions/:id
 */
const getTransactionById = async (transactionId: string): Promise<TransactionStatus> => {
  const response = await apiService.getClient().get<TransactionStatus>(
    `/transactions/${transactionId}`
  );
  return response.data;
};

/**
 * useTransactionStatus Hook
 * 
 * Transaction durumunu poll eder ve otomatik olarak günceller.
 * 
 * **Önemli:**
 * - Pending durumda her 2 saniyede bir backend'e sorgu atar
 * - Confirmed veya Failed durumunda polling durur
 * - Web2: Backend transaction processor tarafından status güncellenir
 * - Web3: Blockchain event listener tarafından status güncellenir
 * 
 * @param transactionId - Transaction ID
 * @returns React Query result with transaction status
 * 
 * @example
 * ```tsx
 * const { data: transaction, isLoading } = useTransactionStatus(txId);
 * 
 * if (transaction?.status === 'pending') {
 *   return <Text>⏳ Pending...</Text>;
 * }
 * 
 * if (transaction?.status === 'confirmed') {
 *   return <Text>✅ Confirmed</Text>;
 * }
 * ```
 */
export const useTransactionStatus = (transactionId: string | null) => {
  return useQuery({
    queryKey: ['transaction', 'status', transactionId],
    queryFn: () => getTransactionById(transactionId!),
    
    // Polling stratejisi
    refetchInterval: (data) => {
      // Pending ise her 2 saniyede poll et
      if (data?.status === 'pending' || data?.status === 'created') {
        return 2000; // 2 saniye
      }
      // Confirmed veya Failed ise poll'u durdur
      return false;
    },
    
    // Transaction ID varsa enable et
    enabled: !!transactionId,
    
    // Cache süresi (confirmed işlemler için)
    staleTime: (data) => {
      if (data?.status === 'confirmed' || data?.status === 'failed') {
        return 5 * 60 * 1000; // 5 dakika cache
      }
      return 0; // Pending için cache yok
    },
    
    // Retry stratejisi
    retry: (failureCount, error: any) => {
      // 404 hatası varsa retry yapma (transaction bulunamadı)
      if (error?.response?.status === 404) {
        return false;
      }
      // 3 defaya kadar retry
      return failureCount < 3;
    },
    
    retryDelay: 1000, // 1 saniye sonra retry
  });
};

/**
 * Transaction Status Helper
 * 
 * Transaction status'üne göre UI mesajları döner
 */
export const getTransactionStatusMessage = (status: TransactionStatus['status']): {
  message: string;
  emoji: string;
  color: string;
} => {
  switch (status) {
    case 'created':
      return {
        message: 'İşlem oluşturuluyor...',
        emoji: '⏱️',
        color: '#8C8C8C',
      };
    case 'pending':
      return {
        message: 'İşlem işleniyor...',
        emoji: '⏳',
        color: '#FFA500',
      };
    case 'confirmed':
      return {
        message: 'İşlem tamamlandı',
        emoji: '✅',
        color: '#4CAF50',
      };
    case 'failed':
      return {
        message: 'İşlem başarısız',
        emoji: '❌',
        color: '#F44336',
      };
    default:
      return {
        message: 'Bilinmeyen durum',
        emoji: '❓',
        color: '#8C8C8C',
      };
  }
};

