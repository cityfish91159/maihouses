-- ==============================================================================
-- Fix Bad Images (Replace unstable picsum with Unsplash)
-- ==============================================================================

-- 1. Fix Property Images (MH-100001 and others)
UPDATE properties
SET images = ARRAY['https://images.unsplash.com/photo-1600596542815-27b88e54e6d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
WHERE public_id = 'MH-100001' OR images[1] LIKE '%picsum%';

-- 2. Fix Agent Avatars
UPDATE agents
SET avatar_url = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
WHERE avatar_url LIKE '%picsum%';
