import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { InfoNote } from '../../../components/Ui';
import { CoverageFlag, DataState } from '../../../components/States';
import { GlossaryTip } from '../../../components/Glossary';
import { DATA_MODE, getEmendas } from '../../../lib/dataset';
import { CONCILIACAO_LABEL } from '../../../lib/fichas-types';
import { brl, brlOrMissing, formatDate } from '../../../lib/dataset-types';
import { portalUrl } from '../../../lib/authors-types';

export const dynamicParams = false;

export function generateStaticParams() {
  const res = getEmendas();
  return res.ok ? Object.keys(res.data).map(codigo => ({ codigo })) : [];
}

export async function generateMetadata({ params }: { params: Promise<{ codigo: string }> }): Promise<Metadata> {
  const { codigo } = await params;
  return { title: `Emenda ${codigo} | RASTRO` };
}

const FASES = ['Empenho', 'Liquidação', 'Pagamento'];

export default async function EmendaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const res = getEmendas();
  if (!res.ok) return <div className="container page-space"><DataState kind="error" title="Fichas de emenda indisponíveis">{res.error}</DataState></div>;
  const e = res.data[codigo];
  if (!e) notFound();
  const demo = DATA_MODE === 'demo';
  const byFase = FASES.map(f => ({ fase: f, docs: e.documentos.filter(d => d.fase.startsWith(f.slice(0, 5))) }));

  return <div className="container page-space emenda-page">
    <Link href="/mapa" className="text-link"><ArrowLeft size={15} aria-hidden="true" /> Explorador</Link>
    <header className="ficha-hero">
      <span className="eyebrow">Emenda {e.ano} · {e.tipo}</span>
      <h1>Emenda {e.code}</h1>
      <p className="author-facts">
        Autor formal (SIAFI): {e.autor_ficha ? <Link href={`/parlamentares/${e.autor_ficha}`}>{e.autor_nome}</Link> : (e.autor_nome ?? 'não identificado na fonte')}
        {e.coletiva && <span className="muted"> · autoria coletiva — não é atribuída a uma pessoa</span>}
      </p>
      <p className="small muted">{[e.funcao, e.acao].filter(Boolean).join(' · ')}</p>
      <p className="small muted">Localidade registrada: {e.localidades.map(l => l.localidade).join('; ')}</p>
      <div className="author-badges">
        <span className={`link-badge ${e.conciliacao.status === 'confere' ? 'link-revisado' : 'link-pendente'}`}>{CONCILIACAO_LABEL[e.conciliacao.status]}</span>
        <CoverageFlag value={demo ? 'demo' : 'unverified'} />
        {!demo && <a className="text-link" href={portalUrl(e.code)} target="_blank" rel="noopener noreferrer">Página oficial no Portal <ExternalLink size={13} aria-hidden="true" /></a>}
      </div>
    </header>

    <section aria-labelledby="valores">
      <h2 id="valores" className="block-title">Valores</h2>
      <div className="value-strip">
        {[['Empenhado', e.empenhado], ['Liquidado', e.liquidado], ['Pago', e.pago], ['Restos a pagar pagos', e.rap_pagos], ['Pago total', e.pago_total]].map(([l, v]) =>
          <div key={l as string} className={l === 'Pago total' ? 'value-cell is-total' : 'value-cell'}><small>{l}</small><b>{brlOrMissing(v as number | null)}</b></div>)}
      </div>
      <p className="small muted">Empenhado, liquidado e pago são etapas diferentes e não se somam. Pago total = Pago + Restos a pagar pagos da fonte. Documentos de pagamento: {brlOrMissing(e.conciliacao.documentos_pago)}{e.conciliacao.status === 'diverge' ? ' — diferente do pago total; a divergência está registrada para investigação' : ''}.{demo ? ' Valores fictícios.' : ''}</p>
    </section>

    <section className="block-gap" aria-labelledby="linha-do-tempo">
      <h2 id="linha-do-tempo" className="block-title">Linha do tempo dos documentos</h2>
      <p className="small muted">Cada linha é um documento oficial de despesa (SIAFI). Liquidação não traz valor no arquivo; o valor aparece no empenho e no pagamento.</p>
      <div className="fase-cols">{byFase.map(({ fase, docs }) => <div key={fase} className="fase-col">
        <h3>{fase} <span className="tiny-code">{docs.length}</span></h3>
        {docs.length ? <ol className="doc-list">{docs.slice(0, 60).map(d => <li key={d.documento + d.fase}>
          <span className="tiny-code">{formatDate(d.data ?? undefined)} · {d.documento}</span>
          {d.valor !== null && <b>{brlOrMissing(d.valor)}</b>}
          <span className="small muted">{[d.favorecido, d.municipio_aplicacao && `${d.municipio_aplicacao}${d.uf_aplicacao ? `-${d.uf_aplicacao}` : ''}`].filter(Boolean).join(' · ')}</span>
        </li>)}</ol> : <p className="small muted">Nenhum documento.</p>}
        {docs.length > 60 && <p className="small muted">+ {docs.length - 60} documentos não exibidos.</p>}
      </div>)}</div>
    </section>

    <section className="block-gap" aria-labelledby="recebeu">
      <h2 id="recebeu" className="block-title">Quem recebeu os pagamentos</h2>
      {e.quem_recebeu.length ? <div className="table-wrap"><table className="data-table">
        <caption>Favorecidos dos documentos de pagamento. Pessoas físicas e empresários individuais aparecem como “omitido”.</caption>
        <thead><tr><th scope="col">Favorecido</th><th scope="col">Município de aplicação</th><th scope="col" className="num">Documentos</th><th scope="col" className="num">Valor pago</th></tr></thead>
        <tbody>{e.quem_recebeu.map((r, i) => <tr key={i}><th scope="row">{r.favorecido}</th><td>{r.municipio ? `${r.municipio}${r.uf ? `-${r.uf}` : ''}` : '—'}</td><td className="num">{r.documentos}</td><td className="num">{brlOrMissing(r.valor)}</td></tr>)}</tbody>
      </table></div> : <DataState kind="empty" title="Sem pagamento registrado">Não há documento de pagamento para esta emenda até a data da extração.</DataState>}
    </section>

    {e.convenios.length > 0 && <section className="block-gap" aria-labelledby="convenios">
      <h2 id="convenios" className="block-title">Convênios</h2>
      <div className="table-wrap"><table className="data-table">
        <thead><tr><th scope="col">Número</th><th scope="col">Publicação</th><th scope="col">Convenente</th><th scope="col">Objeto</th><th scope="col" className="num">Valor</th></tr></thead>
        <tbody>{e.convenios.map((c, i) => <tr key={i}><th scope="row">{c.numero}</th><td>{formatDate(c.data_publicacao ?? undefined)}</td><td>{c.convenente}</td><td className="wrap">{c.objeto}</td><td className="num">{brlOrMissing(c.valor)}</td></tr>)}</tbody>
      </table></div>
    </section>}

    <div className="block-gap"><InfoNote>Documento de pagamento comprova que o dinheiro saiu do caixa federal. Não comprova, sozinho, que a obra ou o serviço foi entregue. Divergências entre fontes são registradas e investigadas, não tratadas como irregularidade.</InfoNote></div>
    <div className="block-gap glossary-row"><GlossaryTip id="documento" /><GlossaryTip id="pagototal" /></div>
  </div>;
}
