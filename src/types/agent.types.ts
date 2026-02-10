export interface AgentProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  company: string | null;
  bio: string | null;
  specialties: string[];
  certifications: string[];
  phone: string | null;
  lineId: string | null;
  licenseNumber?: string | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  trustScore: number;
  encouragementCount: number;
  serviceRating: number;
  reviewCount: number;
  completedCases: number;
  activeListings: number;
  serviceYears: number;
  joinedAt?: string | null;
  internalCode?: number;
  visitCount?: number;
  dealCount?: number;
}

export interface AgentProfileMe extends AgentProfile {
  email: string | null;
  points: number;
  quotaS: number;
  quotaA: number;
  createdAt: string | null;
}

export interface UpdateAgentProfilePayload {
  name?: string;
  company?: string | null;
  bio?: string | null;
  specialties?: string[];
  certifications?: string[];
  phone?: string | null;
  lineId?: string | null;
  licenseNumber?: string | null;
  joinedAt?: string;
}
