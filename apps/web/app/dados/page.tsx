import Link from 'next/link';
import { PageHero, InfoNote } from '../../components/Ui';
import { DadosArt } from '../../components/Illustrations';
import { DataState } from '../../components/States';
import { DATA_MODE, getDataset } from '../../lib/dataset';
import { formatDate } from '../../lib/dataset-types';

const sources = [
  ['CGU — emendas parlamentares', 'https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares', 'Valores por emenda, localidade, favorecidos e convênios do arquivo único.'],
  ['CGU — documentos de despesa', 'https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares-documentos/', 'Datas, etapas, pagamentos e município de aplicação.'],
  ['Câmara dos Deputados', 'https://dadosabertos.camara.leg.br/', 'Identificação de deputados, legislaturas e partido na data da consulta.'],
  ['Senado Federal', 'https://www12.senado.leg.br/dados-abertos', 'Identificação de senadores e registros da legislatura.'],
  ['Ceará Transparente (CGE-CE) — emendas estaduais', 'https://cearatransparente.ce.gov.br/portal-da-transparencia/despesas/emendas-parlamentares', 'Orçamento das emendas dos deputados estaduais, 2023 a 2026, em página própria e separado das federais. Sem execução.'],
  ['IBGE — municípios', 'https://servicodados.ibge.gov.br/api/v1/localidades/estados/CE/municipios', 'Nomes e códigos municipais. A malha geográfica ainda não foi incorporada.'],
  ['Transferegov — APIs', 'https://api-publica.transferegov.gestao.gov.br/', 'Referência para aprofundamento dos instrumentos; integração própria ainda pendente.'],
];
export default function Dados() {
  const demo = DATA_MODE === 'demo';
  const result = getDataset();
  return <div className="container page-space">
    <PageHero eyebrow="FONTES E METODOLOGIA" title="Cada número precisa de um caminho." description="Da cópia da fonte oficial à conferência dos documentos: entenda o recorte, os critérios e as lacunas do RASTRO." art={<DadosArt />} />
    <InfoNote>{demo ? 'Você está na demonstração: os valores e personagens desta interface são fictícios. O pipeline de dados oficiais existe em um ambiente local de validação, separado desta versão.' : DATA_MODE === 'validacao' ? 'Você está no ambiente local de dados oficiais em validação. Esta versão serve à conferência da equipe e ainda não constitui uma publicação jornalística apurada.' : 'O RASTRO é uma investigação cidadã independente. Os números vêm de arquivos oficiais da CGU; a extração, o cruzamento e a interpretação são nossos e podem conter erros. Diferenças entre fontes aparecem nas fichas e não são prova de irregularidade.'}</InfoNote>
    {!demo && (result.ok ? <p className="article-meta">Fonte: {result.data.source} · extração: {formatDate(result.data.asOf)} · snapshot: {result.data.snapshot} · período: {result.data.years.join(', ')} · cobertura sem auditoria externa</p> : <DataState kind="error" title="Metadados indisponíveis">{result.error}</DataState>)}
    <div className="data-info-grid block-gap"><section className="data-method"><h2 className="block-title">Da fonte à ficha</h2><ol>
      <li>Preservamos a cópia original com URL, data de extração e SHA-256.</li><li>Tratamos dinheiro em centavos e usamos códigos oficiais para identificar emendas e municípios.</li><li>Conferimos os agregados com o arquivo bruto e com os documentos de despesa.</li><li>Ligamos autores do SIAFI às listas da Câmara e do Senado por nome exato, com revisão humana registrada.</li><li>Exibimos divergências e lacunas para conferência. Elas não comprovam irregularidade.</li>
    </ol></section><section className="data-method alt"><h2 className="block-title">Dois critérios territoriais</h2><p><strong>Localidade da emenda:</strong> município registrado na própria emenda. Valores estaduais e de vários municípios ficam separados.</p><p><strong>Aplicação do pagamento:</strong> município informado no documento de despesa. Pode localizar pagamentos de uma emenda registrada de forma mais ampla.</p><p>Os critérios nunca se somam. Município de aplicação ou sede do favorecido não comprovam o local da entrega.</p></section></div>
    <section className="credits-block"><h2 className="block-title">Como ler os valores</h2><p>Empenhado, liquidado e pago são etapas distintas. Pago total é Pago + Restos a pagar pagos; as fichas mostram se esse total confere com os documentos disponíveis. A conciliação se refere ao recorte e à extração consultados.</p><p>O ano do filtro é o ano da emenda. Os documentos podem ter datas posteriores. Ausência de registro permanece ausência, e não vira zero.</p><p>Pessoas físicas e empresários individuais têm identificação omitida. Partido é o informado pela casa legislativa na data da consulta, não necessariamente o partido na época da emenda.</p><Link className="text-link" href="/glossario">Consultar o glossário →</Link></section>
    <section className="source-section"><h2>Fontes e usos</h2>{sources.map(([name, url, use], i) => <a className="source-row" key={url} href={url} target="_blank" rel="noreferrer"><span>{String(i + 1).padStart(2, '0')}</span><div><strong>{name}</strong><p>{use}</p></div><span aria-hidden="true">↗</span></a>)}</section>
    <div className="data-info-grid block-gap"><section className="data-method"><h2 className="block-title">O que falta conferir</h2><p>O tratamento das divergências e a validação de cobertura continuam em andamento. As <Link href="/estaduais">emendas estaduais</Link> aparecem só pelo orçamento: o arquivo aberto não traz empenho, pagamento nem beneficiário, e cobre parte das emendas. O mapa mostra onde os pagamentos foram aplicados; emendas registradas para o estado inteiro ou para vários municípios ficam fora da cor das cidades.</p><p>As fontes são cópias datadas, sem atualização em tempo real.</p></section><section className="data-method alt"><h2 className="block-title">Créditos e correções</h2><p>As ilustrações são vetores editoriais esquemáticos. Retratos oficiais, quando disponíveis na validação, têm crédito na ficha do autor.</p><p><Link href="/correcoes">Conheça a política de correções</Link> e <Link href="/sobre">o estágio do projeto</Link>.</p></section></div>
  </div>;
}
