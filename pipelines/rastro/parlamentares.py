"""Parlamentares federais (Câmara e Senado) para a aba de autores (SPEC 04, T04.04; ADR-009).

Snapshots imutáveis das listas oficiais da 56ª e 57ª legislaturas, tabela `parlamentares`
e fotos oficiais (só de parlamentares vinculados), com SHA-256 em manifesto próprio.
"""
from __future__ import annotations

import json
import shutil
import sqlite3
from pathlib import Path

from . import RAW_DIR, ROOT
from . import cgu
from .snapshot import Source, acquire, latest, verify

LEGISLATURAS = (56, 57)
PHOTOS_MANIFEST = ROOT / 'data' / 'manifests' / 'fotos.jsonl'
PUBLIC_PHOTOS = ROOT / 'apps' / 'web' / 'public' / 'fotos'
CAMARA_TERMS = 'Dados abertos da Câmara dos Deputados (dadosabertos.camara.leg.br).'
SENADO_TERMS = 'Dados abertos do Senado Federal (legis.senado.leg.br/dadosabertos).'

SCHEMA = """
CREATE TABLE IF NOT EXISTS parlamentares (
  casa TEXT NOT NULL CHECK (casa IN ('camara', 'senado')),
  id TEXT NOT NULL,
  nome TEXT NOT NULL,
  nome_norm TEXT NOT NULL,
  partido_atual TEXT,
  uf TEXT,
  eleito_ce INTEGER NOT NULL CHECK (eleito_ce IN (0, 1)),
  legislaturas TEXT NOT NULL,
  url_foto TEXT,
  url_perfil TEXT,
  snapshot_date TEXT NOT NULL,
  PRIMARY KEY (casa, id)
);
"""


def camara_source(leg: int, page: int) -> Source:
    return Source(
        source_id=f'camara_deputados_leg{leg}_p{page}',
        url=f'https://dadosabertos.camara.leg.br/api/v2/deputados?idLegislatura={leg}&itens=1000&pagina={page}&ordem=ASC&ordenarPor=id',
        subdir='camara', filename=f'deputados_leg{leg}_p{page}.json',
        dictionary_version='API Dados Abertos da Câmara v2 — /deputados', license_or_terms=CAMARA_TERMS)


SENADO = Source(
    source_id='senado_senadores_leg56_57',
    url='https://legis.senado.leg.br/dadosabertos/senador/lista/legislatura/56/57.json',
    subdir='senado', filename='senadores_leg56_57.json',
    dictionary_version='Dados Abertos do Senado — /senador/lista/legislatura', license_or_terms=SENADO_TERMS)


def _has_next(payload: dict) -> bool:
    return any(link.get('rel') == 'next' for link in payload.get('links', []))


def acquire_lists() -> list[dict]:
    """Baixa as listas (paginadas na Câmara). Cada página é um snapshot imutável próprio."""
    entries = []
    for leg in LEGISLATURAS:
        page = 1
        while True:
            e = acquire(camara_source(leg, page))
            entries.append(e)
            if not _has_next(json.loads(verify(e).read_text(encoding='utf-8'))):
                break
            page += 1
    entries.append(acquire(SENADO))
    return entries


def _camara_pages(leg: int, raw_dir: Path = RAW_DIR) -> list[tuple[dict, dict]]:
    pages, page = [], 1
    while True:
        e = latest(f'camara_deputados_leg{leg}_p{page}')
        if not e:
            if page == 1:
                raise SystemExit(f'Sem snapshot da Câmara (legislatura {leg}). Rode: python pipelines/run.py autores')
            raise ValueError(f'Página {page} da legislatura {leg} anunciada mas ausente do manifesto')
        payload = json.loads(verify(e, raw_dir).read_text(encoding='utf-8'))
        pages.append((e, payload))
        if not _has_next(payload):
            return pages
        page += 1


def parse_camara(payloads: list[tuple[int, dict]]) -> dict[tuple[str, str], dict]:
    """(legislatura, payload) → parlamentares. A listagem mais recente define partido/UF atuais."""
    out: dict[tuple[str, str], dict] = {}
    for leg, payload in sorted(payloads, key=lambda x: x[0]):
        for d in payload['dados']:
            key = ('camara', str(d['id']))
            p = out.setdefault(key, {'casa': 'camara', 'id': str(d['id']), 'legislaturas': set(), 'eleito_ce': False})
            p.update(nome=d['nome'], partido_atual=d.get('siglaPartido'), uf=d.get('siglaUf'), url_foto=d.get('urlFoto'),
                     url_perfil=f"https://www.camara.leg.br/deputados/{d['id']}")
            p['legislaturas'].add(leg)
            if d.get('siglaUf') == 'CE':
                p['eleito_ce'] = True
    return out


