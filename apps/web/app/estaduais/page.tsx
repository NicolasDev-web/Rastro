import type { Metadata } from 'next';
import Link from 'next/link';
import { InfoNote, SectionHeader } from '../../components/Ui';
import { CoverageFlag, DataState } from '../../components/States';
import { brlOrMissing, formatDate } from '../../lib/dataset-types';
import { getEstaduais, VALOR_KEYS, type EmendaEstadual, type Estaduais } from '../../lib/estaduais';

export const metadata: Metadata = { title: 'Emendas estaduais | RASTRO' };

const PCF_URL = 'https://diariodonordeste.verdesmares.com.br/pontopoder/r-76-milhoes-ha-10-anos-deputados-brigam-para-tornar-obrigatoria-execucao-de-emendas-no-ceara-1.3692203';
const httpDate = (v: string | null) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? formatDate(d.toISOString()) : '—'; };
const money = (v: number | null) => <td className={v === null ? 'num missing' : 'num'}>{brlOrMissing(v)}</td>;

function Aviso() {
  return <InfoNote><strong>Indicação não é pagamento.</strong> No Ceará, a emenda do deputado estadual não é impositiva: o deputado indica e o governo do Estado decide se executa. O arquivo usado aqui mostra só o orçamento (o valor da emenda e o valor na lei). Ele não mostra empenho, pagamento nem quem recebeu. Estes valores são do orçamento estadual e <strong>não se somam</strong> às emendas federais das outras páginas do RASTRO.</InfoNote>;
}

function Fonte({ data }: { data: Estaduais }) {
  const snaps = data.anos.map(y => data.snapshots[String(y)]);
  const lastModified = [...new Set(snaps.map(s => httpDate(s.last_modified)))].join(', ');
  const extracao = [...new Set(snaps.map(s => formatDate(s.downloaded_at)))].join(', ');
  return <p className="article-meta">Fonte: <a href={data.fonte_pagina} target="_blank" rel="noopener noreferrer">Ceará Transparente (CGE-CE), emendas parlamentares</a>, um arquivo CSV por ano · atualização informada pelo servidor: {lastModified} · extração: {extracao} · SHA-256 por ano: {data.anos.map(y => `${y} ${data.snapshots[String(y)].raw_sha256.slice(0, 8)}`).join(', ')}</p>;
}

function Cobertura({ data }: { data: Estaduais }) {
  const linhas = data.anos.map(y => `${data.cobertura[String(y)].linhas} em ${y}`);
  const carater = [...new Set(data.anos.flatMap(y => Object.keys(data.cobertura[String(y)].carater)))].join(', ');
  return <DataState kind="partial_coverage" title="Cobertura parcial, sem explicação da fonte">
    O arquivo traz {linhas[0].replace(' em ', ' linhas em ')}{linhas.length > 1 ? `, ${linhas.slice(1, -1).join(', ')}${linhas.length > 2 ? ' e ' : ''}${linhas.at(-1)}` : ''}, todas de caráter {carater} (Programa de Cooperação Federativa) e do tipo individual. A imprensa cita <a href={PCF_URL} target="_blank" rel="noopener noreferrer">cerca de R$ 76 milhões por ano</a> no PCF, e a Lei Orçamentária de 2026 acolheu 521 emendas de deputados. Portanto, o arquivo não cobre todas as emendas estaduais. A execução (empenho, pagamento e beneficiário) e a explicação do recorte foram pedidas à CGE-CE pela Lei de Acesso à Informação.
  </DataState>;
}

function Resumo({ data }: { data: Estaduais }) {
  return <section className="block-gap" aria-labelledby="por-ano">
    <h2 id="por-ano" className="block-title">Por ano do orçamento</h2>
    <div className="table-wrap"><table className="data-table">
      <caption>Valores do orçamento estadual, como estão no arquivo de cada ano. As três colunas de valor são diferentes e <strong>não se somam</strong> entre si. Nenhuma delas se soma às emendas federais.</caption>
      <thead><tr><th scope="col">Ano</th><th scope="col" className="num">Linhas</th><th scope="col" className="num">Deputados</th><th scope="col" className="num">Com município citado</th>{VALOR_KEYS.map(k => <th key={k} scope="col" className="num">{data.colunas_valor[k]}</th>)}</tr></thead>
      <tbody>{data.anos.map(y => { const c = data.cobertura[String(y)]; return <tr key={y}>
        <th scope="row">{y}</th><td className="num">{c.linhas}</td><td className="num">{c.parlamentares_distintos}</td><td className="num">{c.linhas_municipio_ligado} de {c.linhas}</td>
        {VALOR_KEYS.map(k => <td key={k} className={c.valores[k].total === null ? 'num missing' : 'num'}>{brlOrMissing(c.valores[k].total)}</td>)}
      </tr>; })}</tbody>
    </table></div>
    <p className="small muted">Os nomes das colunas de valor são os do arquivo. O dicionário de dados publicado não os define. Algumas linhas têm “Valor emenda” e “Valor lei” iguais a zero e “Valor lei créditos” positivo; o arquivo não explica a diferença. Valor ausente aparece como “Sem registro”, nunca como zero.</p>
  </section>;
}

function Deputado({ e }: { e: EmendaEstadual }) {
  if (!e.parlamentar) return <>—</>;
  return e.deputado.situacao === 'ligada' && e.deputado.url_perfil
    ? <a href={e.deputado.url_perfil} target="_blank" rel="noopener noreferrer">{e.parlamentar} ↗</a>
    : <>{e.parlamentar}</>;
}

