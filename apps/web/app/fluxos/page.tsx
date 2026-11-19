import { MoneyFlow } from '../../components/MoneyFlow';
import { EvidenceCard, PageHero } from '../../components/Ui';
import { FluxoArt } from '../../components/Illustrations';

export default function Fluxos() {
  return <div className="container page-space">
    <PageHero eyebrow="Siga o dinheiro" title="Cada ligação precisa de prova." description="Visualize como um rastreamento conecta registros, instrumentos e documentos — sem presumir que uma transferência seja um contrato concluído." art={<FluxoArt />} caption="Fichas ligadas por fios: documentado, em verificação e não identificado." />
    <MoneyFlow />
    <div className="block-gap evidence-grid">
      <EvidenceCard title="Aresta documental" body="Conexão baseada em ID público ou documento que sustenta os dois nós." />
      <EvidenceCard title="Em verificação" body="Correspondência candidata é revisada por humano; não aparece como fato confirmado." />
      <EvidenceCard title="Não identificado" body="Quando o documento não permite estabelecer ligação, a plataforma preserva a lacuna em vez de criar um vínculo." />
    </div>
  </div>;
}
