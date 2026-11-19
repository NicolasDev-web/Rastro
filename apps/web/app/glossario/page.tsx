import type { Metadata } from 'next';
import { PageHero } from '../../components/Ui';
import { DocumentosArt } from '../../components/Illustrations';
import { GlossaryList } from '../../components/Glossary';
import { DataState } from '../../components/States';

export const metadata: Metadata = { title: 'Glossário | RASTRO' };

export default function Glossario() {
  return <div className="container page-space">
    <PageHero eyebrow="Glossário" title="As palavras do orçamento, sem juridiquês." description="Definições curtas para ler os números do RASTRO sem confundir etapas, destinos e modalidades." art={<DocumentosArt id="glossario-art" />} caption="Mesa de apuração. Cena ilustrativa." />
    <DataState kind="unverified" title="Rascunho editorial">Estas definições ainda passam por validação com as fontes oficiais e revisão independente (SPEC 03, T03.01–T03.02). Cada termo aponta para a norma de referência.</DataState>
    <div className="block-gap"><GlossaryList /></div>
  </div>;
}
