import type { ReactNode } from 'react';
import { AlertTriangle, CircleDashed, FlaskConical, Loader2, PieChart, SearchX, ShieldCheck } from 'lucide-react';

/** Estados obrigatórios de todo componente de dados (02-JORNADAS-E-UX → Estados). */
export type DataStateKind = 'loading' | 'empty' | 'error' | 'partial_coverage' | 'unverified' | 'verified' | 'demo';

const META: Record<DataStateKind, { label: string; text: string; Icon: typeof Loader2 }> = {
  loading: { label: 'Carregando', text: 'Consultando os registros. Nenhum valor é exibido antes da resposta completa.', Icon: Loader2 },
  empty: { label: 'Sem registros', text: 'Não há registros para este filtro. Isso não significa valor zero: pode indicar ausência na fonte ou cobertura incompleta.', Icon: SearchX },
  error: { label: 'Fonte indisponível', text: 'Não foi possível consultar a fonte. Nenhum valor foi estimado ou preenchido no lugar.', Icon: AlertTriangle },
  partial_coverage: { label: 'Cobertura parcial', text: 'Parte do período ou das modalidades ainda não foi conciliada. Compare com cautela.', Icon: PieChart },
  unverified: { label: 'Não verificado', text: 'Dado ainda não conferido contra o documento original. Não deve ser citado como fato.', Icon: CircleDashed },
  verified: { label: 'Verificado', text: 'Valor conciliado com a fonte oficial e revisado. Fonte, data e método estão registrados.', Icon: ShieldCheck },
  demo: { label: 'Demonstração', text: 'Valores fictícios usados apenas para testar a interface.', Icon: FlaskConical },
};

export function DataState({ kind, title, children, action }: { kind: DataStateKind; title?: string; children?: ReactNode; action?: ReactNode }) {
  const { label, text, Icon } = META[kind];
  return (
    <div className={`data-state data-state-${kind}`} role={kind === 'error' ? 'alert' : 'status'} aria-busy={kind === 'loading' || undefined}>
      <span className="data-state-icon"><Icon size={20} aria-hidden="true" className={kind === 'loading' ? 'spin' : undefined} /></span>
      <div>
        <strong>{title ?? label}</strong>
        <p>{children ?? text}</p>
        {action}
      </div>
    </div>
  );
}

/** Selo de cobertura. Cobertura descreve o dado — nunca a conduta de alguém. */
export type Coverage = 'complete' | 'partial' | 'unverified' | 'demo';
const COVERAGE: Record<Coverage, string> = { complete: 'Completa no recorte', partial: 'Parcial', unverified: 'Não verificada', demo: 'Demonstração' };

export function CoverageFlag({ value }: { value: Coverage }) {
  return <span className={`coverage-flag coverage-${value}`}><i aria-hidden="true" />Cobertura: {COVERAGE[value]}</span>;
}
