// Fichas 100% fictícias para o modo demonstração (sem pessoas, órgãos ou códigos reais).
import type { Emenda, Municipio } from './fichas-types';
import { demoDataset } from './demo';

export const demoEmendas: Record<string, Emenda> = {
  DEMO00000001: {
    code: 'DEMO00000001', ano: 2025, tipo: 'Emenda Individual - Transferências Especiais', autor_codigo: 'DEMO-demo-a', autor_nome: 'AUTORA FICTÍCIA A',
    autor_ficha: 'demo-a', coletiva: false, localidades: [{ localidade: 'FORTALEZA - CE', escopo: 'municipio', ibge: '2304400' }],
    funcao: 'Saúde (fictício)', acao: 'Ação fictícia de demonstração',
    empenhado: 300_000_000, liquidado: 250_000_000, pago: 250_000_000, rap_inscritos: 0, rap_cancelados: 0, rap_pagos: 0, pago_total: 250_000_000,
    conciliacao: { status: 'confere', documentos_pago: 250_000_000 },
    documentos: [
      { data: '2025-03-10', fase: 'Empenho', documento: 'DEMO-NE-0001', valor: 300_000_000, municipio_aplicacao: 'FORTALEZA', uf_aplicacao: 'CE', ibge_aplicacao: '2304400', favorecido: 'MUNICÍPIO FICTÍCIO', modalidade: 'Transferências a Municípios' },
      { data: '2025-06-02', fase: 'Liquidação', documento: 'DEMO-NS-0001', valor: null, municipio_aplicacao: 'FORTALEZA', uf_aplicacao: 'CE', ibge_aplicacao: '2304400', favorecido: 'MUNICÍPIO FICTÍCIO', modalidade: 'Transferências a Municípios' },
      { data: '2025-06-20', fase: 'Pagamento', documento: 'DEMO-OB-0001', valor: 250_000_000, municipio_aplicacao: 'FORTALEZA', uf_aplicacao: 'CE', ibge_aplicacao: '2304400', favorecido: 'MUNICÍPIO FICTÍCIO', modalidade: 'Transferências a Municípios' },
    ],
    quem_recebeu: [{ favorecido: 'MUNICÍPIO FICTÍCIO', tipo: 'Pessoa Jurídica', municipio: 'FORTALEZA', uf: 'CE', valor: 250_000_000, documentos: 1 }],
    convenios: [],
  },
};

export const demoMunicipios: Record<string, Municipio> = Object.fromEntries(demoDataset.municipalities.map(m => [m.ibge!, {
  ibge: m.ibge!, name: m.name,
  emendas_localidade: m.ibge === '2304400' ? [{ code: 'DEMO00000001', ano: 2025, tipo: 'Emenda Individual - Transferências Especiais', autor: 'AUTORA FICTÍCIA A', pago_total: 250_000_000, ficha: true }] : [],
  emendas_aplicacao: m.ibge === '2304400' ? [{ code: 'DEMO00000001', ano: 2025, pago: 250_000_000, documentos: 1, autor: 'AUTORA FICTÍCIA A', tipo: 'Emenda Individual - Transferências Especiais', ficha: true }] : [],
  autores: m.ibge === '2304400' ? [{ id: 'demo-a', name: 'Autora Fictícia A' }] : [],
  favorecidos: [{ favorecido: 'ENTIDADE FICTÍCIA', natureza: 'Demonstração', valor: 100_000_000, lancamentos: 2 }],
}]));
