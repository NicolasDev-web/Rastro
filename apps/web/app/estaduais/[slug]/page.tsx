// Emendas estaduais de UM deputado (SPEC 07, incremento 2). Só os slugs que o pipeline ligou por nome exato e único na Alece.
// Sem ranking e sem soma por deputado: as emendas aparecem uma a uma, por ano, com as três colunas de valor separadas.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { AuthorPortrait } from '../../../components/AuthorPortrait';
import { CoverageFlag, DataState } from '../../../components/States';
import { AvisoEstaduais, CoberturaEstaduais, FonteEstaduais, TabelaEmendasAno } from '../../../components/Estaduais';
import { getAuthors } from '../../../lib/dataset';
import { formatDate } from '../../../lib/dataset-types';
import { deputadosLigados, getEstaduais } from '../../../lib/estaduais';

export const dynamicParams = false;

export function generateStaticParams() {
  const res = getEstaduais();
  return res.ok ? deputadosLigados(res.data).map(d => ({ slug: d.slug })) : [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const res = getEstaduais();
  const d = res.ok ? deputadosLigados(res.data).find(x => x.slug === slug) : undefined;
  return { title: d ? `${d.nome} | Emendas estaduais | RASTRO` : 'Emendas estaduais | RASTRO' };
}

export default async function DeputadoEstadual({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = getEstaduais();
  if (!res.ok) return <div className="container page-space">
    {res.demo
      ? <DataState kind="demo" title="Sem dados na demonstração">Esta página usa só dados oficiais do Ceará Transparente. Na demonstração eles não são carregados, e nenhum valor fictício é mostrado no lugar.</DataState>
      : <DataState kind="error" title="Emendas estaduais indisponíveis">{res.error}</DataState>}
  </div>;
  const data = res.data;
  const d = deputadosLigados(data).find(x => x.slug === slug);
  if (!d) notFound();
  const authors = getAuthors();
  const card = authors.ok ? authors.data.stateDeputies.find(x => x.slug === slug) : undefined;
  const perfil = d.url_perfil ?? card?.url_perfil ?? null;

  return <div className="container page-space author-page">
    <Link href="/estaduais" className="text-link"><ArrowLeft size={15} aria-hidden="true" /> Todas as emendas estaduais</Link>

    <header className="author-hero">
      <AuthorPortrait name={d.nome} photo={card?.photo ?? null} credit={card?.photo ? 'Foto: Assembleia Legislativa do Ceará' : null} size="lg" />
      <div>
        <span className="eyebrow">Deputado(a) estadual · Orçamento do Estado do Ceará</span>
        <h1>{d.nome}</h1>
        {card?.partido_atual && <p className="author-facts"><b>{card.partido_atual}</b> <span className="muted">(partido atual segundo a Alece{authors.ok && authors.data.stateAsOf ? `, em ${formatDate(authors.data.stateAsOf)}` : ''}; não necessariamente o da época das emendas)</span></p>}
        <p className="author-facts muted small">Nome no arquivo do Ceará Transparente: {d.nomes_fonte.join(', ')} · ligado por nome exato e único à lista da Alece (consulta de {formatDate(data.referencias.alece.downloaded_at)})</p>
        <div className="author-badges">
          <CoverageFlag value="partial" />
          {perfil && <a className="text-link" href={perfil} target="_blank" rel="noopener noreferrer">Perfil oficial na Alece <ExternalLink size={13} aria-hidden="true" /></a>}
          <Link className="text-link" href="/parlamentares#estaduais">Deputados estaduais em Autores</Link>
        </div>
      </div>
    </header>

    <AvisoEstaduais />
    <div className="block-gap"><CoberturaEstaduais data={data} /></div>
    <FonteEstaduais data={data} />

    <section className="block-gap" aria-labelledby="por-ano">
      <h2 id="por-ano" className="block-title">Emendas por ano do orçamento</h2>
      <p className="small muted">Linhas do arquivo ligadas a este nome, uma a uma, na ordem do código da fonte. Não há total por deputado: as três colunas de valor são diferentes, não se somam entre si, nem entre anos, nem com as emendas federais. Valor ausente aparece como “Sem registro”, nunca como zero.</p>
      {[...data.anos].reverse().map(ano => {
        const rows = data.emendas.filter(e => e.ano === ano && e.deputado.situacao === 'ligada' && e.deputado.slug === slug);
        return <section key={ano} className="block-gap" aria-labelledby={`ano-${ano}`}>
          <h3 id={`ano-${ano}`}>{ano} · {rows.length > 0 ? `${rows.length} ${rows.length === 1 ? 'linha' : 'linhas'} no orçamento` : 'sem linha ligada'}</h3>
          {rows.length > 0
            ? <TabelaEmendasAno data={data} rows={rows} comDeputado={false} caption={`Emendas estaduais de ${ano} indicadas por ${d.nome}, segundo o arquivo do Ceará Transparente. O município é o citado no texto da ação; não é necessariamente quem recebe nem prova onde o dinheiro foi usado.`} />
            : <p className="small muted">O arquivo de {ano} não traz emenda ligada a este nome. Como a cobertura do arquivo é parcial, isso não quer dizer que não houve indicação nesse ano.</p>}
        </section>;
      })}
    </section>

    <section className="credits-block block-gap"><h2 className="block-title">Como esta página foi montada</h2>
      <p>Entram só as linhas cujo nome no arquivo é igual, sem acento e sem diferença de maiúsculas, a um único nome da lista atual da Assembleia Legislativa. Linhas com o nome escrito de outro jeito ou de ex-deputados não entram aqui, nem por nome parecido. Não há ranking de deputados nem soma por deputado.</p>
      <Link className="text-link" href="/estaduais">Cobertura, regras e limites das emendas estaduais →</Link>
    </section>
  </div>;
}
