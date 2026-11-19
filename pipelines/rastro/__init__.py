"""Pipeline de dados reais do RASTRO (SPEC 01). Somente biblioteca padrão do Python.

Fluxo: snapshot (raw imutável + SHA-256) → profile (inventário/contrato) → load (staging SQLite)
→ report (cobertura e conservação) → export (JSON para o modo validação do site).
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # pasta RASTRO/
RAW_DIR = ROOT / 'raw_data'                          # fora do Git
MANIFEST = ROOT / 'data' / 'manifests' / 'snapshots.jsonl'  # versionado
STAGING_DB = ROOT / 'data' / 'staging' / 'rastro.sqlite'   # fora do Git
VALIDATION_DIR = ROOT / 'data' / 'validacao'               # fora do Git
REPORTS_DIR = ROOT / 'reports'
CONTRACTS_DIR = Path(__file__).resolve().parents[1] / 'contracts'

UF_CE_IBGE = '23'
