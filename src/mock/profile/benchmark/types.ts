import type {
  BenchmarkUser,
  BenchmarkProduct,
  BenchmarkStats,
  BenchmarkCardData,
} from '@/src/types/BenchmarkCard';

export type { BenchmarkUser, BenchmarkProduct, BenchmarkStats };

export interface BenchmarkScore {
  overall: number;
  performance: number;
  design: number;
  battery: number;
  camera: number;
  display: number;
}

export interface BenchmarkPost extends BenchmarkCardData {}
