import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { InfoNote } from '../../../components/Ui';
import { AuthorPortrait } from '../../../components/AuthorPortrait';
import { CoverageFlag, DataState } from '../../../components/States';
import { GlossaryTip } from '../../../components/Glossary';
import { getAuthors, getEmendas } from '../../../lib/dataset';
import { CASA_LABEL, LINK_LABEL, ROLE_LABEL, portalUrl } from '../../../lib/authors-types';
import { PAGO_TOTAL_NOTE, STAGES, STAGE_LABEL, brlOrMissing, formatDate, pagoTotal } from '../../../lib/dataset-types';

export const dynamicParams = false;

export function generateStaticParams() {
  const res = getAuthors();
  return res.ok ? res.data.authors.map(a => ({ id: a.id })) : [];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const res = getAuthors();
  const a = res.ok ? res.data.authors.find(x => x.id === id) : undefined;
  return { title: a ? `${a.display_name} | Autores | RASTRO` : 'Autor | RASTRO' };
}

export default async function AutorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = getAuthors();
  if (!res.ok) return <div className="container page-space"><DataState kind="error" title="Dados de autores indisponíveis">{res.error}</DataState></div>;
  const a = res.data.authors.find(x => x.id === id);
  if (!a) notFound();
  const demo = res.data.mode === 'demo';
  const fichas = getEmendas();
  const temFicha = (code: string | null) => !!code && fichas.ok && code in fichas.data;
  const cols = [...STAGES, 'rap_pagos'] as const;
  const colLabel = (c: (typeof cols)[number]) => (c === 'rap_pagos' ? 'RAP pagos' : STAGE_LABEL[c]);

  return <div className="container page-space author-page">
    <Link href="/parlamentares" className="text-link"><ArrowLeft size={15} aria-hidden="true" /> Todos os autores</Link>

    <header className="author-hero">
      <AuthorPortrait name={a.display_name} photo={a.photo} credit={a.photo_credit} size="lg" />
      <div>
        <span className="eyebrow">{a.casa ? ROLE_LABEL[a.casa] : 'Autor de emendas'}{a.eleito_ce ? ' · eleito pelo Ceará' : a.uf ? ` · ${a.uf}` : ''}</span>
        <h1>{a.display_name}</h1>
        <p className="author-facts">
          {a.partido_atual ? <><b>{a.partido_atual}</b> <span className="muted">(partido atual{res.data.partiesAsOf ? `, segundo ${a.casa === 'senado' ? 'o Senado' : 'a Câmara'} em ${formatDate(res.data.partiesAsOf)}` : ''}; não necessariamente o da época das emendas)</span></> : <span className="muted">Partido não informado: sem vínculo confirmado com Câmara ou Senado.</span>}
        </p>
        <p className="author-facts muted small">Nome no SIAFI: {a.cgu_name} · código do autor {a.siafi_code}{a.casa ? ` · ${CASA_LABEL[a.casa]}` : ''}</p>
        <div className="author-badges">
          <span className={`link-badge link-${a.link.status}`}>{LINK_LABEL[a.link.status]}</span>
          <CoverageFlag value={res.data.coverage} />
          {a.profile_url && <a className="text-link" href={a.profile_url} target="_blank" rel="noopener noreferrer">Perfil oficial <ExternalLink size={13} aria-hidden="true" /></a>}
        </div>
        {a.link.nota && <p className="small muted">Nota do vínculo: {a.link.nota}</p>}
      </div>
    </header>

    <InfoNote><strong>Autor formal segundo o SIAFI.</strong> Indicar não é pagar; pagar não é entregar. Sem juízo de conduta. {a.scope === 'somente_ce' ? 'Parlamentar de outro estado: aqui aparecem só as emendas com localidade no Ceará.' : 'Eleito pelo Ceará: aparecem todas as emendas de que é autor, inclusive para outros estados.'}{demo ? ' Valores fictícios.' : ''}</InfoNote>

    <section className="block-gap" aria-labelledby="por-ano">
      <h2 id="por-ano" className="block-title">Por ano da emenda</h2>
      <div className="table-wrap"><table className="data-table">
        <caption>Valores {demo ? 'fictícios' : `oficiais em validação (CGU, extraídos em ${formatDate(res.data.asOf)})`}. Empenhado, liquidado e pago não se somam. {PAGO_TOTAL_NOTE}</caption>
        <thead><tr><th scope="col">Ano</th><th scope="col" className="num">Emendas</th>{cols.map(c => <th key={c} scope="col" className="num">{colLabel(c)}</th>)}<th scope="col" className="num">Pago total</th></tr></thead>
        <tbody>{res.data.years.map(y => { const v = a.years[String(y)]; return <tr key={y}><th scope="row">{y}</th><td className="num">{v ? v.emendas : '—'}</td>{cols.map(c => <td key={c} className={!v || v[c] === null ? 'num missing' : 'num'}>{v ? brlOrMissing(v[c]) : 'Sem registro'}</td>)}<td className={v ? 'num' : 'num missing'}>{v ? brlOrMissing(pagoTotal(v.pago, v.rap_pagos)) : 'Sem registro'}</td></tr>; })}</tbody>
        <tfoot><tr><th scope="row">2020–2026</th><td className="num">{a.total.emendas}</td>{cols.map(c => <td key={c} className="num">{brlOrMissing(a.total[c])}</td>)}<td className="num">{brlOrMissing(pagoTotal(a.total.pago, a.total.rap_pagos))}</td></tr></tfoot>
      </table></div>
    </section>

    <section className="block-gap" aria-labelledby="rastreaveis">
      <h2 id="rastreaveis" className="block-title">Destinos rastreáveis</h2>
      <p className="small muted">Emendas com município identificado no arquivo da CGU. A localidade registrada não prova o local da entrega. Pago e restos a pagar pagos são medidas distintas: uma emenda pode ter “pago” zero e ter sido paga via restos a pagar em outro ano.</p>
      {a.traceable.length ? <div className="table-wrap"><table className="data-table">
        <thead><tr><th scope="col">Município</th><th scope="col">UF</th><th scope="col" className="num">Emendas</th><th scope="col" className="num">Empenhado</th><th scope="col" className="num">Pago</th><th scope="col" className="num">RAP pagos</th></tr></thead>
        <tbody>{a.traceable.map(t => <tr key={t.ibge}><th scope="row">{t.name}</th><td>{t.uf}</td><td className="num">{t.emendas}</td><td className="num">{brlOrMissing(t.empenhado)}</td><td className="num">{brlOrMissing(t.pago)}</td><td className="num">{brlOrMissing(t.rap_pagos)}</td></tr>)}</tbody>
      </table></div> : <DataState kind="empty" title="Nenhuma emenda com município identificado">Os valores deste autor estão em destinos sem rastreio no arquivo (abaixo).</DataState>}
    </section>

    <section className="block-gap" aria-labelledby="sem-rastreio">
      <h2 id="sem-rastreio" className="block-title">Sem rastreio no arquivo</h2>
      <p className="small muted">O arquivo não diz em qual município o dinheiro foi aplicado. Mostramos só o valor.</p>
      {a.untraceable.length ? <div className="non-municipal-grid">{a.untraceable.map(u => <div key={u.label} className="nm-card nm-multiplo">
        <span className="tiny-code">{u.emendas} {u.emendas === 1 ? 'EMENDA' : 'EMENDAS'}</span>
        <strong>{u.label}</strong>
        <b className={u.pago === null ? 'missing' : undefined}>{brlOrMissing(u.pago)}</b>
        <p>Pago. Empenhado: {brlOrMissing(u.empenhado)}. Restos a pagar pagos: {brlOrMissing(u.rap_pagos)} (não somar).</p>
      </div>)}</div> : <p className="small muted">Nenhum valor sem rastreio.</p>}
    </section>

    <section className="block-gap" aria-labelledby="emendas">
      <h2 id="emendas" className="block-title">Emendas ({a.emendas.length})</h2>
      <div className="table-wrap"><table className="data-table">
        <thead><tr><th scope="col">Código</th><th scope="col">Ano</th><th scope="col">Tipo</th><th scope="col">Localidade</th><th scope="col" className="num">Empenhado</th><th scope="col" className="num">Pago</th><th scope="col" className="num">RAP pagos</th></tr></thead>
        <tbody>{a.emendas.map(e => <tr key={e.technical_id}>
          <th scope="row">{e.code ? (temFicha(e.code) ? <><Link href={`/emendas/${e.code}`}>{e.code}</Link>{!demo && <> <a href={portalUrl(e.code)} target="_blank" rel="noopener noreferrer" aria-label={`Emenda ${e.code} no Portal da Transparência`}>↗</a></>}</> : <a href={portalUrl(e.code)} target="_blank" rel="noopener noreferrer">{e.code}</a>) : <span className="muted" title="Sem código oficial na fonte">{e.technical_id}</span>}</th>
          <td>{e.ano}</td><td>{e.tipo.replace('Emenda Individual - ', '')}</td><td>{e.localidades.join('; ')}</td>
          <td className="num">{brlOrMissing(e.empenhado)}</td><td className="num">{brlOrMissing(e.pago)}</td><td className="num">{brlOrMissing(e.rap_pagos)}</td></tr>)}</tbody>
      </table></div>
      <p className="small muted">O código abre a ficha da emenda no RASTRO{demo ? '' : '; a seta abre a página oficial no Portal da Transparência'}.</p>
    </section>

    <div className="block-gap glossary-row"><GlossaryTip id="empenho" /><GlossaryTip id="pagamento" /></div>
  </div>;
}
