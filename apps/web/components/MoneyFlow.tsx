'use client';
import { useState } from 'react';
import Link from 'next/link';
import { InfoNote } from './Ui';
import { FileCheck, HelpCircle, CircleDashed, Link2, ExternalLink, ArrowRight } from 'lucide-react';
import { FLUXO_ILUSTRATIVO, type EdgeStatus, type Flow, type FlowEdge, type FlowNode } from '../lib/fluxo';

const STATUS: Record<EdgeStatus, { label: string; Icon: typeof FileCheck }> = {
  documentado: { label: 'Documentado', Icon: FileCheck },
  em_verificacao: { label: 'Em verificação', Icon: CircleDashed },
  nao_identificado: { label: 'Não identificado', Icon: HelpCircle },
};

/** Desenha um fluxo pronto (lib/fluxo.ts). Sem propriedade, mostra o exemplo genérico. */
export function MoneyFlow({ flow = FLUXO_ILUSTRATIVO }: { flow?: Flow }) {
  const [active, setActive] = useState(flow.illustrative ? flow.nodes[2]?.id : 'pagamentos');
  const idx = flow.nodes.findIndex(n => n.id === active);
  const isBranch = flow.branch?.node.id === active;
  const node: FlowNode = isBranch ? flow.branch!.node : flow.nodes[Math.max(idx, 0)];
  const inEdge: FlowEdge | null = isBranch ? flow.branch!.edge : idx > 0 ? flow.edges[idx - 1] : null;
  const DetailIcon = inEdge ? STATUS[inEdge.status].Icon : Link2;
  const branchFrom = flow.branch ? flow.nodes.find(n => n.id === flow.branch!.from) : undefined;

  const nodeButton = (n: FlowNode, i: number | null) => <button type="button" className={n.id === node.id ? 'flow-node active' : 'flow-node'} onClick={() => setActive(n.id)} aria-pressed={n.id === node.id}>
    <span className="flow-counter">{i === null ? 'RAMO' : String(i + 1).padStart(2, '0')}</span><strong>{n.title}</strong><small>{n.sub}</small>
  </button>;

  return <div className="flow-demo">
    <span className="eyebrow">{flow.illustrative ? 'Fluxo de recursos · exemplo ilustrativo' : `Fluxo da emenda ${flow.code}`}</span>
    <div className="flow-track">{flow.nodes.map((n, i) => <div key={n.id} className="flow-step">
      {nodeButton(n, i)}
      {i < flow.nodes.length - 1 && <EdgeChip status={flow.edges[i].status} />}
    </div>)}</div>
    {flow.branch && branchFrom && <div className="flow-branch">
      <span className="tiny-code">Também ligado a {branchFrom.title.toLowerCase()}</span>
      <EdgeChip status={flow.branch.edge.status} />
      {nodeButton(flow.branch.node, null)}
    </div>}
    <div className="flow-legend" aria-label="Legenda das ligações">{(Object.keys(STATUS) as EdgeStatus[]).map(s => <span key={s} className={`edge-chip edge-${s}`}><EdgeLine status={s} />{STATUS[s].label}</span>)}</div>
    <div className="flow-detail" aria-live="polite"><div className="icon-box"><DetailIcon size={18} aria-hidden="true" /></div><div>
      <h4>{node.title}{!flow.illustrative && <span className="muted"> · {node.sub}</span>}</h4><p>{node.desc}</p>
      {inEdge && <dl className="edge-meta">
        <div><dt>{isBranch ? 'Ligação com a emenda' : 'Ligação com a etapa anterior'}</dt><dd>{STATUS[inEdge.status].label}</dd></div>
        <div><dt>evidence_id</dt><dd className="wrap-anywhere">{inEdge.evidence_id ?? '—'}</dd></div>
        <div><dt>Método</dt><dd>{inEdge.method}</dd></div>
      </dl>}
      {inEdge?.note && <p className="small"><strong>O que a investigação encontrou:</strong> {resumo(inEdge.note)}{inEdge.note.length > 260 && <> <Link href={`/emendas/${flow.code}#investigacao`}>Detalhes na ficha</Link>.</>}</p>}
      <div className="flow-links">
        {node.href && <Link className="text-link" href={node.href}>{node.hrefLabel ?? 'Abrir ficha'} <ArrowRight size={14} aria-hidden="true" /></Link>}
        {inEdge?.source_url && <a className="text-link" href={inEdge.source_url} target="_blank" rel="noopener noreferrer">Fonte oficial no Portal <ExternalLink size={13} aria-hidden="true" /></a>}
      </div>
      <span className="small muted"><Link2 size={15} aria-hidden="true" /> {flow.illustrative ? 'Diagrama explicativo, com nomes genéricos. Os registros reais de cada emenda estão nas fichas.' : 'Montado com os arquivos da CGU. Clique em cada etapa para ver a prova da ligação.'}</span>
    </div></div>
    <InfoNote>No RASTRO, uma conexão só aparece como documentada após conferência de identificador ou registro. Ausência de vínculo não prova irregularidade.</InfoNote>
  </div>;
}

/** Primeira(s) frase(s) até ~260 caracteres; o texto completo fica na seção da ficha. */
function resumo(texto: string) {
  if (texto.length <= 260) return texto;
  const corte = texto.slice(0, 260);
  const fim = corte.lastIndexOf('. ');
  return fim > 80 ? corte.slice(0, fim + 1) : `${corte.trimEnd()}…`;
}

function EdgeLine({ status }: { status: EdgeStatus }) {
  return <svg width="34" height="10" aria-hidden="true" className="edge-line"><line x1="2" y1="5" x2="32" y2="5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray={status === 'documentado' ? undefined : status === 'em_verificacao' ? '7 5' : '1 6'} /></svg>;
}
function EdgeChip({ status }: { status: EdgeStatus }) {
  const { label, Icon } = STATUS[status];
  return <span className={`flow-edge edge-${status}`} title={label}><EdgeLine status={status} /><Icon size={15} aria-hidden="true" /><span className="sr-only">Ligação: {label}</span></span>;
}
