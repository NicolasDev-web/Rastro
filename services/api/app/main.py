"""API de demonstração apenas. TODOS os valores são fictícios."""
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from .domain import filtered_records, get_stage, stage_total

FIXTURE_PATH=Path(__file__).resolve().parents[3] / 'data' / 'fixtures' / 'municipios-demo.json'
app=FastAPI(title='RASTRO API — DEMO ONLY', version='0.1.0',description='Não fornece dados de gastos públicos reais. Contém fixtures inventadas.')


def read_demo() -> dict:
    with FIXTURE_PATH.open(encoding='utf-8') as handle:
        payload=json.load(handle)
    if payload.get('kind')!='DEMO_ONLY':
        raise RuntimeError('Fixture without mandatory DEMO_ONLY label')
    return payload


@app.get('/api/v1/health')
def health():
    return {'status':'ok','mode':'DEMO_ONLY','official_data_available':False}


@app.get('/api/v1/demo/municipalities')
def municipalities(search: str=Query(default='',max_length=100),stage: str=Query(default='paid')):
    if stage not in ('authorized','committed','paid'):
        raise HTTPException(status_code=422,detail='Etapa não disponível na demonstração')
    data=read_demo(); records=filtered_records(data['records'],search)
    return {'kind':'DEMO_ONLY','year':data['year'],'stage':stage,'total_brl':str(stage_total(records,stage)),
            'records':[{**r,'selected_stage_brl':str(get_stage(r,stage))} for r in records],
            'warning':data['warning']}


@app.get('/api/v1/demo/municipalities/{ibge_code}')
def municipality(ibge_code: str):
    payload=read_demo()
    match=next((r for r in payload['records'] if r['ibge_code']==ibge_code),None)
    if match is None:
        raise HTTPException(status_code=404, detail='Município fora da fixture de demonstração')
    return {'kind':'DEMO_ONLY','year':payload['year'],'record':match,'warning':payload['warning']}
