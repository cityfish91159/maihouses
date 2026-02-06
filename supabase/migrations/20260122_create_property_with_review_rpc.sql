-- ============================================
-- WHY: 原子性保證 - property INSERT 與 community_review 關聯
--      必須在同一 Transaction 中完成，避免中途失敗導致資料不一致
-- ============================================

CREATE OR REPLACE FUNCTION fn_create_property_with_review(
    p_agent_id UUID,
    p_title TEXT,
    p_price NUMERIC,
    p_address TEXT,
    p_address_fingerprint TEXT,
    p_community_name TEXT,
    p_community_id UUID,
    p_size NUMERIC,
    p_age NUMERIC,
    p_rooms INTEGER,
    p_halls INTEGER,
    p_bathrooms INTEGER,
    p_floor_current TEXT,
    p_floor_total INTEGER,
    p_property_type TEXT,
    p_advantage_1 TEXT,
    p_advantage_2 TEXT,
    p_disadvantage TEXT,
    p_description TEXT,
    p_images TEXT[],
    p_features TEXT[],
    p_source_platform TEXT,
    p_source_external_id TEXT,
    p_trust_enabled BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_property_id UUID;
    v_public_id TEXT;
BEGIN
    -- Step 1: INSERT property (Transaction 自動開始)
    INSERT INTO public.properties (
        agent_id,
        title,
        price,
        address,
        address_fingerprint,
        community_name,
        community_id,
        size,
        age,
        rooms,
        halls,
        bathrooms,
        floor_current,
        floor_total,
        property_type,
        advantage_1,
        advantage_2,
        disadvantage,
        description,
        images,
        features,
        source_platform,
        source_external_id,
        trust_enabled
    ) VALUES (
        p_agent_id,
        p_title,
        p_price,
        p_address,
        p_address_fingerprint,
        p_community_name,
        p_community_id,
        p_size,
        p_age,
        p_rooms,
        p_halls,
        p_bathrooms,
        p_floor_current,
        p_floor_total,
        p_property_type,
        p_advantage_1,
        p_advantage_2,
        p_disadvantage,
        p_description,
        p_images,
        p_features,
        p_source_platform,
        p_source_external_id,
        COALESCE(p_trust_enabled, false)
    )
    RETURNING id, public_id INTO v_property_id, v_public_id;

    -- Step 2: INSERT community_review (如果有社區且有評價內容)
    IF p_community_id IS NOT NULL AND (
        p_advantage_1 IS NOT NULL OR
        p_advantage_2 IS NOT NULL OR
        p_disadvantage IS NOT NULL
    ) THEN
        INSERT INTO public.community_reviews (
            community_id,
            property_id,
            source,
            advantage_1,
            advantage_2,
            disadvantage
        ) VALUES (
            p_community_id,
            v_property_id,
            'agent',
            p_advantage_1,
            p_advantage_2,
            p_disadvantage
        );
    END IF;

    -- Step 3: 回傳結果 (Transaction 自動 COMMIT)
    RETURN jsonb_build_object(
        'success', true,
        'id', v_property_id,
        'public_id', v_public_id
    );

EXCEPTION WHEN OTHERS THEN
    -- Transaction 自動 ROLLBACK
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- 權限設定
GRANT EXECUTE ON FUNCTION fn_create_property_with_review TO authenticated;
