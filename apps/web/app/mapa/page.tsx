import { ExplorerSection } from '../../components/ExplorerSection';
import { InfoNote, PageHero } from '../../components/Ui';
import { MapaArt } from '../../components/Illustrations';
import { DataState, CoverageFlag } from '../../components/States';
import { GlossaryTip } from '../../components/Glossary';
import { getDataset } from '../../lib/dataset';
import Link from 'next/link';
import { STAGES, STAGE_LABEL, aplicValue, brlOrMissing, formatDate, value, type Dataset } from '../../lib/dataset-types';

function DataTable({ data }: { data: Dataset }) {
  const y = data.defaultYear;
  const demo = data.mode === 'demo';
  const withRecord = data.municipalities.filter(m => m.years[String(y)]).length;
  const hasAplic = data.municipalities.some(m => m.aplicacao);
  return <section className="block-gap" aria-labelledby="mapa-tabela">
    <h2 id="mapa-tabela" className="block-title">Tabela por destinação · emendas de {y}{demo ? ' (fictício)' : ''}</h2>
    {!demo && <p className="small muted">{withRecord} de {data.municipalities.length} municípios com registro em {y}. Outros anos: use o explorador acima ou baixe o CSV.</p>}
    <div className="table-wrap">
      <table className="data-table">
        <caption>Valores {demo ? 'fictícios' : `oficiais em validação (CGU, extraídos em ${formatDate(data.asOf)})`} por etapa, pela localidade da emenda. As colunas são etapas diferentes e <strong>não devem ser somadas</strong>.{hasAplic ? ' A última coluna usa outro critério — o município onde o pagamento foi aplicado, segundo os documentos de despesa — e também não se soma às demais.' : ''}</caption>
        <thead><tr><th scope="col">Destinação</th><th scope="col">Código IBGE</th>{STAGES.map(s => <th key={s} scope="col" className="num">{STAGE_LABEL[s]}</th>)}{hasAplic && <th scope="col" className="num col-aplic">Pago por aplicação</th>}</tr></thead>
        <tbody>
          <tr className="group-row"><th scope="rowgroup" colSpan={3 + STAGES.length}>Municípios</th></tr>
          {data.municipalities.map(m => { const ap = aplicValue(m, y); return <tr key={m.id}><th scope="row"><Link href={`/municipios/${m.ibge}`}>{m.name}</Link></th><td className="mono">{m.ibge}</td>{STAGES.map(s => { const v = value(m, y, s); return <td key={s} className={v === null ? 'num missing' : 'num'}>{brlOrMissing(v)}</td>; })}{hasAplic && <td className={ap === null ? 'num missing col-aplic' : 'num col-aplic'}>{brlOrMissing(ap)}</td>}</tr>; })}
          <tr className="group-row"><th scope="rowgroup" colSpan={3 + STAGES.length}>Fora da contagem municipal</th></tr>
          {data.nonMunicipal.map(n => <tr key={n.id}><th scope="row">{n.name}</th><td className="mono">—</td>{STAGES.map(s => { const v = value(n, y, s); return <td key={s} className={v === null ? 'num missing' : 'num'}>{brlOrMissing(v)}</td>; })}{hasAplic && <td className="num missing col-aplic">não se aplica</td>}</tr>)}
        </tbody>
      </table>
    </div>
    <p className="small muted">“Sem registro” significa que a fonte não traz linha para essa destinação no ano. Não é zero.</p>
  </section>;
}

export default function Mapa() {
  const res = getDataset();
  return <div className="container page-space">
    <PageHero eyebrow="Explorador / Ceará" title="O mapa do dinheiro." description="Município, aplicação estadual ou vários municípios: cada valor fica onde os documentos permitem colocá-lo — e em nenhum outro lugar." art={<MapaArt />} caption="Três destinos possíveis de um recurso: município, aplicação estadual e vários municípios. Mapa imaginário, sem fronteiras reais.">
      <div className="page-hero-flags"><CoverageFlag value={res.ok ? res.data.coverage : 'unverified'} /></div>
    </PageHero>

    <ExplorerSection />

    <section className="block-gap" aria-labelledby="mapa-geo">
      <h2 id="mapa-geo" className="block-title">Mapa municipal</h2>
      <DataState kind="partial_coverage" title="Mapa geográfico ainda não carregado">A versão real usará a malha municipal oficial do IBGE, com versão e simplificação documentadas (SPEC 04, T04.03). Até lá, a tabela abaixo é a forma completa e acessível de consultar os valores.</DataState>
    </section>

    {res.ok && <DataTable data={res.data} />}

    <div className="block-gap glossary-row"><GlossaryTip id="beneficiario" /><GlossaryTip id="indeterminado" /></div>
    <div className="block-gap"><InfoNote>Valores com localidade estadual ou de vários municípios não são atribuídos a Fortaleza nem a qualquer município sem documento que comprove o vínculo.</InfoNote></div>
  </div>;
}
