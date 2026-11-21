import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { InfoNote } from '../../../components/Ui';
import { CoverageFlag, DataState } from '../../../components/States';
import { GlossaryTip } from '../../../components/Glossary';
import { DATA_MODE, getEmendas } from '../../../lib/dataset';
import { getInvestigacao } from '../../../lib/investigacao';
import { CONCILIACAO_LABEL } from '../../../lib/fichas-types';
import { brl, brlOrMissing, formatDate } from '../../../lib/dataset-types';
import { portalUrl } from '../../../lib/authors-types';
import { buildFluxo } from '../../../lib/fluxo';
import { MoneyFlow } from '../../../components/MoneyFlow';

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
  const caso = demo ? undefined : getInvestigacao()[e.code];
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
      <p className="small muted">Empenhado, liquidado e pago são etapas diferentes e não se somam. Pago total = Pago + Restos a pagar pagos da fonte. Documentos de pagamento: {brlOrMissing(e.conciliacao.documentos_pago)}{e.conciliacao.status === 'diverge' ? ' — diferente do pago total; a diferença entre as fontes está registrada para investigação e não indica, por si, irregularidade' : e.conciliacao.status === 'sem_documentos' && (e.pago_total ?? 0) > 0 ? ' — a fonte informa pagamento, mas os arquivos de documentos da CGU de 2020 a 2026 não trazem a ordem bancária desta emenda; a lacuna está registrada para investigação' : ''}.{demo ? ' Valores fictícios.' : ''}</p>
    </section>

    <section className="block-gap" aria-labelledby="fluxo">
      <h2 id="fluxo" className="block-title">Fluxo do dinheiro</h2>
      <p className="small muted">Do autor a quem recebeu, cada ligação mostra a prova que a sustenta. <Link href="/fluxos">Como ler o fluxo</Link>.</p>
      <MoneyFlow flow={buildFluxo(e, { demo, caso })} />
    </section>

    {caso && <section className="block-gap" aria-labelledby="investigacao">
      <h2 id="investigacao" className="block-title">O que a investigação encontrou</h2>
      <InfoNote><strong>{caso.status !== 'explicado' ? 'Ainda sem explicação documentada.' : e.conciliacao.status === 'sem_documentos' ? 'Causa encontrada para a falta de documento de pagamento.' : 'Causa encontrada para a diferença entre as fontes.'}</strong> {caso.causa ?? caso.achado}</InfoNote>
      {caso.causa && <p className="small muted">{caso.achado}</p>}
      <p className="small muted">Análise do RASTRO em {caso.data.split('-').reverse().join('/')}. Fontes: {caso.fontes.map((f, i) => <span key={f}>{i > 0 && '; '}{f.startsWith('http') ? <a href={f} target="_blank" rel="noopener noreferrer">{f.replace(/^https?:\/\//, '')}</a> : f}</span>)}.{caso.proxima_verificacao ? ` Próximo passo: ${caso.proxima_verificacao}` : ''}</p>
    </section>}

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

    {e.transferegov && <section className="block-gap texto-fonte" aria-labelledby="transferegov">
      <h2 id="transferegov" className="block-title">No Transferegov</h2>
      <p className="small muted">Registros ligados à emenda só por identificador oficial: o número da emenda no plano de ação (transferência especial) ou o número do convênio do arquivo da CGU. Valores do plano, do convênio, do relatório de gestão e dos pagamentos a fornecedores são etapas diferentes e não se somam com os da CGU. Metas são o planejado; relatório de gestão é declaração do ente e não prova entrega.</p>
      {e.transferegov.planos_acao.map(p => <div key={p.id} className="block-gap">
        <h3>Plano de ação {p.codigo}</h3>
        <p className="small">{p.beneficiario ?? 'Beneficiário não informado'}{p.uf ? `-${p.uf}` : ''} · situação: {p.situacao ?? 'não informada'}{p.plano_trabalho?.situacao ? ` · plano de trabalho: ${p.plano_trabalho.situacao}` : ''}{p.plano_trabalho?.inicio ? ` (${formatDate(p.plano_trabalho.inicio)} a ${formatDate(p.plano_trabalho.fim ?? undefined)})` : ''}</p>
        {(p.objeto || p.detalhamento) && <p className="small">{[p.objeto, p.detalhamento].filter(Boolean).join(' — ')}</p>}
        <div className="value-strip">
          <div className="value-cell"><small>Custeio no plano</small><b>{brlOrMissing(p.valor_custeio)}</b></div>
          <div className="value-cell"><small>Investimento no plano</small><b>{brlOrMissing(p.valor_investimento)}</b></div>
          <div className="value-cell"><small>Executado declarado (último relatório)</small><b>{p.relatorio ? brlOrMissing(p.relatorio.valor_executado) : 'Sem relatório'}</b></div>
        </div>
        {p.relatorio && <p className="small muted">Último de {p.relatorio.relatorios} relatório(s) de gestão: {p.relatorio.tipo ?? 'tipo não informado'}, {formatDate(p.relatorio.data ?? undefined)}, {p.relatorio.situacao ?? 'situação não informada'}. Relatórios não são somados.</p>}
        {p.executores.map((x, i) => <div key={i}>
          <p className="small"><strong>Executor:</strong> {x.nome}{x.objeto ? ` — ${x.objeto}` : ''}</p>
          {x.metas.length > 0 && <ul className="small">{x.metas.slice(0, 12).map((m, j) => <li key={j}>{m.nome ?? m.descricao ?? 'Meta'}{m.quantidade ? `: ${m.quantidade}${m.unidade ? ` ${m.unidade}` : ''}` : ''} <span className="muted">(planejado)</span></li>)}</ul>}
          {x.metas.length > 12 && <p className="small muted">+ {x.metas.length - 12} metas não exibidas.</p>}
        </div>)}
        {p.fornecedores.length > 0 ? <div className="table-wrap"><table className="data-table">
          <caption>Pagamentos do ente a recebedores, declarados nos documentos de liquidação do relatório de gestão ({p.documentos_liquidacao} documento(s)). Pessoa física, MEI e recebedor sem natureza jurídica confirmada aparecem com o nome omitido.</caption>
          <thead><tr><th scope="col">Recebedor</th><th scope="col" className="num">Documentos</th><th scope="col" className="num">Valor declarado</th></tr></thead>
          <tbody>{p.fornecedores.map((f, i) => <tr key={i}><th scope="row">{f.recebedor}</th><td className="num">{f.documentos}</td><td className="num">{f.valor === null ? 'Incompleto na fonte' : brl(f.valor)}</td></tr>)}</tbody>
        </table></div> : <p className="small muted">Nenhum documento de liquidação declarado neste plano até a extração.</p>}
        <p className="small"><a className="text-link" href={p.source_url} target="_blank" rel="noopener noreferrer">Registro do plano na API do Transferegov <ExternalLink size={13} aria-hidden="true" /></a></p>
      </div>)}
      {e.transferegov.convenios.length > 0 && <div className="table-wrap block-gap"><table className="data-table">
        <caption>Convênios e contratos de repasse: proposta no Transferegov, achada pelo número do convênio. A API pública não traz contratos nem pagamentos do convenente.</caption>
        <thead><tr><th scope="col">Convênio</th><th scope="col">Modalidade e situação</th><th scope="col">Objeto</th><th scope="col" className="num">Valor global</th><th scope="col" className="num">Repasse</th><th scope="col" className="num">Contrapartida</th><th scope="col">Metas planejadas</th></tr></thead>
        <tbody>{e.transferegov.convenios.map(c => <tr key={c.numero}>
          <th scope="row"><a href={c.source_url} target="_blank" rel="noopener noreferrer">{c.numero}</a></th>
          <td>{[c.modalidade, c.situacao].filter(Boolean).join(' · ')}{c.vigencia_inicio ? ` · vigência ${formatDate(c.vigencia_inicio)} a ${formatDate(c.vigencia_fim ?? undefined)}` : ''}</td>
          <td className="wrap">{c.objeto ?? '—'}</td>
          <td className="num">{brlOrMissing(c.valor_global)}</td><td className="num">{brlOrMissing(c.valor_repasse)}</td><td className="num">{brlOrMissing(c.valor_contrapartida)}</td>
          <td className="wrap">{c.metas.slice(0, 3).map(m => `${m.descricao ?? 'Meta'}${m.quantidade ? ` (${m.quantidade}${m.unidade ? ` ${m.unidade}` : ''})` : ''}`).join('; ') || '—'}{c.metas.length > 3 ? `; e mais ${c.metas.length - 3}` : ''}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>}

    <div className="block-gap"><InfoNote>Documento de pagamento comprova que o dinheiro saiu do caixa federal. Não comprova, sozinho, que a obra ou o serviço foi entregue. Divergências entre fontes são registradas e investigadas, não tratadas como irregularidade.</InfoNote></div>
    <div className="block-gap glossary-row"><GlossaryTip id="documento" /><GlossaryTip id="pagototal" /></div>
  </div>;
}
