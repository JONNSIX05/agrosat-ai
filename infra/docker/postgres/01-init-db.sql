-- ============================================================================
-- AGROSAT AI — INICIALIZACIÓN DE BASE DE DATOS UNIFICADA
-- Motor: PostgreSQL 16 + PostGIS 3.4 + pgvector 0.7
-- ============================================================================

-- 1. Activación de Extensiones Reales
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Creación de los 5 Esquemas Aislados (DDD Bounded Contexts)
CREATE SCHEMA IF NOT EXISTS ms1_satellite;
CREATE SCHEMA IF NOT EXISTS ms2_zoning;
CREATE SCHEMA IF NOT EXISTS ms3_telemetry;
CREATE SCHEMA IF NOT EXISTS ms4_rag;
CREATE SCHEMA IF NOT EXISTS ms5_alerts;

-- ============================================================================
-- ESQUEMA MS2: CROP ZONING SERVICE (Polígonos GIS y Aptitud para Sandía)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ms2_zoning.parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL,
    parcel_name VARCHAR(120) NOT NULL,
    watermelon_variety VARCHAR(80) NOT NULL DEFAULT 'Crimson Sweet',
    planting_date DATE NOT NULL DEFAULT (CURRENT_DATE - INTERVAL '45 days'),
    boundary_geom GEOMETRY(Polygon, 4326) NOT NULL,
    centroid_geom GEOMETRY(Point, 4326) NOT NULL,
    area_hectares NUMERIC(10,4) NOT NULL,
    perimeter_meters NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ms2_parcels_boundary
    ON ms2_zoning.parcels USING GIST (boundary_geom);
CREATE INDEX IF NOT EXISTS idx_ms2_parcels_farmer
    ON ms2_zoning.parcels (farmer_id);

CREATE TABLE IF NOT EXISTS ms2_zoning.soil_suitability_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES ms2_zoning.parcels(id) ON DELETE CASCADE,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    soil_texture VARCHAR(32) NOT NULL,
    ph_level NUMERIC(4,2) NOT NULL,
    drainage_level VARCHAR(32) NOT NULL,
    altitude_msnm NUMERIC(7,2) NOT NULL,
    solar_radiation_mjm2 NUMERIC(5,2) NOT NULL,
    slope_pct NUMERIC(5,2) NOT NULL,
    viability_score_pct NUMERIC(5,2) NOT NULL CHECK (viability_score_pct BETWEEN 0 AND 100),
    suitability_category VARCHAR(32) NOT NULL,
    technical_breakdown JSONB NOT NULL DEFAULT '{}',
    limiting_factors TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_ms2_evaluations_parcel
    ON ms2_zoning.soil_suitability_evaluations (parcel_id, evaluated_at DESC);

