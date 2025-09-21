export interface TrustUser {
    id: string;
    name: string;
    title: string;
    avatar: any;
    trustLevel: number; // 1-5
    isOnline?: boolean;
}

export interface TrustListScreenRouteProp {
    key: string;
    name: string;
    params: {
        initialTab?: 'trust' | 'truster';
    };
}
