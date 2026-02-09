export interface Agent {
  id: string;
  internalCode: number;
  name: string;
  avatarUrl: string;
  company: string;
  trustScore: number;
  encouragementCount: number;
  serviceRating?: number;
  reviewCount?: number;
  completedCases?: number;
  activeListings?: number;
  serviceYears?: number;
  bio?: string | null;
  specialties?: string[];
  certifications?: string[];
  phone?: string | null;
  lineId?: string | null;
  licenseNumber?: string | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
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
