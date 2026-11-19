import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { InfoNote } from '../../../components/Ui';
import { CoverageFlag, DataState } from '../../../components/States';
import { GlossaryTip } from '../../../components/Glossary';
import { DATA_MODE, getDataset, getMunicipios } from '../../../lib/dataset';
import { aplicValue, brl, brlOrMissing, pagoTotal, value } from '../../../lib/dataset-types';
import { portalUrl } from '../../../lib/authors-types';

export const dynamicParams = false;

export function generateStaticParams() {
  const res = getMunicipios();
  return res.ok ? Object.keys(res.data).map(ibge => ({ ibge })) : [];
}

export async function generateMetadata({ params }: { params: Promise<{ ibge: string }> }): Promise<Metadata> {
  const { ibge } = await params;
  const res = getMunicipios();
  return { title: `${res.ok ? res.data[ibge]?.name ?? ibge : ibge} | Municípios | RASTRO` };
}

export default async function MunicipioPage({ params }: { params: Promise<{ ibge: string }> }) {
  const { ibge } = await params;
  const res = getMunicipios();
  const ds = getDataset();
  if (!res.ok) return <div className="container page-space"><DataState kind="error" title="Fichas de município indisponíveis">{res.error}</DataState></div>;
  const m = res.data[ibge];
  if (!m) notFound();
  const demo = DATA_MODE === 'demo';
  const place = ds.ok ? ds.data.municipalities.find(p => p.ibge === ibge) : undefined;
  const years = ds.ok ? ds.data.years : [];
  const codeCell = (code: string, ficha: boolean) => ficha ? <Link href={`/emendas/${code}`}>{code}</Link> : demo ? code : <a href={portalUrl(code)} target="_blank" rel="noopener noreferrer">{code} ↗</a>;

  return <div className="container page-space municipio-page">
    <Link href="/mapa" className="text-link"><ArrowLeft size={15} aria-hidden="true" /> Explorador</Link>
    <header className="ficha-hero">
      <span className="eyebrow">Município do Ceará · IBGE {m.ibge}</span>
      <h1>{m.name}</h1>
      <div className="author-badges"><CoverageFlag value={demo ? 'demo' : 'unverified'} /></div>
    </header>

    <InfoNote><strong>Dois critérios, nunca somados:</strong> “localidade da emenda” é o município registrado na própria emenda; “onde o pagamento foi aplicado” vem dos documentos de despesa e inclui emendas registradas como “vários municípios”. O local de aplicação não prova a entrega da obra ou do serviço.{demo ? ' Valores fictícios.' : ''}</InfoNote>

    {place && <section className="block-gap" aria-labelledby="por-ano">
      <h2 id="por-ano" className="block-title">Por ano da emenda</h2>
      <div className="table-wrap"><table className="data-table">
        <thead><tr><th scope="col">Ano</th><th scope="col" className="num">Empenhado (emenda)</th><th scope="col" className="num">Pago total (emenda)</th><th scope="col" className="num col-aplic">Pago por aplicação (documentos)</th></tr></thead>
        <tbody>{years.map(y => { const emp = value(place, y, 'empenhado'); const pt = pagoTotal(value(place, y, 'pago'), value(place, y, 'rap_pagos')); const ap = aplicValue(place, y); return <tr key={y}>
          <th scope="row">{y}</th><td className={emp === null ? 'num missing' : 'num'}>{brlOrMissing(emp)}</td><td className={pt === null ? 'num missing' : 'num'}>{brlOrMissing(pt)}</td><td className={ap === null ? 'num missing col-aplic' : 'num col-aplic'}>{brlOrMissing(ap)}</td></tr>; })}</tbody>
      </table></div>
    </section>}

    <section className="block-gap" aria-labelledby="autores">
      <h2 id="autores" className="block-title">Parlamentares que destinaram</h2>
      {m.autores.length ? <ul className="chip-list">{m.autores.map(a => <li key={a.id}><Link className="chip-button" href={`/parlamentares/${a.id}`}>{a.name}</Link></li>)}</ul>
        : <p className="small muted">Nenhum autor individual com ficha entre as emendas listadas abaixo. Emendas de bancada, comissão e relator são autoria coletiva.</p>}
    </section>

    <section className="block-gap" aria-labelledby="loc">
      <h2 id="loc" className="block-title">Emendas com o município registrado ({m.emendas_localidade.length})</h2>
      {m.emendas_localidade.length ? <div className="table-wrap"><table className="data-table">
        <thead><tr><th scope="col">Emenda</th><th scope="col">Ano</th><th scope="col">Tipo</th><th scope="col">Autor (SIAFI)</th><th scope="col" className="num">Pago total</th></tr></thead>
        <tbody>{m.emendas_localidade.map(e => <tr key={e.code}><th scope="row">{codeCell(e.code, e.ficha)}</th><td>{e.ano}</td><td>{e.tipo.replace('Emenda Individual - ', '')}</td><td>{e.autor ?? '—'}</td><td className="num">{brlOrMissing(e.pago_total)}</td></tr>)}</tbody>
      </table></div> : <DataState kind="empty" title="Nenhuma emenda com este município registrado">Veja abaixo os pagamentos aplicados no município por emendas registradas de outra forma.</DataState>}
    </section>

    <section className="block-gap" aria-labelledby="apl">
      <h2 id="apl" className="block-title">Emendas com pagamento aplicado aqui ({m.emendas_aplicacao.length})</h2>
      {m.emendas_aplicacao.length ? <div className="table-wrap"><table className="data-table">
        <caption>Segundo os documentos de pagamento. Inclui emendas registradas como “vários municípios”, bancada e outros autores.</caption>
        <thead><tr><th scope="col">Emenda</th><th scope="col">Ano</th><th scope="col">Tipo</th><th scope="col">Autor (SIAFI)</th><th scope="col" className="num">Documentos</th><th scope="col" className="num">Pago aplicado aqui</th></tr></thead>
        <tbody>{m.emendas_aplicacao.map(e => <tr key={`${e.code}-${e.ano}`}><th scope="row">{codeCell(e.code, e.ficha)}</th><td>{e.ano}</td><td>{(e.tipo ?? '—').replace('Emenda Individual - ', '')}</td><td>{e.autor ?? '—'}</td><td className="num">{e.documentos}</td><td className="num">{brlOrMissing(e.pago)}</td></tr>)}</tbody>
      </table></div> : <DataState kind="empty" title="Sem pagamento aplicado no município">Nenhum documento de pagamento de emendas de 2020–2026 com este município de aplicação.</DataState>}
    </section>

    <section className="block-gap" aria-labelledby="fav">
      <h2 id="fav" className="block-title">Quem recebeu no município</h2>
      {m.favorecidos.length ? <div className="table-wrap"><table className="data-table">
        <caption>Favorecidos com sede no município (arquivo “por favorecido” da CGU, lançamentos desde 2020). Pessoas físicas e empresários individuais aparecem como “omitido”. Ordenado por valor recebido.</caption>
        <thead><tr><th scope="col">Favorecido</th><th scope="col">Natureza jurídica</th><th scope="col" className="num">Lançamentos</th><th scope="col" className="num">Valor recebido</th></tr></thead>
        <tbody>{m.favorecidos.map((f, i) => <tr key={i}><th scope="row">{f.favorecido ?? 'Sem informação'}</th><td>{f.natureza ?? '—'}</td><td className="num">{f.lancamentos}</td><td className="num">{brlOrMissing(f.valor)}</td></tr>)}</tbody>
      </table></div> : <p className="small muted">Nenhum favorecido registrado.</p>}
    </section>

    <div className="block-gap glossary-row"><GlossaryTip id="aplicacao" /><GlossaryTip id="beneficiario" /></div>
  </div>;
}
