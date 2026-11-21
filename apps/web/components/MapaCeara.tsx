'use client';
// Mapa dos 184 municípios + busca + resumo da cidade em frases (SPEC 04 T04.03, ADR-017).
// Cor = pago por aplicação (documentos de pagamento), por ano da emenda. Sem registro ≠ zero.
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Download, Search, X } from 'lucide-react';
import { aplicValue, compactBrl, datasetCsv, formatDate, normalize, pagoTotal, value, type Dataset, type Place } from '../lib/dataset-types';

type Props = { data: Dataset; paths: Record<string, string>; viewBox: string };
const SHADES = ['var(--mapa-1)', 'var(--mapa-2)', 'var(--mapa-3)', 'var(--mapa-4)', 'var(--mapa-5)'];
// Formatação manual: o Intl do Node e o do navegador podem divergir e quebrar a hidratação (ver compactBrl).
const milhar = (n: number) => String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const brl = (cents: number) => `R$ ${cents < 0 ? '-' : ''}${milhar(Math.abs(cents) / 100)},${String(Math.abs(cents) % 100).padStart(2, '0')}`;
const plural = (n: number, um: string, varios: string) => `${milhar(n)} ${n === 1 ? um : varios}`;

export function MapaCeara({ data, paths, viewBox }: Props) {
  const places = data.municipalities;
  const byIbge = useMemo(() => new Map(places.map(p => [p.ibge ?? p.id, p])), [places]);
  const [year, setYear] = useState(data.defaultYear);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const hydrated = useRef(false);

  // URL compartilhável (?municipio=<IBGE>&ano=<ano>), como no explorador (T04.02).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const m = q.get('municipio'), a = Number(q.get('ano'));
    if (m && byIbge.has(m)) setSelected(m);
    if (data.years.includes(a)) setYear(a);
    hydrated.current = true;
  }, [byIbge, data.years]);
  useEffect(() => {
    if (!hydrated.current) return;
    const url = new URL(window.location.href);
    if (selected) url.searchParams.set('municipio', selected); else url.searchParams.delete('municipio');
    url.searchParams.set('ano', String(year));
    window.history.replaceState(null, '', url);
  }, [selected, year]);

  // Quintis dos valores positivos do ano: a cor compara cidades, não julga ninguém.
  const breaks = useMemo(() => {
    const vals = places.map(p => aplicValue(p, year)).filter((v): v is number => v !== null && v > 0).sort((a, b) => a - b);
    return vals.length ? [0.2, 0.4, 0.6, 0.8].map(q => vals[Math.floor(q * (vals.length - 1))]) : [];
  }, [places, year]);
  const fill = (v: number | null) => v === null ? 'url(#mapa-sem-registro)' : v <= 0 ? 'var(--paper)' : SHADES[breaks.filter(b => v > b).length];
  const comPagamento = places.filter(p => (aplicValue(p, year) ?? 0) > 0).length;

  const q = normalize(search.trim());
  const matches = q ? places.filter(p => normalize(p.name).includes(q) || (p.ibge ?? '').startsWith(q)).slice(0, 6) : [];
  const choose = (id: string) => { setSelected(id); setSearch(''); };
  const focus = selected ?? hover;
  const city = focus ? byIbge.get(focus) ?? null : null;

  return <section className="mapa-ce" aria-labelledby="mapa-ce-titulo">
    <div className="mapa-ce-toolbar">
      <div className="mapa-ce-search" role="search">
        <label htmlFor="mapa-busca">Sua cidade</label>
        <div className="search-field"><Search size={18} aria-hidden="true" />
          <input id="mapa-busca" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && matches[0]) choose(matches[0].ibge ?? matches[0].id); }} placeholder="Digite o nome, ex.: Tamboril" autoComplete="off" aria-describedby="mapa-busca-dica" />
        </div>
        <p id="mapa-busca-dica" className="sr-only">Acentos são opcionais. Enter escolhe o primeiro resultado.</p>
        {q && <div className="city-list mapa-ce-results" role="group" aria-label="Cidades encontradas">
          {matches.length ? matches.map(p => <button type="button" key={p.id} className="city-pill" onClick={() => choose(p.ibge ?? p.id)}>{p.name}</button>)
            : <p className="small muted">Nenhuma cidade com esse nome. Confira a grafia.</p>}
        </div>}
      </div>
      <div className="year-selector" role="group" aria-label="Ano da emenda">
        {data.years.map(y => <button type="button" key={y} aria-pressed={year === y} onClick={() => setYear(y)}>{y}</button>)}
      </div>
    </div>

    <div className="mapa-ce-grid">
      <figure className="mapa-ce-frame">
        <svg viewBox={viewBox} role="img" aria-labelledby="mapa-ce-titulo mapa-ce-desc" onMouseLeave={() => setHover(null)}>
          <title id="mapa-ce-titulo">{`Mapa dos 184 municípios do Ceará, emendas de ${year}`}</title>
          <desc id="mapa-ce-desc">Cor mais escura indica mais dinheiro pago com aplicação no município. Hachura indica sem registro. A mesma informação está na busca e na tabela abaixo.</desc>
          <defs><pattern id="mapa-sem-registro" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--paper)" /><rect width="1.6" height="5" fill="var(--mapa-hachura)" /></pattern></defs>
          {Object.entries(paths).map(([ibge, d]) => {
            const p = byIbge.get(ibge);
            return <path key={ibge} d={d} fill={fill(p ? aplicValue(p, year) : null)} className={ibge === selected ? 'is-selected' : ibge === hover ? 'is-hover' : undefined}
              onMouseEnter={() => setHover(ibge)} onClick={() => setSelected(ibge === selected ? null : ibge)} />;
          })}
          {selected && paths[selected] && <path d={paths[selected]} className="mapa-ce-outline" aria-hidden="true" />}
        </svg>
        <figcaption className="mapa-ce-legend">
          <span className="tiny-code">Pago com aplicação na cidade · emendas de {year}</span>
          <div className="mapa-ce-scale">{SHADES.map((c, i) => <span key={c}><i style={{ background: c }} />{breaks.length ? (i === 0 ? `até ${compactBrl(breaks[0])}` : i === 4 ? `acima de ${compactBrl(breaks[3])}` : `${compactBrl(breaks[i - 1])} a ${compactBrl(breaks[i])}`) : '—'}</span>)}
            <span><i className="sem-registro" />sem registro (não é zero)</span></div>
        </figcaption>
      </figure>

      <div className="mapa-ce-card" aria-live="polite">
        {city ? <CityStory city={city} year={year} pinned={!!selected} onClear={() => setSelected(null)} />
          : <div>
            <span className="eyebrow">Ceará · emendas de {year}</span>
            <h3>Escolha uma cidade</h3>
            <p>Clique no mapa ou digite o nome da sua cidade. Em {year}, <strong>{comPagamento} dos {places.length} municípios</strong> receberam pagamentos de emendas federais, segundo os documentos da CGU.</p>
            <p className="small muted">Quanto mais escuro, mais dinheiro foi pago com aplicação na cidade. A cor só compara valores: não diz se o dinheiro foi bem usado.</p>
          </div>}
      </div>
    </div>
    <div className="mapa-ce-fora">
      <h3>O que o mapa não mostra</h3>
      <p>Algumas emendas são registradas para o estado inteiro ou para vários municípios, sem dizer quanto vai para cada um. Pelo registro da emenda, em {year}:</p>
      <ul>{data.nonMunicipal.map(n => { const t = pagoTotal(value(n, year, 'pago'), value(n, year, 'rap_pagos')); return <li key={n.id}><strong>{n.name}:</strong> {t === null ? 'sem registro' : `${brl(t)} pagos`}</li>; })}</ul>
      <p className="small muted">Esses valores não são pintados sobre nenhuma cidade. Parte desse dinheiro aparece no mapa quando os documentos de pagamento dizem onde ele foi aplicado, por isso os números não devem ser somados.</p>
    </div>
    <p className="small muted">Fonte: {data.source}, extraída em {formatDate(data.asOf)}. Malha municipal: IBGE.</p>
  </section>;
}

