// Tipos e funções puras do dataset exibido no site — usados no servidor e no cliente.
// Modos (ADR-008): 'demo' (fictício) e 'validacao' (oficial, em auditoria, só local).

export type DataMode = 'demo' | 'validacao';
export type Metric = 'empenhado' | 'liquidado' | 'pago' | 'rap_inscritos' | 'rap_cancelados' | 'rap_pagos';
export type Stage = 'empenhado' | 'liquidado' | 'pago';
export const STAGES: Stage[] = ['empenhado', 'liquidado', 'pago'];
export const STAGE_LABEL: Record<Stage, string> = { empenhado: 'Empenhado', liquidado: 'Liquidado', pago: 'Pago' };
export const isStage = (v: string | null): v is Stage => v === 'empenhado' || v === 'liquidado' || v === 'pago';

/** Valores de um ano, em centavos. `null` no ano inteiro = sem registro (nunca zero). */
export type YearValues = ({ lines: number } & Record<Metric, number | null>) | null;

/** Frente A: pago por município de APLICAÇÃO (documentos de pagamento), por ano da emenda. Nunca somar ao critério por emenda. */
export type AplicValues = { pago: number; emendas: number; documentos: number } | null;
export type Criterio = 'emenda' | 'aplicacao';
export const CRITERIO_LABEL: Record<Criterio, string> = { emenda: 'Localidade da emenda', aplicacao: 'Onde o pagamento foi aplicado' };

export type Place = {
  id: string;
  name: string;
  ibge?: string;
  kind: 'municipio' | 'estado' | 'multiplo';
  note?: string;
  years: Record<string, YearValues>;
  aplicacao?: Record<string, AplicValues>;
};

export type Dataset = {
  mode: DataMode;
  coverage: 'demo' | 'unverified';
  warning: string;
  source: string;
  sourceUrl?: string;
  asOf?: string;          // data da extração (ISO)
  snapshot?: string;      // SHA-256 curto do arquivo bruto
  years: number[];
  defaultYear: number;
  municipalities: Place[];
  nonMunicipal: Place[];
};

export type DatasetResult = { ok: true; data: Dataset } | { ok: false; error: string };

export const value = (p: Place, year: number, metric: Metric): number | null => p.years[String(year)]?.[metric] ?? null;
export const aplicValue = (p: Place, year: number): number | null => p.aplicacao?.[String(year)]?.pago ?? null;

export const brl = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
export const brlOrMissing = (cents: number | null) => (cents === null ? 'Sem registro' : brl(cents));

/** Pago total = pago no ano da emenda + restos a pagar pagos nos anos seguintes (mesma etapa, anos diferentes).
 *  Confirmado pelos documentos de pagamento em 95,7% das emendas do recorte (SPEC 01 → H1). */
export const pagoTotal = (pago: number | null, rapPagos: number | null) => (pago === null && rapPagos === null ? null : (pago ?? 0) + (rapPagos ?? 0));
export const PAGO_TOTAL_NOTE = 'Pago total = pago no ano da emenda + restos a pagar pagos depois. Confirmado pelos documentos de pagamento da CGU em 95,7% das emendas do Ceará (2020–2026).';

// Formatação manual: Intl 'compact' difere entre o ICU do Node e o do navegador e quebra a hidratação.
export const compactBrl = (cents: number) => {
  const v = cents / 100;
  const [div, suf] = v >= 1e9 ? [1e9, 'bi'] : v >= 1e6 ? [1e6, 'mi'] : v >= 1e3 ? [1e3, 'mil'] : [1, ''];
  const n = Math.round((v / div) * 10) / 10;
  const s = (Number.isInteger(n) ? String(n) : n.toFixed(1)).replace('.', ',');
  return `R$ ${s}${suf ? ` ${suf}` : ''}`;
};

export const normalize = (v: string) => v.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');

export const formatDate = (iso?: string) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');

/** CSV com metadados da consulta (SPEC 04, AC07). Separador `;` para o Excel pt-BR. Vazio = sem registro. */
export function datasetCsv(data: Dataset, year: number, stage: Stage, generatedAt: string) {
  const esc = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const head = [
    `# RASTRO — ${data.mode === 'demo' ? 'EXPORTAÇÃO DE DEMONSTRAÇÃO: todos os valores são fictícios' : 'DADOS OFICIAIS EM VALIDAÇÃO: não publicar nem citar como resultado apurado'}`,
    `# fonte: ${data.source}${data.sourceUrl ? ` (${data.sourceUrl})` : ''}`,
    `# extraido_em: ${data.asOf ?? '—'}${data.snapshot ? ` · snapshot ${data.snapshot}` : ''}`,
    `# exercicio_da_emenda: ${year}`,
    `# etapa: ${STAGE_LABEL[stage]}`,
    '# regras: empenho, liquidação e pagamento não se somam; pago + rap_pagos = pago total (restos a pagar pagos nos anos seguintes); aplicação estadual e vários municípios não entram em municípios; vazio = sem registro (não é zero)',
    `# cobertura: ${data.coverage}`,
    `# gerado_em: ${generatedAt}`,
    'codigo_ibge;nome;tipo_destinacao;exercicio;etapa;valor_centavos;rap_pagos_centavos',
  ];
  const rows = [...data.municipalities, ...data.nonMunicipal].map(p => {
    const v = value(p, year, stage), rap = value(p, year, 'rap_pagos');
    return [p.ibge ?? '', p.name, p.kind, String(year), stage, v === null ? '' : String(v), rap === null ? '' : String(rap)].map(esc).join(';');
  });
  return [...head, ...rows].join('\n');
}
