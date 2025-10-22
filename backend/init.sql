-- TradesPro Database Initialization Script
-- PostgreSQL 15+

-- ============================================
-- Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Password reset
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- ============================================
-- Projects Table
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Owner
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Project metadata
    location VARCHAR(200),
    client_name VARCHAR(200),
    
    -- Status
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_owner_created ON projects(owner_id, created_at DESC);
CREATE INDEX idx_projects_name ON projects(name);
CREATE INDEX idx_projects_archived ON projects(is_archived) WHERE is_archived = FALSE;

-- ============================================
-- Calculations Table
-- ============================================
CREATE TABLE IF NOT EXISTS calculations (
    -- Primary key is bundle ID from calculation engine
    id VARCHAR(36) PRIMARY KEY,
    
    -- Project relationship
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Calculation metadata
    building_type VARCHAR(50) NOT NULL,
    calculation_type VARCHAR(50) DEFAULT 'cec_load',
    
    -- Code version used
    code_edition VARCHAR(10) DEFAULT '2024',
    code_type VARCHAR(10) DEFAULT 'cec',
    
    -- Complete calculation bundle (JSONB for indexing)
    inputs JSONB NOT NULL,
    results JSONB NOT NULL,
    steps JSONB NOT NULL,
    warnings JSONB,
    
    -- Engine metadata
    engine_version VARCHAR(50),
    engine_commit VARCHAR(64),
    
    -- Bundle integrity
    bundle_hash VARCHAR(64),
    
    -- Signing (future feature)
    is_signed BOOLEAN DEFAULT FALSE,
    signature JSONB,
    signed_at TIMESTAMP WITH TIME ZONE,
    signed_by VARCHAR(200),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    calculation_time_ms INTEGER,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT calculations_building_type_check 
        CHECK (building_type IN ('single-dwelling', 'apartment', 'school', 'hospital', 'hotel', 'other'))
);

CREATE INDEX idx_calc_project ON calculations(project_id);
CREATE INDEX idx_calc_project_created ON calculations(project_id, created_at DESC);
CREATE INDEX idx_calc_building_type ON calculations(building_type);
CREATE INDEX idx_calc_code_edition ON calculations(code_edition);
CREATE INDEX idx_calc_deleted ON calculations(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_calc_signed ON calculations(is_signed) WHERE is_signed = TRUE;

-- GIN index for JSONB queries
CREATE INDEX idx_calc_inputs_gin ON calculations USING GIN (inputs);
CREATE INDEX idx_calc_results_gin ON calculations USING GIN (results);

-- ============================================
-- Audit Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    
    -- User who performed action
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Additional context
    details JSONB,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- Async Calculation Jobs Table (New)
-- ============================================
CREATE TABLE IF NOT EXISTS calculation_jobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User and project
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Job status
    status VARCHAR(20) DEFAULT 'pending',
    
    -- Inputs and result
    inputs JSONB NOT NULL,
    result_id VARCHAR(36) REFERENCES calculations(id) ON DELETE SET NULL,
    error TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_time_ms INTEGER,
    
    -- Constraints
    CONSTRAINT job_status_check 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX idx_jobs_user ON calculation_jobs(user_id);
CREATE INDEX idx_jobs_status ON calculation_jobs(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_jobs_created ON calculation_jobs(created_at DESC);

-- ============================================
-- Insert Default Admin User (Development Only)
-- ============================================
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (email, hashed_password, full_name, is_superuser, is_verified)
VALUES (
    'admin@tradespro.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5yvgWNPuZ.Rpy',
    'System Administrator',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Functions & Triggers
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Views
-- ============================================

-- Recent calculations view
CREATE OR REPLACE VIEW recent_calculations AS
SELECT 
    c.id,
    c.building_type,
    c.code_edition,
    c.created_at,
    c.results->>'conductorSize' as conductor_size,
    c.results->>'panelRatingA' as panel_rating,
    p.name as project_name,
    u.email as user_email
FROM calculations c
JOIN projects p ON c.project_id = p.id
JOIN users u ON p.owner_id = u.id
WHERE c.deleted_at IS NULL
ORDER BY c.created_at DESC;

-- User statistics view
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT p.id) as project_count,
    COUNT(DISTINCT c.id) as calculation_count,
    MAX(c.created_at) as last_calculation_at
FROM users u
LEFT JOIN projects p ON p.owner_id = u.id AND p.is_archived = FALSE
LEFT JOIN calculations c ON c.project_id = p.id AND c.deleted_at IS NULL
GROUP BY u.id, u.email;

-- ============================================
-- Grant Permissions
-- ============================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tradespro_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tradespro_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO tradespro_user;