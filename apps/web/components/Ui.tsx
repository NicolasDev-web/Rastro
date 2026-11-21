import Link from 'next/link';
import { ArrowRight, ExternalLink, FileCheck2, Info } from 'lucide-react';
import type { ReactNode } from 'react';

export function DemoLabel(){return <span className="demo-label">Exemplo fictício</span>}
export function SectionHeader({eyebrow,title,description,level=2}: {eyebrow:string;title:string;description?:string;level?:1|2}){
  const Heading = level === 1 ? 'h1' : 'h2';
  return <div className="section-heading"><span className="eyebrow">{eyebrow}</span><Heading>{title}</Heading>{description&&<p className="lead">{description}</p>}</div>;
}
/** Abertura de página interna: texto à esquerda, ilustração à direita. */
export function PageHero({eyebrow,title,description,art,children}:{eyebrow:string;title:string;description?:string;art:ReactNode;children?:ReactNode}){
  return <div className="page-hero"><div className="page-hero-copy"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description&&<p className="lead">{description}</p>}{children}</div><figure className="art page-hero-art"><div className="art-frame">{art}</div></figure></div>;
}
export function PrimaryLink({href,children}:{href:string;children:ReactNode}){
  return <Link className="button button-primary" href={href}>{children}<ArrowRight aria-hidden="true" size={17}/></Link>;
}
/** Faixa de chamada de largura total. */
export function CtaBar({href,children}:{href:string;children:ReactNode}){
  return <Link className="cta-bar" href={href}><span>{children}</span><ArrowRight aria-hidden="true" size={28} strokeWidth={2.5}/></Link>;
}
export function EvidenceCard({title,body,source}: {title:string;body:string;source?:string}){
  return <article className="evidence-card"><div className="icon-box"><FileCheck2 size={18}/></div><div><div className="eyebrow">Trilha de evidência</div><h3>{title}</h3><p>{body}</p>{source?<a className="text-link" target="_blank" rel="noopener noreferrer" href={source}>Abrir fonte oficial <ExternalLink size={13}/></a>:null}</div></article>;
}
export function InfoNote({children}: {children:ReactNode}){
  return <div className="info-note"><Info size={19} aria-hidden="true"/><p>{children}</p></div>;
}
