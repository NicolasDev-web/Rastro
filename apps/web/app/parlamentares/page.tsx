import Link from 'next/link';
import { InfoNote, PageHero } from '../../components/Ui';
import { AutoresArt } from '../../components/Illustrations';
import { AuthorsBrowser } from '../../components/AuthorsBrowser';
import { AuthorPortrait } from '../../components/AuthorPortrait';
import { DataState, CoverageFlag } from '../../components/States';
import { GlossaryTip } from '../../components/Glossary';
import { getAuthors } from '../../lib/dataset';
import type { AuthorCard } from '../../lib/authors-types';
import { STAGES, STAGE_LABEL, brlOrMissing, formatDate } from '../../lib/dataset-types';

export default function Autores() {
  const res = getAuthors();
  return <div className="container page-space">
    <PageHero eyebrow="Autores / perfis documentais" title="Quem apresenta as emendas?" description="O que cada deputado federal e senador fez com as emendas destinadas ao Ceará — sem ranquear pessoas nem atribuir intenções a partir de montantes." art={<AutoresArt />}>
      <div className="page-hero-flags"><CoverageFlag value={res.ok ? res.data.coverage : 'unverified'} /></div>
    </PageHero>

    {!res.ok ? <DataState kind="error" title="Dados de autores indisponíveis">{res.error}</DataState> : <>
      <InfoNote><strong>Como ler:</strong> autor formal segundo o SIAFI. Indicar não é pagar; pagar não é entregar. Sem juízo de conduta. {res.data.mode !== 'demo' ? `Partido e foto vêm da Câmara e do Senado (consulta de ${formatDate(res.data.partiesAsOf ?? undefined)}); o partido é o atual, não o da época da emenda. O vínculo entre o autor da CGU e o parlamentar foi feito por nome e conferido manualmente.` : 'Perfis fictícios para testar a interface.'}</InfoNote>

      <AuthorsBrowser demo={res.data.mode === 'demo'} authors={res.data.authors.map<AuthorCard>(({ id, display_name, casa, partido_atual, uf, eleito_ce, scope, link, photo, photo_credit, total }) => ({ id, display_name, casa, partido_atual, uf, eleito_ce, scope, link, photo, photo_credit, total }))} />

      <section className="block-gap" aria-labelledby="coletivas">
        <h2 id="coletivas" className="block-title">Autorias coletivas e sem autor identificado</h2>
        <p className="small muted">Emendas de bancada, de comissão, de relator-geral e linhas sem autor na fonte, com localidade no Ceará. Aparecem só como valor e <strong>nunca</strong> são repartidas entre parlamentares.</p>
        <div className="table-wrap"><table className="data-table">
          <caption>Totais de emendas de 2020 a 2026{res.data.mode === 'demo' ? ' (fictícios)' : ''}. Colunas são etapas diferentes e não se somam.</caption>
          <thead><tr><th scope="col">Autoria</th><th scope="col">Tipo</th><th scope="col" className="num">Emendas</th>{STAGES.map(s => <th key={s} scope="col" className="num">{STAGE_LABEL[s]}</th>)}</tr></thead>
          <tbody>{res.data.collective.map(c => <tr key={c.label + c.tipo}><th scope="row">{c.label}</th><td>{c.tipo.replace('Emenda de ', '')}</td><td className="num">{c.total.emendas}</td>{STAGES.map(s => <td key={s} className={c.total[s] === null ? 'num missing' : 'num'}>{brlOrMissing(c.total[s])}</td>)}</tr>)}</tbody>
        </table></div>
      </section>

      <section className="block-gap" aria-labelledby="estaduais">
        <h2 id="estaduais" className="block-title">Deputados estaduais (Alece)</h2>
        <DataState kind="partial_coverage" title="Emendas estaduais: só o orçamento, cobertura parcial">No Ceará, as emendas dos deputados estaduais não são impositivas: são indicações ao orçamento do Estado, executadas a critério do governo. O Ceará Transparente publica um arquivo por ano (2023 a 2026) com o lado do orçamento, sem empenho, pagamento ou beneficiário, e com poucas linhas por ano. A execução foi pedida à CGE pela Lei de Acesso à Informação. <Link href="/estaduais">Veja o que já está em Emendas estaduais</Link>.</DataState>
        {res.data.stateDeputies.length > 0 && <>
          <p className="small muted">{res.data.stateDeputies.length} deputados em exercício segundo a página oficial da Alece{res.data.stateAsOf ? ` (consulta de ${formatDate(res.data.stateAsOf)})` : ''}, em ordem alfabética. Partido atual.</p>
          <ul className="author-grid state-grid">{[...res.data.stateDeputies].sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR')).map(d => <li key={d.slug}>
            <a href={d.url_perfil} target="_blank" rel="noopener noreferrer" className="author-card">
              <AuthorPortrait name={d.nome} photo={d.photo} />
              <div className="author-card-body">
                <strong>{d.nome}</strong>
                <span className="author-meta">{[d.partido_atual, 'Assembleia Legislativa do Ceará'].filter(Boolean).join(' · ')}</span>
                {d.situacao === 'suplente_em_exercicio' && <span className="author-meta">Suplente em exercício</span>}
                <span className="author-value"><small>Emendas</small> sem dado estruturado</span>
                <span className="link-badge link-revisado">Perfil oficial ↗</span>
              </div>
            </a>
          </li>)}</ul>
          <p className="small muted">Fotos: Assembleia Legislativa do Ceará.</p>
        </>}
      </section>

      <div className="block-gap glossary-row"><GlossaryTip id="emenda" /><GlossaryTip id="rp" /></div>
    </>}
  </div>;
}