def parse_senado(payload: dict) -> dict[tuple[str, str], dict]:
    out: dict[tuple[str, str], dict] = {}
    for item in payload['ListaParlamentarLegislatura']['Parlamentares']['Parlamentar']:
        ident = item['IdentificacaoParlamentar']
        mandatos = item.get('Mandatos', {}).get('Mandato', [])
        mandatos = mandatos if isinstance(mandatos, list) else [mandatos]
        ufs = {m.get('UfParlamentar') for m in mandatos if m.get('UfParlamentar')} | ({ident['UfParlamentar']} if ident.get('UfParlamentar') else set())
        legs = set()
        for m in mandatos:
            for k in ('PrimeiraLegislaturaDoMandato', 'SegundaLegislaturaDoMandato'):
                n = (m.get(k) or {}).get('NumeroLegislatura')
                if n and int(n) in LEGISLATURAS:
                    legs.add(int(n))
        foto = ident.get('UrlFotoParlamentar')
        out[('senado', ident['CodigoParlamentar'])] = {
            'casa': 'senado', 'id': ident['CodigoParlamentar'], 'nome': ident['NomeParlamentar'],
            'partido_atual': ident.get('SiglaPartidoParlamentar'), 'uf': 'CE' if 'CE' in ufs else (sorted(ufs)[0] if ufs else None),
            'eleito_ce': 'CE' in ufs, 'legislaturas': legs or set(LEGISLATURAS),
            'url_foto': foto.replace('http://', 'https://') if foto else None,
            'url_perfil': (ident.get('UrlPaginaParlamentar') or '').replace('http://', 'https://') or None,
        }
    return out


def load(con: sqlite3.Connection, raw_dir: Path = RAW_DIR) -> dict:
    con.executescript(SCHEMA)
    payloads, dates = [], []
    for leg in LEGISLATURAS:
        for e, payload in _camara_pages(leg, raw_dir):
            payloads.append((leg, payload))
            dates.append(e['downloaded_at'])
    senado_entry = latest(SENADO.source_id)
    if not senado_entry:
        raise SystemExit('Sem snapshot do Senado. Rode: python pipelines/run.py autores')
    dates.append(senado_entry['downloaded_at'])
    people = {**parse_camara(payloads), **parse_senado(json.loads(verify(senado_entry, raw_dir).read_text(encoding='utf-8')))}
    snap_date = min(dates)[:10]
    con.execute('DELETE FROM parlamentares')
    con.executemany('INSERT INTO parlamentares VALUES (?,?,?,?,?,?,?,?,?,?,?)', [
        (p['casa'], p['id'], p['nome'], cgu.normalize_name(p['nome']), p.get('partido_atual'), p.get('uf'), int(p['eleito_ce']),
         ','.join(str(x) for x in sorted(p['legislaturas'])), p.get('url_foto'), p.get('url_perfil'), snap_date)
        for p in people.values()])
    return {'parlamentares': len(people), 'eleitos_ce': sum(1 for p in people.values() if p['eleito_ce']), 'data': snap_date}


def fetch_photos(con: sqlite3.Connection, keys: list[tuple[str, str]]) -> dict[tuple[str, str], str]:
    """Baixa (ou reaproveita) a foto oficial de cada parlamentar e copia para o site. Retorna caminho público."""
    PUBLIC_PHOTOS.mkdir(parents=True, exist_ok=True)
    out = {}
    for casa, pid in keys:
        row = con.execute('SELECT url_foto FROM parlamentares WHERE casa = ? AND id = ?', (casa, pid)).fetchone()
        if not row or not row[0]:
            continue
        src = Source(source_id=f'foto_{casa}_{pid}', url=row[0], subdir='fotos', filename=f'{casa}_{pid}.jpg',
                     dictionary_version='retrato oficial', license_or_terms=CAMARA_TERMS if casa == 'camara' else SENADO_TERMS)
        e = latest(src.source_id, PHOTOS_MANIFEST)
        try:
            if e and e['source_url'] == src.url:
                verify(e)  # retrato já guardado e íntegro: não baixa de novo
            else:
                e = acquire(src, manifest=PHOTOS_MANIFEST)
        except (RuntimeError, FileNotFoundError, ValueError) as exc:  # foto indisponível: a ficha mostra iniciais
            print(f'  [foto] {casa} {pid}: {exc}')
            continue
        dest = PUBLIC_PHOTOS / f'{casa}_{pid}.jpg'
        shutil.copyfile(RAW_DIR / e['raw_path'], dest)
        out[(casa, pid)] = f'/fotos/{casa}_{pid}.jpg'
    return out
