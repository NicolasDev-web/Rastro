// Autores 100% fictícios para o modo demonstração. Sem nomes, fotos ou partidos reais.
import type { Author, AuthorsData, Sum } from './authors-types';

const s = (pago: number | null, emendas = 1): Sum => ({ emendas, empenhado: pago === null ? null : pago * 1.2, liquidado: pago, pago, rap_pagos: 0 });
const years = (v: Record<number, number | null>) => Object.fromEntries([2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => [String(y), y in v ? s(v[y]) : null]));

function author(id: string, name: string, extra: Partial<Author>): Author {
  return {
    id, siafi_code: `DEMO-${id}`, cgu_name: name.toUpperCase(), display_name: name, casa: 'camara', parl_id: null, partido_atual: 'PARTIDO FICTÍCIO',
    uf: 'CE', eleito_ce: true, scope: 'todas', link: { status: 'em_revisao', metodo: 'demo', nota: null }, photo: null, photo_credit: null, profile_url: null,
    years: years({}), total: s(0, 0), traceable: [], untraceable: [], emendas: [], ...extra,
  };
}

export const demoAuthors: AuthorsData = {
  mode: 'demo',
  coverage: 'demo',
  warning: 'Perfis e valores fictícios para testar a interface.',
  source: 'Dados fabricados (demonstração)',
  years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
  authors: [
    author('demo-a', 'Autora Fictícia A', {
      years: years({ 2024: 2_000_000_00, 2025: 3_000_000_00 }), total: s(5_000_000_00, 3),
      traceable: [{ ibge: '2304400', name: 'Fortaleza', uf: 'CE', ...s(2_500_000_00, 2) }],
      untraceable: [{ label: 'Vários municípios — Ceará', ...s(1_500_000_00) }, { label: 'Nacional', ...s(1_000_000_00) }],
      emendas: [{ code: 'DEMO00000001', technical_id: 'DEMO00000001', ano: 2025, tipo: 'Emenda Individual - Transferências Especiais', localidades: ['FORTALEZA - CE'], empenhado: 300_000_000, liquidado: 250_000_000, pago: 250_000_000, rap_pagos: 0 }],
    }),
    author('demo-b', 'Autor Fictício B', { casa: 'senado', years: years({ 2025: 1_200_000_00 }), total: s(1_200_000_00), untraceable: [{ label: 'Aplicação estadual — Ceará', ...s(1_200_000_00) }] }),
    author('demo-c', 'Autor Fictício C', { uf: 'PE', eleito_ce: false, scope: 'somente_ce', link: { status: 'pendente', metodo: null, nota: 'exemplo de vínculo pendente' }, casa: null, partido_atual: null, years: years({ 2023: null }), total: s(null, 0) }),
  ],
  collective: [{ label: 'BANCADA FICTÍCIA', tipo: 'Emenda de Bancada', years: years({ 2025: 9_000_000_00 }), total: s(9_000_000_00, 2) }],
  stateDeputies: [],
  stateNote: 'No modo demonstração não há deputados estaduais listados.',
};
