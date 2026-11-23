'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { normalize } from '../lib/dataset-types';
import { AuthorPortrait } from './AuthorPortrait';
import { DataState } from './States';

/** Card enxuto de deputado estadual (Alece). `emendas` só existe quando o nome liga exatamente às linhas do orçamento. */
export type StateDeputyCard = {
  slug: string; nome: string; partido_atual: string | null; suplente: boolean; photo: string | null; url_perfil: string;
  emendas: { href: string; linhas_por_ano: { ano: number; linhas: number }[] } | null;
};

type Emendas = 'todos' | 'com' | 'sem';
type Situacao = 'todas' | 'titular' | 'suplente';

/** Lista de deputados estaduais em ordem alfabética, sem ranking, com os mesmos tipos de filtro dos federais (SPEC 07, T07.17). */
export function StateDeputiesBrowser({ deputies }: { deputies: StateDeputyCard[] }) {
  const [q, setQ] = useState('');
  const [emendas, setEmendas] = useState<Emendas>('todos');
  const [situacao, setSituacao] = useState<Situacao>('todas');
  const [partido, setPartido] = useState('todos');
  const partidos = useMemo(() => [...new Set(deputies.map(d => d.partido_atual).filter(Boolean) as string[])].sort(), [deputies]);
  const list = deputies.filter(d =>
    (!q || normalize(d.nome).includes(normalize(q))) &&
    (emendas === 'todos' || (emendas === 'com') === !!d.emendas) &&
    (situacao === 'todas' || (situacao === 'suplente') === d.suplente) &&
    (partido === 'todos' || d.partido_atual === partido));

  return <div className="authors-browser">
    <div className="authors-filters" role="search" aria-label="Filtrar deputados estaduais">
      <label className="search-field"><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar deputado estadual</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome" autoComplete="off" /></label>
      <label className="select-field"><span>Emendas no RASTRO</span><select value={emendas} onChange={e => setEmendas(e.target.value as Emendas)}>
        <option value="todos">Todos</option><option value="com">Com emendas ligadas</option><option value="sem">Só perfil oficial</option></select></label>
      <label className="select-field"><span>Situação</span><select value={situacao} onChange={e => setSituacao(e.target.value as Situacao)}>
        <option value="todas">Todas</option><option value="titular">Titular ou licenciado</option><option value="suplente">Suplente em exercício</option></select></label>
      <label className="select-field"><span>Partido atual</span><select value={partido} onChange={e => setPartido(e.target.value)}>
        <option value="todos">Todos</option>{partidos.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
    </div>
    <p className="small muted" aria-live="polite">{list.length} de {deputies.length} deputados · ordem alfabética, sem ranking · contagem de linhas do orçamento por ano, sem soma.</p>
    {list.length ? <ul className="author-grid state-grid">{list.map(d => <li key={d.slug}>
      {d.emendas ? <div className="author-card">
        <AuthorPortrait name={d.nome} photo={d.photo} />
        <div className="author-card-body">
          <strong><Link href={d.emendas.href}>{d.nome}</Link></strong>
          <span className="author-meta">{[d.partido_atual, 'Assembleia Legislativa do Ceará'].filter(Boolean).join(' · ')}</span>
          {d.suplente && <span className="author-meta">Suplente em exercício</span>}
          <span className="author-value"><small>Emendas estaduais</small> {d.emendas.linhas_por_ano.map(x => `${x.ano}: ${x.linhas}`).join(' · ')}</span>
          <span className="author-meta">linhas no orçamento, por ano</span>
          <Link href={d.emendas.href} className="link-badge link-revisado">Emendas no RASTRO →</Link>
          <a href={d.url_perfil} target="_blank" rel="noopener noreferrer" className="link-badge">Perfil oficial ↗</a>
        </div>
      </div> : <a href={d.url_perfil} target="_blank" rel="noopener noreferrer" className="author-card">
        <AuthorPortrait name={d.nome} photo={d.photo} />
        <div className="author-card-body">
          <strong>{d.nome}</strong>
          <span className="author-meta">{[d.partido_atual, 'Assembleia Legislativa do Ceará'].filter(Boolean).join(' · ')}</span>
          {d.suplente && <span className="author-meta">Suplente em exercício</span>}
          <span className="author-value"><small>Emendas</small> sem dado estruturado</span>
          <span className="link-badge link-revisado">Perfil oficial ↗</span>
        </div>
      </a>}
    </li>)}</ul> : <DataState kind="empty" title="Nenhum deputado estadual com esses filtros">Ajuste a busca ou os filtros. Sem emendas ligadas não significa sem emendas: o nome pode estar escrito de outro jeito no arquivo do orçamento, e o arquivo cobre só parte das emendas.</DataState>}
  </div>;
}