function Ano({ data, ano }: { data: Estaduais; ano: number }) {
  const rows = data.emendas.filter(e => e.ano === ano);
  return <details className="mapa-tabela block-gap">
    <summary>Ver as {rows.length} emendas de {ano}</summary>
    <div className="table-wrap"><table className="data-table">
      <caption>Emendas estaduais de {ano} na ordem do código da fonte. O município é o citado no texto da ação; não é necessariamente quem recebe nem prova onde o dinheiro foi usado.</caption>
      <thead><tr><th scope="col">Código</th><th scope="col">Deputado(a)</th><th scope="col">Ação (texto da fonte)</th><th scope="col">Município citado</th><th scope="col">Região</th>{VALOR_KEYS.map(k => <th key={k} scope="col" className="num">{data.colunas_valor[k]}</th>)}</tr></thead>
      <tbody>{rows.map(e => <tr key={e.id}>
        <th scope="row" className="mono">{e.codigo}</th><td><Deputado e={e} /></td><td className="wrap">{e.acao ?? '—'}</td>
        <td>{e.municipio.ibge ? <>{e.municipio.nome} <span className="mono">{e.municipio.ibge}</span></> : <span className="muted">sem ligação</span>}</td>
        <td>{e.regiao ?? '—'}</td>{money(e.valor_emenda)}{money(e.valor_lei)}{money(e.valor_lei_creditos)}
      </tr>)}</tbody>
    </table></div>
  </details>;
}

function Metodo({ data }: { data: Estaduais }) {
  const sum = (f: (y: string) => number) => data.anos.reduce((acc, y) => acc + f(String(y)), 0);
  const total = sum(y => data.cobertura[y].linhas);
  const mun = sum(y => data.cobertura[y].linhas_municipio_ligado);
  const amb = sum(y => data.cobertura[y].linhas_municipio_ambiguo + data.cobertura[y].linhas_municipio_nao_resolvido);
  const sem = sum(y => data.cobertura[y].linhas_sem_municipio);
  const dep = sum(y => data.cobertura[y].linhas_deputado_ligado);
  return <div className="data-info-grid block-gap">
    <section className="data-method"><h2 className="block-title">Como ligamos ao município</h2>
      <p>O arquivo não tem código IBGE nem beneficiário. Só ligamos a linha a um município quando o texto da ação traz o nome exato do IBGE, sem acento e sem diferença de maiúsculas, em uma de duas posições:</p>
      <ol><li>logo depois da palavra “município” (por exemplo, “no município de Tamboril”);</li><li>no fim do texto, depois de “em”, “de”, barra ou hífen, quando é o único município citado (por exemplo, “pavimentação em Ubajara”).</li></ol>
      <p>Resultado: {mun} de {total} linhas ligadas. {amb} não passam na regra (nome que não é exato, como “Tabuleiro” e “Santana de Acaraú”, ou mais de um município) e {sem} não citam município. Essas ficam sem ligação.</p>
    </section>
    <section className="data-method alt"><h2 className="block-title">Como ligamos ao deputado</h2>
      <p>O nome do arquivo precisa ser igual, sem acento e sem diferença de maiúsculas, a um único nome da lista atual da Assembleia Legislativa (consulta de {formatDate(data.referencias.alece.downloaded_at)}). Não usamos nome parecido nem abreviação.</p>
      <p>Resultado: {dep} de {total} linhas ligadas. Ex-deputados e nomes escritos de outro jeito ficam sem ligação. Não há ranking de deputados nem soma por deputado.</p>
    </section>
  </div>;
}

export default function EmendasEstaduais() {
  const res = getEstaduais();
  return <div className="container page-space">
    <SectionHeader level={1} eyebrow="ORÇAMENTO DO ESTADO DO CEARÁ" title="Emendas estaduais" description="Indicações dos deputados estaduais ao orçamento do Ceará, conforme o arquivo aberto do Ceará Transparente. Ficam separadas das emendas federais." />
    <div className="page-hero-flags"><CoverageFlag value={res.ok ? 'partial' : res.demo ? 'demo' : 'unverified'} /></div>
    <Aviso />
    {!res.ok ? (res.demo
      ? <DataState kind="demo" title="Sem dados na demonstração">Esta página usa só dados oficiais do Ceará Transparente. Na demonstração eles não são carregados, e nenhum valor fictício é mostrado no lugar.</DataState>
      : <DataState kind="error" title="Emendas estaduais indisponíveis">{res.error}</DataState>) : <>
      <div className="block-gap"><Cobertura data={res.data} /></div>
      <Fonte data={res.data} />
      <Resumo data={res.data} />
      <section className="block-gap" aria-labelledby="lista">
        <h2 id="lista" className="block-title">Emenda por emenda</h2>
        {[...res.data.anos].reverse().map(y => <Ano key={y} data={res.data} ano={y} />)}
      </section>
      <Metodo data={res.data} />
      <section className="credits-block block-gap"><h2 className="block-title">Limites destes dados</h2>
        <ul>{res.data.limitacoes.map(t => <li key={t}>{t}</li>)}</ul>
        <p className="small muted">O <a href={res.data.dicionario.url} target="_blank" rel="noopener noreferrer">dicionário de dados</a> do Ceará Transparente descreve colunas de outra tabela (dotação inicial e atualizada, empenho, liquidação e pagamento), não as do arquivo CSV. Os arquivos brutos ficam guardados com data e SHA-256.</p>
        <Link className="text-link" href="/dados">Fontes e metodologia →</Link>
      </section>
    </>}
  </div>;
}
