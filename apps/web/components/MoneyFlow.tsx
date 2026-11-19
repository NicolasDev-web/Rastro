'use client';
import { useState } from 'react';
import { InfoNote } from './Ui';
import { FileCheck, HelpCircle, CircleDashed, Link2 } from 'lucide-react';

type EdgeStatus = 'documentado' | 'em_verificacao' | 'nao_identificado';
const nodes = [
  { id: 'origem', title: 'Indicação formal', sub: 'Autor fictício A', desc: 'O responsável pela apresentação/documento de indicação tem de ser verificado na fonte oficial.' },
  { id: 'orgao', title: 'Órgão de execução', sub: 'Órgão fictício B', desc: 'A origem orçamentária e a unidade gestora dependem da fonte original.' },
  { id: 'beneficiario', title: 'Beneficiário', sub: 'Município fictício C', desc: 'Beneficiário identificado não significa que toda a execução física ocorra no mesmo município.' },
  { id: 'documento', title: 'Documento de despesa', sub: 'Documento fictício D', desc: 'É a evidência que pode ligar execução e beneficiário; não é automaticamente contrato ou obra entregue.' },
];
/** Cada aresta tem evidence_id, method e status (SPEC 04 → Regras). Todos fictícios. */
const edges: { status: EdgeStatus; evidence: string; method: string }[] = [
  { status: 'documentado', evidence: 'DEMO-EV-001', method: 'Código da emenda presente nos dois registros' },
  { status: 'em_verificacao', evidence: 'DEMO-EV-002', method: 'Correspondência candidata aguardando revisão humana' },
  { status: 'nao_identificado', evidence: '—', method: 'Nenhum documento liga os dois pontos; a lacuna fica visível' },
];
const STATUS: Record<EdgeStatus, { label: string; Icon: typeof FileCheck }> = {
  documentado: { label: 'Documentado', Icon: FileCheck },
  em_verificacao: { label: 'Em verificação', Icon: CircleDashed },
  nao_identificado: { label: 'Não identificado', Icon: HelpCircle },
};

export function MoneyFlow() {
  const [active, setActive] = useState('beneficiario');
  const idx = nodes.findIndex(n => n.id === active);
  const node = nodes[idx];
  const inEdge = idx > 0 ? edges[idx - 1] : null;
  return <div className="flow-demo"><span className="eyebrow">Fluxo de recursos · exemplo fictício</span>
    <div className="flow-track">{nodes.map((n, i) => <div key={n.id} className="flow-step">
      <button type="button" className={n.id === active ? 'flow-node active' : 'flow-node'} onClick={() => setActive(n.id)} aria-pressed={n.id === active}><span className="flow-counter">{String(i + 1).padStart(2, '0')}</span><strong>{n.title}</strong><small>{n.sub}</small></button>
      {i < nodes.length - 1 && <EdgeChip status={edges[i].status} />}
    </div>)}</div>
    <div className="flow-legend" aria-label="Legenda das ligações">{(Object.keys(STATUS) as EdgeStatus[]).map(s => <span key={s} className={`edge-chip edge-${s}`}><EdgeLine status={s} />{STATUS[s].label}</span>)}</div>
    <div className="flow-detail"><div className="icon-box"><HelpCircle size={18} aria-hidden="true" /></div><div>
      <h4>{node.title}</h4><p>{node.desc}</p>
      {inEdge && <dl className="edge-meta">
        <div><dt>Ligação com a etapa anterior</dt><dd>{STATUS[inEdge.status].label}</dd></div>
        <div><dt>evidence_id</dt><dd>{inEdge.evidence}</dd></div>
        <div><dt>Método</dt><dd>{inEdge.method}</dd></div>
      </dl>}
      <span className="small muted"><Link2 size={15} aria-hidden="true" /> Nenhum vínculo documental real carregado — não é um dado jornalístico.</span>
    </div></div>
    <InfoNote>Numa publicação real, cada conexão só aparece como documentada após conferência de identificador ou registro. Ausência de vínculo não prova irregularidade.</InfoNote>
  </div>;
}

function EdgeLine({ status }: { status: EdgeStatus }) {
  return <svg width="34" height="10" aria-hidden="true" className="edge-line"><line x1="2" y1="5" x2="32" y2="5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray={status === 'documentado' ? undefined : status === 'em_verificacao' ? '7 5' : '1 6'} /></svg>;
}
function EdgeChip({ status }: { status: EdgeStatus }) {
  const { label, Icon } = STATUS[status];
  return <span className={`flow-edge edge-${status}`} title={label}><EdgeLine status={status} /><Icon size={15} aria-hidden="true" /><span className="sr-only">Ligação: {label}</span></span>;
}
