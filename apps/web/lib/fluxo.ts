// Fluxo documental de uma emenda (SPEC 04 → T04.05). Função pura: só lê a ficha e o registro de investigação.
// Cada aresta tem evidence_id, source_url, method e status. Nenhuma ligação por nome ou valor (AC05).
import type { Emenda, TgConvenio, TgPlano } from './fichas-types';
import { CONCILIACAO_LABEL, execucaoDeclarada } from './fichas-types';
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
  const { node: execucao, edge: eExec } = execucaoTransferegov(e, opts.demo);

  const flow: Flow = { code: e.code, illustrative: false, nodes: [autor, emenda, pag, recebeu, execucao], edges: [eAutor, ePag, eRecebeu, eExec] };
  const planos = e.transferegov?.planos_acao ?? [];
  if (planos.length) {
    const p = planos[0];
    flow.branch = {
      from: 'emenda',
      node: { id: 'convenio', title: 'Plano de ação', sub: `${p.codigo}${planos.length > 1 ? ` + ${planos.length - 1}` : ''}`,
        desc: `Transferência especial no Transferegov. ${planos.slice(0, 3).map(descPlano).join(' ')}${planos.length > 3 ? ` E mais ${planos.length - 3} planos de ação.` : ''} O plano de ação registra o repasse; não prova execução.`,
        href: `/emendas/${e.code}#transferegov`, hrefLabel: 'Detalhes do Transferegov na ficha' },
      edge: { status: 'documentado', evidence_id: `Plano de ação ${p.codigo}${planos.length > 1 ? ` (+${planos.length - 1})` : ''}`, source_url: p.source_url,
        method: 'Número da emenda no plano de ação do Transferegov (transferência especial), igual ao código da emenda na CGU.' },
    };
  } else if (e.convenios.length) {
    const c = e.convenios[0];
    const tg = (e.transferegov?.convenios ?? []).find(x => x.numero === c.numero);
    flow.branch = {
      from: 'emenda',
      node: { id: 'convenio', title: 'Convênio', sub: `nº ${c.numero ?? 'sem número'}${e.convenios.length > 1 ? ` + ${e.convenios.length - 1}` : ''}`,
        desc: `${c.objeto ?? 'Objeto não informado'}. Convenente: ${c.convenente ?? 'não informado'}. Valor no arquivo da CGU: ${brlOrMissing(c.valor)}.${tg ? ` ${descConvenio(tg)}` : ''}`,
        ...(tg ? { href: `/emendas/${e.code}#transferegov`, hrefLabel: 'Detalhes do Transferegov na ficha' } : {}) },
      edge: { status: 'documentado', evidence_id: c.numero ? `Convênio ${c.numero}${tg?.nr_proposta ? ` · proposta ${tg.nr_proposta}` : ''}` : null, source_url: source,
        method: `Código da emenda no arquivo de convênios da CGU.${tg ? ' Proposta e metas do Transferegov pelo número do convênio (meta do cronograma físico → proposta).' : ''} Convênio e pagamento não têm identificador comum, por isso o convênio não é ligado a um pagamento nem a um favorecido.` },
    };
  }
  return flow;
}

const valoresPlano = (custeio: number | null, investimento: number | null) => `custeio ${brlOrMissing(custeio)} e investimento ${brlOrMissing(investimento)}`;

function descPlano(p: TgPlano): string {
  const objeto = p.objeto ?? p.executores.find(x => x.objeto)?.objeto ?? 'objeto não informado';
  return `${p.codigo}: ${p.beneficiario ?? 'beneficiário não informado'}${p.uf ? `-${p.uf}` : ''}, ${objeto}. Situação: ${p.situacao ?? 'não informada'}${p.plano_trabalho?.situacao ? `; plano de trabalho: ${p.plano_trabalho.situacao}` : ''}. Valores do plano: ${valoresPlano(p.valor_custeio, p.valor_investimento)}.`;
}

function descConvenio(c: TgConvenio): string {
  return `No Transferegov: ${c.modalidade?.toLowerCase() ?? 'instrumento'} da proposta ${c.nr_proposta ?? c.id_proposta}, situação "${c.situacao ?? 'não informada'}", valor global ${brlOrMissing(c.valor_global)} (repasse ${brlOrMissing(c.valor_repasse)}, contrapartida ${brlOrMissing(c.valor_contrapartida)}), ${plural(c.metas.length, 'meta planejada', 'metas planejadas')}.`;
}

type MetaTexto = { nome?: string | null; descricao: string | null; unidade: string | null; quantidade: string | null };
const metasTexto = (metas: MetaTexto[]) =>
  metas.slice(0, 3).map(m => `${m.nome ?? m.descricao ?? 'meta'}${m.quantidade ? ` (${m.quantidade}${m.unidade ? ` ${m.unidade}` : ''})` : ''}`).join('; ') + (metas.length > 3 ? `; e mais ${metas.length - 3}` : '');

