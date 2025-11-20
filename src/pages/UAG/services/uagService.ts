import { supabase } from '../../../lib/supabase';
import { 
  AppData, 
  AppDataSchema, 
  Grade, 
  Lead, 
  LeadStatus, 
  LeadSchema 
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
  const rawData = {
    user: {
      points: userData.points,
      quota: { s: userData.quota_s, a: userData.quota_a }
    },
    leads: leadsData.map((l: any) => {
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
    }),
    listings: listingsData.map((l: any) => ({
      ...l,
      title: l.title,
      tags: l.tags ?? [],
      view: l.view_count ?? 0,
      click: l.click_count ?? 0,
      fav: l.fav_count ?? 0,
      thumbColor: l.thumb_color ?? '#e5e7eb'
    })),
    feed: feedData
  };

  // Runtime validation with Zod
  const result = AppDataSchema.safeParse(rawData);
  
  if (!result.success) {
    console.error('UAG Data Validation Error:', result.error);
    // In a real app, you might want to throw or return a fallback
    // For now, we return the raw data but cast it, or throw if critical
    throw new Error('Data validation failed: ' + result.error.message);
  }

  return result.data;
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
