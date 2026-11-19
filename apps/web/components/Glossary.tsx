import Link from 'next/link';
import { BookOpen, ExternalLink } from 'lucide-react';
import { glossary, glossaryById, type GlossaryEntry } from '../lib/glossary';

/** Definição expansível (details/summary): funciona com teclado e sem hover. */
export function GlossaryTip({ id, open = false }: { id: string; open?: boolean }) {
  const g = glossaryById[id];
  if (!g) return null;
  return (
    <details className="glossary-tip" open={open}>
      <summary><BookOpen size={16} aria-hidden="true" /><span>O que é <strong>{g.term.toLowerCase().startsWith('rp') ? g.term : g.term.toLowerCase()}</strong>?</span></summary>
      <Definition g={g} />
    </details>
  );
}

function Definition({ g }: { g: GlossaryEntry }) {
  return (
    <div className="glossary-body">
      <p>{g.short}</p>
      {g.long && <p>{g.long}</p>}
      <div className="glossary-foot">
        {g.source && <a href={g.source.url} target="_blank" rel="noopener noreferrer">{g.source.label} <ExternalLink size={12} /></a>}
        <Link href={`/glossario#${g.id}`}>Ver no glossário</Link>
      </div>
    </div>
  );
}

export function GlossaryList() {
  return (
    <dl className="glossary-list">
      {glossary.map(g => (
        <div key={g.id} id={g.id} className="glossary-item">
          <dt>{g.term}</dt>
          <dd>
            <p>{g.short}</p>
            {g.long && <p className="muted">{g.long}</p>}
            {g.source && <a className="text-link" href={g.source.url} target="_blank" rel="noopener noreferrer">{g.source.label} <ExternalLink size={13} /></a>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
