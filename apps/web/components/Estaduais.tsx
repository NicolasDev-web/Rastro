// Peças das páginas de emendas ESTADUAIS (SPEC 07, ADR-019), compartilhadas por /estaduais e /estaduais/[slug].
// Componentes de servidor: nada aqui se soma às emendas federais, nem entre colunas de valor, nem entre anos.
import Link from 'next/link';
import { InfoNote } from './Ui';
import { DataState } from './States';
import { brlOrMissing, formatDate } from '../lib/dataset-types';
import { VALOR_KEYS, type EmendaEstadual, type Estaduais } from '../lib/estaduais';

const PCF_URL = 'https://diariodonordeste.verdesmares.com.br/pontopoder/r-76-milhoes-ha-10-anos-deputados-brigam-para-tornar-obrigatoria-execucao-de-emendas-no-ceara-1.3692203';
const httpDate = (v: string | null) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? formatDate(d.toISOString()) : '—'; };
const money = (v: number | null) => <td className={v === null ? 'num missing' : 'num'}>{brlOrMissing(v)}</td>;

/** Endereço da página do deputado estadual no RASTRO (só para linha com ligação exata do pipeline). */
export const estadualHref = (slug: string) => `/estaduais/${slug}`;

export function AvisoEstaduais() {
  return <InfoNote><strong>Indicação não é pagamento.</strong> No Ceará, a emenda do deputado estadual não é impositiva: o deputado indica e o governo do Estado decide se executa. O arquivo usado aqui mostra só o orçamento (o valor da emenda e o valor na lei). Ele não mostra empenho, pagamento nem quem recebeu. Estes valores são do orçamento estadual e <strong>não se somam</strong> às emendas federais das outras páginas do RASTRO.</InfoNote>;
}

export function FonteEstaduais({ data }: { data: Estaduais }) {
  const snaps = data.anos.map(y => data.snapshots[String(y)]);
  const lastModified = [...new Set(snaps.map(s => httpDate(s.last_modified)))].join(', ');
  const extracao = [...new Set(snaps.map(s => formatDate(s.downloaded_at)))].join(', ');
  return <p className="article-meta">Fonte: <a href={data.fonte_pagina} target="_blank" rel="noopener noreferrer">Ceará Transparente (CGE-CE), emendas parlamentares</a>, um arquivo CSV por ano · atualização informada pelo servidor: {lastModified} · extração: {extracao} · SHA-256 por ano: {data.anos.map(y => `${y} ${data.snapshots[String(y)].raw_sha256.slice(0, 8)}`).join(', ')}</p>;
}

export function CoberturaEstaduais({ data }: { data: Estaduais }) {
  const linhas = data.anos.map(y => `${data.cobertura[String(y)].linhas} em ${y}`);
  const carater = [...new Set(data.anos.flatMap(y => Object.keys(data.cobertura[String(y)].carater)))].join(', ');
  return <DataState kind="partial_coverage" title="Cobertura parcial, sem explicação da fonte">
    O arquivo traz {linhas[0].replace(' em ', ' linhas em ')}{linhas.length > 1 ? `, ${linhas.slice(1, -1).join(', ')}${linhas.length > 2 ? ' e ' : ''}${linhas.at(-1)}` : ''}, todas de caráter {carater} (Programa de Cooperação Federativa) e do tipo individual. A imprensa cita <a href={PCF_URL} target="_blank" rel="noopener noreferrer">cerca de R$ 76 milhões por ano</a> no PCF, e a Lei Orçamentária de 2026 acolheu 521 emendas de deputados. Portanto, o arquivo não cobre todas as emendas estaduais. A execução (empenho, pagamento e beneficiário) e a explicação do recorte foram pedidas à CGE-CE pela Lei de Acesso à Informação.
  </DataState>;
}

/** Nome do deputado: link interno só quando o pipeline ligou a linha (nome exato e único na Alece). */
function DeputadoNome({ e }: { e: EmendaEstadual }) {
  if (!e.parlamentar) return <>—</>;
  return e.deputado.situacao === 'ligada' && e.deputado.slug
    ? <Link href={estadualHref(e.deputado.slug)}>{e.parlamentar}</Link>
    : <>{e.parlamentar}</>;
}

/** Tabela de emendas de um ano, na ordem do código da fonte, com as três colunas de valor separadas e sem total. */
export function TabelaEmendasAno({ data, rows, caption, comDeputado = true }: { data: Estaduais; rows: EmendaEstadual[]; caption: string; comDeputado?: boolean }) {
  return <div className="table-wrap"><table className="data-table">
    <caption>{caption}</caption>
    <thead><tr><th scope="col">Código</th>{comDeputado && <th scope="col">Deputado(a)</th>}<th scope="col">Ação (texto da fonte)</th><th scope="col">Município citado</th><th scope="col">Região</th>{VALOR_KEYS.map(k => <th key={k} scope="col" className="num">{data.colunas_valor[k]}</th>)}</tr></thead>
    <tbody>{rows.map(e => <tr key={e.id}>
      <th scope="row" className="mono">{e.codigo}</th>{comDeputado && <td><DeputadoNome e={e} /></td>}<td className="wrap">{e.acao ?? '—'}</td>
      <td>{e.municipio.ibge ? <>{e.municipio.nome} <span className="mono">{e.municipio.ibge}</span></> : <span className="muted">sem ligação</span>}</td>
      <td>{e.regiao ?? '—'}</td>{money(e.valor_emenda)}{money(e.valor_lei)}{money(e.valor_lei_creditos)}
    </tr>)}</tbody>
  </table></div>;
}