-- ============================================================================
-- ESQUEMA MS1: SATELLITE INGESTION SERVICE (Sentinel-2 Sintético y Grillas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ms1_satellite.sentinel_scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL,
    scene_code VARCHAR(64) NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    days_after_planting INT NOT NULL,
    phenological_stage VARCHAR(32) NOT NULL,
    cloud_cover_pct NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    mean_ndvi NUMERIC(5,4) NOT NULL,
    min_ndvi NUMERIC(5,4) NOT NULL,
    max_ndvi NUMERIC(5,4) NOT NULL,
    stddev_ndvi NUMERIC(5,4) NOT NULL DEFAULT 0.0,
    mean_evi NUMERIC(5,4) NOT NULL,
    stressed_cells_pct NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    has_stress_patch BOOLEAN NOT NULL DEFAULT FALSE,
    stress_patch_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ms1_scenes_parcel_date
    ON ms1_satellite.sentinel_scenes (parcel_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS ms1_satellite.spectral_subcells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID NOT NULL REFERENCES ms1_satellite.sentinel_scenes(id) ON DELETE CASCADE,
    parcel_id UUID NOT NULL,
    cell_row INT NOT NULL,
    cell_col INT NOT NULL,
    cell_geom GEOMETRY(Polygon, 4326) NOT NULL,
    centroid_geom GEOMETRY(Point, 4326) NOT NULL,
    band_b02_blue NUMERIC(6,5) NOT NULL,
    band_b04_red NUMERIC(6,5) NOT NULL,
    band_b08_nir NUMERIC(6,5) NOT NULL,
    ndvi NUMERIC(5,4) NOT NULL CHECK (ndvi BETWEEN -1.0 AND 1.0),
    evi NUMERIC(5,4) NOT NULL CHECK (evi BETWEEN -1.0 AND 1.0),
    vigor_level VARCHAR(24) NOT NULL,
    is_stressed_cell BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ms1_subcells_geom
    ON ms1_satellite.spectral_subcells USING GIST (cell_geom);
CREATE INDEX IF NOT EXISTS idx_ms1_subcells_scene
    ON ms1_satellite.spectral_subcells (scene_id);

-- ============================================================================
-- ESQUEMA MS3: AGRONOMIC TELEMETRY SERVICE (Series Temporales IoT)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ms3_telemetry.sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL,
    sensor_node_code VARCHAR(50) NOT NULL DEFAULT 'NODERED-IOT-01',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ambient_temp_c NUMERIC(5,2) NOT NULL,
    relative_humidity_pct NUMERIC(5,2) NOT NULL,
    soil_moisture_20cm_pct NUMERIC(5,2) NOT NULL,
    soil_moisture_40cm_pct NUMERIC(5,2) NOT NULL,
    solar_radiation_wm2 NUMERIC(6,2) NOT NULL,
    vpd_kpa NUMERIC(5,3) NOT NULL,
    is_anomaly_flagged BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ms3_readings_parcel_time
    ON ms3_telemetry.sensor_readings (parcel_id, recorded_at DESC);

-- ============================================================================
-- ESQUEMA MS4: VIRTUAL AGRONOMIST RAG SERVICE (pgvector 384d + DeepSeek)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ms4_rag.watermelon_knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(180) NOT NULL,
    category VARCHAR(40) NOT NULL,
    phenological_stage VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(384) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ms4_knowledge_embedding_hnsw
    ON ms4_rag.watermelon_knowledge_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE TABLE IF NOT EXISTS ms4_rag.consultation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL,
    farmer_question TEXT NOT NULL,
    assembled_context JSONB NOT NULL DEFAULT '{}',
    retrieved_chunks JSONB NOT NULL DEFAULT '[]',
    deepseek_answer TEXT NOT NULL,
    model_used VARCHAR(40) NOT NULL DEFAULT 'deepseek-chat',
    embedding_time_ms INT NOT NULL DEFAULT 0,
    llm_time_ms INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ESQUEMA MS5: ALERT NOTIFICATION SERVICE (Reglas y Enlace Telegram / n8n)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ms5_alerts.farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(32),
    telegram_chat_id VARCHAR(64) NOT NULL UNIQUE,
    telegram_username VARCHAR(64),
    is_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ms5_alerts.farmer_parcel_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES ms5_alerts.farmers(id) ON DELETE CASCADE,
    parcel_id UUID NOT NULL,
    parcel_alias VARCHAR(120) NOT NULL,
    cooldown_minutes INT NOT NULL DEFAULT 60,
    UNIQUE (farmer_id, parcel_id)
);

CREATE TABLE IF NOT EXISTS ms5_alerts.triggered_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL,
    farmer_id UUID NOT NULL REFERENCES ms5_alerts.farmers(id),
    rule_code VARCHAR(48) NOT NULL,
    severity VARCHAR(24) NOT NULL,
    title VARCHAR(160) NOT NULL,
    recommended_action TEXT NOT NULL,
    trigger_metrics JSONB NOT NULL DEFAULT '{}',
    n8n_webhook_status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ms5_alerts_parcel_rule_time
    ON ms5_alerts.triggered_alerts (parcel_id, rule_code, triggered_at DESC);

-- ============================================================================
-- SEMILLA INICIAL DEMO (Agricultor + Parcela de Sandía de 4.84 ha en PostGIS)
-- ============================================================================
INSERT INTO ms5_alerts.farmers (id, full_name, phone_number, telegram_chat_id, telegram_username)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    'Juan Carlos Reyes',
    '+528710000000',
    '1074033728',
    'JamesFranco05'
) ON CONFLICT (id) DO NOTHING;

WITH demo_poly AS (
    SELECT ST_SetSRID(
        ST_GeomFromGeoJSON('{
            "type": "Polygon",
            "coordinates": [[
                [-103.4150, 25.5410],
                [-103.4126, 25.5410],
                [-103.4126, 25.5430],
                [-103.4150, 25.5430],
                [-103.4150, 25.5410]
            ]]
        }'),
        4326
    ) AS geom
)
INSERT INTO ms2_zoning.parcels (
    id,
    farmer_id,
    parcel_name,
    watermelon_variety,
    planting_date,
    boundary_geom,
    centroid_geom,
    area_hectares,
    perimeter_meters
)
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid,
    'Parcela Sandía Lote Norte',
    'Crimson Sweet',
    (CURRENT_DATE - INTERVAL '48 days')::date,
    geom,
    ST_Centroid(geom),
    ROUND((ST_Area(geom::geography) / 10000.0)::numeric, 4),
    ROUND((ST_Perimeter(geom::geography))::numeric, 2)
FROM demo_poly
ON CONFLICT (id) DO NOTHING;

INSERT INTO ms2_zoning.soil_suitability_evaluations (
    parcel_id,
    soil_texture,
    ph_level,
    drainage_level,
    altitude_msnm,
    solar_radiation_mjm2,
    slope_pct,
    viability_score_pct,
    suitability_category,
    technical_breakdown,
    limiting_factors
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'FRANCO_ARENOSA',
    6.40,
    'OPTIMO_BUENO',
    420.0,
    24.8,
    1.8,
    94.0,
    'ALTAMENTE_APTO',
    '{"textureScore": 25, "phScore": 25, "drainageScore": 20, "radiationScore": 15, "topographyScore": 9}',
    '{}'
) ON CONFLICT DO NOTHING;

INSERT INTO ms5_alerts.farmer_parcel_subscriptions (
    farmer_id,
    parcel_id,
    parcel_alias,
    cooldown_minutes
)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Parcela Sandía Lote Norte',
    15
) ON CONFLICT (farmer_id, parcel_id) DO NOTHING;
