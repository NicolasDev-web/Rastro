"""Pacote imutável de validação. O ponteiro só muda após validação integral."""
import hashlib
import json
import os
import tempfile
from pathlib import Path
from . import VALIDATION_DIR
from .snapshot import latest

PREFIXES = ('ce-municipios', 'autores', 'emendas', 'municipios')
# Partes opcionais: entram no pacote quando o export do mesmo snapshot existe, e então são validadas (ADR-018).
OPTIONAL_PREFIXES = ('transferegov',)
MONETARY = {'pago', 'pago_total', 'empenhado', 'liquidado', 'rap_pagos', 'rap_inscritos', 'rap_cancelados', 'valor', 'documentos_pago',
            'valor_custeio', 'valor_investimento', 'valor_executado', 'valor_pendente', 'valor_global', 'valor_repasse', 'valor_contrapartida'}


def validate(payloads):
    required = {'ce-municipios': ('municipalities', 'non_municipal', 'years'), 'autores': ('authors', 'collective', 'years'), 'emendas': ('emendas',), 'municipios': ('municipios',)}
    monetary = MONETARY
    def values(obj):
        if isinstance(obj, list):
            for item in obj: values(item)
        elif isinstance(obj, dict):
            for key, item in obj.items():
                if key in monetary and item is not None and (type(item) is not int or abs(item) > 2**53-1):
                    raise ValueError(f'Valor financeiro inválido: {key}')
                values(item)
    for prefix, fields in required.items():
        for field in fields:
            expected = dict if field in ('emendas', 'municipios') else list
            if not isinstance(payloads[prefix].get(field), expected):
                raise ValueError(f'Estrutura inválida: {prefix}/{field}')
        values(payloads[prefix])
    emendas = payloads['emendas']['emendas']
    for code, em in emendas.items():
        if em.get('code') != code or any(not isinstance(em.get(k), list) for k in ('documentos', 'quem_recebeu', 'convenios')) or em.get('conciliacao', {}).get('status') not in ('confere', 'diverge', 'sem_documentos', 'indisponivel'):
            raise ValueError('Ficha de emenda inválida')
    for ibge, city in payloads['municipios']['municipios'].items():
        if city.get('ibge') != ibge or not isinstance(city.get('name'), str) or any(not isinstance(city.get(k), list) for k in ('autores', 'favorecidos', 'emendas_localidade', 'emendas_aplicacao')):
            raise ValueError('Ficha municipal inválida')
        if any(e.get('ficha') and e.get('code') not in emendas for k in ('emendas_localidade', 'emendas_aplicacao') for e in city[k]):
            raise ValueError('Referência de emenda incompatível')
    if 'transferegov' in payloads:  # parte opcional (ADR-018): só referencia fichas existentes
        tg = payloads['transferegov']
        if not isinstance(tg.get('emendas'), dict):
            raise ValueError('Estrutura inválida: transferegov/emendas')
        values(tg)
        for code, item in tg['emendas'].items():
            if code not in emendas or any(not isinstance(item.get(k), list) for k in ('planos_acao', 'convenios')):
                raise ValueError('Referência Transferegov incompatível')


def publish(entry, directory=VALIDATION_DIR):
    directory = Path(directory)
    tag = f"{entry['downloaded_at'][:10]}-{entry['raw_sha256'][:8]}"
    payloads, hashes, sources = {}, {}, None
    for prefix in PREFIXES:
        content = (directory / f'{prefix}-{tag}.json').read_bytes()
        raw = json.loads(content)
        if raw.get('kind') != 'VALIDACAO' or raw.get('snapshot', {}).get('raw_sha256') != entry['raw_sha256']:
            raise ValueError(f'Export incompatível: {prefix}')
        if prefix != 'autores':
            selected = raw.get('document_sources')
            if not selected or (sources is not None and selected != sources):
                raise ValueError(f'Documentos incompatíveis: {prefix}; regenere documentos, export e fichas')
            sources = selected
        payloads[prefix] = content
        hashes[prefix] = hashlib.sha256(content).hexdigest()
    for prefix in OPTIONAL_PREFIXES:
        path = directory / f'{prefix}-{tag}.json'
        if not path.exists():
            continue
        content = path.read_bytes()
        raw = json.loads(content)
        if raw.get('kind') != 'VALIDACAO' or raw.get('snapshot', {}).get('raw_sha256') != entry['raw_sha256']:
            raise ValueError(f'Export incompatível: {prefix}')
        payloads[prefix] = content
        hashes[prefix] = hashlib.sha256(content).hexdigest()
    validate({prefix: json.loads(content) for prefix, content in payloads.items()})
    ident = hashlib.sha256(json.dumps(hashes, sort_keys=True).encode()).hexdigest()
    target = directory / 'bundles' / ident
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        with tempfile.TemporaryDirectory(dir=target.parent) as temp:
            stage = Path(temp) / 'package'
            stage.mkdir()
            for prefix, content in payloads.items():
                (stage / f'{prefix}.json').write_bytes(content)
            os.replace(stage, target)
    for prefix, digest in hashes.items():
        if hashlib.sha256((target / f'{prefix}.json').read_bytes()).hexdigest() != digest:
            raise ValueError('Pacote existente foi alterado')
    manifest = {'version': 1, 'id': ident, 'snapshot': entry['raw_sha256'], 'document_sources': sources,
                'files': {p: {'path': f'bundles/{ident}/{p}.json', 'sha256': hashes[p]} for p in hashes}}
    with tempfile.NamedTemporaryFile(dir=directory, delete=False, suffix='.tmp', mode='w', encoding='utf-8') as handle:
        json.dump(manifest, handle, sort_keys=True)
        temp = handle.name
    try:
        os.replace(temp, directory / 'active-bundle.json')
    finally:
        Path(temp).unlink(missing_ok=True)
    return ident


def run():
    print('[bundle] ' + publish(latest('cgu_emendas')))
