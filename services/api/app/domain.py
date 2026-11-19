"""Camada de domínio sem dependências externas e sem dados públicos reais."""
import unicodedata
from decimal import Decimal
from typing import Literal

STAGE = Literal['authorized','committed','paid']


def normalize(value: str) -> str:
    normalized = unicodedata.normalize('NFD', value).casefold()
    return ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')


def get_stage(record: dict, stage: str) -> Decimal:
    if stage not in ('authorized', 'committed', 'paid'):
        raise ValueError('Invalid stage')
    value = record.get(stage)
    if value is None:
        raise ValueError('Stage not documented')
    return Decimal(str(value))


def filtered_records(records: list[dict], name: str = '') -> list[dict]:
    return [r for r in records if normalize(name) in normalize(r['municipality'])]


def stage_total(records: list[dict], stage: str) -> Decimal:
    # Não somar estágios diferentes. A etapa é um parâmetro único.
    return sum((get_stage(r, stage) for r in records), Decimal('0'))
