export interface Agent {
  id: string;
  internalCode: number;
  name: string;
  avatarUrl: string;
  company: string;
  trustScore: number;
  encouragementCount: number;
}

export interface Imported591Data {
  title: string;
  price: number;
  address: string;
  description: string;
  images: string[];
  sourcePlatform: 'MH' | '591';
  sourceExternalId: string;
}
