-- Profile fields collected during account registration.
ALTER TABLE usuarios ADD COLUMN foto_perfil_url TEXT;
ALTER TABLE usuarios ADD COLUMN linkedin TEXT;
ALTER TABLE usuarios ADD COLUMN intuito_uso TEXT;
ALTER TABLE usuarios ADD COLUMN permite_analise_por_terceiros INTEGER NOT NULL DEFAULT 0;
