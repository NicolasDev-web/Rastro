import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '../../components/Ui';
import { EstaduaisArt } from '../../components/Illustrations';
import { CoverageFlag, DataState } from '../../components/States';
import { AvisoEstaduais as Aviso, CoberturaEstaduais as Cobertura, FonteEstaduais as Fonte, TabelaEmendasAno } from '../../components/Estaduais';
import { brlOrMissing, formatDate } from '../../lib/dataset-types';
import { deputadosLigados, getEstaduais, VALOR_KEYS, type Estaduais } from '../../lib/estaduais';

export const metadata: Metadata = { title: 'Emendas estaduais | RASTRO' };

function Resumo({ data }: { data: Estaduais }) {
  return <section className="block-gap" aria-labelledby="por-ano">
    <h2 id="por-ano" className="block-title">Por ano do orçamento</h2>
    <div tabIndex={0} className="table-wrap"><table className="data-table">
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

function Ano({ data, ano }: { data: Estaduais; ano: number }) {
  const rows = data.emendas.filter(e => e.ano === ano);
  return <details className="mapa-tabela block-gap">
    <summary>Ver as {rows.length} emendas de {ano}</summary>
    <TabelaEmendasAno data={data} rows={rows} caption={`Emendas estaduais de ${ano} na ordem do código da fonte. O município é o citado no texto da ação; não é necessariamente quem recebe nem prova onde o dinheiro foi usado. O nome com link leva às emendas do deputado no RASTRO; nome sem link não tem ligação exata com a lista da Alece.`} />
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
      <p>Resultado: {dep} de {total} linhas ligadas, de {deputadosLigados(data).length} deputados. Cada um tem uma página com as emendas dele por ano, aberta pelo nome na tabela acima ou pelo card em <Link href="/parlamentares#estaduais">Autores</Link>. Ex-deputados e nomes escritos de outro jeito ficam sem ligação e sem página. Não há ranking de deputados nem soma por deputado.</p>
    </section>
  </div>;
}

export default function EmendasEstaduais() {
  const res = getEstaduais();
  return <div className="container page-space">
    <PageHero eyebrow="ORÇAMENTO DO ESTADO DO CEARÁ" title="Emendas estaduais" description="Indicações dos deputados estaduais ao orçamento do Ceará, conforme o arquivo aberto do Ceará Transparente. Ficam separadas das emendas federais." art={<EstaduaisArt />}><div className="page-hero-flags"><CoverageFlag value={res.ok ? 'partial' : res.demo ? 'demo' : 'unverified'} /></div></PageHero>
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
