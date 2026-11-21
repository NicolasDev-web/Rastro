import { EvidenceCard, PageHero } from '../../components/Ui';
import { FluxoArt } from '../../components/Illustrations';
import { DataState } from '../../components/States';
import { FlowExplorer, type FlowExample } from '../../components/FlowExplorer';
import { DATA_MODE, getEmendas } from '../../lib/dataset';
import { getInvestigacao } from '../../lib/investigacao';
import { buildFluxo, statusPagamento, type EdgeStatus } from '../../lib/fluxo';
import type { Emenda } from '../../lib/fichas-types';

const EXEMPLOS: { status: EdgeStatus; label: string; hint: string }[] = [
  { status: 'documentado', label: 'Ligação documentada', hint: 'Os documentos de pagamento trazem o código da emenda e somam exatamente o total informado pela fonte.' },
  { status: 'em_verificacao', label: 'Em verificação', hint: 'Os documentos trazem o código da emenda, mas a soma não fecha com o total da fonte e a diferença ainda não tem causa documentada.' },
  { status: 'nao_identificado', label: 'Não identificado', hint: 'A fonte informa pagamento, mas nenhum documento de pagamento traz o código desta emenda. A lacuna fica visível.' },
];

export default function Fluxos() {
  const res = getEmendas();
  const demo = DATA_MODE === 'demo';
  const casos = demo ? {} : getInvestigacao();
  let examples: FlowExample[] = [];
  let codes: string[] = [];
  if (res.ok) {
    // Ordem estável: emendas mais recentes primeiro; prefere exemplos curtos (até 3 favorecidos) e, no documentado, com convênio.
    const emendas = Object.values(res.data).sort((a, b) => b.ano - a.ano || a.code.localeCompare(b.code));
    codes = emendas.map(e => e.code);
    const flows = emendas.map(e => ({ e, flow: buildFluxo(e, { demo, caso: casos[e.code] }) }));
    const score = (e: Emenda, s: EdgeStatus) => (e.quem_recebeu.length <= 3 ? 0 : 2) + (s === 'documentado' && !e.convenios.length ? 1 : 0) + (s === 'documentado' && e.conciliacao.status !== 'confere' ? 3 : 0) + (s === 'nao_identificado' && !((e.pago_total ?? 0) > 0) ? 4 : 0);
    examples = EXEMPLOS.flatMap(x => {
      const pick = flows.filter(f => statusPagamento(f.flow) === x.status).sort((a, b) => score(a.e, x.status) - score(b.e, x.status))[0];
      return pick ? [{ label: x.label, hint: x.hint, flow: pick.flow }] : [];
    });
  }

  return <div className="container page-space">
    <PageHero eyebrow="Siga o dinheiro" title="Cada ligação precisa de prova." description="Veja o caminho de uma emenda real: do autor ao pagamento e a quem recebeu. Cada traço mostra se a ligação está provada por documento, se ainda está em verificação ou se não existe nos dados." art={<FluxoArt />} />
    {!res.ok ? <DataState kind="error" title="Fluxos indisponíveis">{res.error}</DataState>
      : examples.length ? <FlowExplorer examples={examples} codes={codes} />
      : <DataState kind="empty" title="Nenhuma emenda para mostrar">O pacote de dados ativo não tem fichas de emenda.</DataState>}
    {demo && <p className="small muted block-gap">Modo demonstração: a emenda e os valores são fictícios.</p>}
    <div className="block-gap evidence-grid">
      <EvidenceCard title="Aresta documental" body="Conexão baseada em código público ou documento que sustenta os dois pontos, como o código da emenda impresso no documento de pagamento." />
      <EvidenceCard title="Em verificação" body="Os documentos existem, mas algo não fecha, como a soma dos pagamentos. Fica em investigação e não aparece como fato confirmado." />
      <EvidenceCard title="Não identificado" body="Quando nenhum documento permite a ligação, a plataforma preserva a lacuna em vez de criar um vínculo por nome ou valor parecido." />
    </div>
  </div>;
}
