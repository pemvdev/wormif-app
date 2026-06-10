-- Legacy migration for databases created before user_id existed in 0001.
ALTER TABLE diagnosticos ADD COLUMN user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_diagnosticos_user_id ON diagnosticos (user_id);
