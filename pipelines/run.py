"""CLI do pipeline de dados reais do RASTRO.

Uso (a partir da pasta RASTRO/):
    python pipelines/run.py snapshot   # baixa CGU + IBGE (raw imutável + manifesto)
    python pipelines/run.py profile    # inventário e checagem de contrato
    python pipelines/run.py load       # staging SQLite (idempotente por snapshot)
    python pipelines/run.py report     # cobertura, conservação e amostra para conferência
    python pipelines/run.py export     # JSON do modo validação do site
    python pipelines/run.py autores    # Câmara/Senado/Alece, vínculo de autores, fotos e JSON da aba de autores
    python pipelines/run.py documentos # documentos de despesa 2020–2026: conciliação com o arquivo por emenda
    python pipelines/run.py conciliacao # revisa o staging ativo, sem reler os ZIPs
    python pipelines/run.py bundle     # valida e ativa pacote consistente
    python pipelines/run.py fichas     # dados das fichas de emenda e de município (modo validação)
    python pipelines/run.py all
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))


def main(argv: list[str]) -> int:
    cmd = argv[1] if len(argv) > 1 else 'help'
    steps = ['snapshot', 'profile', 'load', 'report', 'autores', 'documentos', 'export', 'fichas', 'bundle'] if cmd == 'all' else [cmd]
    for step in steps:
        if step == 'snapshot':
            from rastro.snapshot import acquire_all
            for e in acquire_all():
                state = 'reaproveitado' if e['reused'] else 'novo'
                print(f"[snapshot] {e['source_id']}: {state} · {e['raw_path']} · sha256 {e['raw_sha256'][:12]}… · {e['bytes']:,} bytes")
        elif step == 'profile':
            from rastro.profile import run as profile
            if profile() != 0:
                return 1
        elif step == 'load':
            from rastro.load import run as load
            load()
        elif step == 'report':
            from rastro.report import run as report
            if report() != 0:
                return 1
        elif step == 'export':
            from rastro.export import run as export
            export()
        elif step == 'bundle':
            from rastro.bundle import run as bundle
            bundle()
        elif step == 'fichas':
            from rastro.fichas import run as fichas
            fichas()
        elif step == 'conciliacao':
            from rastro.audit_conciliacao import run as audit
            audit()
        elif step == 'documentos':
            from rastro.documentos import run as documentos
            if documentos() != 0:
                return 1
        elif step == 'autores':
            from rastro.autores import run as autores
            autores()
        else:
            print(__doc__)
            return 0 if cmd == 'help' else 2
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv))
