import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHero, InfoNote } from '../../components/Ui';
import { DocumentosArt } from '../../components/Illustrations';
import { GlossaryList } from '../../components/Glossary';
import { GLOSSARIO_CONSULTA } from '../../lib/glossary';
import { formatDate } from '../../lib/dataset-types';

export const metadata: Metadata = { title: 'Glossário | RASTRO' };

export default function Glossario() {
  return <div className="container page-space">
    <PageHero eyebrow="Glossário" title="As palavras do orçamento, sem juridiquês." description="Definições curtas para ler os números do RASTRO sem confundir etapas, destinos e modalidades." art={<DocumentosArt id="glossario-art" />} />
    <InfoNote>Cada definição foi conferida com o texto oficial da norma citada, no site do Planalto, em {formatDate(GLOSSARIO_CONSULTA)}. As leis mudam: se encontrar diferença, <Link href="/correcoes">aponte uma correção</Link>.</InfoNote>
    <div className="block-gap"><GlossaryList /></div>
  </div>;
}
