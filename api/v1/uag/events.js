/**
 * Vercel Serverless Function: /api/v1/uag/events
 * 接收前端 UAG 事件並存入 Supabase
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY // 使用 service key 繞過 RLS

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials')
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

const MAX_EVENTS_PER_BATCH = 200

const normalizeBody = body => {
  if (!body) return []
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch (err) {
      console.warn('[UAG] Failed to parse body as JSON', err)
      return []
    }
  }
  return body
}

const isValidEvent = e =>
  e && typeof e === 'object' &&
  typeof e.event === 'string' && e.event.trim() !== '' &&
  typeof e.page === 'string' && e.page.trim() !== '' &&
  typeof e.sessionId === 'string' && e.sessionId.trim() !== '' &&
  typeof e.ts === 'string' && e.ts.trim() !== '' &&
  typeof e.requestId === 'string' && e.requestId.trim() !== ''

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabase) {
    console.error('Supabase not configured')
    return res.status(500).json({ error: 'Database not configured' })
  }

  try {
    const rawBody = normalizeBody(req.body)
    const events = Array.isArray(rawBody) ? rawBody : [rawBody]

    if (events.length > MAX_EVENTS_PER_BATCH) {
      return res.status(413).json({ error: `Too many events: max ${MAX_EVENTS_PER_BATCH}` })
    }

    // 驗證事件格式
    const validEvents = events.filter(isValidEvent)

    if (validEvents.length === 0) {
      return res.status(400).json({ error: 'Invalid event format' })
    }

    if (validEvents.length !== events.length) {
      console.warn(`[UAG] Dropped ${events.length - validEvents.length} invalid events from batch`)
    }

    // 轉換格式以符合資料庫 schema
    const dbEvents = validEvents.map(e => ({
      event: e.event,
      page: e.page,
      target_id: e.targetId || null,
      session_id: e.sessionId,
      user_id: e.userId || null,
      ts: e.ts,
      meta: e.meta && typeof e.meta === 'object' ? e.meta : {},
      request_id: e.requestId
    }))

    // 批次插入 Supabase (使用 upsert 避免重複)
    const { error } = await supabase
      .from('uag_events')
      .upsert(dbEvents, { 
        onConflict: 'request_id',
        ignoreDuplicates: true 
      })

    if (error) {
      console.error('Supabase insert error:', error)
      
      // 如果是速率限制,返回 retry 時間
      if (error.code === '42P05' || error.message?.includes('rate limit')) {
        const retryAfterMs = 60000
        res.setHeader('Retry-After', Math.ceil(retryAfterMs / 1000))
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          retryAfterMs
        })
      }
      
      return res.status(500).json({ error: error.message })
    }

    console.log(`[UAG] Saved ${validEvents.length} events`)
    
    return res.status(200).json({ 
      success: true,
      saved: validEvents.length 
    })

  } catch (err) {
    console.error('UAG events error:', err)
    return res.status(500).json({ error: err.message })
  }
}
