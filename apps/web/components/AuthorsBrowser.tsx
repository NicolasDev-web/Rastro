'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { CASA_LABEL, LINK_LABEL, type AuthorCard } from '../lib/authors-types';
import { brlOrMissing, normalize, pagoTotal } from '../lib/dataset-types';
import { AuthorPortrait } from './AuthorPortrait';
import { DataState } from './States';

type Origem = 'todos' | 'ce' | 'outros';
type Casa = 'todas' | 'camara' | 'senado';

/** Lista de autores em ordem alfabética, sem ranking (SPEC 04). */
export function AuthorsBrowser({ authors, demo }: { authors: AuthorCard[]; demo: boolean }) {
  const [q, setQ] = useState('');
  const [origem, setOrigem] = useState<Origem>('todos');
  const [casa, setCasa] = useState<Casa>('todas');
  const [partido, setPartido] = useState('todos');
  const partidos = useMemo(() => [...new Set(authors.map(a => a.partido_atual).filter(Boolean) as string[])].sort(), [authors]);
  const list = authors.filter(a =>
    (!q || normalize(a.display_name).includes(normalize(q))) &&
    (origem === 'todos' || (origem === 'ce') === a.eleito_ce) &&
    (casa === 'todas' || a.casa === casa) &&
    (partido === 'todos' || a.partido_atual === partido));

  return <div className="authors-browser">
    <div className="authors-filters" role="search">
      <label className="search-field"><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar parlamentar</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome" autoComplete="off" /></label>
      <label className="select-field"><span>Origem</span><select value={origem} onChange={e => setOrigem(e.target.value as Origem)}>
        <option value="todos">Todos</option><option value="ce">Eleitos pelo Ceará</option><option value="outros">Outros estados</option></select></label>
      <label className="select-field"><span>Casa</span><select value={casa} onChange={e => setCasa(e.target.value as Casa)}>
        <option value="todas">Câmara e Senado</option><option value="camara">Câmara</option><option value="senado">Senado</option></select></label>
      <label className="select-field"><span>Partido atual</span><select value={partido} onChange={e => setPartido(e.target.value)}>
        <option value="todos">Todos</option>{partidos.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
    </div>
    <p className="small muted" aria-live="polite">{list.length} de {authors.length} autores · ordem alfabética, sem ranking · valores de emendas de 2020 a 2026{demo ? ' (fictícios)' : ''}.</p>
    {list.length ? <ul className="author-grid">{list.map(a => <li key={a.id}>
      <Link href={`/parlamentares/${a.id}`} className="author-card">
        <AuthorPortrait name={a.display_name} photo={a.photo} />
        <div className="author-card-body">
          <strong>{a.display_name}</strong>
          <span className="author-meta">{[a.partido_atual, a.uf, a.casa ? CASA_LABEL[a.casa] : null].filter(Boolean).join(' · ') || 'Sem vínculo com Câmara/Senado'}</span>
          <span className="author-value"><small>Pago total</small> {brlOrMissing(pagoTotal(a.total.pago, a.total.rap_pagos))}</span>
          <span className="author-value"><small>Emendas</small> {a.total.emendas}{a.scope === 'somente_ce' ? ' para o Ceará' : ''}</span>
          <span className={`link-badge link-${a.link.status}`}>{LINK_LABEL[a.link.status]}</span>
        </div>
      </Link>
    </li>)}</ul> : <DataState kind="empty" title="Nenhum parlamentar com esses filtros">Ajuste a busca ou os filtros. Não aparecer aqui não significa não ter emendas: só entram autores com emendas no Ceará ou eleitos pelo Ceará.</DataState>}
  </div>;
}
