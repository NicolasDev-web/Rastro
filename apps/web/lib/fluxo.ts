// Fluxo documental de uma emenda (SPEC 04 → T04.05). Função pura: só lê a ficha e o registro de investigação.
// Cada aresta tem evidence_id, source_url, method e status. Nenhuma ligação por nome ou valor (AC05).
import type { Emenda } from './fichas-types';
import { CONCILIACAO_LABEL } from './fichas-types';
import { brl, brlOrMissing } from './dataset-types';
import { portalUrl } from './authors-types';

export type EdgeStatus = 'documentado' | 'em_verificacao' | 'nao_identificado';
export type FlowNode = { id: string; title: string; sub: string; desc: string; href?: string; hrefLabel?: string };
export type FlowEdge = { status: EdgeStatus; evidence_id: string | null; source_url: string | null; method: string; note?: string };
/** edges[i] liga nodes[i] a nodes[i + 1]; branch sai do nó `branch.from`. */
export type Flow = { code: string | null; illustrative: boolean; nodes: FlowNode[]; edges: FlowEdge[]; branch?: { from: string; node: FlowNode; edge: FlowEdge } };
export type CasoResumo = { status: 'explicado' | 'sem_causa' | 'excluido'; causa: string | null; achado: string };

const plural = (n: number, um: string, varios: string) => `${n.toLocaleString('pt-BR')} ${n === 1 ? um : varios}`;

export function buildFluxo(e: Emenda, opts: { demo: boolean; caso?: CasoResumo }): Flow {
  const source = opts.demo ? null : portalUrl(e.code);
  const pagamentos = e.documentos.filter(d => d.fase.startsWith('Pagam')).sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''));
  const primeiro = pagamentos[0]?.documento ?? null;
  const evidPag = primeiro ? (pagamentos.length > 1 ? `${primeiro} (+${pagamentos.length - 1})` : primeiro) : null;
  const explicado = opts.caso?.status === 'explicado';
  const notaCaso = opts.caso ? (opts.caso.causa ?? opts.caso.achado) : undefined;

  const autor: FlowNode = {
    id: 'autor', title: 'Autor formal', sub: e.autor_nome ?? 'Não identificado',
    desc: e.coletiva ? 'Autoria coletiva (bancada, comissão ou relator): não é atribuída a uma pessoa.' : 'Autor registrado no SIAFI para esta emenda. Indicar não é pagar; pagar não é entregar.',
    ...(e.autor_ficha ? { href: `/parlamentares/${e.autor_ficha}`, hrefLabel: 'Ficha do autor' } : {}),
  };
  const emenda: FlowNode = {
    id: 'emenda', title: 'Emenda', sub: e.code,
    desc: `${e.ano} · ${e.tipo}. Localidade registrada: ${e.localidades.map(l => l.localidade).join('; ') || 'não informada'}. Empenhado: ${brlOrMissing(e.empenhado)}.`,
    href: `/emendas/${e.code}`, hrefLabel: 'Ficha completa da emenda',
  };
  const pag: FlowNode = {
    id: 'pagamentos', title: 'Pagamentos',
    sub: pagamentos.length ? `${plural(pagamentos.length, 'documento', 'documentos')} · ${brlOrMissing(e.conciliacao.documentos_pago)}` : 'Nenhum documento',
    desc: `${CONCILIACAO_LABEL[e.conciliacao.status]}. Pago total segundo a fonte: ${brlOrMissing(e.pago_total)}. Documento de pagamento comprova que o dinheiro saiu do caixa federal.`,
  };
  const top = e.quem_recebeu.slice(0, 3);
  const recebeu: FlowNode = {
    id: 'recebeu', title: 'Quem recebeu',
    sub: top.length ? `${top[0].favorecido}${e.quem_recebeu.length > 1 ? ` + ${e.quem_recebeu.length - 1}` : ''}` : 'Sem registro',
    desc: top.length
      ? `${top.map(r => `${r.favorecido}${r.municipio ? ` (${r.municipio}${r.uf ? `-${r.uf}` : ''})` : ''}: ${r.valor === null ? 'sem valor' : brl(r.valor)}`).join('; ')}${e.quem_recebeu.length > 3 ? `; e mais ${e.quem_recebeu.length - 3}` : ''}. Município de aplicação não prova o local da entrega.`
      : 'Sem documento de pagamento, não há favorecido a mostrar.',
  };
  const execucao: FlowNode = {
    id: 'execucao', title: 'Contrato ou obra', sub: 'Fora dos dados',
    desc: 'Os arquivos usados não trazem os contratos nem os fornecedores contratados por quem recebeu o dinheiro. Por isso o RASTRO não afirma se a obra ou o serviço foi entregue.',
  };

  const eAutor: FlowEdge = e.autor_codigo
    ? { status: 'documentado', evidence_id: `SIAFI ${e.autor_codigo}`, source_url: source, method: 'Código do autor no arquivo de emendas da CGU.' }
    : { status: 'nao_identificado', evidence_id: null, source_url: source, method: 'A fonte não informa o autor da emenda.' };

  let ePag: FlowEdge;
  if (!pagamentos.length) {
    ePag = { status: 'nao_identificado', evidence_id: null, source_url: source,
      method: (e.pago_total ?? 0) > 0 ? 'A fonte informa pagamento, mas nenhum documento de pagamento da CGU (2020–2026) traz o código desta emenda.' : 'Nenhum pagamento registrado até a extração.',
      note: notaCaso };
  } else if (e.conciliacao.status === 'confere') {
    ePag = { status: 'documentado', evidence_id: evidPag, source_url: source, method: 'Código da emenda nos documentos de pagamento da CGU; a soma é igual ao pago total da fonte.' };
  } else if (e.conciliacao.status === 'diverge' && explicado) {
    ePag = { status: 'documentado', evidence_id: evidPag, source_url: source, method: 'Código da emenda nos documentos de pagamento. A soma difere do pago total, e a diferença tem causa documentada.', note: notaCaso };
  } else {
    ePag = { status: 'em_verificacao', evidence_id: evidPag, source_url: source,
      method: e.conciliacao.status === 'diverge' ? 'Código da emenda nos documentos de pagamento, mas a soma difere do pago total. A diferença ainda não tem causa documentada.' : 'Faltam valores na fonte para conferir a soma dos documentos.',
      note: notaCaso };
  }
  const eRecebeu: FlowEdge = pagamentos.length && e.quem_recebeu.length
    ? { status: 'documentado', evidence_id: evidPag, source_url: source, method: 'Favorecido registrado no próprio documento de pagamento.' }
    : { status: 'nao_identificado', evidence_id: null, source_url: null, method: 'Sem documento de pagamento, não há favorecido ligado à emenda.' };
  const eExec: FlowEdge = { status: 'nao_identificado', evidence_id: null, source_url: null, method: 'Contratos e fornecedores não estão nos arquivos usados. Fonte prevista: Transferegov, no próximo incremento.' };

  const flow: Flow = { code: e.code, illustrative: false, nodes: [autor, emenda, pag, recebeu, execucao], edges: [eAutor, ePag, eRecebeu, eExec] };
  if (e.convenios.length) {
    const c = e.convenios[0];
    flow.branch = {
      from: 'emenda',
      node: { id: 'convenio', title: 'Convênio', sub: `nº ${c.numero ?? 'sem número'}${e.convenios.length > 1 ? ` + ${e.convenios.length - 1}` : ''}`,
        desc: `${c.objeto ?? 'Objeto não informado'}. Convenente: ${c.convenente ?? 'não informado'}. Valor: ${brlOrMissing(c.valor)}.` },
      edge: { status: 'documentado', evidence_id: c.numero ? `Convênio ${c.numero}` : null, source_url: source,
        method: 'Código da emenda no arquivo de convênios da CGU. Convênio e pagamento não têm identificador comum, por isso o convênio não é ligado a um pagamento nem a um favorecido.' },
    };
  }
  return flow;
}

