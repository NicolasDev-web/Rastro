// Registro da investigação dos casos da fila (ADR-014/015). Lido só no build, no servidor.
import fs from 'node:fs';
import path from 'node:path';

export type CasoInvestigado = { status: 'explicado' | 'sem_causa' | 'excluido'; achado: string; causa: string | null; fontes: string[]; data: string; proxima_verificacao?: string };

let cache: Record<string, CasoInvestigado> | null = null;

/** Casos registrados em pipelines/contracts/investigacao_casos.json; vazio se o arquivo não existir. */
export function getInvestigacao(): Record<string, CasoInvestigado> {
  if (cache) return cache;
  try {
    const file = path.resolve(process.cwd(), '../../pipelines/contracts/investigacao_casos.json');
    cache = (JSON.parse(fs.readFileSync(file, 'utf8')).casos ?? {}) as Record<string, CasoInvestigado>;
  } catch (e) {
    // No site publicado, achado ausente é erro de build, não silêncio (auditoria SENTINEL).
    if (process.env.DATA_MODE === 'publicado') throw new Error(`Registro de investigação ilegível: ${(e as Error).message}`);
    cache = {};
  }
  return cache;
}
