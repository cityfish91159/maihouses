import { supabase } from '../../../lib/supabase';
import { 
  AppData, 
  Grade, 
  LeadSchema, 
  ListingSchema,
  FeedPostSchema,
  UserDataSchema
} from '../types/uag.types';
import { GRADE_HOURS } from '../uag-config';

// Helper function for remaining hours calculation
const calculateRemainingHours = (
  purchasedAt: number | string | undefined | null,
  grade: Grade
): number => {
  if (!purchasedAt) return 0;
  
  const totalHours = GRADE_HOURS[grade] || 336;
  const purchasedTime = new Date(purchasedAt).getTime();
  const elapsedHours = (Date.now() - purchasedTime) / (1000 * 60 * 60);
  
  return Math.max(0, Math.min(totalHours, totalHours - elapsedHours));
};

const transformSupabaseData = (
  userData: any,
  leadsData: any[],
  listingsData: any[],
  feedData: any[]
): AppData => {
  // 1. Validate User Data (Critical)
  const userRaw = {
    points: userData.points,
    quota: { s: userData.quota_s, a: userData.quota_a }
  };
  
  const userResult = UserDataSchema.safeParse(userRaw);
  if (!userResult.success) {
    console.error('Critical: User Data Validation Failed', userResult.error);
    throw new Error('Failed to load user profile');
  }

  // 2. Transform and Validate Leads (Resilient)
  const validLeads = leadsData.map((l: any) => {
    let remainingHours = l.remaining_hours != null ? Number(l.remaining_hours) : null;

    if (remainingHours == null && l.purchased_at && l.status === 'purchased') {
      remainingHours = calculateRemainingHours(l.purchased_at, l.grade as Grade);
    }

    return {
      ...l,
      grade: l.grade,
      status: l.status,
      ...(remainingHours != null ? { remainingHours } : {})
    };
  }).filter(lead => {
    const result = LeadSchema.safeParse(lead);
    if (!result.success) {
      console.warn(`Skipping invalid lead (${lead.id}):`, result.error.flatten());
      return false;
    }
    return true;
  });

  // 3. Transform and Validate Listings
  const validListings = listingsData.map((l: any) => ({
    ...l,
    title: l.title,
    tags: l.tags ?? [],
    view: l.view_count ?? 0,
    click: l.click_count ?? 0,
    fav: l.fav_count ?? 0,
    thumbColor: l.thumb_color ?? '#e5e7eb'
  })).filter(listing => {
    const result = ListingSchema.safeParse(listing);
    if (!result.success) {
      console.warn('Skipping invalid listing:', result.error.flatten());
      return false;
    }
    return true;
  });

  // 4. Validate Feed
  const validFeed = feedData.filter(post => {
    const result = FeedPostSchema.safeParse(post);
    if (!result.success) {
      console.warn('Skipping invalid feed post:', result.error.flatten());
      return false;
    }
    return true;
  });

  return {
    user: userResult.data,
    leads: validLeads,
    listings: validListings,
    feed: validFeed
  };
};

export class UAGService {
  static async fetchAppData(userId: string): Promise<AppData> {
    const [userRes, leadsRes, listingsRes, feedRes] = await Promise.all([
      supabase.from('users').select('points, quota_s, quota_a').single(),
      supabase.from('leads').select('*'),
      supabase.from('listings').select('*').eq('agent_id', userId),
      supabase.from('feed').select('*').order('created_at', { ascending: false }).limit(5)
    ]);

    if (userRes.error) throw userRes.error;
    if (leadsRes.error) throw leadsRes.error;
    if (listingsRes.error) throw listingsRes.error;
    if (feedRes.error) throw feedRes.error;

    return transformSupabaseData(userRes.data, leadsRes.data, listingsRes.data, feedRes.data);
  }

  static async purchaseLead(
    userId: string,
    leadId: string,
    cost: number,
    grade: Grade
  ): Promise<void> {
    const { error } = await supabase.rpc('purchase_lead', {
      p_user_id: userId,
      p_lead_id: leadId,
      p_cost: cost,
      p_grade: grade
    });

    if (error) throw error;
  }
}
