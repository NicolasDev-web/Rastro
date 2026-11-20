import Link from 'next/link';
import { SectionHeader } from '../../components/Ui';
import { Art } from '../../components/Illustrations';
import { stories } from '../../lib/editorial';

export default function Reportagens() {
  return <div className="container page-space">
    <SectionHeader eyebrow="Reportagens e pautas" title="Histórias para investigar. Não conclusões antecipadas." description="A primeira peça é um explicador. As demais são próximas frentes da investigação, ainda em andamento." />
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
  </div>;
}
