import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '../../components/Ui';
import { Art, ReportagensArt } from '../../components/Illustrations';
import { stories } from '../../lib/editorial';

export const metadata: Metadata = { title: 'Reportagens | RASTRO' };

export default function Reportagens() {
  return <div className="container page-space">
    <PageHero eyebrow="Reportagens e pautas" title="Histórias para investigar. Não conclusões antecipadas." description="Um explicador e duas reportagens feitas com os dados publicados. Cada número tem fonte, e nenhuma conclusão vai além do que os documentos mostram." art={<ReportagensArt />} />
    <section className="block-gap" aria-labelledby="pecas">
      <h2 id="pecas" className="block-title">Peças publicadas</h2>
      <div className="story-grid">{stories.map(a => <article key={a.number} className="story-card">
        <Link href={a.link} className="story-card-art" aria-hidden="true" tabIndex={-1}>
          <Art name={a.art} id={`card-${a.art}`} />
          <span className="art-label"><strong>{a.title}</strong><small>{a.number} · {a.category}</small></span>
        </Link>
        <div className="story-body">
          <h3><Link href={a.link}>{a.title}</Link></h3>
          <span className="story-meta">{a.status}</span>
          <p>{a.text}</p>
          <Link href={a.link} className="text-link">Explorar →</Link>
        </div>
      </article>)}</div>
    </section>
  </div>;
}
