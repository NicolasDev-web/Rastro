import { initials } from '../lib/authors-types';

/** Retrato oficial em P&B, mesmo tratamento para todos (SPEC 02, AC09). Sem foto → iniciais. */
export function AuthorPortrait({ name, photo, credit, size = 'md' }: { name: string; photo: string | null; credit?: string | null; size?: 'md' | 'lg' }) {
  return <figure className={`portrait portrait-${size}`}>
    {photo
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={photo} alt={`Retrato oficial de ${name}`} loading="lazy" />
      : <span className="portrait-initials" aria-hidden="true">{initials(name)}</span>}
    {photo && credit && size === 'lg' && <figcaption>{credit}</figcaption>}
  </figure>;
}
