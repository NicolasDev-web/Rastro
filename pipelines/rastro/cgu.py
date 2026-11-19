"""Leitura do ZIP da CGU conforme o contrato (SPEC 01 → Contrato verificado).

Tudo aqui é puro (sem banco): leitura validada, sentinelas, dinheiro em centavos,
classificação territorial e mascaramento de pessoas físicas.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import re
import unicodedata
import zipfile
from pathlib import Path
from typing import Iterator

from . import CONTRACTS_DIR

MAIN = 'EmendasParlamentares.csv'
FAVORECIDO = 'EmendasParlamentares_PorFavorecido.csv'
CONVENIOS = 'EmendasParlamentares_Convenios.csv'

UF_CE_CODE = '2300000'
LOC_ESTADO = 'CEARÁ (UF)'
LOC_MULTIPLO = 'MÚLTIPLO'
OUTSIDE_NO_UF = {'Nacional': 'nacional', 'Exterior': 'exterior', 'Norte': 'regional', 'Nordeste': 'regional',
                 'Centro-Oeste': 'regional', 'Sudeste': 'regional', 'Sul': 'regional'}

MONEY_COLUMNS = {
    'empenhado': 'Valor Empenhado', 'liquidado': 'Valor Liquidado', 'pago': 'Valor Pago',
    'rap_inscritos': 'Valor Restos A Pagar Inscritos', 'rap_cancelados': 'Valor Restos A Pagar Cancelados',
    'rap_pagos': 'Valor Restos A Pagar Pagos',
}
METRICS = tuple(MONEY_COLUMNS)

_MONEY_RE = re.compile(r'^-?\d+(,\d{1,2})?$')


class ContractError(Exception):
    """Arquivo diverge do contrato: a carga inteira é bloqueada (AC05)."""


def load_contract(path: Path | None = None) -> dict:
    return json.loads((path or CONTRACTS_DIR / 'cgu_emendas.json').read_text(encoding='utf-8'))


def check_members(zf: zipfile.ZipFile, contract: dict) -> list[str]:
    errors = []
    names = set(zf.namelist())
    expected = set(contract['members'])
    for missing in sorted(expected - names):
        errors.append(f'Arquivo esperado ausente no ZIP: {missing}')
    for extra in sorted(names - expected):
        errors.append(f'Arquivo novo, fora do contrato: {extra}')
    return errors


def header_errors(member: str, header: list[str], contract: dict) -> list[str]:
    expected = contract['members'][member]['columns']
    if header == expected:
        return []
    errs = []
    for col in expected:
        if col not in header:
            errs.append(f'{member}: coluna ausente "{col}"')
    for col in header:
        if col not in expected:
            errs.append(f'{member}: coluna desconhecida "{col}"')
    if not errs:
        errs.append(f'{member}: ordem das colunas mudou')
    return errs


def iter_rows(zf: zipfile.ZipFile, member: str, contract: dict) -> Iterator[tuple[int, list[str], dict[str, str]]]:
    """Gera (número da linha física, valores brutos, dict) após validar o cabeçalho."""
    with zf.open(member) as fh:
        text = io.TextIOWrapper(fh, encoding=contract['encoding'], errors='strict', newline='')
        reader = csv.reader(text, delimiter=contract['delimiter'])
        header = next(reader)
        errs = header_errors(member, header, contract)
        if errs:
            raise ContractError('; '.join(errs))
        width = len(header)
        for row in reader:
            if len(row) != width:
                raise ContractError(f'{member}: linha {reader.line_num} com {len(row)} campos (esperado {width})')
            yield reader.line_num, row, dict(zip(header, row))


SENTINELS = {'', 'Sem informação', 'S/I', '-99'}


def clean(value: str | None) -> str | None:
    """Sentinelas de ausência viram None (AC07). Nunca viram texto nem zero."""
    if value is None:
        return None
    v = value.strip()
    return None if v in SENTINELS else v


def cents(value: str | None) -> int | None:
    """'408000,00' → 40800000. Vazio → None (AC06). Formato inesperado → erro (nada é adivinhado)."""
    v = clean(value)
    if v is None:
        return None
    if not _MONEY_RE.match(v):
        raise ContractError(f'Valor monetário fora do formato do contrato: {value!r}')
    neg = v.startswith('-')
    v = v.lstrip('-')
    whole, _, frac = v.partition(',')
    total = int(whole) * 100 + int((frac + '00')[:2])
    return -total if neg else total


def row_sha256(values: list[str]) -> str:
    return hashlib.sha256('\x1f'.join(values).encode('utf-8')).hexdigest()


def classify(d: dict[str, str], ce_codes: set[str]) -> tuple[str, str | None]:
    """Escopo territorial pela UF/município IBGE — nunca por texto (AC08).

    Retorna (escopo, código do município). Escopos: municipio, estado, multiplo,
    ce_nao_classificado (exceção), fora_do_recorte:<tipo>.
    """
    uf_code = clean(d.get('Código UF IBGE'))
    mun_code = clean(d.get('Código Município IBGE'))
    loc = (d.get('Localidade de aplicação do recurso') or '').strip()
    if uf_code != UF_CE_CODE:
        if uf_code in (None, '-1'):  # '-1' = sem UF (localidade Nacional, regional ou Exterior)
            return f'fora_do_recorte:{OUTSIDE_NO_UF.get(loc, "sem_uf")}', None
        return 'fora_do_recorte:outra_uf', None
    if mun_code and mun_code.isdigit() and len(mun_code) == 7:
        return ('municipio', mun_code) if mun_code in ce_codes else ('ce_nao_classificado', mun_code)
    if loc == LOC_MULTIPLO:
        return 'multiplo', None
    if loc == LOC_ESTADO:
        return 'estado', None
    return 'ce_nao_classificado', None


def normalize_name(name: str) -> str:
    n = unicodedata.normalize('NFD', name).encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^A-Z0-9]+', ' ', n.upper()).strip()


MASKED_PF = '[pessoa física — omitido]'
MASKED_EI = '[empresário individual — omitido]'


def mask_favorecido(tipo: str | None, natureza: str | None, codigo: str | None, nome: str | None) -> tuple[str | None, str | None, bool]:
    """LGPD (AC09): pessoa física e empresário individual nunca saem do raw com código ou nome."""
    if tipo and normalize_name(tipo) == 'PESSOA FISICA':  # a fonte grafa "Pessoa Fisica", sem acento
        return None, MASKED_PF, True
    if natureza and 'Empresário (Individual)' in natureza:
        return None, MASKED_EI, True
    return codigo, nome, False


def official_code(code: str | None, year: str | None) -> tuple[str | None, str | None]:
    """Código oficial de 12 dígitos cujo prefixo é o ano. Retorna (código, motivo_da_exceção)."""
    c = clean(code)
    if c is None:
        return None, None
    if not (c.isdigit() and len(c) == 12):
        return None, f'código fora do padrão: {c!r}'
    if year and c[:4] != year:
        return c, f'prefixo {c[:4]} difere do ano {year}'
    return c, None
