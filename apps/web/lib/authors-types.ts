// Tipos da aba de autores (SPEC 04, T04.04). Valores em centavos; null = sem registro.
import type { DataMode } from './dataset-types';

export type Sum = { emendas: number; empenhado: number | null; liquidado: number | null; pago: number | null; rap_pagos: number | null };
export type LinkStatus = 'em_revisao' | 'revisado' | 'pendente' | 'rejeitado';

export type Author = {
  id: string;
  siafi_code: string;
  cgu_name: string;
  display_name: string;
  casa: 'camara' | 'senado' | null;
  parl_id: string | null;
  partido_atual: string | null;
  uf: string | null;
  eleito_ce: boolean;
  scope: 'todas' | 'somente_ce';
  link: { status: LinkStatus; metodo: string | null; nota: string | null };
  photo: string | null;
  photo_credit: string | null;
  profile_url: string | null;
  years: Record<string, Sum | null>;
  total: Sum;
  traceable: (Sum & { ibge: string; name: string; uf: string })[];
  untraceable: (Sum & { label: string })[];
  emendas: { code: string | null; technical_id: string; ano: number; tipo: string; localidades: string[]; empenhado: number | null; liquidado: number | null; pago: number | null; rap_pagos: number | null }[];
};

export type Collective = { label: string; tipo: string; years: Record<string, Sum | null>; total: Sum };

/** Deputado estadual (Alece): só identidade — emendas estaduais sem fonte estruturada. */
export type StateDeputy = { slug: string; nome: string; partido_atual: string | null; situacao: 'titular_ou_licenciado' | 'suplente_em_exercicio'; photo: string | null; photo_credit: string | null; url_perfil: string };

export type AuthorsData = {
  mode: DataMode;
  coverage: 'demo' | 'unverified';
  warning: string;
  source: string;
  asOf?: string;
  partiesAsOf?: string | null;
  years: number[];
  authors: Author[];
  collective: Collective[];
  stateDeputies: StateDeputy[];
  stateAsOf?: string | null;
  stateNote: string;
};

export type AuthorsResult = { ok: true; data: AuthorsData } | { ok: false; error: string };

/** Versão enxuta para a listagem (o cliente não precisa da lista de emendas). */
export type AuthorCard = Pick<Author, 'id' | 'display_name' | 'casa' | 'partido_atual' | 'uf' | 'eleito_ce' | 'scope' | 'link' | 'photo' | 'photo_credit' | 'total'>;

export const CASA_LABEL = { camara: 'Câmara dos Deputados', senado: 'Senado Federal' } as const;
export const ROLE_LABEL = { camara: 'Deputado(a) federal', senado: 'Senador(a)' } as const;
export const LINK_LABEL: Record<LinkStatus, string> = {
  em_revisao: 'Vínculo por nome — em revisão',
  revisado: 'Vínculo revisado',
  pendente: 'Vínculo pendente',
  rejeitado: 'Vínculo rejeitado na revisão',
};
export const initials = (name: string) => name.split(/\s+/).filter(w => w.length > 2 || /^[A-ZÀ-Ú]/.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase();
export const portalUrl = (code: string) => `https://portaldatransparencia.gov.br/emendas/detalhe?codigoEmenda=${code}`;
