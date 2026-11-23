// Números das reportagens 02 e 03 (SPEC 03, incremento 2). Funções puras sobre o pacote ativo:
// nada é digitado à mão, e tudo muda se o pacote mudar.
// Regras: nunca somar anos, etapas, fontes ou critérios. Contagens de emendas podem cruzar anos.
import type { Dataset, Place } from './dataset-types';
import type { Emenda } from './fichas-types';
import { execucaoDeclarada } from './fichas-types';
import type { CasoInvestigado } from './investigacao';
import populacao from './populacao-ce.json';

/* ---------- Reportagem 03: onde termina o registro público ---------- */

export type StatusPagamento = 'documentado' | 'em_verificacao' | 'sem_documento';

/** Mesma regra da aresta emenda → pagamentos em lib/fluxo.ts. */
export function statusPagamentoFicha(e: Emenda, caso?: CasoInvestigado): StatusPagamento {
  const pagamentos = e.documentos.some(d => d.fase.startsWith('Pagam'));
  if (!pagamentos) return 'sem_documento';
  if (e.conciliacao.status === 'confere') return 'documentado';
  if (e.conciliacao.status === 'diverge' && caso?.status === 'explicado') return 'documentado';
  return 'em_verificacao';
}

export type Caminho = 'especial' | 'convenio' | 'demais';
export const caminhoDe = (e: Emenda): Caminho => (e.tipo.includes('Especiais') ? 'especial' : e.convenios.length ? 'convenio' : 'demais');

const isBanco = (nome: string | null) => !!nome && /^BANCO DO BRASIL/i.test(nome);

export type Funil = {
  fichas: number; anos: [number, number];
  autor: number; comDocumentoPagamento: number; pagamentoDocumentado: number; pagamentoEmVerificacao: number; semDocumento: number;
  favorecido: number; registroDoUso: number; execucaoDeclarada: number; entregaComprovada: number;
  caminhos: Record<Caminho, { emendas: number; comRegistro: number; comExecucao: number }>;
  fundoAFundo: { emendas: number; emendasBanco: number; documentosFundo: number; documentosFundoBanco: number };
  casos: { explicados: number; semCausa: { code: string; ano: number; achado: string; proxima?: string }[] };
};

export function funil(emendas: Emenda[], casos: Record<string, CasoInvestigado>): Funil {
  const anos = emendas.map(e => e.ano);
  const status = emendas.map(e => statusPagamentoFicha(e, casos[e.code]));
  const planos = (e: Emenda) => e.transferegov?.planos_acao ?? [];
  const tgConv = (e: Emenda) => e.transferegov?.convenios ?? [];
  const temRegistro = (e: Emenda) => planos(e).length > 0 || tgConv(e).length > 0;
  const temExecucao = (e: Emenda) => planos(e).some(execucaoDeclarada);
  const caminhos = { especial: { emendas: 0, comRegistro: 0, comExecucao: 0 }, convenio: { emendas: 0, comRegistro: 0, comExecucao: 0 }, demais: { emendas: 0, comRegistro: 0, comExecucao: 0 } };
  for (const e of emendas) {
    const c = caminhos[caminhoDe(e)];
    c.emendas++; if (temRegistro(e)) c.comRegistro++; if (temExecucao(e)) c.comExecucao++;
  }
  const fundo = (d: Emenda['documentos'][number]) => d.fase.startsWith('Pagam') && /Fundo a Fundo/i.test(d.modalidade ?? '');
  const docsFundo = emendas.flatMap(e => e.documentos.filter(fundo));
  const sem = Object.entries(casos).filter(([, c]) => c.status === 'sem_causa');
  const byCode = new Map(emendas.map(e => [e.code, e]));
  return {
    fichas: emendas.length, anos: [Math.min(...anos), Math.max(...anos)],
    autor: emendas.filter(e => e.autor_codigo).length,
    comDocumentoPagamento: status.filter(s => s !== 'sem_documento').length,
    pagamentoDocumentado: status.filter(s => s === 'documentado').length,
    pagamentoEmVerificacao: status.filter(s => s === 'em_verificacao').length,
    semDocumento: status.filter(s => s === 'sem_documento').length,
    favorecido: emendas.filter(e => e.quem_recebeu.length > 0).length,
    registroDoUso: emendas.filter(temRegistro).length,
    execucaoDeclarada: emendas.filter(temExecucao).length,
    entregaComprovada: 0, // nenhum arquivo usado traz vistoria ou atesto de entrega (ADR-018)
    caminhos,
    fundoAFundo: {
      emendas: emendas.filter(e => e.documentos.some(fundo)).length,
      emendasBanco: emendas.filter(e => e.documentos.some(d => fundo(d) && isBanco(d.favorecido))).length,
      documentosFundo: docsFundo.length,
      documentosFundoBanco: docsFundo.filter(d => isBanco(d.favorecido)).length,
    },
    casos: {
      explicados: Object.values(casos).filter(c => c.status === 'explicado').length,
      semCausa: sem.map(([code, c]) => ({ code, ano: byCode.get(code)?.ano ?? Number(code.slice(0, 4)), achado: c.achado, proxima: c.proxima_verificacao }))
        .sort((a, b) => a.ano - b.ano || a.code.localeCompare(b.code)),
    },
  };
}

