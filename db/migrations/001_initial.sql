-- RASTRO: DDL de referência. Rodar em PostgreSQL 15+ com PostGIS.
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE data_snapshots (
  id BIGSERIAL PRIMARY KEY,
  source_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  downloaded_at TIMESTAMPTZ NOT NULL,
  raw_sha256 CHAR(64) NOT NULL UNIQUE,
  dictionary_version TEXT,
  raw_filename TEXT NOT NULL,
  record_count BIGINT CHECK (record_count >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE municipalities (
  ibge_code CHAR(7) PRIMARY KEY,
  name TEXT NOT NULL,
  uf CHAR(2) NOT NULL DEFAULT 'CE',
  geometry_version TEXT,
  geom GEOMETRY(MultiPolygon, 4674)
);
CREATE TABLE actors (
  id BIGSERIAL PRIMARY KEY,
  external_id TEXT,
  name TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK(actor_type IN ('individual','bancada','comissao','outro')),
  external_source TEXT,
  UNIQUE (external_source, external_id)
);
CREATE TABLE amendments (
  id BIGSERIAL PRIMARY KEY,
  official_id TEXT NOT NULL,
  source_system TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL CHECK (fiscal_year BETWEEN 1988 AND 2100),
  modality TEXT NOT NULL,
  budget_action TEXT,
  description TEXT,
  snapshot_id BIGINT NOT NULL REFERENCES data_snapshots(id),
  source_row_id TEXT NOT NULL,
  UNIQUE (source_system,official_id,fiscal_year,source_row_id)
);
CREATE TABLE amendment_actors (
  amendment_id BIGINT NOT NULL REFERENCES amendments(id),
  actor_id BIGINT NOT NULL REFERENCES actors(id),
  role TEXT NOT NULL,
  evidence_url TEXT NOT NULL,
  PRIMARY KEY (amendment_id, actor_id,role)
);
CREATE TABLE beneficiaries (
  id BIGSERIAL PRIMARY KEY,
  official_id TEXT,
  name TEXT NOT NULL,
  beneficiary_type TEXT NOT NULL,
  municipality_code CHAR(7) REFERENCES municipalities(ibge_code),
  territorial_scope TEXT NOT NULL CHECK(territorial_scope IN ('municipio','estado','indeterminado')),
  external_source TEXT
);
CREATE TABLE source_documents (
  id BIGSERIAL PRIMARY KEY,
  snapshot_id BIGINT REFERENCES data_snapshots(id),
  original_url TEXT NOT NULL,
  document_external_id TEXT,
  sha256 CHAR(64),
  captured_at TIMESTAMPTZ,
  document_type TEXT NOT NULL
);
CREATE TABLE financial_events (
  id BIGSERIAL PRIMARY KEY,
  amendment_id BIGINT REFERENCES amendments(id),
  beneficiary_id BIGINT REFERENCES beneficiaries(id),
  source_document_id BIGINT NOT NULL REFERENCES source_documents(id),
  source_event_id TEXT NOT NULL,
  stage TEXT NOT NULL CHECK(stage IN ('autorizado','indicado','empenhado','liquidado','pago','transferido','estornado')),
  amount_brl NUMERIC(18,2) NOT NULL,
  event_date DATE,
  snapshot_id BIGINT NOT NULL REFERENCES data_snapshots(id),
  UNIQUE (snapshot_id, source_event_id,stage)
);
CREATE TABLE transfers (
  id BIGSERIAL PRIMARY KEY,
  official_instrument_id TEXT NOT NULL,
  source_system TEXT NOT NULL,
  beneficiary_id BIGINT REFERENCES beneficiaries(id),
  amendment_id BIGINT REFERENCES amendments(id),
  snapshot_id BIGINT NOT NULL REFERENCES data_snapshots(id),
  UNIQUE (official_instrument_id,source_system,snapshot_id)
);
CREATE TABLE contracts (
  id BIGSERIAL PRIMARY KEY,
  contract_external_id TEXT NOT NULL,
  contracting_party TEXT NOT NULL,
  contracted_party TEXT NOT NULL,
  object_description TEXT,
  amount_brl NUMERIC(18,2),
  source_document_id BIGINT NOT NULL REFERENCES source_documents(id)
);
CREATE TABLE documented_links (
  id BIGSERIAL PRIMARY KEY,
  left_entity_type TEXT NOT NULL,
  left_entity_id BIGINT NOT NULL,
  right_entity_type TEXT NOT NULL,
  right_entity_id BIGINT NOT NULL,
  source_document_id BIGINT REFERENCES source_documents(id),
  evidence_status TEXT NOT NULL CHECK(evidence_status IN ('documentado','em_revisao','nao_identificado')),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX idx_amendments_year ON amendments(fiscal_year);
CREATE INDEX idx_financial_events_amendment ON financial_events(amendment_id,stage);
CREATE INDEX idx_municipality_geom ON municipalities USING GIST(geom);