/** Status da ligação emenda → pagamentos, que distingue os exemplos de /fluxos. */
export const statusPagamento = (f: Flow) => f.edges[1].status;

/** Exemplo genérico, sem dados reais, para as páginas explicativas. */
export const FLUXO_ILUSTRATIVO: Flow = {
  code: null, illustrative: true,
  nodes: [
    { id: 'origem', title: 'Indicação formal', sub: 'Autor A', desc: 'O responsável pela apresentação/documento de indicação tem de ser verificado na fonte oficial.' },
    { id: 'orgao', title: 'Órgão de execução', sub: 'Órgão B', desc: 'A origem orçamentária e a unidade gestora dependem da fonte original.' },
    { id: 'beneficiario', title: 'Beneficiário', sub: 'Município C', desc: 'Beneficiário identificado não significa que toda a execução física ocorra no mesmo município.' },
    { id: 'documento', title: 'Documento de despesa', sub: 'Documento D', desc: 'É a evidência que pode ligar execução e beneficiário; não é automaticamente contrato ou obra entregue.' },
  ],
  edges: [
    { status: 'documentado', evidence_id: 'EX-001', source_url: null, method: 'Código da emenda presente nos dois registros' },
    { status: 'em_verificacao', evidence_id: 'EX-002', source_url: null, method: 'Correspondência candidata aguardando revisão humana' },
    { status: 'nao_identificado', evidence_id: null, source_url: null, method: 'Nenhum documento liga os dois pontos; a lacuna fica visível' },
  ],
};
