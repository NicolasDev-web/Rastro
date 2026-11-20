"""Cópia congelada do pacote ativo para o modo `publicado` (ADR-015).

Copia o manifesto ativo e os quatro arquivos do pacote para `data/publicado/`, mantendo os caminhos
`bundles/<id>/<prefixo>.json` que o site já valida. Cada arquivo vem da pasta do pacote ou, se ela não
puder ser lida, do export de mesmo nome. Em ambos os casos o SHA-256 tem de bater com o manifesto ativo.
Nada no staging, nos snapshots ou no pacote de validação é alterado.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import tempfile
from pathlib import Path

from . import ROOT, VALIDATION_DIR
from .bundle import PREFIXES

PUBLISHED_DIR = ROOT / 'data' / 'publicado'


def _read_verified(validation: Path, manifest: dict, prefix: str, tag: str) -> bytes:
    expected = manifest['files'][prefix]['sha256']
    candidates = [validation / manifest['files'][prefix]['path'], validation / f'{prefix}-{tag}.json']
    for path in candidates:
        try:
            content = path.read_bytes()
        except OSError:
            continue
        if hashlib.sha256(content).hexdigest() == expected:
            return content
    raise ValueError(f'Nenhuma cópia de {prefix} confere com o SHA-256 do manifesto ativo')


def freeze(validation: Path = VALIDATION_DIR, target: Path = PUBLISHED_DIR) -> str:
    validation, target = Path(validation), Path(target)
    manifest = json.loads((validation / 'active-bundle.json').read_text(encoding='utf-8'))
    tag = None
    contents = {}
    for prefix in PREFIXES:
        if tag is None:  # data e hash do snapshot, como nos nomes dos exports
            for f in validation.glob(f'{prefix}-*-{manifest["snapshot"][:8]}.json'):
                tag = f.stem[len(prefix) + 1:]
        contents[prefix] = _read_verified(validation, manifest, prefix, tag or '')
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=target.parent) as temp:
        stage = Path(temp) / 'publicado'
        (stage / 'bundles' / manifest['id']).mkdir(parents=True)
        for prefix, content in contents.items():
            (stage / manifest['files'][prefix]['path']).write_bytes(content)
        (stage / 'active-bundle.json').write_text(json.dumps(manifest, sort_keys=True), encoding='utf-8')
        if target.exists():
            shutil.rmtree(target)
        shutil.move(str(stage), str(target))
    return manifest['id']


def run() -> int:
    ident = freeze()
    print(f'[publicar] pacote {ident[:12]} congelado em data/publicado/ (hashes conferidos com o manifesto ativo)')
    return 0
