import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const fields = { 'ce-municipios': ['municipalities', 'non_municipal', 'years'], autores: ['authors', 'collective', 'years'], emendas: ['emendas'], municipios: ['municipios'] };
const monetary = new Set(['pago', 'pago_total', 'empenhado', 'liquidado', 'rap_pagos', 'rap_inscritos', 'rap_cancelados', 'valor', 'documentos_pago']);
function validateValues(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (monetary.has(key) && item !== null && !Number.isSafeInteger(item)) throw new Error(`Valor financeiro inválido: ${key}`);
    validateValues(item);
  }
}
export function loadBundle(directory) {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'active-bundle.json'), 'utf8'));
  if (manifest.version !== 1 || !/^[a-f0-9]{64}$/.test(manifest.id) || typeof manifest.snapshot !== 'string') throw new Error('Manifesto inválido');
  /** @type {Record<string, any>} */
  const result = {};
  for (const [prefix, required] of Object.entries(fields)) {
    const file = manifest.files?.[prefix];
    if (file?.path !== `bundles/${manifest.id}/${prefix}.json`) throw new Error(`Caminho inválido: ${prefix}`);
    const content = fs.readFileSync(path.join(directory, file.path));
    if (createHash('sha256').update(content).digest('hex') !== file.sha256) throw new Error(`Hash divergente: ${prefix}`);
    const raw = JSON.parse(content.toString('utf8'));
    if (raw.kind !== 'VALIDACAO' || raw.snapshot?.raw_sha256 !== manifest.snapshot) throw new Error(`Snapshot incompatível: ${prefix}`);
    for (const field of required) {
      if (!raw[field] || typeof raw[field] !== 'object' || (field !== 'emendas' && field !== 'municipios' && !Array.isArray(raw[field]))) throw new Error(`Estrutura inválida: ${prefix}/${field}`);
    }
    if ((prefix === 'emendas' || prefix === 'municipios') && Array.isArray(raw[prefix])) throw new Error('Índice de fichas inválido');
    validateValues(raw);
    if (prefix !== 'autores' && (!Object.keys(raw.document_sources ?? {}).length || JSON.stringify(Object.entries(raw.document_sources).sort()) !== JSON.stringify(Object.entries(manifest.document_sources ?? {}).sort()))) throw new Error(`Documentos incompatíveis: ${prefix}`);
    result[prefix] = raw;
  }
  for (const [code, amendment] of Object.entries(result.emendas.emendas)) {
    if (amendment.code !== code || !Array.isArray(amendment.documentos) || !Array.isArray(amendment.quem_recebeu) || !Array.isArray(amendment.convenios) || !['confere', 'diverge', 'sem_documentos', 'indisponivel'].includes(amendment.conciliacao?.status)) throw new Error('Ficha de emenda inválida');
  }
  for (const [ibge, city] of Object.entries(result.municipios.municipios)) {
    if (city.ibge !== ibge || typeof city.name !== 'string' || !Array.isArray(city.autores) || !Array.isArray(city.favorecidos)) throw new Error('Ficha municipal inválida');
    for (const list of [city.emendas_localidade, city.emendas_aplicacao]) {
      if (!Array.isArray(list) || list.some(e => e.ficha && !result.emendas.emendas[e.code])) throw new Error('Referência de emenda incompatível');
    }
  }
  return result;
}
