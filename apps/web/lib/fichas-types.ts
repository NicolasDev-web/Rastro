// Fichas de emenda e de município (Frente B). Valores em centavos.

export type EmendaDoc = { data: string | null; fase: string; documento: string; valor: number | null; municipio_aplicacao: string | null; uf_aplicacao: string | null; ibge_aplicacao: string | null; favorecido: string | null; modalidade: string | null };

export type Emenda = {
  code: string; ano: number; tipo: string; autor_codigo: string | null; autor_nome: string | null; autor_ficha: string | null; coletiva: boolean;
  localidades: { localidade: string; escopo: string; ibge: string | null }[];
  funcao: string | null; acao: string | null;
  empenhado: number | null; liquidado: number | null; pago: number | null; rap_inscritos: number | null; rap_cancelados: number | null; rap_pagos: number | null; pago_total: number | null;
  conciliacao: { status: 'confere' | 'diverge' | 'sem_documentos' | 'indisponivel'; documentos_pago: number | null };
  documentos: EmendaDoc[];
  quem_recebeu: { favorecido: string; tipo: string | null; municipio: string | null; uf: string | null; valor: number | null; documentos: number }[];
  convenios: { numero: string | null; data_publicacao: string | null; convenente: string | null; objeto: string | null; valor: number | null }[];
  /** Transferegov (ADR-018). `undefined`: o pacote ativo não tem a parte; `null`: nenhum registro ligado por identificador. */
  transferegov?: TransferegovEmenda | null;
};

// Transferegov.br ligado à emenda só por identificador oficial (SPEC 01 → T01.04, ADR-018). Valores em centavos.
export type TgMeta = { nome: string | null; descricao: string | null; unidade: string | null; quantidade: string | null };
export type TgPlano = {
  id: number; codigo: string; ano: number | null; situacao: string | null; beneficiario: string | null; uf: string | null;
  objeto: string | null; detalhamento: string | null; categoria: string | null; valor_custeio: number | null; valor_investimento: number | null; source_url: string;
  plano_trabalho: { situacao: string | null; inicio: string | null; fim: string | null } | null;
  executores: { nome: string; objeto: string | null; valor_custeio: number | null; valor_investimento: number | null; metas: TgMeta[] }[];
  relatorio: { id: number; tipo: string | null; data: string | null; situacao: string | null; valor_executado: number | null; valor_pendente: number | null; relatorios: number; source_url: string } | null;
  fornecedores: { recebedor: string; mascarado: boolean; valor: number | null; documentos: number }[];
  documentos_liquidacao: number;
};
export type TgConvenio = {
  numero: string; id_proposta: number; nr_proposta: string | null; modalidade: string | null; situacao: string | null; objeto: string | null; orgao: string | null;
  proponente: string | null; municipio: string | null; uf: string | null; valor_global: number | null; valor_repasse: number | null; valor_contrapartida: number | null;
  vigencia_inicio: string | null; vigencia_fim: string | null; ordem_servico: string | null;
  metas: { numero: number | null; descricao: string | null; unidade: string | null; quantidade: string | null; valor: number | null; inicio: string | null; fim: string | null }[];
  source_url: string; proposta_url: string;
};
export type TransferegovEmenda = { planos_acao: TgPlano[]; convenios: TgConvenio[] };

/** Execução declarada pelo ente: documento de liquidação ou valor executado positivo no último relatório de gestão. */
export const execucaoDeclarada = (p: TgPlano) => p.documentos_liquidacao > 0 || (p.relatorio?.valor_executado ?? 0) > 0;

export type Municipio = {
  ibge: string; name: string;
  emendas_localidade: { code: string; ano: number; tipo: string; autor: string | null; pago_total: number | null; ficha: boolean }[];
  emendas_aplicacao: { code: string; ano: number; pago: number | null; documentos: number; autor: string | null; tipo: string | null; ficha: boolean }[];
  autores: { id: string; name: string }[];
  favorecidos: { favorecido: string | null; natureza: string | null; valor: number | null; lancamentos: number }[];
};

export const CONCILIACAO_LABEL = {
  confere: 'Pagamentos conferem com os documentos',
  diverge: 'Pagamentos divergem dos documentos',
  sem_documentos: 'Sem documento de pagamento',
  indisponivel: 'Conciliação indisponível — valores incompletos',
} as const;
