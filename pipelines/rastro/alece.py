"""Deputados estaduais do Ceará (Alece) para a aba de autores.

Fonte: página oficial https://www.al.ce.gov.br/deputados (HTML), guardada como snapshot imutável.
As EMENDAS estaduais não têm fonte estruturada verificada (ver docs/sources/FONTES-OFICIAIS.md, 6c):
aqui entram só identidade, partido atual, situação e retrato oficial — nenhum valor.
"""
from __future__ import annotations

import html as htmllib
import re
import shutil
from pathlib import Path

from . import RAW_DIR
from .parlamentares import PHOTOS_MANIFEST, PUBLIC_PHOTOS
from .snapshot import Source, acquire, latest, verify

TERMS = 'Página oficial da Assembleia Legislativa do Ceará (al.ce.gov.br).'
SOURCE = Source(source_id='alece_deputados', url='https://www.al.ce.gov.br/deputados', subdir='alece',
                filename='deputados.html', dictionary_version='HTML da página /deputados (cards deputado_card)', license_or_terms=TERMS)

_CARD = re.compile(
    r'src="(?P<img>https://www\.al\.ce\.gov\.br/image/\d+)"\s+alt="Foto de (?P<alt>[^"]+)".*?'
    r'deputado_card--nome[^>]*>\s*<a href="(?P<href>https://www\.al\.ce\.gov\.br/deputados/(?P<slug>[a-z0-9-]+))">\s*(?P<nome>[^<]+?)\s*</a>.*?'
    r'deputado_card--partido[^>]*>\s*(?P<partido>[^<]*?)\s*<', re.S)


class LayoutError(Exception):
    """A página mudou de estrutura: nada é carregado até revisão."""


def parse(page: str, minimum: int = 46) -> list[dict]:
    split = page.find('Suplentes em Exerc')
    out, seen = [], set()
    for m in _CARD.finditer(page):
        if m['slug'] in seen:
            continue
        seen.add(m['slug'])
        out.append({
            'slug': m['slug'], 'nome': htmllib.unescape(m['nome']).strip(), 'partido_atual': htmllib.unescape(m['partido']).strip() or None,
            'situacao': 'suplente_em_exercicio' if split != -1 and m.start() > split else 'titular_ou_licenciado',
            'url_foto': m['img'], 'url_perfil': m['href'],
        })
    if len(out) < minimum:
        raise LayoutError(f'Alece: esperados ao menos {minimum} deputados, encontrados {len(out)} — estrutura da página mudou?')
    return out


def run() -> tuple[list[dict], str]:
    """Baixa a página (snapshot), extrai os deputados e guarda os retratos. Retorna (deputados, data)."""
    entry = acquire(SOURCE)
    deputies = parse(verify(entry).read_text(encoding='utf-8', errors='replace'))
    PUBLIC_PHOTOS.mkdir(parents=True, exist_ok=True)
    for d in deputies:
        src = Source(source_id=f"foto_alece_{d['slug']}", url=d['url_foto'], subdir='fotos', filename=f"alece_{d['slug']}.jpg",
                     dictionary_version='retrato oficial', license_or_terms=TERMS)
        e = latest(src.source_id, PHOTOS_MANIFEST)
        try:
            if e and e['source_url'] == src.url:
                verify(e)
            else:
                e = acquire(src, manifest=PHOTOS_MANIFEST)
            shutil.copyfile(RAW_DIR / e['raw_path'], PUBLIC_PHOTOS / f"alece_{d['slug']}.jpg")
            d['photo'] = f"/fotos/alece_{d['slug']}.jpg"
        except (RuntimeError, FileNotFoundError, ValueError) as exc:
            print(f"  [foto] alece {d['slug']}: {exc}")
            d['photo'] = None
    return deputies, entry['downloaded_at'][:10]
