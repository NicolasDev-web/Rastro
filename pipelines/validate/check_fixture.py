"""Validação mínima de fixtures, não valida a integridade de dados governamentais reais."""
import json
from decimal import Decimal
from pathlib import Path

FIXTURE=Path(__file__).resolve().parents[2] / 'data' / 'fixtures' / 'municipios-demo.json'

def validate(payload: dict) -> list[str]:
    errors=[]
    if payload.get('kind')!='DEMO_ONLY':errors.append('Expected DEMO_ONLY marker')
    if 'fict' not in payload.get('warning','').lower():errors.append('Missing fictional-data warning')
    keys=set()
    for i,r in enumerate(payload.get('records',[])):
        code=r.get('ibge_code','')
        if len(code)!=7 or not code.isdigit():errors.append(f'Invalid IBGE code at {i}')
        if code in keys:errors.append(f'Duplicate municipality code {code}')
        keys.add(code)
        for stage in ('authorized','committed','paid'):
            if stage not in r:errors.append(f'Missing {stage} at {i}');continue
            v=Decimal(str(r[stage]))
            if v<0:errors.append(f'Negative {stage} at {i}')
        if r.get('scope')!='municipio':errors.append('Demo record has unsupported scope')
    return errors

def run() -> int:
    payload=json.loads(FIXTURE.read_text(encoding='utf-8'))
    errors=validate(payload)
    if errors:
        for e in errors:print('ERROR:',e)
        return 1
    print(f"OK — {len(payload['records'])} fixture records are consistently marked DEMO_ONLY")
    return 0

if __name__=='__main__':raise SystemExit(run())
