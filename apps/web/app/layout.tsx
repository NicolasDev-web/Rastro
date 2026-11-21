import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ExternalLink, ArrowUpRight } from 'lucide-react';
import { NavLinks } from '../components/NavLinks';
import { DATA_MODE, getDataset } from '../lib/dataset';
import { formatDate } from '../lib/dataset-types';

const archivo = localFont({ src: '../fonts/c214ffb7f5362987-s.p.woff2', weight: '100 900', variable: '--font-archivo', display: 'swap', declarations: [{ prop: 'font-stretch', value: '62% 125%' }] });
const serif = localFont({ src: [{ path: '../fonts/597b6a5d799c44de-s.p.woff2', weight: '200 900', style: 'normal' }, { path: '../fonts/85ef47686bd56cf6-s.p.woff2', weight: '200 900', style: 'italic' }], variable: '--font-serif', display: 'swap' });
const mono = localFont({ src: [{ path: '../fonts/cdec7fa3927eb560-s.p.woff2', weight: '400' }, { path: '../fonts/af5dd2b5d3f396f3-s.p.woff2', weight: '500' }, { path: '../fonts/fe486b1aba70499c-s.p.woff2', weight: '700' }], variable: '--font-mono', display: 'swap' });

const PUBLICADO = DATA_MODE === 'publicado';
export const metadata: Metadata = PUBLICADO
  ? { title: 'RASTRO | O caminho das emendas parlamentares no Ceará', description: 'Investigação cidadã independente com dados oficiais da CGU: quanto foi indicado, empenhado e pago em emendas federais destinadas ao Ceará, de 2020 a 2026.' }
  : { title: 'RASTRO | Jornalismo de dados — conceito demonstrativo', description: 'Protótipo fictício do RASTRO: explicações e ferramentas para compreender emendas parlamentares destinadas ao Ceará.' };
const nav: [string, string][] = [['/investigacao', 'Investigação'], ['/mapa', 'Mapa'], ['/parlamentares', 'Autores'], ['/estaduais', 'Estaduais'], ['/fluxos', 'Fluxos'], ['/reportagens', 'Reportagens'], ['/dados', 'Dados']];

function Wordmark() {
  return <>RASTRO<span className="wordmark-trail" aria-hidden="true"><i /><i /><i /></span></>;
}

/** Aviso global persistente (Constituição, regra 16; ADR-008). */
function GlobalNotice() {
  if (DATA_MODE === 'demo') {
    return <div className="global-demo"><span className="demo-dot" /> PROTÓTIPO CONCEITUAL — <strong>todos os valores exibidos são fictícios</strong>. Não utilize como informação pública.</div>;
  }
  const res = getDataset();
  if (PUBLICADO) {
    return <div className="global-demo is-publicado"><span className="demo-dot" /> <strong>Investigação cidadã independente.</strong> {res.ok ? `Dados oficiais da CGU extraídos em ${formatDate(res.data.asOf)}.` : res.error} Pode haver erros de extração ou interpretação: <Link href="/correcoes">aponte uma correção</Link>.</div>;
  }
  return <div className="global-demo is-validacao" role="alert"><span className="demo-dot" /> <strong>DADOS OFICIAIS EM VALIDAÇÃO — NÃO PUBLICAR.</strong> {res.ok ? `CGU, extraídos em ${formatDate(res.data.asOf)} (snapshot ${res.data.snapshot}); cobertura e divergências em revisão, sem aprovação editorial para publicação.` : res.error}</div>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR" className={`${archivo.variable} ${serif.variable} ${mono.variable}`}><body>
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <GlobalNotice />
    <header className="site-header"><div className="container nav-inner">
      <Link href="/" className="wordmark" aria-label="RASTRO, página inicial"><Wordmark /></Link>
      <nav aria-label="Menu principal"><NavLinks items={nav} /></nav>
      {!PUBLICADO && <Link className="nav-meta" href="/componentes">Design system <ArrowUpRight size={14} /></Link>}
    </div></header>
    <main id="conteudo" tabIndex={-1}>{children}</main>
    <footer className="site-footer"><div className="container footer-grid">
      <div><div className="wordmark"><Wordmark /></div><p>O dinheiro público tem um caminho. Você tem o direito de conhecê-lo.</p><p className="small">{PUBLICADO ? 'Investigação cidadã independente, sem afiliação partidária ou governamental.' : 'Kit de especificação e protótipo. Sem afiliação partidária ou governamental.'}</p></div>
      <div><div className="eyebrow">Páginas</div><Link href="/investigacao">Investigação</Link><Link href="/mapa">Mapa</Link><Link href="/glossario">Glossário</Link><Link href="/dados">Fontes e metodologia</Link>{!PUBLICADO && <Link href="/componentes">Componentes</Link>}</div>
      <div><div className="eyebrow">Fontes de referência</div><a href="https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares" target="_blank" rel="noreferrer">Portal da Transparência <ExternalLink size={12} /></a><a href="https://api-publica.transferegov.gestao.gov.br/" target="_blank" rel="noreferrer">Transferegov <ExternalLink size={12} /></a><a href="https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html" target="_blank" rel="noreferrer">IBGE <ExternalLink size={12} /></a></div>
      <div><div className="eyebrow">O projeto</div><Link href="/sobre">Sobre</Link><Link href="/correcoes">Correções</Link><Link href="/contato">Contato</Link></div>
    </div><div className="container footer-bottom">© 2026 RASTRO — {PUBLICADO ? 'investigação cidadã independente' : 'conceito demonstrativo'}.</div></footer>
  </body></html>;
}
