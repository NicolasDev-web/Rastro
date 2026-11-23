import type { ArtKey } from '../components/Illustrations';

// Peças publicadas. Números das reportagens 02 e 03 vêm do pacote ativo (lib/reportagens.ts).
export type Story = { number: string; category: string; status: string; title: string; text: string; art: ArtKey; link: string };

export const stories: Story[] = [
  { number: '01', category: 'Entenda', status: 'Explicador · 19 nov 2026', title: 'O caminho do dinheiro', text: 'O que são emendas, como funcionam e por que a diferença entre destinar e pagar importa.', art: 'congresso', link: '/investigacao' },
  { number: '02', category: 'Território', status: 'Reportagem · 23 nov 2026', title: 'A geografia das emendas', text: 'Pela emenda, poucas cidades aparecem; pelo pagamento, quase todas. E as cidades pequenas recebem mais por habitante.', art: 'doisMapas', link: '/reportagens/geografia-das-emendas' },
  { number: '03', category: 'Rastreabilidade', status: 'Reportagem · 23 nov 2026', title: 'Onde termina o registro público?', text: 'Seguimos cada emenda até onde os documentos permitem. O pagamento é bem registrado; o que o dinheiro virou, quase nunca.', art: 'funil', link: '/reportagens/onde-termina-o-registro' },
];