/* ---------- Reportagem 02: a geografia das emendas ---------- */

export const POPULACAO = populacao as { fonte: string; url: string; baixado_em: string; sha256: string; ano: number; pessoas: Record<string, number> };

const pagoTotal = (v: Place['years'][string]) => (v ? (v.pago ?? 0) + (v.rap_pagos ?? 0) : 0);

export type AnoGeografia = {
  ano: number; emExecucao: boolean;
  municipiosLocalidade: number; municipiosAplicacao: number; semRegistro: string[];
  /** pago total (pago + RAP pagos) pela LOCALIDADE da emenda, em centavos, no mesmo ano: partes de um mesmo total */
  localidade: { municipal: number; varios: number; estado: number; total: number };
};

export function geografiaPorAno(data: Dataset): AnoGeografia[] {
  const ultimo = data.years.at(-1);
  const estado = data.nonMunicipal.find(p => p.kind === 'estado');
  const varios = data.nonMunicipal.find(p => p.kind === 'multiplo');
  return data.years.map(ano => {
    const y = String(ano);
    const municipal = data.municipalities.reduce((acc, m) => acc + pagoTotal(m.years[y]), 0);
    const v = pagoTotal(varios?.years[y] ?? null), es = pagoTotal(estado?.years[y] ?? null);
    return {
      ano, emExecucao: ano === ultimo,
      municipiosLocalidade: data.municipalities.filter(m => m.years[y]).length,
      municipiosAplicacao: data.municipalities.filter(m => (m.aplicacao?.[y]?.pago ?? 0) > 0).length,
      semRegistro: data.municipalities.filter(m => !m.years[y] && !m.aplicacao?.[y]).map(m => m.name),
      localidade: { municipal, varios: v, estado: es, total: municipal + v + es },
    };
  });
}

export const FAIXAS = [
  { de: 0, ate: 10_000, rotulo: 'Até 10 mil habitantes' },
  { de: 10_000, ate: 20_000, rotulo: '10 mil a 20 mil' },
  { de: 20_000, ate: 50_000, rotulo: '20 mil a 50 mil' },
  { de: 50_000, ate: 100_000, rotulo: '50 mil a 100 mil' },
  { de: 100_000, ate: Infinity, rotulo: 'Mais de 100 mil' },
] as const;

const mediana = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export type PorHabitante = {
  ano: number;
  /** mediana do pago por aplicação por habitante (reais), por faixa; null = faixa sem município com pagamento */
  faixas: { rotulo: string; municipios: number; mediana: number | null }[];
  mediana: number | null; municipios: number;
};

/** Pago por aplicação (centavos → reais) dividido pela população do Censo 2022. Só municípios com pagamento no ano. */
export function porHabitante(data: Dataset, ano: number): PorHabitante {
  const y = String(ano);
  const pts = data.municipalities.flatMap(m => {
    const pago = m.aplicacao?.[y]?.pago, pop = m.ibge ? POPULACAO.pessoas[m.ibge] : undefined;
    return pago && pago > 0 && pop ? [{ pop, rph: pago / 100 / pop }] : [];
  });
  return {
    ano, municipios: pts.length, mediana: mediana(pts.map(p => p.rph)),
    faixas: FAIXAS.map(f => {
      const g = pts.filter(p => p.pop >= f.de && p.pop < f.ate).map(p => p.rph);
      return { rotulo: f.rotulo, municipios: g.length, mediana: mediana(g) };
    }),
  };
}

export function capital(data: Dataset, ano: number) {
  const m = data.municipalities.find(x => x.ibge === '2304400');
  const pop = POPULACAO.pessoas['2304400'];
  const pago = m?.aplicacao?.[String(ano)]?.pago ?? null;
  return { nome: m?.name ?? 'Fortaleza', populacao: pop, pago, porHabitante: pago ? pago / 100 / pop : null };
}

export const reais = (v: number | null) => (v === null ? 'sem registro' : `R$ ${Math.round(v).toLocaleString('pt-BR')}`);
export const pct = (parte: number, total: number) => (total ? `${Math.round((parte / total) * 100)}%` : '—');