/** CSV da tabela (SPEC 04, AC07), com os metadados da consulta. */
export function CsvButton({ data }: { data: Dataset }) {
  const download = () => {
    const blob = new Blob(['﻿' + datasetCsv(data, data.defaultYear, 'pago', new Date().toISOString(), 'emenda')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rastro-${data.mode}-emenda-pago-${data.defaultYear}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return <button type="button" className="chip-button" onClick={download}><Download size={15} aria-hidden="true" />Baixar CSV ({data.defaultYear})</button>;
}

function CityStory({ city, year, pinned, onClear }: { city: Place; year: number; pinned: boolean; onClear: () => void }) {
  const ap = city.aplicacao?.[String(year)] ?? null;
  const pago = aplicValue(city, year);
  const empenhado = value(city, year, 'empenhado');
  const total = pagoTotal(value(city, year, 'pago'), value(city, year, 'rap_pagos'));
  return <div>
    <div className="mapa-ce-card-head"><span className="eyebrow">Emendas federais de {year}</span>
      {pinned && <button type="button" className="mapa-ce-clear" onClick={onClear} aria-label="Limpar a cidade escolhida"><X size={16} aria-hidden="true" /></button>}</div>
    <h3>{city.name}</h3>
    {pago !== null && pago > 0
      ? <><p className="mapa-ce-big"><b>{brl(pago)}</b> pagos</p>
        <p>Esse dinheiro saiu do caixa federal em <strong>{plural(ap?.documentos ?? 0, 'pagamento', 'pagamentos')}</strong>, de <strong>{plural(ap?.emendas ?? 0, 'emenda', 'emendas')}</strong>, com aplicação em {city.name}. Inclui restos a pagar.</p></>
      : <p className="mapa-ce-big missing"><b>Sem registro</b></p>}
    {(pago === null || pago <= 0) && <p>Nenhum pagamento de emendas de {year} tem {city.name} como local de aplicação nos documentos da CGU. Isso não quer dizer que a cidade recebeu zero: o dinheiro pode estar em emendas de outros anos.</p>}
    <p className="small">{empenhado !== null
      ? <>Emendas com {city.name} no próprio registro: {brl(empenhado)} reservados (empenhados){total !== null ? <> e {brl(total)} pagos</> : null}. É outra forma de contar e não se soma ao valor acima.</>
      : <>Nenhuma emenda de {year} traz {city.name} no próprio registro. É comum: muitas emendas são registradas para “vários municípios” e só os pagamentos mostram onde o dinheiro foi parar.</>}</p>
    <p className="small muted">Pago quer dizer que o dinheiro saiu do caixa federal. Não prova que a obra ou o serviço foi entregue.</p>
    <Link className="text-link" href={`/municipios/${city.ibge}`}>Emendas, autores e quem recebeu <ArrowRight size={14} aria-hidden="true" /></Link>
  </div>;
}
