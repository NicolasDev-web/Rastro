import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Archivo, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google';
import { ExternalLink, ArrowUpRight } from 'lucide-react';
import { NavLinks } from '../components/NavLinks';
import { DATA_MODE, getDataset } from '../lib/dataset';
import { formatDate } from '../lib/dataset-types';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
const serif = Source_Serif_4({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = { title: 'RASTRO | Jornalismo de dados — conceito demonstrativo', description: 'Protótipo fictício do RASTRO: explicações e ferramentas para compreender emendas parlamentares destinadas ao Ceará.' };
const nav: [string, string][] = [['/investigacao', 'Investigação'], ['/mapa', 'Mapa'], ['/parlamentares', 'Autores'], ['/fluxos', 'Fluxos'], ['/reportagens', 'Reportagens'], ['/dados', 'Dados']];

function Wordmark() {
  return <>RASTRO<span className="wordmark-trail" aria-hidden="true"><i /><i /><i /></span></>;
}

/** Aviso global persistente (Constituição, regra 16; ADR-008). */
function GlobalNotice() {
  if (DATA_MODE === 'demo') {
    return <div className="global-demo"><span className="demo-dot" /> PROTÓTIPO CONCEITUAL — <strong>todos os valores exibidos são fictícios</strong>. Não utilize como informação pública.</div>;
  }
  const res = getDataset();
  return <div className="global-demo is-validacao" role="alert"><span className="demo-dot" /> <strong>DADOS OFICIAIS EM VALIDAÇÃO — NÃO PUBLICAR.</strong> {res.ok ? `CGU, extraídos em ${formatDate(res.data.asOf)} (snapshot ${res.data.snapshot}); sem conferência amostral nem revisão editorial.` : res.error}</div>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR" className={`${archivo.variable} ${serif.variable} ${mono.variable}`}><body>
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <GlobalNotice />
    <header className="site-header"><div className="container nav-inner">
      <Link href="/" className="wordmark" aria-label="RASTRO, página inicial"><Wordmark /></Link>
      <nav aria-label="Menu principal"><NavLinks items={nav} /></nav>
      <Link className="nav-meta" href="/componentes">Design system <ArrowUpRight size={14} /></Link>
    </div></header>
    <main id="conteudo" tabIndex={-1}>{children}</main>
    <footer className="site-footer"><div className="container footer-grid">
      <div><div className="wordmark"><Wordmark /></div><p>O dinheiro público tem um caminho. Você tem o direito de conhecê-lo.</p><p className="small">Kit de especificação e protótipo. Sem afiliação partidária ou governamental.</p></div>
      <div><div className="eyebrow">Páginas</div><Link href="/investigacao">Investigação</Link><Link href="/mapa">Mapa</Link><Link href="/glossario">Glossário</Link><Link href="/dados">Fontes e metodologia</Link><Link href="/componentes">Componentes</Link></div>
      <div><div className="eyebrow">Fontes de referência</div><a href="https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares" target="_blank" rel="noreferrer">Portal da Transparência <ExternalLink size={12} /></a><a href="https://api-publica.transferegov.gestao.gov.br/" target="_blank" rel="noreferrer">Transferegov <ExternalLink size={12} /></a><a href="https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html" target="_blank" rel="noreferrer">IBGE <ExternalLink size={12} /></a></div>
    </div><div className="container footer-bottom">© 2026 RASTRO — conceito demonstrativo. Ilustrações vetoriais originais e esquemáticas: não são registros documentais de lugares, pessoas ou fatos.</div></footer>
  </body></html>;
}
