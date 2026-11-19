// Nunca migrar estas constantes para produção. Elas são 100% fictícias.
import type { Dataset, Place, YearValues } from './dataset-types';

const DEMO_YEAR = 2025;

/** Critério de aplicação (documentos), fictício. */
const aplic = (pago: number) => ({ [DEMO_YEAR]: { pago: pago * 100, emendas: 2, documentos: 5 } });

/** Valores em reais inteiros → centavos. `null` = sem registro. */
function year(empenhado: number | null, liquidado: number | null, pago: number | null, rapPagos: number | null = 0): Record<string, YearValues> {
  const c = (v: number | null) => (v === null ? null : v * 100);
  return { [DEMO_YEAR]: { lines: 1, empenhado: c(empenhado), liquidado: c(liquidado), pago: c(pago), rap_inscritos: 0, rap_cancelados: 0, rap_pagos: c(rapPagos) } };
}

const municipalities: Place[] = [
  { id: '2304103', ibge: '2304103', name: 'Crateús', kind: 'municipio', years: year(1500000, 900000, 700000), aplicacao: aplic(1900000) },
  { id: '2304202', ibge: '2304202', name: 'Crato', kind: 'municipio', years: year(2700000, 1600000, 1350000, 120000), aplicacao: aplic(2600000) },
  { id: '2304400', ibge: '2304400', name: 'Fortaleza', kind: 'municipio', years: year(12000000, 8100000, 7100000, 450000), aplicacao: aplic(21000000) },
  { id: '2307304', ibge: '2307304', name: 'Juazeiro do Norte', kind: 'municipio', years: year(6800000, 4200000, 3800000), aplicacao: aplic(5100000) },
  { id: '2312908', ibge: '2312908', name: 'Sobral', kind: 'municipio', years: year(4300000, 3100000, 2900000, 80000), aplicacao: aplic(4400000) },
];

/** Destinações que NÃO pertencem a nenhum município e nunca entram na soma municipal (SPEC 04, AC03). */
const nonMunicipal: Place[] = [
  { id: 'estado', name: 'Ceará — aplicação estadual', kind: 'estado', note: 'Aplicação em âmbito estadual. Não identifica quem recebeu nem atribui a nenhum município.', years: year(9000000, 6200000, 4100000) },
  { id: 'multiplo', name: 'Ceará — vários municípios', kind: 'multiplo', note: 'A despesa cobre mais de um município e não pode ser repartida. O pagamento ainda não tem registro na fonte simulada.', years: year(3100000, 2200000, null, null) },
];

export const demoDataset: Dataset = {
  mode: 'demo',
  coverage: 'demo',
  warning: 'Protótipo conceitual — todos os valores exibidos são fictícios. Não utilize como informação pública.',
  source: 'data/fixtures (registros fabricados para teste de interface)',
  years: [DEMO_YEAR],
  defaultYear: DEMO_YEAR,
  municipalities,
  nonMunicipal,
};
