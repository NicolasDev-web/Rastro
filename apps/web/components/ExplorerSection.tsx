import { getDataset } from '../lib/dataset';
import { MunicipalityExplorer } from './Explorer';
import { DataState } from './States';

/** Carrega o dataset no servidor e entrega ao explorador. Em erro, mostra o erro — nunca dados demo no lugar. */
export function ExplorerSection({ compact = false }: { compact?: boolean }) {
  const res = getDataset();
  if (!res.ok) return <DataState kind="error" title="Dados indisponíveis">{res.error}</DataState>;
  return <MunicipalityExplorer data={res.data} compact={compact} />;
}
