import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ExplorerSection } from '../components/ExplorerSection';
import { DATA_MODE } from '../lib/dataset';
import { PrimaryLink, SectionHeader, EvidenceCard, CtaBar } from '../components/Ui';
import { Art, CaminhoArt, CongressoArt, Figure, SertaoArt, SpotArt, type SpotKey } from '../components/Illustrations';
import { stories } from '../lib/editorial';

const pillars: { spot: SpotKey; no: string; title: string; desc: string; url: string }[] = [
  { spot: 'entender', no: '01', title: 'Entender', desc: 'Como as emendas funcionam e quais etapas o dinheiro percorre.', url: '/investigacao' },
  { spot: 'explorar', no: '02', title: 'Explorar', desc: 'Encontre sua cidade e veja a diferença entre os valores.', url: '/mapa' },
  { spot: 'verificar', no: '03', title: 'Verificar', desc: 'Aprenda a seguir os vínculos que os documentos permitem demonstrar.', url: '/fluxos' },
  { spot: 'acompanhar', no: '04', title: 'Acompanhar', desc: 'Conheça as pautas e veja como a apuração é construída.', url: '/reportagens' },
];

export default function Home() {
  return <>
    <section className="hero"><div className="container hero-layout">
      <div className="hero-copy">
        <span className="eyebrow">Investigação · Ceará · Emendas federais</span>
        <h1>O caminho <mark>do dinheiro.</mark></h1>
        <p>Quem decide para onde vão as emendas parlamentares, quem recebe os recursos e o que os documentos realmente permitem descobrir?</p>
        <div className="hero-actions"><PrimaryLink href="/investigacao">Começar a leitura</PrimaryLink><Link className="button button-ghost" href="/mapa">Explorar os dados <ArrowUpRight size={17} /></Link></div>
      </div>
      <Figure className="hero-art" caption="O percurso de uma emenda, da indicação ao pagamento. Representação esquemática."><CaminhoArt /></Figure>
    </div></section>

    <section className="intro-section container"><div className="intro-grid">
      <div className="eyebrow">A proposta</div>
      <div><h2>Transparência não é apenas publicar números. <span>É permitir compreendê-los.</span></h2><p>O RASTRO combina reportagem explicativa, investigação documental e ferramentas de exploração. A primeira versão terá foco nas emendas federais com destinação identificável ao Ceará.</p><Link className="text-link" href="/dados">Conheça nossos critérios <ArrowUpRight size={16} /></Link></div>
    </div></section>

    <section className="pillars-section"><div className="container">
      <SectionHeader eyebrow="Uma plataforma, quatro etapas" title="Da curiosidade à evidência." description="Uma jornada de leitura e consulta que funciona para quem nunca abriu uma planilha de orçamento público." />
      <div className="pillars-grid">{pillars.map(p => <Link key={p.no} href={p.url} className="pillar">
        <div className="pillar-art"><SpotArt name={p.spot} /></div>
        <span className="pillar-no">{p.no}</span><h3>{p.title}</h3><p>{p.desc}</p><ArrowUpRight className="pillar-arrow" size={22} />
      </Link>)}</div>
    </div></section>

    <section className="container section-space"><SectionHeader eyebrow="Experimente a interface" title="Sua cidade. Os caminhos dos recursos." description={DATA_MODE === 'demo' ? 'O exemplo abaixo usa apenas valores fictícios para demonstrar como será a experiência de consulta após a auditoria das fontes oficiais.' : 'Dados oficiais da CGU em validação: ainda sem conferência amostral nem revisão editorial. Não publicar.'} /><ExplorerSection /></section>

    <section className="feature"><div className="container feature-grid">
      <Figure caption="O interior do estado. Cena ilustrativa, não retrata um município específico."><SertaoArt /></Figure>
      <div className="feature-copy"><span className="eyebrow">Além dos grandes centros</span><h2>Todos os municípios merecem respostas claras.</h2><p>O portal pretende permitir que o leitor compreenda a distribuição de recursos, reconhecendo as diferenças entre recursos destinados ao governo estadual, beneficiários municipais e valores sem localidade comprovada.</p><PrimaryLink href="/mapa">Conhecer o explorador</PrimaryLink></div>
    </div></section>

    <section className="container section-space"><SectionHeader eyebrow="Jornalismo com rigor" title="Uma afirmação. Uma fonte. Um contexto." /><div className="evidence-grid">
      <EvidenceCard title="Origem verificável" body="Valores só podem ser publicados com data de extração, definição de medida e origem oficial registrada." source="https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares" />
      <EvidenceCard title="Etapas não se confundem" body="Indicação, empenho, pagamento, transferência e resultado físico são informações diferentes. Nenhuma deve substituir outra." />
      <EvidenceCard title="Sem culpa presumida" body="Relações estatísticas geram perguntas investigativas, não classificações automáticas de conduta política." />
    </div></section>

    <section className="container section-space story-section"><SectionHeader eyebrow="Reportagens e pautas" title="O que estamos investigando." />
      <div className="story-list">{stories.map(s => <article key={s.number} className="story-row">
        <Link href={s.link} className="story-row-art" aria-hidden="true" tabIndex={-1}><Art name={s.art} id={`row-${s.art}`} /></Link>
        <div><span className="story-kicker">{s.category}</span><h3><Link href={s.link}>{s.title}</Link></h3><span className="story-meta">{s.status}</span></div>
        <p className="story-row-text">{s.text}</p>
      </article>)}</div>
    </section>

    <section className="dark-feature"><div className="container">
      <div className="dark-grid">
        <div><span className="eyebrow">A grande reportagem</span><h2>Uma história que continua depois da última página.</h2><p>Entenda as modalidades, as decisões orçamentárias e os desafios da rastreabilidade. Depois, abra o mapa e conduza sua própria exploração.</p></div>
        <Figure caption="Documentos que saem do Legislativo. Metáfora visual."><CongressoArt /></Figure>
      </div>
      <CtaBar href="/investigacao">Ler a investigação</CtaBar>
    </div></section>
  </>;
}
