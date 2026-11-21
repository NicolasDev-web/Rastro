'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { MoneyFlow } from './MoneyFlow';
import type { Flow } from '../lib/fluxo';

export type FlowExample = { label: string; hint: string; flow: Flow };

/** Exemplos reais em abas + busca por código, que leva à ficha (site estático). */
export function FlowExplorer({ examples, codes }: { examples: FlowExample[]; codes: string[] }) {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const current = examples[tab];

  function submit(ev: FormEvent) {
    ev.preventDefault();
    const code = query.replace(/\D/g, '');
    if (!codes.includes(code)) { setError(code ? `A emenda ${code} não está entre as ${codes.length.toLocaleString('pt-BR')} fichas do recorte.` : 'Digite o código da emenda.'); return; }
    router.push(`/emendas/${code}#fluxo`);
  }

  return <div className="flow-explorer">
    <div className="flow-tabs" role="tablist" aria-label="Exemplos reais de fluxo">{examples.map((x, i) =>
      <button key={x.flow.code} type="button" role="tab" id={`flow-tab-${i}`} aria-selected={i === tab} aria-controls="flow-panel" className={i === tab ? 'flow-tab active' : 'flow-tab'} onClick={() => setTab(i)}>
        <strong>{x.label}</strong><small>Emenda {x.flow.code}</small>
      </button>)}
    </div>
    <div id="flow-panel" role="tabpanel" aria-labelledby={`flow-tab-${tab}`}>
      <p className="small muted flow-hint">{current.hint}</p>
      <MoneyFlow key={current.flow.code} flow={current.flow} />
    </div>
    <form className="flow-search" onSubmit={submit} role="search">
      <label htmlFor="flow-code">Ver o fluxo de outra emenda</label>
      <div className="search-field"><Search size={17} aria-hidden="true" /><input id="flow-code" inputMode="numeric" autoComplete="off" placeholder="Código da emenda, ex.: 202020250002" value={query} onChange={ev => { setQuery(ev.target.value); setError(null); }} aria-describedby="flow-code-help" /></div>
      <button type="submit" className="flow-go">Abrir fluxo</button>
      <p id="flow-code-help" className={error ? 'small flow-error' : 'small muted'}>{error ?? 'O código está na ficha de cada emenda, no explorador e na ficha de cada parlamentar. Toda ficha de emenda tem o seu fluxo.'}</p>
    </form>
  </div>;
}
