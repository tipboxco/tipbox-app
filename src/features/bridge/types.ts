export type BridgeStackParamList = {
  BridgeScreen: undefined;
  BridgeDetail: {
    brandId: string;
    brandName: string;
    brandDescription: string;
    followers: number;
    logo: any;
    banner: any;
  };
  BrandProducts: {
    brandName: string;
  };
  SurveysAndGamification: undefined;
};

export interface BrandProductsScreenProps {
  route: {
    params: {
      brandName: string;
    };
  };
  navigation: any;
}

export interface ProductCategory {
  id: string;
  name: string;
  products: Product[];
}

export interface Product {
  id: string;
  name: string;
  metrics: {
    metric1: number;
    metric2: number;
    metric3: number;
  };
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  type: string;
  duration: string;
  points: number;
  progress?: number;
  status: 'not_started' | 'in_progress' | 'completed';
  buttonText: string;
}

export interface SurveyCategory {
  id: string;
  name: string;
  isActive: boolean;
}

export interface SurveysAndGamificationScreenProps {
  navigation: any;
}