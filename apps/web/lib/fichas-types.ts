// Fichas de emenda e de município (Frente B). Valores em centavos.

export type EmendaDoc = { data: string | null; fase: string; documento: string; valor: number | null; municipio_aplicacao: string | null; uf_aplicacao: string | null; ibge_aplicacao: string | null; favorecido: string | null; modalidade: string | null };

export type Emenda = {
  code: string; ano: number; tipo: string; autor_codigo: string | null; autor_nome: string | null; autor_ficha: string | null; coletiva: boolean;
  localidades: { localidade: string; escopo: string; ibge: string | null }[];
  funcao: string | null; acao: string | null;
  empenhado: number; liquidado: number; pago: number; rap_inscritos: number; rap_cancelados: number; rap_pagos: number; pago_total: number;
  conciliacao: { status: 'confere' | 'diverge' | 'sem_documentos'; documentos_pago: number };
  documentos: EmendaDoc[];
  quem_recebeu: { favorecido: string; tipo: string | null; municipio: string | null; uf: string | null; valor: number; documentos: number }[];
  convenios: { numero: string | null; data_publicacao: string | null; convenente: string | null; objeto: string | null; valor: number | null }[];
};

export type Municipio = {
  ibge: string; name: string;
  emendas_localidade: { code: string; ano: number; tipo: string; autor: string | null; pago_total: number; ficha: boolean }[];
  emendas_aplicacao: { code: string; ano: number; pago: number; documentos: number; autor: string | null; tipo: string | null; ficha: boolean }[];
  autores: { id: string; name: string }[];
  favorecidos: { favorecido: string | null; natureza: string | null; valor: number; lancamentos: number }[];
};

export const CONCILIACAO_LABEL = {
  confere: 'Pagamentos conferem com os documentos',
  diverge: 'Pagamentos divergem dos documentos',
  sem_documentos: 'Sem documentos de despesa',
} as const;
