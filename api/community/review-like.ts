import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { ToggleReviewLikePayloadSchema } from '../../src/types/community-review-like';
import { verifyAuth } from '../lib/auth';
import { corsHeaders } from '../lib/cors';
import { getEnvVar } from '../lib/env';
import { logError } from '../lib/logger';

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // GET: 查詢按讚狀態與總數 (公開)
  if (req.method === 'GET') {
    try {
      const propertyId = req.query.propertyId as string;
      if (!propertyId) {
        return res.status(400).json({ error: 'Missing propertyId' });
      }

      // 檢查用戶是否已登入 (用於判斷 liked 狀態)
      const authHeader = req.headers.authorization;
      let userId: string | null = null;
      
      if (authHeader) {
        const { user, error } = await verifyAuth(authHeader);
        if (!error && user) {
          userId = user.id;
        }
      }

      // 1. 查詢總讚數
      const { count: totalLikes, error: countError } = await supabase
        .from('community_review_likes')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', propertyId);

      if (countError) throw countError;

      // 2. 如果已登入，查詢是否已讚
      let liked = false;
      if (userId) {
        const { data: likeData, error: likeError } = await supabase
          .from('community_review_likes')
          .select('id')
          .eq('property_id', propertyId)
          .eq('user_id', userId)
          .maybeSingle(); // 使用 maybeSingle 避免多筆資料報錯 (雖然有唯一索引)

        if (likeError && likeError.code !== 'PGRST116') throw likeError;
        liked = !!likeData;
      }

      return res.status(200).json({
        success: true,
        liked,
        totalLikes: totalLikes ?? 0,
      });

    } catch (error) {
      logError('Failed to get review like status', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST: Toggle 按讚 (需認證)
  if (req.method === 'POST') {
    try {
      // 1. 驗證身分
      const { user, error: authError } = await verifyAuth(req.headers.authorization);
      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // 2. 驗證參數
      const parseResult = ToggleReviewLikePayloadSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parseResult.error });
      }
      const { propertyId } = parseResult.data;

      // 3. 檢查 Property 是否存在 (確保是 community review 來源)
      // 理論上前端只會在存在的卡片上按讚，但後端需防護
      const { data: property, error: propError } = await supabase
        .from('properties')
        .select('id')
        .eq('id', propertyId)
        .single();
      
      if (propError || !property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      // 4. 檢查是否已讚
      const { data: existingLike, error: checkError } = await supabase
        .from('community_review_likes')
        .select('id')
        .eq('property_id', propertyId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      let liked = false;

      if (existingLike) {
        // 已讚 -> 取消讚 (DELETE)
        const { error: deleteError } = await supabase
          .from('community_review_likes')
          .delete()
          .eq('id', existingLike.id);
        
        if (deleteError) throw deleteError;
        liked = false;
      } else {
        // 未讚 -> 新增讚 (INSERT)
        const { error: insertError } = await supabase
          .from('community_review_likes')
          .insert({
            property_id: propertyId,
            user_id: user.id
          });
        
        // 如果併發請求導致重複鍵錯誤，視為已讚
        if (insertError) {
          if (insertError.code === '23505') { // Unique violation
             liked = true;
          } else {
             throw insertError;
          }
        } else {
          liked = true;
        }
      }

      // 5. 取得最新總數
      const { count: totalLikes, error: countError } = await supabase
        .from('community_review_likes')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', propertyId);

      if (countError) throw countError;

      return res.status(200).json({
        success: true,
        liked,
        totalLikes: totalLikes ?? 0,
      });

    } catch (error) {
      logError('Failed to toggle review like', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
