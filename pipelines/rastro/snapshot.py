"""Aquisição de snapshots imutáveis (SPEC 01, T01.02 / AC01).

Regras:
- download em streaming, SHA-256 calculado durante a escrita;
- nome final `<data>_<sha8>_<arquivo>`; nunca sobrescreve; mesmo SHA = reaproveita;
- manifesto append-only em data/manifests/snapshots.jsonl (versionado no Git);
- User-Agent genérico, sem dados pessoais.
"""
from __future__ import annotations

import hashlib
import http.client
import json
import os
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Iterable

from . import MANIFEST, RAW_DIR

USER_AGENT = 'RASTRO-pesquisa/0.1 (jornalismo de dados; uso de dados abertos)'
CHUNK = 1 << 20


@dataclass(frozen=True)
class Source:
    source_id: str
    url: str
    subdir: str
    filename: str
    dictionary_version: str
    license_or_terms: str


SOURCES: dict[str, Source] = {
    'cgu_emendas': Source(
        source_id='cgu_emendas',
        url='https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares/UNICO',
        subdir='cgu/emendas',
        filename='EmendasParlamentares.zip',
        dictionary_version='https://portaldatransparencia.gov.br/dicionario-de-dados/emendas-parlamentares (consultado 2026-11-19)',
        license_or_terms='Dados abertos do Portal da Transparência (CGU). Termos de uso a registrar na revisão editorial.',
    ),
    'ibge_municipios_ce': Source(
        source_id='ibge_municipios_ce',
        url='https://servicodados.ibge.gov.br/api/v1/localidades/estados/23/municipios',
        subdir='ibge',
        filename='municipios_CE.json',
        dictionary_version='API de Localidades do IBGE v1',
        license_or_terms='Dados públicos do IBGE (API de serviços de dados).',
    ),
}

# Documentos de despesa por ano (incremento 2): um documento SIAFI por linha.
for _ano in range(2020, 2027):
    SOURCES[f'cgu_documentos_{_ano}'] = Source(
        source_id=f'cgu_documentos_{_ano}',
        url=f'https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares-documentos/{_ano}',
        subdir='cgu/documentos',
        filename=f'{_ano}_EmendasParlamentaresPorDocumento.zip',
        dictionary_version='https://portaldatransparencia.gov.br/dicionario-de-dados/emendas-parlamentares-por-documento (consultado 2026-11-19)',
        license_or_terms='Dados abertos do Portal da Transparência (CGU). Termos de uso a registrar na revisão editorial.',
    )


class Response:
    """Interface mínima usada pelo download (facilita testes sem rede)."""
    def __init__(self, stream, final_url: str, headers: dict[str, str]):
        self.stream, self.final_url, self.headers = stream, final_url, headers


def http_fetch(url: str) -> Response:
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'application/json, */*;q=0.8'})
    resp = urllib.request.urlopen(req, timeout=120)  # segue redirecionamentos
    return Response(resp, resp.geturl(), {k.lower(): v for k, v in resp.headers.items()})


def read_manifest(path: Path = MANIFEST) -> list[dict]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding='utf-8').splitlines() if line.strip()]


def latest(source_id: str, path: Path = MANIFEST) -> dict | None:
    entries = [e for e in read_manifest(path) if e['source_id'] == source_id]
    return entries[-1] if entries else None


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as fh:
        for chunk in iter(lambda: fh.read(CHUNK), b''):
            h.update(chunk)
    return h.hexdigest()


def verify(entry: dict, raw_dir: Path = RAW_DIR) -> Path:
    """Confere que o arquivo bruto ainda existe e não foi alterado."""
    p = raw_dir / entry['raw_path']
    if not p.exists():
        raise FileNotFoundError(f'Snapshot ausente: {p}')
    actual = sha256_file(p)
    if actual != entry['raw_sha256']:
        raise ValueError(f'SHA-256 divergente para {p}: {actual} != {entry["raw_sha256"]}')
    return p


def acquire(source: Source, *, raw_dir: Path = RAW_DIR, manifest: Path = MANIFEST,
            fetch: Callable[[str], Response] = http_fetch, retries: int = 3,
            now: Callable[[], datetime] = lambda: datetime.now(timezone.utc)) -> dict:
    target_dir = raw_dir / source.subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    part = target_dir / f'.{source.filename}.part'

    for attempt in range(1, retries + 1):
        try:
            resp = fetch(source.url)
            h, size = hashlib.sha256(), 0
            with part.open('wb') as out:
                for chunk in iter(lambda: resp.stream.read(CHUNK), b''):
                    out.write(chunk)
                    h.update(chunk)
                    size += len(chunk)
            break
        except (urllib.error.URLError, TimeoutError, ConnectionError, http.client.HTTPException) as exc:
            part.unlink(missing_ok=True)
            if attempt == retries:
                raise RuntimeError(f'Falha ao baixar {source.url}: {exc}') from exc
            time.sleep(2 ** attempt)

    if size == 0:
        part.unlink(missing_ok=True)
        raise RuntimeError(f'Arquivo vazio recebido de {source.url}')

    digest = h.hexdigest()
    existing = next((e for e in read_manifest(manifest) if e['source_id'] == source.source_id and e['raw_sha256'] == digest), None)
    if existing:
        part.unlink(missing_ok=True)
        verify(existing, raw_dir)
        return {**existing, 'reused': True}

    stamp = now()
    final = target_dir / f'{stamp:%Y-%m-%d}_{digest[:8]}_{source.filename}'
    if final.exists():  # mesmo nome com outro conteúdo nunca deve acontecer
        part.unlink(missing_ok=True)
        raise FileExistsError(f'Recusando sobrescrever {final}')
    os.replace(part, final)
    os.chmod(final, 0o444)  # somente leitura

    entry = {
        'source_id': source.source_id,
        'source_url': source.url,
        'final_url': resp.final_url,
        'downloaded_at': stamp.isoformat(timespec='seconds'),
        'last_modified': resp.headers.get('last-modified'),
        'etag': resp.headers.get('etag'),
        'raw_sha256': digest,
        'bytes': size,
        'raw_path': final.relative_to(raw_dir).as_posix(),
        'dictionary_version': source.dictionary_version,
        'license_or_terms': source.license_or_terms,
    }
    manifest.parent.mkdir(parents=True, exist_ok=True)
    with manifest.open('a', encoding='utf-8') as fh:
        fh.write(json.dumps(entry, ensure_ascii=False, sort_keys=True) + '\n')
    return {**entry, 'reused': False}


def acquire_all(ids: Iterable[str] = SOURCES) -> list[dict]:
    return [acquire(SOURCES[i]) for i in ids]
