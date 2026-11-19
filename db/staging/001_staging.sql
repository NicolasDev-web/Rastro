-- RASTRO: staging local (SQLite) do incremento 1 — ADR-007.
-- Dinheiro em centavos inteiros; NULL = ausente (nunca zero fabricado).
-- Toda linha referencia um snapshot e a linha física do arquivo bruto (AC01).
-- Versão do schema em PRAGMA user_version (load.py recria o staging, que é derivado, quando muda).

CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY,
  source_id TEXT NOT NULL,
  raw_sha256 TEXT NOT NULL UNIQUE,
  raw_path TEXT NOT NULL,
  downloaded_at TEXT NOT NULL,
  last_modified TEXT,
  contract_version TEXT
);

CREATE TABLE IF NOT EXISTS municipalities (
  ibge_code TEXT PRIMARY KEY CHECK (length(ibge_code) = 7),
  name TEXT NOT NULL,
  name_norm TEXT NOT NULL,
  uf TEXT NOT NULL,
  snapshot_id INTEGER NOT NULL REFERENCES snapshots(id)
);

CREATE TABLE IF NOT EXISTS cgu_emenda_lines (
  snapshot_id INTEGER NOT NULL REFERENCES snapshots(id),
  source_row_id TEXT NOT NULL,
  row_sha256 TEXT NOT NULL,
  emenda_code TEXT,                     -- oficial (12 dígitos) ou NULL
  technical_id TEXT NOT NULL,           -- = emenda_code ou 'TEC-…' (não oficial)
  is_official_code INTEGER NOT NULL CHECK (is_official_code IN (0, 1)),
  ano INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  autor_codigo TEXT,
  autor_nome TEXT,
  numero TEXT,
  possui_apoiador TEXT,
  localidade TEXT NOT NULL,
  municipio_ibge TEXT REFERENCES municipalities(ibge_code),
  -- recorte CE: municipio | estado | multiplo; fora do CE (aba de autores): outra_uf | nacional | regional | exterior | sem_uf
  territorial_scope TEXT NOT NULL CHECK (territorial_scope IN ('municipio', 'estado', 'multiplo', 'outra_uf', 'nacional', 'regional', 'exterior', 'sem_uf')),
  funcao_codigo TEXT, funcao TEXT,
  subfuncao_codigo TEXT, subfuncao TEXT,
  programa_codigo TEXT, programa TEXT,
  acao_codigo TEXT, acao TEXT,
  po_codigo TEXT, po TEXT,
  empenhado_cents INTEGER,
  liquidado_cents INTEGER,
  pago_cents INTEGER,
  rap_inscritos_cents INTEGER,
  rap_cancelados_cents INTEGER,
  rap_pagos_cents INTEGER,
  uf TEXT,                              -- nome da UF na fonte (NULL se sem UF)
  municipio_nome TEXT,                  -- nome do município na fonte (qualquer UF)
  municipio_codigo TEXT,                -- código IBGE do município na fonte (qualquer UF; FK só no recorte CE)
  PRIMARY KEY (snapshot_id, source_row_id)
);
CREATE INDEX IF NOT EXISTS idx_lines_autor ON cgu_emenda_lines (snapshot_id, autor_codigo, ano);
CREATE INDEX IF NOT EXISTS idx_lines_scope ON cgu_emenda_lines (snapshot_id, territorial_scope, ano);
CREATE INDEX IF NOT EXISTS idx_lines_code ON cgu_emenda_lines (snapshot_id, emenda_code);

-- Linhas fora do recorte do Ceará: só agregados, para medir cobertura.
CREATE TABLE IF NOT EXISTS cgu_outside_summary (
  snapshot_id INTEGER NOT NULL REFERENCES snapshots(id),
  ano INTEGER NOT NULL,
  outside_kind TEXT NOT NULL,           -- outra_uf, nacional, regional, exterior, sem_uf
  rows INTEGER NOT NULL,
  empenhado_cents INTEGER, liquidado_cents INTEGER, pago_cents INTEGER,
  PRIMARY KEY (snapshot_id, ano, outside_kind)
);

CREATE TABLE IF NOT EXISTS cgu_favorecidos_ce (
  snapshot_id INTEGER NOT NULL REFERENCES snapshots(id),
  source_row_id TEXT NOT NULL,
  row_sha256 TEXT NOT NULL,
  emenda_code TEXT,
  tipo_emenda TEXT,
  ano_mes TEXT,
  favorecido_codigo TEXT,               -- NULL quando mascarado
  favorecido_nome TEXT,                 -- texto de omissão quando mascarado
  masked INTEGER NOT NULL CHECK (masked IN (0, 1)),
  natureza_juridica TEXT,
  tipo_favorecido TEXT,
  municipio_nome TEXT,
  municipio_ibge TEXT REFERENCES municipalities(ibge_code),  -- casamento exato por nome; NULL se não casar
  valor_cents INTEGER,
  PRIMARY KEY (snapshot_id, source_row_id)
);

CREATE TABLE IF NOT EXISTS cgu_convenios_ce (
  snapshot_id INTEGER NOT NULL REFERENCES snapshots(id),
  source_row_id TEXT NOT NULL,
  row_sha256 TEXT NOT NULL,
  emenda_code TEXT NOT NULL,
  localidade TEXT,
  tipo_emenda TEXT,
  data_publicacao TEXT,
  convenente TEXT,
  objeto TEXT,
  numero TEXT,
  valor_cents INTEGER,
  PRIMARY KEY (snapshot_id, source_row_id)
);

CREATE TABLE IF NOT EXISTS load_exceptions (
  snapshot_id INTEGER NOT NULL REFERENCES snapshots(id),
  source_row_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  detail TEXT
);
