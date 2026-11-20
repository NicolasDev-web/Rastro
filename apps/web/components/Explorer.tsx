'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CRITERIO_LABEL, STAGES, officialLabel, STAGE_LABEL, aplicValue, brl, brlOrMissing, compactBrl, datasetCsv, formatDate, isStage, normalize, pagoTotal, value, type Criterio, type Dataset, type Place, type Stage } from '../lib/dataset-types';
import { InfoNote } from './Ui';
import { DataState, CoverageFlag } from './States';
import { Search, MapPin, BarChart3, FileSearch, ArrowRight, ArrowUpRight, Download, Link2, Check } from 'lucide-react';

const DEFAULT_CITY = '2304400';
const MAX_RESULTS = 12;
const isCriterio = (v: string | null): v is Criterio => v === 'emenda' || v === 'aplicacao';

export function MunicipalityExplorer({ data, compact = false, syncUrl = !compact }: { data: Dataset; compact?: boolean; syncUrl?: boolean }) {
  const demo = data.mode === 'demo';
  const places = data.municipalities;
  const hasAplic = places.some(p => p.aplicacao);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(places.some(p => p.id === DEFAULT_CITY) ? DEFAULT_CITY : places[0]?.id);
  const [stage, setStage] = useState<Stage>('pago');
  const [criterio, setCriterio] = useState<Criterio>('emenda');
  const [year, setYear] = useState(data.defaultYear);
  const [copied, setCopied] = useState(false);
  const hydrated = useRef(false);
  const aplic = criterio === 'aplicacao';

  // Filtros na URL (SPEC 04, T04.02): lê na montagem, escreve a cada mudança.
  useEffect(() => {
    if (!syncUrl) return;
    const q = new URLSearchParams(window.location.search);
    const m = q.get('municipio'), e = q.get('etapa'), a = Number(q.get('ano')), c = q.get('criterio');
    if (m && places.some(p => p.id === m)) setSelected(m);
    if (isStage(e)) setStage(e);
    if (data.years.includes(a)) setYear(a);
    if (isCriterio(c) && (c === 'emenda' || hasAplic)) setCriterio(c);
    hydrated.current = true;
  }, [syncUrl, places, data.years, hasAplic]);
  useEffect(() => {
    if (!syncUrl || !hydrated.current) return;
    const url = new URL(window.location.href);
    url.searchParams.set('municipio', selected);
    url.searchParams.set('etapa', stage);
    url.searchParams.set('ano', String(year));
    url.searchParams.set('criterio', criterio);
    window.history.replaceState(null, '', url);
  }, [selected, stage, year, criterio, syncUrl]);

  const q = normalize(search.trim());
  const matches = useMemo(() => q ? places.filter(c => normalize(c.name).includes(q) || (c.ibge ?? '').includes(q)) : places, [q, places]);
  const shown = matches.slice(0, q ? MAX_RESULTS : 8);
  const current = places.find(c => c.id === selected) ?? places[0];
  const v = (p: Place) => (aplic ? aplicValue(p, year) : value(p, year, stage));
  const main = v(current);
  const rapPagos = value(current, year, 'rap_pagos');
  const aplicInfo = current.aplicacao?.[String(year)] ?? null;
  const bars = (q || places.length <= 8) ? shown : [];
  const max = Math.max(1, ...bars.map(c => v(c) ?? 0));
  const measureLabel = aplic ? 'Pago, por município de aplicação' : STAGE_LABEL[stage];

  const choose = (id: string) => { setSelected(id); setSearch(''); };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { setCopied(false); }
  };
  const downloadCsv = () => {
    const blob = new Blob(['﻿' + datasetCsv(data, year, stage, new Date().toISOString(), criterio)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rastro-${data.mode}-${criterio}-${aplic ? 'pago' : stage}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return <div className="explorer" id="explorador">
    <div className="explorer-top"><div><div className="eyebrow">Explorador territorial / {demo ? 'demonstração' : `dados ${officialLabel(data.mode)}`}</div><h3>{demo ? 'Veja como seria pesquisar sua cidade.' : 'Pesquise sua cidade.'}</h3></div>{data.mode !== 'publicado' && <span className={demo ? 'demo-label' : 'demo-label is-validacao'}>{demo ? 'Exemplo fictício' : 'Em validação'}</span>}</div>
    {hasAplic && <div className="criterio-selector" role="group" aria-label="Critério de localização">
      <span className="criterio-label">Localizar o dinheiro por:</span>
      {(['emenda', 'aplicacao'] as Criterio[]).map(c => <button type="button" key={c} aria-pressed={criterio === c} onClick={() => setCriterio(c)}>{CRITERIO_LABEL[c]}</button>)}
      <p className="small muted">{aplic
        ? 'Cada pagamento é atribuído ao município onde foi aplicado, segundo os documentos de despesa da CGU (inclui pagamentos de emendas registradas como “vários municípios” ou de outros autores). Medida separada: não se soma à localidade da emenda.'
        : 'Município registrado na própria emenda. Emendas para “vários municípios” ou para o estado inteiro ficam fora desta conta.'}</p>
    </div>}
    <div className="explorer-grid">
      <div className="search-panel">
        <label htmlFor={compact ? 'citysearch-compact' : 'citysearch'}>Município cearense</label>
        <div className="search-field"><Search size={18} aria-hidden="true" /><input id={compact ? 'citysearch-compact' : 'citysearch'} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && matches[0]) choose(matches[0].id); }} placeholder="Busque por cidade ou código IBGE" autoComplete="off" aria-describedby="citysearch-hint" /></div>
        <p id="citysearch-hint" className="sr-only">Digite e pressione Enter para escolher o primeiro resultado. Acentos são opcionais.</p>
        {shown.length
          ? <div className="city-list" role="group" aria-label="Municípios">{shown.map(c => <button type="button" key={c.id} aria-pressed={c.id === selected} className={c.id === selected ? 'city-pill selected' : 'city-pill'} onClick={() => choose(c.id)}>{c.name}</button>)}</div>
          : <DataState kind="empty" title="Nenhum município encontrado" action={<button type="button" className="text-link as-button" onClick={() => setSearch('')}>Limpar busca</button>}>{demo ? 'A demonstração inclui só cinco municípios. Tente “Sobral” ou o código 2312908.' : 'Confira a grafia ou use o código IBGE de 7 dígitos.'} Não encontrar um município não significa que ele recebeu zero.</DataState>}
        <p className="small muted">{demo
          ? 'O produto final consultará os 184 municípios do Ceará, conforme cobertura confirmada. Esta demo oferece apenas cinco.'
          : `${places.length} municípios do Ceará${matches.length > shown.length ? ` · mostrando ${shown.length} de ${matches.length}, digite para filtrar` : ''}. Fonte: ${data.source}, extraída em ${formatDate(data.asOf)}.`}</p>
      </div>
      <div className="metric-panel">
        <div className="metric-panel-head"><div><span className="eyebrow">Ficha municipal / emendas de {year}{demo ? ' (fictício)' : ''}</span><h4><MapPin size={19} aria-hidden="true" /><Link href={`/municipios/${current.ibge}`} className="ficha-link">{current.name} <ArrowUpRight size={16} aria-hidden="true" /></Link></h4></div><span className="tiny-code">IBGE {current.ibge}</span></div>
        {data.years.length > 1 && <div className="year-selector" role="group" aria-label="Ano da emenda">
          {data.years.map(y => <button type="button" key={y} aria-pressed={year === y} onClick={() => setYear(y)}>{y}</button>)}
        </div>}
        {!aplic && <div className="stage-selector" role="group" aria-label="Etapa financeira">
          {STAGES.map(s => <button type="button" key={s} aria-pressed={stage === s} onClick={() => setStage(s)}>{STAGE_LABEL[s]}</button>)}
        </div>}
        <div className="main-number" aria-live="polite"><span>{measureLabel} · emendas de {year}</span><strong className={main === null ? 'missing' : undefined}>{brlOrMissing(main)}</strong>
          <small>{demo ? 'Valor inventado para testar a apresentação'
            : aplic ? (aplicInfo ? `${aplicInfo.documentos} documentos de pagamento de ${aplicInfo.emendas} emendas. Inclui restos a pagar pagos.` : 'Nenhum pagamento com aplicação neste município para emendas deste ano.')
            : main === null ? 'Nenhuma emenda com este município registrado no ano. Veja o critério “Onde o pagamento foi aplicado”.' : data.mode === 'validacao' ? 'Valor oficial em validação: conferido por amostra, ainda sem revisão editorial.' : `Valor oficial da CGU, extraído em ${formatDate(data.asOf)}.`}</small></div>
        {!aplic && stage === 'pago' && rapPagos !== null && rapPagos > 0 && <p className="rap-note">Restos a pagar pagos: <b>{brl(rapPagos)}</b> · <b>pago total: {brlOrMissing(pagoTotal(main, rapPagos))}</b>. {demo ? '' : 'Consulte a conciliação e a cobertura nas fichas das emendas.'}</p>}
        <div className="metric-flags"><CoverageFlag value={data.coverage} /></div>
        {syncUrl && <div className="explorer-actions">
          <button type="button" className="chip-button" onClick={copyLink}>{copied ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />}{copied ? 'Link copiado' : 'Copiar link desta consulta'}</button>
          <button type="button" className="chip-button" onClick={downloadCsv}><Download size={15} aria-hidden="true" />Baixar CSV{demo ? ' (demo)' : data.mode === 'validacao' ? ' (em validação)' : ''}</button>
        </div>}
      </div>
    </div>
    {!compact && <>
      <div className="bar-chart" role="figure" aria-label={`Comparação por município, ${measureLabel}, emendas de ${year}`}>
        <div className="chart-title"><BarChart3 size={16} aria-hidden="true" /> {demo ? 'Comparação dos cinco municípios de exemplo' : q ? 'Municípios encontrados, em ordem alfabética' : 'Comparação entre municípios'} · {measureLabel} · {year}</div>
        {bars.length
          ? bars.map(c => { const x = v(c); return <div className={c.id === selected ? 'bar-row is-selected' : 'bar-row'} key={c.id}><span>{c.name}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${(x ?? 0) / max * 100}%` }} /></div><b className={x === null ? 'missing' : undefined}>{x === null ? 'sem registro' : compactBrl(x)}</b></div>; })
          : <p className="small muted">Busque um ou mais municípios para comparar. Sem ranking: as barras seguem a ordem alfabética.</p>}
        <p className="small muted">{demo ? 'Gráfico baseado exclusivamente nos registros fictícios do pacote.' : aplic ? 'Pagamentos com município de aplicação nos documentos de despesa.' : 'Só aparecem valores com município registrado na emenda.'} A tabela completa está na página do mapa.</p>
      </div>
      {!aplic && <div className="non-municipal">
        <div className="chart-title">Fora da contagem municipal · {STAGE_LABEL[stage]} · {year}</div>
        <p className="small muted">Estes valores não pertencem a nenhum município e nunca são somados às barras acima.</p>
        <div className="non-municipal-grid">{data.nonMunicipal.map(n => { const x = value(n, year, stage); return <div key={n.id} className={`nm-card nm-${n.kind}`}>
          <span className="tiny-code">{n.kind === 'estado' ? 'APLICAÇÃO ESTADUAL' : 'VÁRIOS MUNICÍPIOS'}</span>
          <strong>{n.name}</strong>
          <b className={x === null ? 'missing' : undefined}>{brlOrMissing(x)}</b>
          <p>{n.note}</p>
        </div>; })}</div>
      </div>}
    </>}
    <InfoNote><strong>Aviso metodológico:</strong> empenho, liquidação e pagamento são etapas distintas e não se somam. Os dois critérios de localização são medidas diferentes e também não se somam. {demo ? 'No RASTRO real, números só aparecerão após conciliação documental.' : `Conferência amostral realizada; a comparação com documentos inclui divergências e lacunas indicadas nas fichas.${data.mode === 'validacao' ? ' Revisão editorial pendente.' : ''}`} O local de aplicação registrado não prova a entrega da obra ou do serviço.</InfoNote>
    <a className="text-link" href="/dados"><FileSearch size={16} aria-hidden="true" /> Ver fontes e metodologia <ArrowRight size={14} aria-hidden="true" /></a>
  </div>;
}