/** Etapa "contrato ou obra": só o que o Transferegov ligar por identificador; o resto fica como lacuna com o motivo. */
function execucaoTransferegov(e: Emenda, demo: boolean): { node: FlowNode; edge: FlowEdge } {
  const base = { id: 'execucao', title: 'Contrato ou obra' };
  const tg = e.transferegov;
  const planos = tg?.planos_acao ?? [];
  const comExecucao = planos.filter(execucaoDeclarada);
  if (comExecucao.length) {
    const p = comExecucao[0];
    const forn = comExecucao.flatMap(x => x.fornecedores);
    const publicos = forn.filter(f => !f.mascarado);
    const ocultos = forn.filter(f => f.mascarado).reduce((n, f) => n + f.documentos, 0);
    const metas = p.executores.flatMap(x => x.metas);
    const docs = comExecucao.reduce((n, x) => n + x.documentos_liquidacao, 0);
    return {
      node: { ...base, sub: docs ? `${plural(docs, 'pagamento declarado', 'pagamentos declarados')} pelo ente` : 'Execução declarada pelo ente',
        desc: [
          p.relatorio ? `Último relatório de gestão do plano ${p.codigo} (${p.relatorio.tipo ?? 'tipo não informado'}, ${p.relatorio.data ? p.relatorio.data.split('-').reverse().join('/') : 'sem data'}): valor executado declarado ${brlOrMissing(p.relatorio.valor_executado)}.` : '',
          publicos.length ? `Recebedores: ${publicos.slice(0, 3).map(f => `${f.recebedor}: ${f.valor === null ? 'valor incompleto' : brl(f.valor)}`).join('; ')}${publicos.length > 3 ? `; e mais ${publicos.length - 3}` : ''}.` : '',
          ocultos ? `${plural(ocultos, 'pagamento', 'pagamentos')} a pessoa física, MEI ou recebedor sem natureza jurídica confirmada, com nome omitido.` : '',
          metas.length ? `Metas planejadas: ${metasTexto(metas)}.` : '',
          'É o que o ente declarou no Transferegov: não é vistoria e não prova que a obra ou o serviço foi entregue.',
        ].filter(Boolean).join(' '),
        href: `/emendas/${e.code}#transferegov`, hrefLabel: 'Recebedores e metas na ficha' },
      edge: { status: 'documentado', evidence_id: `Plano de ação ${p.codigo}${p.relatorio ? ` · relatório de gestão ${p.relatorio.id}` : ''}`, source_url: p.relatorio?.source_url ?? p.source_url,
        method: 'Número da emenda no plano de ação do Transferegov; execução e pagamentos a fornecedores declarados pelo ente no relatório de gestão, ligados ao plano pelos ids da própria fonte. Nenhum fornecedor é ligado por nome ou valor.' },
    };
  }
  if (planos.length) {
    const p = planos[0];
    const metas = p.executores.flatMap(x => x.metas);
    return {
      node: { ...base, sub: 'Sem execução declarada', desc: `O plano de ação ${p.codigo} existe, mas o ente ainda não declarou execução nem pagamentos a fornecedores no relatório de gestão.${metas.length ? ` Metas planejadas: ${metasTexto(metas)}.` : ''} Por isso o RASTRO não afirma se a obra ou o serviço foi entregue.`,
        href: `/emendas/${e.code}#transferegov`, hrefLabel: 'Detalhes do Transferegov na ficha' },
      edge: { status: 'nao_identificado', evidence_id: null, source_url: p.relatorio?.source_url ?? p.source_url, method: 'Plano de ação encontrado pelo número da emenda, mas sem documento de liquidação nem valor executado no relatório de gestão.' },
    };
  }
  const conv = tg?.convenios ?? [];
  if (conv.length) {
    const metas = conv.flatMap(c => c.metas);
    return {
      node: { ...base, sub: 'Fora dos dados abertos', desc: `O convênio está no Transferegov com ${plural(metas.length, 'meta planejada', 'metas planejadas')}${metas.length ? `: ${metasTexto(metas)}` : ''}. A API pública não publica contratos, licitações nem pagamentos do convenente, por isso o RASTRO não afirma se a obra ou o serviço foi entregue.`,
        href: `/emendas/${e.code}#transferegov`, hrefLabel: 'Metas na ficha' },
      edge: { status: 'nao_identificado', evidence_id: null, source_url: conv[0].source_url, method: 'Convênio encontrado no Transferegov pelo número, mas a API pública de transferências discricionárias não traz contratos, licitações nem pagamentos a fornecedores.' },
    };
  }
  const motivo = demo ? 'Modo demonstração: sem dados do Transferegov.'
    : tg === undefined ? 'O pacote de dados ativo não inclui o Transferegov.'
    : e.tipo.includes('Especiais') ? 'Nenhum plano de ação do Transferegov traz o número desta emenda.'
    : e.convenios.length ? 'O número do convênio não tem meta nem proposta na API pública do Transferegov.'
    : 'Não há convênio nem plano de ação ligado à emenda por identificador; contratos e fornecedores não estão nos arquivos usados.';
  return {
    node: { ...base, sub: 'Fora dos dados', desc: `${motivo} Por isso o RASTRO não afirma se a obra ou o serviço foi entregue.` },
    edge: { status: 'nao_identificado', evidence_id: null, source_url: null, method: motivo },
  };
}

/** Status da ligação emenda → pagamentos, que distingue os exemplos de /fluxos. */
export const statusPagamento = (f: Flow) => f.edges[1].status;
/** Status da etapa "contrato ou obra" (Transferegov, ADR-018). */
export const statusExecucao = (f: Flow) => f.edges[3].status;

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
