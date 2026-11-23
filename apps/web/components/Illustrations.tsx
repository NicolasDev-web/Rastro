/**
 * Biblioteca de ilustrações editoriais do RASTRO.
 *
 * Linguagem visual: colagem de papel recortado + impressão em risografia
 * (cores chapadas, retícula de meio-tom, grão de papel e bordas levemente
 * irregulares). Tudo é vetor desenhado em código: não há fotografia nem
 * imagem gerada por IA. As cenas são METÁFORAS esquemáticas — não retratam
 * lugares, pessoas ou fatos específicos e não servem como prova visual.
 */
import type { ReactNode } from 'react';

export const C = {
  ink: '#151515',
  paper: '#F4EFE6',
  paper2: '#E8DFCC',
  cobalt: '#2E3BD6',
  barro: '#C2461E',
  sol: '#F2B33D',
  mata: '#2F6B4F',
  mataLight: '#5C9277',
  rosa: '#EE8FA6',
};

/* ---------- Infra comum ---------- */

function Defs({ id }: { id: string }) {
  return (
    <defs>
      {/* grão de papel: pontos escuros esparsos sobre a cena */}
      <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={7} stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.07  0 0 0 0 0.06  1.7 0 0 0 -0.72" />
      </filter>
      {/* borda de papel recortado à mão */}
      <filter id={`${id}-rough`} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={3} result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale={5} xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {/* retícula de meio-tom */}
      <pattern id={`${id}-dots`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <circle cx="3.5" cy="3.5" r="1.5" fill={C.ink} />
      </pattern>
      <pattern id={`${id}-dots-lg`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <circle cx="6" cy="6" r="2.6" fill={C.ink} />
      </pattern>
      <pattern id={`${id}-dots-paper`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
        <circle cx="4.5" cy="4.5" r="1.6" fill={C.paper} />
      </pattern>
      <pattern id={`${id}-floors`} width="8" height="7" patternUnits="userSpaceOnUse">
        <rect width="8" height="2" fill={C.ink} />
      </pattern>
    </defs>
  );
}

function Frame({ id, w = 800, h = 600, label, round, children }: { id: string; w?: number; h?: number; label: string; round?: { cx: number; cy: number; r: number }; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="art-svg" preserveAspectRatio="xMidYMid slice">
      <Defs id={id} />
      {round && <clipPath id={`${id}-clip`}><circle cx={round.cx} cy={round.cy} r={round.r} /></clipPath>}
      {children}
      <rect width={w} height={h} filter={`url(#${id}-grain)`} opacity={0.6} pointerEvents="none" clipPath={round ? `url(#${id}-clip)` : undefined} />
    </svg>
  );
}

/* ---------- Peças reutilizáveis ---------- */

type DocProps = { x: number; y: number; w?: number; h?: number; rot?: number; stamp?: string; fill?: string; mark?: boolean };
function Doc({ x, y, w = 60, h = 78, rot = 0, stamp, fill = C.paper, mark = false }: DocProps) {
  const l = -w / 2, t = -h / 2, px = w * 0.14;
  const rows = [0.34, 0.48, 0.62, 0.76];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={l + 4} y={t + 5} width={w} height={h} fill={C.ink} />
      <rect x={l} y={t} width={w} height={h} fill={fill} stroke={C.ink} strokeWidth={2.5} />
      <rect x={l + px} y={t + h * 0.12} width={w * 0.46} height={Math.max(3, h * 0.07)} fill={C.ink} />
      {mark && <rect x={l + px - 2} y={t + h * 0.48 - h * 0.05} width={w * 0.66} height={h * 0.1} fill={C.sol} />}
      {rows.map(r => (
        <line key={r} x1={l + px} x2={l + w - px - (r > 0.7 ? w * 0.3 : 0)} y1={t + h * r} y2={t + h * r} stroke={C.ink} strokeWidth={1.6} />
      ))}
      {stamp && <circle cx={l + w * 0.74} cy={t + h * 0.8} r={w * 0.13} fill="none" stroke={stamp} strokeWidth={2.5} />}
    </g>
  );
}

/** Silhueta esquemática de um edifício legislativo modernista (cúpula, torres e cuia). */
function Congresso({ x, y, s = 1, id }: { x: number; y: number; s?: number; id: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round">
      <rect x={-30} y={-190} width={26} height={190} fill={C.paper} />
      <rect x={4} y={-190} width={26} height={190} fill={C.paper} />
      <rect x={-30} y={-186} width={26} height={182} fill={`url(#${id}-floors)`} stroke="none" opacity={0.3} />
      <rect x={4} y={-186} width={26} height={182} fill={`url(#${id}-floors)`} stroke="none" opacity={0.3} />
      <rect x={-4} y={-122} width={8} height={12} fill={C.paper} />
      <path d="M-140 0 Q-140 -50 -95 -50 Q-50 -50 -50 0Z" fill={C.paper} />
      <path d="M-95 -50 Q-50 -50 -50 0 H-95Z" fill={`url(#${id}-dots)`} stroke="none" opacity={0.5} />
      <path d="M42 -42 L148 -42 Q132 0 95 0 Q58 0 42 -42Z" fill={C.paper} />
      <path d="M95 -42 L148 -42 Q132 0 95 0Z" fill={`url(#${id}-dots)`} stroke="none" opacity={0.5} />
      <rect x={-160} y={0} width={320} height={10} fill={C.paper} />
    </g>
  );
}

function Lupa({ cx, cy, r, angle = 45, len = 90 }: { cx: number; cy: number; r: number; angle?: number; len?: number }) {
  const a = (angle * Math.PI) / 180;
  return (
    <g>
      <line x1={cx + Math.cos(a) * (r + 4)} y1={cy + Math.sin(a) * (r + 4)} x2={cx + Math.cos(a) * (r + len)} y2={cy + Math.sin(a) * (r + len)} stroke={C.ink} strokeWidth={r * 0.32} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill={C.paper} fillOpacity={0.2} stroke={C.ink} strokeWidth={r * 0.18} />
      <path d={`M${cx - r * 0.58} ${cy - r * 0.12} A${r * 0.6} ${r * 0.6} 0 0 1 ${cx - r * 0.12} ${cy - r * 0.58}`} stroke={C.paper} strokeWidth={r * 0.08} fill="none" strokeLinecap="round" />
    </g>
  );
}

function Coin({ x, y, r = 13 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={C.sol} stroke={C.ink} strokeWidth={2.5} />
      <text x={x} y={y + r * 0.3} textAnchor="middle" fontSize={r * 0.82} fill={C.ink}>R$</text>
    </g>
  );
}

function Tag({ x, y, text, bg = C.ink, fg = C.paper }: { x: number; y: number; text: string; bg?: string; fg?: string }) {
  const w = text.length * 7.4 + 16;
  return (
    <g>
      <rect x={x - w / 2} y={y - 11} width={w} height={22} fill={bg} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fill={fg} letterSpacing="0.06em">{text}</text>
    </g>
  );
}

function Palm({ x, y, h }: { x: number; y: number; h: number }) {
  const tx = x + 4, ty = y - h, L = h * 0.42;
  const angles = [-175, -150, -125, -100, -78, -55, -30, -5];
  return (
    <g stroke={C.ink} strokeLinecap="round" fill="none">
      <path d={`M${x} ${y} Q${x - 3} ${y - h / 2} ${tx} ${ty}`} strokeWidth={3.5} />
      {angles.map(deg => {
        const a = (deg * Math.PI) / 180;
        const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.8 + L * 0.25;
        return <path key={deg} d={`M${tx} ${ty} Q${tx + Math.cos(a) * L * 0.5} ${ty + Math.sin(a) * L * 0.6 - 6} ${ex} ${ey}`} strokeWidth={2.5} />;
      })}
    </g>
  );
}

/* ---------- Cenas ---------- */

/** O percurso de uma emenda: do Legislativo à cidade, passando por documentos. */
export function CaminhoArt({ id = 'caminho' }: { id?: string }) {
  return (
    <Frame id={id} w={800} h={640} label="Ilustração em colagem: uma trilha pontilhada sai de um edifício legislativo e atravessa três documentos — indicação, empenho e pagamento — até uma pequena cidade com igreja e caixa d'água. Uma lupa amplia o documento do meio.">
      <rect width={800} height={640} fill={C.cobalt} />
      <g filter={`url(#${id}-rough)`}>
        <circle cx={640} cy={140} r={100} fill={C.sol} />
        <circle cx={640} cy={140} r={100} fill={`url(#${id}-dots)`} opacity={0.16} />
        <rect x={70} y={108} width={170} height={18} rx={9} fill={C.paper} />
        <rect x={125} y={138} width={115} height={14} rx={7} fill={C.paper} />
        <rect x={440} y={250} width={140} height={14} rx={7} fill={C.paper} opacity={0.9} />
        <path d="M0 405 C110 370 210 392 330 378 C470 360 570 392 800 362 L800 640 L0 640Z" fill={C.paper2} />
        <Congresso x={205} y={398} s={0.82} id={id} />
        <path d="M0 470 C140 448 260 476 400 462 C560 446 660 474 800 452 L800 640 L0 640Z" fill={C.barro} />
        <path d="M0 470 C140 448 260 476 400 462 C560 446 660 474 800 452 L800 640 L0 640Z" fill={`url(#${id}-dots)`} opacity={0.18} />

        {/* cidade */}
        <g stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round">
          <rect x={548} y={420} width={56} height={44} fill={C.paper} />
          <polygon points="542,422 576,396 610,422" fill={C.ink} />
          <rect x={618} y={394} width={70} height={70} fill={C.paper} />
          <polygon points="612,396 653,364 694,396" fill={C.ink} />
          <rect x={636} y={320} width={34} height={76} fill={C.paper} />
          <polygon points="632,322 653,288 674,322" fill={C.ink} />
          <line x1={653} y1={288} x2={653} y2={268} />
          <line x1={645} y1={277} x2={661} y2={277} />
          <path d="M643 464 V442 Q653 430 663 442 V464Z" fill={C.ink} />
          <rect x={647} y={336} width={12} height={16} fill={C.ink} />
          <rect x={700} y={426} width={44} height={38} fill={C.paper} />
          <polygon points="695,428 722,406 749,428" fill={C.ink} />
          <line x1={758} y1={462} x2={764} y2={402} />
          <line x1={786} y1={462} x2={780} y2={402} />
          <rect x={752} y={372} width={40} height={30} rx={3} fill={C.paper} />
        </g>

        {/* rastro */}
        <path d="M250 402 C330 420 300 470 360 500 C430 535 520 520 560 490 C590 468 610 470 640 466" stroke={C.ink} strokeWidth={6} strokeDasharray="1 14" strokeLinecap="round" fill="none" />
        <Coin x={300} y={432} />
        <Coin x={522} y={520} r={11} />
        <Doc x={330} y={520} rot={-8} stamp={C.barro} />
        <Doc x={590} y={515} w={52} h={68} rot={9} />
        <Lupa cx={450} cy={545} r={62} angle={48} len={110} />
        <Doc x={450} y={545} w={58} h={74} rot={5} stamp={C.cobalt} mark />
      </g>
      <Tag x={330} y={584} text="INDICAÇÃO" />
      <Tag x={450} y={624} text="EMPENHO" bg={C.sol} fg={C.ink} />
      <Tag x={600} y={570} text="PAGAMENTO" />
    </Frame>
  );
}

/** O interior: estrada, mandacaru, carnaúbas e uma placa — "além dos grandes centros". */
export function SertaoArt({ id = 'sertao' }: { id?: string }) {
  const dashes = [[360, 368], [380, 394], [410, 432], [455, 490], [520, 575]];
  const hw = (y: number) => 0.6 + (y - 352) * 0.014;
  return (
    <Frame id={id} label="Ilustração em colagem: estrada de terra atravessa o interior sob um sol grande; à direita, um mandacaru; ao fundo, carnaúbas e casas pequenas; à esquerda, uma placa de madeira diz 'Ceará · 184 municípios'.">
      <rect width={800} height={600} fill={C.sol} />
      <g filter={`url(#${id}-rough)`}>
        <circle cx={540} cy={190} r={120} fill={C.barro} />
        <circle cx={540} cy={190} r={120} fill={`url(#${id}-dots-lg)`} opacity={0.18} />
        <path d="M150 118 q10 -10 20 0 q10 -10 20 0" stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" />
        <path d="M222 86 q7 -7 14 0 q7 -7 14 0" stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" />
        <path d="M0 360 C150 345 280 352 400 350 C540 348 650 340 800 352 L800 600 L0 600Z" fill={C.paper2} />
        <Palm x={86} y={356} h={72} />
        <Palm x={128} y={354} h={52} />
        <Palm x={730} y={350} h={62} />
        <g stroke={C.ink} strokeWidth={2} strokeLinejoin="round">
          <rect x={450} y={334} width={26} height={18} fill={C.paper} />
          <polygon points="447,336 463,324 479,336" fill={C.barro} />
          <rect x={486} y={338} width={20} height={14} fill={C.paper} />
          <polygon points="483,340 496,330 509,340" fill={C.barro} />
        </g>
        <path d="M0 380 C200 370 600 372 800 380 L800 600 L0 600Z" fill="#D46A33" />
        <path d="M0 380 C200 370 600 372 800 380 L800 600 L0 600Z" fill={`url(#${id}-dots)`} opacity={0.2} />
        <polygon points="394,352 406,352 560,600 240,600" fill={C.ink} />
        {dashes.map(([a, b]) => (
          <polygon key={a} points={`${400 - hw(a)},${a} ${400 + hw(a)},${a} ${400 + hw(b)},${b} ${400 - hw(b)},${b}`} fill={C.sol} />
        ))}

        {/* mandacaru: contornos primeiro, preenchimentos depois = silhueta única */}
        <g transform="translate(640 232)">
          {[
            { x: -34, y: 0, w: 68, h: 380, r: 34 }, { x: -96, y: 140, w: 70, h: 36, r: 18 }, { x: -96, y: 40, w: 36, h: 136, r: 18 },
            { x: 26, y: 200, w: 60, h: 34, r: 17 }, { x: 52, y: 90, w: 34, h: 144, r: 17 },
          ].map((p, i) => <rect key={`o${i}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} fill={C.ink} stroke={C.ink} strokeWidth={7} />)}
          {[
            { x: -34, y: 0, w: 68, h: 380, r: 34 }, { x: -96, y: 140, w: 70, h: 36, r: 18 }, { x: -96, y: 40, w: 36, h: 136, r: 18 },
            { x: 26, y: 200, w: 60, h: 34, r: 17 }, { x: 52, y: 90, w: 34, h: 144, r: 17 },
          ].map((p, i) => <rect key={`f${i}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} fill={C.mata} />)}
          <g stroke={C.mataLight} strokeWidth={3} strokeLinecap="round">
            <line x1={-12} y1={22} x2={-12} y2={370} /><line x1={12} y1={22} x2={12} y2={370} />
            <line x1={-78} y1={58} x2={-78} y2={150} /><line x1={69} y1={106} x2={69} y2={210} />
          </g>
          <rect x={8} y={6} width={26} height={374} rx={13} fill={`url(#${id}-dots)`} opacity={0.35} />
          <circle cx={0} cy={-2} r={11} fill={C.rosa} stroke={C.ink} strokeWidth={2.5} />
        </g>

        {/* placa */}
        <rect x={150} y={410} width={11} height={200} fill={C.ink} />
        <g transform="rotate(-4 160 420)">
          <polygon points="56,396 246,396 268,419 246,442 56,442" fill={C.ink} transform="translate(4 5)" />
          <polygon points="56,396 246,396 268,419 246,442 56,442" fill={C.paper} stroke={C.ink} strokeWidth={3} />
        </g>
      </g>
      <text x={158} y={424} textAnchor="middle" fontSize={12} fill={C.ink} letterSpacing="0.04em" transform="rotate(-4 160 420)">CEARÁ · 184 MUNICÍPIOS</text>
    </Frame>
  );
}

/** Documentos que saem do edifício legislativo, ligados por um rastro. */
export function CongressoArt({ id = 'congresso' }: { id?: string }) {
  const papers: [number, number, number, number][] = [
    [470, 165, -14, 50], [545, 108, 10, 56], [625, 158, -20, 46], [700, 92, 16, 52],
    [330, 120, 12, 50], [252, 166, -10, 44], [176, 100, 8, 54],
  ];
  return (
    <Frame id={id} label="Ilustração em colagem: um edifício legislativo modernista, com cúpula, cuia e duas torres, e folhas de documentos voando a partir dele, ligadas por uma linha pontilhada.">
      <rect width={800} height={600} fill={C.barro} />
      <g filter={`url(#${id}-rough)`}>
        <circle cx={400} cy={330} r={215} fill={C.rosa} />
        <circle cx={400} cy={330} r={215} fill={`url(#${id}-dots-lg)`} opacity={0.12} />
        <path d="M176 100 C220 150 240 170 252 166 C290 150 300 120 330 120 C380 120 420 170 470 165 C510 160 520 110 545 108 C590 104 600 160 625 158 C660 156 670 100 700 92" stroke={C.ink} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" fill="none" />
        {papers.map(([x, y, r, w], i) => <Doc key={i} x={x} y={y} w={w} h={w * 1.3} rot={r} stamp={i % 3 === 0 ? C.cobalt : undefined} mark={i === 2} />)}
        <rect x={0} y={535} width={800} height={65} fill={C.ink} />
        <g stroke={C.paper} strokeWidth={2} opacity={0.5}>
          <line x1={0} y1={560} x2={800} y2={560} /><line x1={0} y1={582} x2={800} y2={582} />
        </g>
        <Congresso x={400} y={525} s={1.45} id={id} />
      </g>
    </Frame>
  );
}

/** Mesa de apuração: pasta, documento com trecho marcado, carimbo, clipe, lupa e moedas. */
export function DocumentosArt({ id = 'documentos' }: { id?: string }) {
  const lines: [number, number][] = [[250, 520], [275, 540], [300, 500], [325, 530], [350, 545], [375, 470], [400, 520], [425, 430]];
  return (
    <Frame id={id} label="Ilustração em colagem: sobre uma pasta azul, um documento com uma linha marcada em amarelo, um carimbo circular escrito 'fonte oficial', um clipe e uma lupa; ao lado, uma pilha de moedas.">
      <rect width={800} height={600} fill={C.paper2} />
      <rect width={800} height={600} fill={`url(#${id}-dots)`} opacity={0.08} />
      <g filter={`url(#${id}-rough)`}>
        <g transform="rotate(-6 400 330)" stroke={C.ink} strokeWidth={3}>
          <rect x={160} y={128} width={150} height={40} rx={6} fill={C.cobalt} />
          <rect x={160} y={150} width={500} height={370} fill={C.cobalt} />
          <rect x={160} y={150} width={500} height={370} fill={`url(#${id}-dots-paper)`} stroke="none" opacity={0.25} />
        </g>
        <g transform="rotate(3 400 330)">
          <rect x={206} y={176} width={380} height={320} fill={C.ink} />
          <rect x={200} y={170} width={380} height={320} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <rect x={230} y={200} width={170} height={16} fill={C.ink} />
          <rect x={226} y={315} width={290} height={20} fill={C.sol} />
          {lines.map(([y, x2]) => <line key={y} x1={230} x2={x2} y1={y} y2={y} stroke={C.ink} strokeWidth={2.5} />)}
          <path d="M262 150 V212 Q262 228 278 228 Q294 228 294 212 V160 Q294 150 285 150 Q276 150 276 160 V206" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
        {[0, 1, 2, 3, 4].map(i => {
          const cy = 536 - i * 15;
          return (
            <g key={i} stroke={C.ink} strokeWidth={2.5}>
              <path d={`M82 ${cy} V${cy + 12} A48 13 0 0 0 178 ${cy + 12} V${cy}`} fill={C.sol} />
              <ellipse cx={130} cy={cy} rx={48} ry={13} fill={C.sol} />
            </g>
          );
        })}
        <Lupa cx={612} cy={262} r={70} angle={45} len={110} />
      </g>
      <g transform="rotate(-15 486 432)">
        <circle cx={486} cy={432} r={50} fill="none" stroke={C.barro} strokeWidth={5} />
        <circle cx={486} cy={432} r={39} fill="none" stroke={C.barro} strokeWidth={2} />
        <text x={486} y={428} textAnchor="middle" fontSize={16} fill={C.barro} letterSpacing="0.08em">FONTE</text>
        <text x={486} y={447} textAnchor="middle" fontSize={11} fill={C.barro} letterSpacing="0.08em">OFICIAL</text>
      </g>
    </Frame>
  );
}

function Pin({ x, y, color, s = 1 }: { x: number; y: number; color: string; s?: number }) {
  // (x, y) = ponta do marcador
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
      <path d="M0 0 C-20 -28 -27 -38 -27 -52 A27 27 0 1 1 27 -52 C27 -38 20 -28 0 0Z" fill={color} />
      <circle cx={0} cy={-53} r={9} fill={C.paper} />
    </g>
  );
}

/** Mapa dobrado com três tipos de destinação: município, aplicação estadual e vários municípios. */
export function MapaArt({ id = 'mapa' }: { id?: string }) {
  return (
    <Frame id={id} label="Ilustração em colagem: mapa de papel dobrado em três partes, sem fronteiras reais, com um marcador laranja rotulado 'município', um azul rotulado 'estadual' e um círculo tracejado com interrogação rotulado 'vários municípios'. Uma régua amarela atravessa a parte de baixo.">
      <rect width={800} height={600} fill={C.mata} />
      <rect width={800} height={600} fill={`url(#${id}-dots)`} opacity={0.12} />
      <g filter={`url(#${id}-rough)`}>
        <polygon points="118,148 298,188 298,528 118,488" fill={C.ink} transform="translate(8 10)" />
        <polygon points="298,188 478,148 478,488 298,528" fill={C.ink} transform="translate(8 10)" />
        <polygon points="478,148 658,188 658,528 478,488" fill={C.ink} transform="translate(8 10)" />
        <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
          <polygon points="110,140 290,180 290,520 110,480" fill={C.paper} />
          <polygon points="290,180 470,140 470,480 290,520" fill={C.paper2} />
          <polygon points="470,140 650,180 650,520 470,480" fill={C.paper} />
        </g>
        <polygon points="290,180 470,140 470,480 290,520" fill={`url(#${id}-dots)`} opacity={0.18} />
        <path d="M120 260 C170 250 200 300 250 290 C300 280 320 230 380 240 C440 250 460 320 520 310 C570 300 600 260 645 270" stroke={C.cobalt} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M130 420 C200 400 250 440 330 410 C400 385 450 420 520 400 C580 385 610 420 640 410" stroke={C.ink} strokeWidth={3} strokeDasharray="2 9" fill="none" strokeLinecap="round" />
        <Pin x={210} y={350} color={C.barro} />
        <Pin x={392} y={300} color={C.cobalt} />
        <circle cx={562} cy={360} r={44} fill={C.paper} stroke={C.ink} strokeWidth={3} strokeDasharray="8 7" />
        <g transform="rotate(-8 450 552)">
          <rect x={300} y={530} width={320} height={40} fill={C.sol} stroke={C.ink} strokeWidth={3} />
          {Array.from({ length: 21 }, (_, i) => <line key={i} x1={312 + i * 14.8} x2={312 + i * 14.8} y1={530} y2={i % 5 === 0 ? 552 : 543} stroke={C.ink} strokeWidth={2} />)}
        </g>
      </g>
      <text x={562} y={377} textAnchor="middle" fontSize={46} fill={C.ink}>?</text>
      <Tag x={210} y={376} text="MUNICÍPIO" />
      <Tag x={392} y={326} text="ESTADUAL" bg={C.cobalt} />
      <Tag x={562} y={426} text="VÁRIOS MUNICÍPIOS" bg={C.sol} fg={C.ink} />
    </Frame>
  );
}

/** Versão compacta (quadrada) da MapaArt, para ficar ao lado do título sem empurrar o mapa interativo. */
export function MapaMiniArt({ id = 'mapa-mini' }: { id?: string }) {
  return (
    <Frame id={id} w={240} h={240} label="Ilustração em colagem: mapa de papel dobrado em três partes, sem fronteiras reais, com um marcador laranja, um marcador azul e um círculo tracejado com interrogação.">
      <rect width={240} height={240} fill={C.mata} />
      <rect width={240} height={240} fill={`url(#${id}-dots)`} opacity={0.12} />
      <g filter={`url(#${id}-rough)`}>
        <g fill={C.ink} transform="translate(6 7)">
          <polygon points="30,60 90,74 90,194 30,180" />
          <polygon points="90,74 150,60 150,180 90,194" />
          <polygon points="150,60 210,74 210,194 150,180" />
        </g>
        <g stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round">
          <polygon points="30,60 90,74 90,194 30,180" fill={C.paper} />
          <polygon points="90,74 150,60 150,180 90,194" fill={C.paper2} />
          <polygon points="150,60 210,74 210,194 150,180" fill={C.paper} />
        </g>
        <polygon points="90,74 150,60 150,180 90,194" fill={`url(#${id}-dots)`} opacity={0.18} />
        <path d="M34 104 C52 98 62 118 80 114 C100 110 106 92 126 96 C146 100 152 124 172 120 C188 116 196 104 208 108" stroke={C.cobalt} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        <path d="M36 164 C60 156 76 170 104 160 C128 152 146 166 170 158 C188 152 198 164 206 160" stroke={C.ink} strokeWidth={2.2} strokeDasharray="2 7" fill="none" strokeLinecap="round" />
        <Pin x={66} y={146} color={C.barro} s={0.56} />
        <Pin x={124} y={128} color={C.cobalt} s={0.48} />
        <circle cx={182} cy={146} r={17} fill={C.paper} stroke={C.ink} strokeWidth={2.5} strokeDasharray="5 5" />
      </g>
      <text x={182} y={153} textAnchor="middle" fontSize={20} fill={C.ink}>?</text>
    </Frame>
  );
}

function Card({ x, y, w = 170, h = 116, rot = 0, bar = C.cobalt, dashed = false }: { x: number; y: number; w?: number; h?: number; rot?: number; bar?: string; dashed?: boolean }) {
  const l = -w / 2, t = -h / 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {!dashed && <rect x={l + 5} y={t + 6} width={w} height={h} fill={C.ink} />}
      <rect x={l} y={t} width={w} height={h} fill={dashed ? 'none' : C.paper} stroke={C.ink} strokeWidth={3} strokeDasharray={dashed ? '10 8' : undefined} />
      {!dashed && <>
        <rect x={l} y={t} width={w} height={22} fill={bar} stroke={C.ink} strokeWidth={3} />
        {[44, 62, 80, 98].map((yy, i) => <line key={yy} x1={l + 16} x2={l + w - 16 - (i === 3 ? 50 : 0)} y1={t + yy} y2={t + yy} stroke={C.ink} strokeWidth={2} />)}
      </>}
    </g>
  );
}

/** Quadro de apuração: fichas ligadas por fios — documentado, em verificação, não identificado. */
export function FluxoArt({ id = 'fluxo' }: { id?: string }) {
  const p1: [number, number] = [140, 132], p2: [number, number] = [430, 104], p3: [number, number] = [300, 352], p4: [number, number] = [610, 342];
  return (
    <Frame id={id} label="Ilustração em colagem: quadro com quatro fichas presas por alfinetes. Um fio contínuo liga as duas primeiras (documentado), um fio tracejado liga a segunda à terceira (em verificação) e um fio interrompido com interrogação leva a uma ficha vazia tracejada (não identificado).">
      <rect width={800} height={600} fill={C.rosa} />
      <rect width={800} height={600} fill={`url(#${id}-dots-lg)`} opacity={0.1} />
      <g filter={`url(#${id}-rough)`}>
        <Card x={140} y={190} rot={-4} bar={C.cobalt} />
        <Card x={430} y={162} rot={3} bar={C.barro} />
        <Card x={300} y={410} rot={2} bar={C.sol} />
        <Card x={610} y={400} rot={-3} dashed />
        <line x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
        <line x1={p2[0]} y1={p2[1]} x2={p3[0]} y2={p3[1]} stroke={C.ink} strokeWidth={4} strokeDasharray="14 10" strokeLinecap="round" />
        <line x1={p3[0]} y1={p3[1]} x2={410} y2={348} stroke={C.ink} strokeWidth={3} strokeDasharray="3 9" strokeLinecap="round" />
        <line x1={520} y1={345} x2={p4[0]} y2={p4[1]} stroke={C.ink} strokeWidth={3} strokeDasharray="3 9" strokeLinecap="round" />
        <circle cx={465} cy={346} r={24} fill={C.sol} stroke={C.ink} strokeWidth={3} />
        {[p1, p2, p3, p4].map(([x, y], i) => (
          <g key={i}><circle cx={x} cy={y} r={11} fill={C.barro} stroke={C.ink} strokeWidth={3} /><circle cx={x - 3} cy={y - 3} r={3} fill={C.paper} /></g>
        ))}
      </g>
      <text x={465} y={357} textAnchor="middle" fontSize={28} fill={C.ink}>?</text>
      <Tag x={285} y={80} text="DOCUMENTADO" />
      <Tag x={420} y={262} text="EM VERIFICAÇÃO" bg={C.cobalt} />
      <Tag x={610} y={480} text="NÃO IDENTIFICADO" bg={C.sol} fg={C.ink} />
    </Frame>
  );
}

/** Plenário visto de cima: cadeiras vazias, com autoria individual, de bancada e de comissão. */
export function AutoresArt({ id = 'autores' }: { id?: string }) {
  const cx = 400, cy = 540;
  const rows = [150, 210, 270, 330];
  const seats = rows.flatMap((r, ri) => {
    const n = Math.round(r / 22);
    return Array.from({ length: n }, (_, i) => {
      const a = Math.PI + (Math.PI * (i + 0.5)) / n;
      return { ri, i, a: a / Math.PI, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), deg: (a * 180) / Math.PI + 90 };
    });
  });
  // individual = uma cadeira; bancada e comissão = fatias contínuas do plenário (autoria coletiva)
  const fill = (s: { ri: number; i: number; a: number }) => (s.ri === 2 && s.i === 3 ? C.sol : s.a >= 1.55 && s.a <= 1.68 ? C.cobalt : s.a >= 1.79 && s.a <= 1.92 ? C.mata : C.paper);
  const at = (turn: number, r: number, dy: number): [number, number] => [cx + r * Math.cos(Math.PI * turn), cy + r * Math.sin(Math.PI * turn) + dy];
  return (
    <Frame id={id} label="Ilustração em colagem: plenário visto de cima, com fileiras de cadeiras vazias em semicírculo. Uma cadeira amarela marca autoria individual, um grupo azul marca bancada e um grupo verde marca comissão. Não há pessoas.">
      <rect width={800} height={600} fill={C.barro} />
      <g filter={`url(#${id}-rough)`}>
        <path d={`M${cx - 370} ${cy} A370 370 0 0 1 ${cx + 370} ${cy}Z`} fill={C.rosa} stroke={C.ink} strokeWidth={3} />
        <path d={`M${cx - 370} ${cy} A370 370 0 0 1 ${cx + 370} ${cy}Z`} fill={`url(#${id}-dots-lg)`} opacity={0.12} />
        {seats.map(s => (
          <g key={`${s.ri}-${s.i}`} transform={`translate(${s.x} ${s.y}) rotate(${s.deg})`}>
            <rect x={-12} y={-9} width={24} height={18} rx={4} fill={fill(s)} stroke={C.ink} strokeWidth={2.5} />
          </g>
        ))}
        <rect x={355} y={470} width={90} height={60} fill={C.ink} />
        <rect x={365} y={478} width={70} height={14} fill={C.paper} />
        <rect x={0} y={540} width={800} height={60} fill={C.ink} />
      </g>
      <Tag x={at(1 + 3.5 / 12, 270, -30)[0]} y={at(1 + 3.5 / 12, 270, -30)[1]} text="INDIVIDUAL" bg={C.sol} fg={C.ink} />
      <Tag x={at(1.615, 372, 0)[0]} y={at(1.615, 372, 0)[1]} text="BANCADA" bg={C.cobalt} />
      <Tag x={at(1.855, 372, 0)[0] - 10} y={at(1.855, 372, 0)[1]} text="COMISSÃO" />
    </Frame>
  );
}

/**
 * Contorno do Ceará como papel recortado (viewBox local 600 × 733), simplificado
 * a partir da malha do IBGE em `lib/malha-ce.json`. Só a silhueta: sem municípios nem pontos.
 */
const CEARA_PTS = '209,10 311,63 398,130 425,134 491,212 600,296 544,310 475,449 416,494 395,568 404,579 382,598 394,638 415,653 398,690 353,733 280,693 282,679 246,659 128,657 151,582 98,560 73,472 70,346 24,302 46,202 42,181 25,179 25,134 7,113 13,87 0,82 23,44 13,20 132,0';
function CearaRecorte({ x, y, s = 1, rot = 0, fill = C.sol, id }: { x: number; y: number; s?: number; rot?: number; fill?: string; id: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <polygon points={CEARA_PTS} fill={C.ink} transform="translate(13 15)" />
      <polygon points={CEARA_PTS} fill={fill} stroke={C.ink} strokeWidth={3 / s} strokeLinejoin="round" />
      <polygon points={CEARA_PTS} fill={`url(#${id}-dots-lg)`} opacity={0.14} />
    </g>
  );
}

/** Caneta esferográfica deitada; (x, y) = ponta, `rot` = direção do corpo. */
function Caneta({ x, y, rot, color = C.cobalt }: { x: number; y: number; rot: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round">
      <rect x={26} y={-5} width={172} height={20} fill={C.ink} stroke="none" />
      <polygon points="0,0 26,-10 26,10" fill={C.paper} />
      <polygon points="0,0 8,-3 8,3" fill={C.ink} />
      <rect x={26} y={-10} width={150} height={20} fill={color} />
      <rect x={176} y={-10} width={22} height={20} fill={C.ink} />
      <rect x={150} y={-10} width={7} height={20} fill={C.ink} stroke="none" />
      <path d="M156 -10 V-17 H196" fill="none" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

/**
 * Emendas estaduais: o contorno do Ceará em papel recortado, uma indicação que vira linha
 * numa planilha do orçamento do Estado — algumas linhas preenchidas e marcadas a caneta,
 * outras em branco (cobertura parcial) — e o carimbo "PCF".
 */
export function EstaduaisArt({ id = 'estaduais' }: { id?: string }) {
  const w = 300, h = 380, l = -w / 2, t = -h / 2, head = 44, rowH = 36;
  const c1 = l + 58, c2 = l + w - 92;
  // linhas com dado (índice → comprimento do texto) e linhas em branco
  const filled: Record<number, number> = { 0: 0.9, 2: 0.7, 3: 0.82, 6: 0.6 };
  const rows = Array.from({ length: 9 }, (_, i) => i);
  return (
    <Frame id={id} label="Ilustração em colagem: o contorno do estado do Ceará recortado em papel amarelo, atrás de uma planilha do orçamento estadual. Um pequeno documento de indicação é ligado por uma linha pontilhada a uma das linhas da planilha. Algumas linhas estão preenchidas e marcadas a caneta azul; outras estão em branco. Um carimbo laranja diz 'PCF' e uma caneta azul está deitada sobre a cena.">
      <rect width={800} height={600} fill={C.mata} />
      <rect width={800} height={600} fill={`url(#${id}-dots)`} opacity={0.1} />
      <g filter={`url(#${id}-rough)`}>
        <CearaRecorte x={118} y={56} s={0.64} rot={-5} id={id} />

        {/* planilha do orçamento estadual */}
        <g transform="translate(522 318) rotate(4)">
          <rect x={l + 7} y={t + 9} width={w} height={h} fill={C.ink} />
          <rect x={l} y={t} width={w} height={h} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <rect x={l} y={t} width={w} height={head} fill={C.ink} />
          <rect x={c1 + 4} y={t + head + rowH * 2 + 5} width={c2 - c1 - 8} height={rowH - 10} fill={C.sol} />
          <g stroke={C.ink} strokeWidth={1.6}>
            {rows.map(i => <line key={i} x1={l} x2={l + w} y1={t + head + rowH * (i + 1)} y2={t + head + rowH * (i + 1)} />)}
            <line x1={c1} x2={c1} y1={t + head} y2={t + h} />
            <line x1={c2} x2={c2} y1={t + head} y2={t + h} />
          </g>
          {rows.map(i => {
            const cy = t + head + rowH * i + rowH / 2;
            const len = filled[i];
            if (len === undefined) {
              return <line key={i} x1={c1 + 12} x2={c2 - 14} y1={cy + 4} y2={cy + 4} stroke={C.ink} strokeWidth={1.6} strokeDasharray="3 7" opacity={0.45} />;
            }
            return (
              <g key={i}>
                <rect x={l + 12} y={cy - 4} width={24} height={7} fill={C.ink} />
                <line x1={c1 + 12} x2={c1 + 12 + (c2 - c1 - 26) * len} y1={cy} y2={cy} stroke={C.ink} strokeWidth={3} />
                <rect x={c2 + 14} y={cy - 5} width={60} height={9} fill={C.ink} />
                <path d={`M${c1 + 10} ${cy + 9} q${(c2 - c1) * 0.2} 4 ${(c2 - c1) * 0.42} 0 t${(c2 - c1) * 0.42} 1`} stroke={C.cobalt} strokeWidth={3} fill="none" strokeLinecap="round" />
                <path d={`M${l + 40} ${cy - 2} l5 6 l9 -12`} stroke={C.cobalt} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );
          })}
        </g>

        {/* a indicação que vira linha do orçamento */}
        <path d="M252 214 C300 196 330 250 372 252" stroke={C.ink} strokeWidth={4} strokeDasharray="1 11" strokeLinecap="round" fill="none" />
        <Doc x={222} y={232} w={56} h={72} rot={-9} />

        <Caneta x={388} y={402} rot={150} />
      </g>
      <text x={391} y={164} fontSize={13} fill={C.paper} letterSpacing="0.06em" transform="rotate(4 522 318)">ORÇAMENTO · CE</text>
      <g transform="rotate(-12 606 458)">
        <rect x={550} y={430} width={112} height={56} fill="none" stroke={C.barro} strokeWidth={5} />
        <rect x={558} y={438} width={96} height={40} fill="none" stroke={C.barro} strokeWidth={2} />
        <text x={606} y={469} textAnchor="middle" fontSize={28} fill={C.barro} letterSpacing="0.12em">PCF</text>
      </g>
    </Frame>
  );
}

/**
 * Fontes e metodologia: gaveta de arquivo com pastas etiquetadas por fonte oficial, uma
 * planilha puxada para fora, um cadeado com "SHA-256" e o carimbo "cópia datada".
 */
export function DadosArt({ id = 'dados' }: { id?: string }) {
  const folders: { y: number; tx: number; fill: string; fg: string; label: string }[] = [
    { y: 214, tx: 186, fill: C.paper, fg: C.ink, label: 'CGU' },
    { y: 238, tx: 290, fill: C.cobalt, fg: C.paper, label: 'CÂMARA' },
    { y: 262, tx: 372, fill: C.paper2, fg: C.ink, label: 'SENADO' },
    { y: 286, tx: 204, fill: C.barro, fg: C.paper, label: 'IBGE' },
    { y: 310, tx: 330, fill: C.paper, fg: C.ink, label: 'CEARÁ' },
  ];
  const Folder = ({ f }: { f: (typeof folders)[number] }) => (
    <g stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round">
      <path d={`M${f.tx} ${f.y} V${f.y - 26} H${f.tx + 96} V${f.y}`} fill={f.fill} />
      <rect x={176} y={f.y} width={448} height={120} fill={f.fill} />
    </g>
  );
  return (
    <Frame id={id} label="Ilustração em colagem: gaveta de arquivo aberta com pastas suspensas etiquetadas 'CGU', 'Câmara', 'Senado', 'IBGE' e 'Ceará'. De uma delas sai uma planilha quadriculada. Na frente, um cadeado fechado com a inscrição 'SHA-256' e um carimbo laranja que diz 'cópia datada'.">
      <rect width={800} height={600} fill={C.sol} />
      <rect width={800} height={600} fill={`url(#${id}-dots-lg)`} opacity={0.1} />
      <g filter={`url(#${id}-rough)`}>
        {/* laterais da gaveta */}
        <polygon points="140,362 172,300 172,540 140,540" fill={C.paper2} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
        <polygon points="660,362 628,300 628,540 660,540" fill={C.paper2} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
        <rect x={172} y={300} width={456} height={240} fill={C.ink} />

        {folders.slice(0, 3).map(f => <Folder key={f.label} f={f} />)}
        {/* planilha puxada para fora */}
        <g transform="rotate(7 540 200)">
          <rect x={478} y={100} width={136} height={196} fill={C.ink} transform="translate(5 6)" />
          <rect x={478} y={100} width={136} height={196} fill={C.paper} stroke={C.ink} strokeWidth={2.5} />
          <rect x={478} y={100} width={136} height={24} fill={C.cobalt} stroke={C.ink} strokeWidth={2.5} />
          <g stroke={C.ink} strokeWidth={1.4}>
            {[148, 172, 196, 220, 244, 268].map(y => <line key={y} x1={478} x2={614} y1={y} y2={y} />)}
            {[512, 546, 580].map(x => <line key={x} x1={x} x2={x} y1={124} y2={296} />)}
          </g>
          {[[512, 124], [546, 148], [512, 172], [580, 196], [546, 220], [512, 244]].map(([x, y]) => <rect key={`${x}-${y}`} x={x + 6} y={y + 8} width={22} height={8} fill={C.ink} />)}
        </g>
        {folders.slice(3).map(f => <Folder key={f.label} f={f} />)}

        {/* frente da gaveta */}
        <rect x={146} y={368} width={520} height={176} fill={C.ink} />
        <rect x={140} y={362} width={520} height={176} fill={C.paper} stroke={C.ink} strokeWidth={3} />
        <rect x={140} y={362} width={520} height={176} fill={`url(#${id}-dots)`} opacity={0.08} />
        <rect x={350} y={400} width={100} height={18} rx={9} fill={C.ink} />
        <rect x={355} y={436} width={90} height={38} fill={C.paper2} stroke={C.ink} strokeWidth={2.5} />

        {/* cadeado */}
        <path d="M176 412 V384 A32 32 0 0 1 240 384 V412" fill="none" stroke={C.ink} strokeWidth={13} strokeLinecap="round" />
        <rect x={155} y={405} width={106} height={80} fill={C.ink} transform="translate(5 6)" />
        <rect x={155} y={405} width={106} height={80} fill={C.cobalt} stroke={C.ink} strokeWidth={3} />
        <rect x={155} y={405} width={106} height={80} fill={`url(#${id}-dots-paper)`} opacity={0.2} />
        <circle cx={208} cy={428} r={7} fill={C.ink} />
        <rect x={205} y={430} width={6} height={13} fill={C.ink} />
      </g>
      <text x={400} y={461} textAnchor="middle" fontSize={12} fill={C.ink} letterSpacing="0.08em">FONTES</text>
      <text x={208} y={469} textAnchor="middle" fontSize={13} fill={C.paper} letterSpacing="0.04em">SHA-256</text>
      {folders.map(f => <text key={f.label} x={f.tx + 48} y={f.y - 9} textAnchor="middle" fontSize={11} fill={f.fg} letterSpacing="0.06em">{f.label}</text>)}
      <g transform="rotate(-8 566 482)">
        <rect x={488} y={452} width={156} height={60} fill="none" stroke={C.barro} strokeWidth={5} />
        <rect x={496} y={460} width={140} height={44} fill="none" stroke={C.barro} strokeWidth={2} />
        <text x={566} y={479} textAnchor="middle" fontSize={10} fill={C.barro} letterSpacing="0.12em">EXTRAÇÃO</text>
        <text x={566} y={497} textAnchor="middle" fontSize={14} fill={C.barro} letterSpacing="0.06em">CÓPIA DATADA</text>
      </g>
    </Frame>
  );
}

/** Sobre: caderno de campo aberto, com a trilha de três pontos, a lista conferida, lápis, moeda e o Ceará. */
export function SobreArt({ id = 'sobre' }: { id?: string }) {
  const rings = Array.from({ length: 9 }, (_, i) => 172 + i * 38);
  const items = [196, 244, 292, 340, 388, 436];
  return (
    <Frame id={id} label="Ilustração em colagem: caderno de campo aberto sobre fundo verde. Na página da esquerda, uma trilha pontilhada passa por três pontos coloridos e termina num marcador; na da direita, uma lista com marcas de conferido. Um lápis laranja, uma moeda e o contorno do Ceará em papel amarelo aparecem ao redor.">
      <rect width={800} height={600} fill={C.mataLight} />
      <rect width={800} height={600} fill={`url(#${id}-dots)`} opacity={0.1} />
      <g filter={`url(#${id}-rough)`}>
        <CearaRecorte x={566} y={22} s={0.36} rot={9} id={id} />
        <g transform="rotate(-4 400 330)">
          <rect x={128} y={150} width={560} height={360} fill={C.ink} />
          <rect x={120} y={140} width={280} height={360} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <rect x={400} y={140} width={280} height={360} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <rect x={400} y={140} width={280} height={360} fill={`url(#${id}-dots)`} opacity={0.06} />
          <rect x={150} y={172} width={120} height={13} fill={C.ink} />
          <rect x={150} y={194} width={76} height={7} fill={C.ink} />
          <path d="M168 440 C200 400 214 336 268 320 C318 306 336 262 350 236" stroke={C.ink} strokeWidth={4} strokeDasharray="1 12" strokeLinecap="round" fill="none" />
          <circle cx={168} cy={440} r={13} fill={C.cobalt} stroke={C.ink} strokeWidth={3} />
          <circle cx={268} cy={320} r={13} fill={C.barro} stroke={C.ink} strokeWidth={3} />
          <circle cx={314} cy={292} r={9} fill={C.sol} stroke={C.ink} strokeWidth={3} />
          <Pin x={354} y={232} color={C.barro} s={0.62} />
          <rect x={436} y={items[2] - 13} width={214} height={26} fill={C.sol} />
          {items.map((y, i) => (
            <g key={y}>
              <rect x={436} y={y - 10} width={20} height={20} fill={C.paper} stroke={C.ink} strokeWidth={2.5} />
              {i < 4 && <path d={`M439 ${y} l6 7 l10 -14`} stroke={C.cobalt} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
              <line x1={470} x2={640 - (i % 3) * 36} y1={y} y2={y} stroke={C.ink} strokeWidth={2.2} />
            </g>
          ))}
          {rings.map(y => <ellipse key={y} cx={400} cy={y} rx={15} ry={6} fill="none" stroke={C.ink} strokeWidth={3} />)}
        </g>
        <Caneta x={612} y={556} rot={196} color={C.barro} />
        <Coin x={118} y={538} r={30} />
      </g>
    </Frame>
  );
}

/** Contato: envelope aberto com uma carta, selo de três pontos, avião de papel e balão com pergunta. */
export function ContatoArt({ id = 'contato' }: { id?: string }) {
  return (
    <Frame id={id} label="Ilustração em colagem: envelope azul aberto sobre fundo rosa, com uma carta saindo e uma linha marcada em amarelo. No envelope, um selo amarelo com três pontos. Um avião de papel deixa uma trilha pontilhada no alto e um balão de conversa amarelo traz um ponto de interrogação.">
      <rect width={800} height={600} fill={C.rosa} />
      <rect width={800} height={600} fill={`url(#${id}-dots-lg)`} opacity={0.1} />
      <g filter={`url(#${id}-rough)`}>
        <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
          <rect x={248} y={290} width={380} height={240} fill={C.ink} stroke="none" />
          <rect x={240} y={280} width={380} height={240} fill={C.cobalt} />
          <polygon points="240,282 430,170 620,282" fill={C.cobalt} />
        </g>
        <g transform="rotate(-3 430 280)">
          <rect x={276} y={150} width={310} height={260} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <rect x={304} y={180} width={150} height={15} fill={C.ink} />
          <rect x={300} y={243} width={250} height={20} fill={C.sol} />
          {[222, 253, 284, 315].map((y, i) => <line key={y} x1={306} x2={556 - (i === 3 ? 80 : 0)} y1={y} y2={y} stroke={C.ink} strokeWidth={2.4} />)}
        </g>
        <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
          <polygon points="240,282 430,410 240,520" fill={C.cobalt} />
          <polygon points="620,282 430,410 620,520" fill={C.cobalt} />
          <polygon points="240,520 430,388 620,520" fill={C.cobalt} />
        </g>
        <polygon points="240,520 430,388 620,520" fill={`url(#${id}-dots-paper)`} opacity={0.22} />
        <rect x={522} y={436} width={70} height={60} fill={C.sol} stroke={C.ink} strokeWidth={3} strokeDasharray="6 4" />
        <circle cx={540} cy={466} r={7} fill={C.cobalt} stroke={C.ink} strokeWidth={2} />
        <circle cx={557} cy={466} r={7} fill={C.barro} stroke={C.ink} strokeWidth={2} />
        <circle cx={574} cy={466} r={7} fill={C.ink} />
        <path d="M24 214 C46 170 82 156 116 140" stroke={C.ink} strokeWidth={4} strokeDasharray="1 11" strokeLinecap="round" fill="none" />
        <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
          <polygon points="120,138 262,72 190,158" fill={C.paper} />
          <polygon points="190,158 262,72 182,180" fill={C.paper2} />
        </g>
        <path d="M110 520 L92 566 L150 532" fill={C.sol} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
        <circle cx={142} cy={470} r={62} fill={C.sol} stroke={C.ink} strokeWidth={3} />
      </g>
      <text x={142} y={492} textAnchor="middle" fontSize={64} fill={C.ink}>?</text>
    </Frame>
  );
}

/** Correções: documento com um valor riscado e o novo escrito por cima, registro anterior guardado atrás, borracha e carimbo. */
export function CorrecoesArt({ id = 'correcoes' }: { id?: string }) {
  const rows = [190, 226, 262, 298, 372, 408, 444, 480];
  return (
    <Frame id={id} label="Ilustração em colagem: folha com linhas de texto em que um valor, representado por uma barra preta, foi riscado em laranja e reescrito à caneta azul logo acima. Atrás, uma folha tracejada guarda o registro anterior. Ao lado, uma borracha e uma caneta azul; um carimbo laranja diz 'corrigido com fonte e data'.">
      <rect width={800} height={600} fill={C.paper2} />
      <rect width={800} height={600} fill={`url(#${id}-dots)`} opacity={0.08} />
      <g filter={`url(#${id}-rough)`}>
        <g transform="rotate(-9 260 250)">
          <rect x={110} y={60} width={300} height={380} fill={C.paper} stroke={C.ink} strokeWidth={3} strokeDasharray="12 8" />
          {[110, 140, 170].map(y => <line key={y} x1={136} x2={360} y1={y} y2={y} stroke={C.ink} strokeWidth={2} opacity={0.4} />)}
        </g>
        <g transform="rotate(3 400 310)">
          <rect x={198} y={100} width={420} height={440} fill={C.ink} />
          <rect x={190} y={90} width={420} height={440} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <rect x={222} y={124} width={200} height={18} fill={C.ink} />
          {rows.map((y, i) => <line key={y} x1={222} x2={578 - (i % 3) * 44} y1={y} y2={y} stroke={C.ink} strokeWidth={2.4} />)}
          <line x1={222} x2={350} y1={336} y2={336} stroke={C.ink} strokeWidth={2.4} />
          <rect x={382} y={326} width={150} height={20} fill={C.ink} />
          <line x1={372} y1={352} x2={544} y2={318} stroke={C.barro} strokeWidth={7} strokeLinecap="round" />
          <path d="M382 302 q18 -11 36 0 t36 0 t36 0 t36 0" stroke={C.cobalt} strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d="M364 330 l10 -16 l10 16" stroke={C.cobalt} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <Caneta x={566} y={288} rot={-28} />
        <g transform="rotate(-18 150 488)" stroke={C.ink} strokeWidth={3}>
          <rect x={86} y={462} width={130} height={54} fill={C.ink} stroke="none" transform="translate(5 6)" />
          <rect x={86} y={462} width={90} height={54} fill={C.rosa} />
          <rect x={176} y={462} width={40} height={54} fill={C.cobalt} />
        </g>
        {[[232, 546], [250, 556], [222, 562]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={4} fill={C.rosa} stroke={C.ink} strokeWidth={1.5} />)}
      </g>
      <g transform="rotate(-7 600 500)">
        <rect x={500} y={462} width={200} height={70} fill="none" stroke={C.barro} strokeWidth={5} />
        <rect x={508} y={470} width={184} height={54} fill="none" stroke={C.barro} strokeWidth={2} />
        <text x={600} y={500} textAnchor="middle" fontSize={24} fill={C.barro} letterSpacing="0.1em">CORRIGIDO</text>
        <text x={600} y={516} textAnchor="middle" fontSize={10} fill={C.barro} letterSpacing="0.12em">COM FONTE E DATA</text>
      </g>
    </Frame>
  );
}

/** Reportagens: máquina de escrever com uma folha de manchete, entre páginas já impressas. */
export function ReportagensArt({ id = 'reportagens' }: { id?: string }) {
  const keyRows = [{ y: 424, n: 9, x0: 268 }, { y: 452, n: 8, x0: 284 }, { y: 480, n: 7, x0: 300 }];
  return (
    <Frame id={id} label="Ilustração em colagem: máquina de escrever laranja sobre fundo azul, com uma folha saindo do rolo. Na folha, uma manchete em barras pretas, um quadro amarelo e linhas de texto. Duas páginas impressas estão ao lado, uma delas com uma linha marcada em amarelo.">
      <rect width={800} height={600} fill={C.cobalt} />
      <rect width={800} height={600} fill={`url(#${id}-dots-paper)`} opacity={0.12} />
      <g filter={`url(#${id}-rough)`}>
        <Doc x={120} y={260} w={120} h={156} rot={-9} />
        <Doc x={684} y={236} w={112} h={146} rot={8} mark />
        <g>
          <rect x={288} y={104} width={224} height={260} fill={C.ink} transform="translate(5 6)" />
          <rect x={288} y={104} width={224} height={260} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <rect x={312} y={130} width={176} height={20} fill={C.ink} />
          <rect x={312} y={158} width={120} height={12} fill={C.ink} />
          <rect x={312} y={186} width={78} height={64} fill={C.sol} stroke={C.ink} strokeWidth={2.5} />
          <rect x={312} y={186} width={78} height={64} fill={`url(#${id}-dots)`} opacity={0.3} />
          {[192, 208, 224, 240].map(y => <line key={y} x1={402} x2={488} y1={y} y2={y} stroke={C.ink} strokeWidth={2} />)}
          {[272, 288, 304, 320].map((y, i) => <line key={y} x1={312} x2={488 - (i === 3 ? 60 : 0)} y1={y} y2={y} stroke={C.ink} strokeWidth={2} />)}
        </g>
        <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
          <polygon points="226,528 262,388 538,388 574,528" fill={C.ink} stroke="none" transform="translate(6 8)" />
          <polygon points="226,528 262,388 538,388 574,528" fill={C.barro} />
          <rect x={240} y={340} width={320} height={40} rx={20} fill={C.ink} />
          <circle cx={232} cy={360} r={22} fill={C.sol} />
          <circle cx={568} cy={360} r={22} fill={C.sol} />
          <rect x={250} y={406} width={300} height={108} fill={C.ink} />
        </g>
        <polygon points="226,528 262,388 538,388 574,528" fill={`url(#${id}-dots)`} opacity={0.12} />
        {keyRows.map(r => Array.from({ length: r.n }, (_, i) => <circle key={`${r.y}-${i}`} cx={r.x0 + i * 33} cy={r.y} r={10} fill={C.paper} stroke={C.ink} strokeWidth={2} />))}
        <rect x={334} y={498} width={132} height={10} rx={5} fill={C.paper} />
        <rect x={196} y={526} width={408} height={22} fill={C.ink} />
      </g>
    </Frame>
  );
}

/** Privacidade: ficha com dados pessoais cobertos por tarjas, cadeado e carimbo "LGPD". */
export function PrivacidadeArt({ id = 'privacidade' }: { id?: string }) {
  const rows: { y: number; tarja: boolean; len: number }[] = [
    { y: 196, tarja: false, len: 190 }, { y: 240, tarja: true, len: 170 }, { y: 284, tarja: false, len: 150 },
    { y: 328, tarja: true, len: 130 }, { y: 372, tarja: false, len: 200 }, { y: 416, tarja: false, len: 120 }, { y: 460, tarja: true, len: 160 },
  ];
  return (
    <Frame id={id} label="Ilustração em colagem: ficha de papel sobre fundo verde, com linhas de texto em que três trechos estão cobertos por tarjas pretas. Ao lado, um cadeado azul fechado e um carimbo circular laranja com a inscrição 'LGPD'.">
      <rect width={800} height={600} fill={C.mata} />
      <rect width={800} height={600} fill={`url(#${id}-dots)`} opacity={0.12} />
      <g filter={`url(#${id}-rough)`}>
        <g transform="rotate(-4 340 320)">
          <rect x={168} y={110} width={360} height={420} fill={C.ink} />
          <rect x={160} y={100} width={360} height={420} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <rect x={190} y={132} width={170} height={18} fill={C.ink} />
          {rows.map(r => (
            <g key={r.y}>
              <rect x={190} y={r.y - 5} width={64} height={10} fill={C.ink} opacity={0.75} />
              {r.tarja
                ? <rect x={270} y={r.y - 12} width={r.len + 50} height={24} fill={C.ink} />
                : <line x1={270} x2={270 + r.len} y1={r.y} y2={r.y} stroke={C.ink} strokeWidth={2.4} />}
            </g>
          ))}
        </g>
        <path d="M584 362 V318 A44 44 0 0 1 672 318 V362" fill="none" stroke={C.ink} strokeWidth={16} strokeLinecap="round" />
        <rect x={560} y={352} width={136} height={112} fill={C.ink} transform="translate(6 7)" />
        <rect x={560} y={352} width={136} height={112} fill={C.cobalt} stroke={C.ink} strokeWidth={3} />
        <rect x={560} y={352} width={136} height={112} fill={`url(#${id}-dots-paper)`} opacity={0.2} />
        <circle cx={628} cy={396} r={10} fill={C.ink} />
        <rect x={623} y={398} width={10} height={22} fill={C.ink} />
      </g>
      <g transform="rotate(12 640 170)">
        <circle cx={640} cy={170} r={64} fill="none" stroke={C.barro} strokeWidth={6} />
        <circle cx={640} cy={170} r={50} fill="none" stroke={C.barro} strokeWidth={2} />
        <text x={640} y={182} textAnchor="middle" fontSize={32} fill={C.barro} letterSpacing="0.1em">LGPD</text>
      </g>
    </Frame>
  );
}

/** Página não encontrada: um mapa rasgado; a trilha sai pela borda e termina numa interrogação. */
export function ForaDoMapaArt({ id = 'fora-do-mapa' }: { id?: string }) {
  const torn = '520,160 544,204 512,246 540,292 506,338 538,384 510,430 530,480';
  return (
    <Frame id={id} label="Ilustração em colagem: pedaço de mapa de papel dobrado, com a borda direita rasgada, sobre fundo amarelo. Uma trilha pontilhada sai de um marcador laranja, atravessa o mapa, passa pela borda rasgada e termina num círculo tracejado com um ponto de interrogação, fora do papel. Uma lupa olha para o vazio.">
      <rect width={800} height={600} fill={C.sol} />
      <rect width={800} height={600} fill={`url(#${id}-dots-lg)`} opacity={0.1} />
      <g filter={`url(#${id}-rough)`}>
        <g fill={C.ink} transform="translate(8 10)">
          <polygon points="110,160 320,200 320,520 110,480" />
          <polygon points={`320,200 ${torn} 320,520`} />
        </g>
        <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
          <polygon points="110,160 320,200 320,520 110,480" fill={C.paper} />
          <polygon points={`320,200 ${torn} 320,520`} fill={C.paper2} />
        </g>
        <polygon points={`320,200 ${torn} 320,520`} fill={`url(#${id}-dots)`} opacity={0.16} />
        <path d="M130 300 C190 280 230 330 300 310 C380 290 420 250 500 262" stroke={C.cobalt} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M170 404 C240 380 300 420 380 360 C440 316 520 300 600 280 C640 270 660 250 668 236" stroke={C.ink} strokeWidth={4} strokeDasharray="1 12" strokeLinecap="round" fill="none" />
        <Pin x={170} y={404} color={C.barro} />
        <circle cx={680} cy={200} r={48} fill={C.paper} stroke={C.ink} strokeWidth={3} strokeDasharray="8 7" />
        <Lupa cx={640} cy={440} r={56} angle={50} len={80} />
      </g>
      <text x={680} y={218} textAnchor="middle" fontSize={50} fill={C.ink}>?</text>
    </Frame>
  );
}

/** Reportagem 03: documentos entram num funil de papel; a trilha que sai embaixo vai sumindo até uma interrogação. */
export function FunilArt({ id = 'funil' }: { id?: string }) {
  const trilha: [number, number, number][] = [[400, 404, 1], [414, 436, 0.85], [438, 464, 0.7], [470, 486, 0.55], [506, 500, 0.4], [544, 508, 0.28]];
  return (
    <Frame id={id} label="Ilustração em colagem: três documentos caem dentro de um funil de papel sobre fundo laranja. Pela boca estreita do funil sai uma trilha de pontos que vai ficando mais fraca até terminar num círculo tracejado com um ponto de interrogação.">
      <rect width={800} height={600} fill={C.barro} />
      <rect width={800} height={600} fill={`url(#${id}-dots-lg)`} opacity={0.1} />
      <g filter={`url(#${id}-rough)`}>
        <Doc x={272} y={96} w={84} h={108} rot={-14} />
        <Doc x={524} y={92} w={84} h={108} rot={13} mark />
        <Doc x={398} y={76} w={90} h={116} rot={3} stamp={C.barro} />
        <polygon points="178,166 630,166 452,344 356,344" fill={C.ink} transform="translate(8 10)" />
        <polygon points="178,166 630,166 452,344 356,344" fill={C.paper} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
        <polygon points="404,166 630,166 452,344 404,344" fill={`url(#${id}-dots)`} opacity={0.14} />
        <ellipse cx={404} cy={166} rx={226} ry={22} fill={C.paper2} stroke={C.ink} strokeWidth={3} />
        <ellipse cx={404} cy={166} rx={190} ry={12} fill={C.ink} opacity={0.85} />
        <rect x={378} y={344} width={52} height={40} fill={C.paper2} stroke={C.ink} strokeWidth={3} />
        <line x1={250} x2={560} y1={230} y2={230} stroke={C.ink} strokeWidth={2} opacity={0.35} />
        <line x1={310} x2={500} y1={290} y2={290} stroke={C.ink} strokeWidth={2} opacity={0.35} />
        {trilha.map(([x, y, o]) => <circle key={x} cx={x} cy={y} r={9} fill={C.sol} stroke={C.ink} strokeWidth={2.5} opacity={o} />)}
        <circle cx={622} cy={500} r={50} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="8 7" />
      </g>
      <text x={622} y={518} textAnchor="middle" fontSize={52} fill={C.ink}>?</text>
    </Frame>
  );
}

/** Ponto dentro do contorno do Ceará (coordenadas locais de CEARA_PTS). */
const CEARA_POLY = CEARA_PTS.split(' ').map(p => p.split(',').map(Number) as [number, number]);
function dentroDoCeara(x: number, y: number) {
  let dentro = false;
  for (let i = 0, j = CEARA_POLY.length - 1; i < CEARA_POLY.length; j = i++) {
    const [xi, yi] = CEARA_POLY[i], [xj, yj] = CEARA_POLY[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}
/** Grade com deslocamento fixo (determinístico) de pontos dentro do contorno, afastados da borda. */
const PONTOS_CEARA = (() => {
  const pts: [number, number][] = [];
  for (let gy = 60; gy < 700; gy += 58) for (let gx = 40; gx < 580; gx += 58) {
    const k = gx * 7 + gy * 13;
    const x = gx + Math.sin(k) * 14, y = gy + Math.cos(k) * 14;
    if ([[0, 0], [26, 0], [-26, 0], [0, 26], [0, -26]].every(([dx, dy]) => dentroDoCeara(x + dx, y + dy))) pts.push([x, y]);
  }
  return pts;
})();

/** Reportagem 02: o mesmo estado em dois recortes — poucos pontos pela localidade da emenda, muitos pela aplicação do pagamento. */
export function DoisMapasArt({ id = 'dois-mapas' }: { id?: string }) {
  const s = 0.5;
  const poucos = PONTOS_CEARA.filter((_, i) => i % 9 === 4);
  return (
    <Frame id={id} label="Ilustração em colagem: dois recortes de papel do contorno do Ceará lado a lado sobre fundo rosa, separados por um sinal de diferente. O da esquerda, em papel claro, tem poucos pontos laranja; o da direita, em amarelo, está coberto de pontos azuis.">
      <rect width={800} height={600} fill={C.rosa} />
      <rect width={800} height={600} fill={`url(#${id}-dots-lg)`} opacity={0.1} />
      <g filter={`url(#${id}-rough)`}>
        <CearaRecorte x={58} y={118} s={s} rot={-4} fill={C.paper} id={id} />
        <CearaRecorte x={438} y={104} s={s} rot={3} fill={C.sol} id={id} />
        <g transform={`translate(58 118) rotate(-4) scale(${s})`}>
          {poucos.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={15} fill={C.barro} stroke={C.ink} strokeWidth={5} />)}
        </g>
        <g transform={`translate(438 104) rotate(3) scale(${s})`}>
          {PONTOS_CEARA.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={15} fill={C.cobalt} stroke={C.ink} strokeWidth={5} />)}
        </g>
      </g>
      <g stroke={C.ink} strokeWidth={9} strokeLinecap="round">
        <line x1={370} x2={426} y1={290} y2={290} />
        <line x1={370} x2={426} y1={318} y2={318} />
        <line x1={384} x2={412} y1={346} y2={262} />
      </g>
    </Frame>
  );
}

/* ---------- Spots (ícones ilustrados para os pilares) ---------- */

function Spot({ id, bg, label, children }: { id: string; bg: string; label: string; children: ReactNode }) {
  return (
    <Frame id={id} w={240} h={240} label={label} round={{ cx: 120, cy: 124, r: 100 }}>
      <g filter={`url(#${id}-rough)`}>
        <circle cx={120} cy={124} r={100} fill={bg} />
        {children}
      </g>
    </Frame>
  );
}

export function SpotEntender() {
  return (
    <Spot id="spot-entender" bg={C.sol} label="Ilustração: livro aberto">
      <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
        <path d="M44 100 V178 Q85 162 120 180 Q155 162 196 178 V100" fill={C.cobalt} />
        <path d="M50 94 Q85 80 118 98 V172 Q85 154 50 168Z" fill={C.paper} />
        <path d="M190 94 Q155 80 122 98 V172 Q155 154 190 168Z" fill={C.paper} />
        <path d="M160 88 V128 L168 120 L176 128 V86" fill={C.barro} />
      </g>
      <g stroke={C.ink} strokeWidth={2}>
        {[112, 126, 140].map(y => <line key={y} x1={64} y1={y} x2={106} y2={y - 6} />)}
        {[112, 126, 140].map(y => <line key={`r${y}`} x1={134} y1={y - 6} x2={152} y2={y - 8} />)}
      </g>
    </Spot>
  );
}

export function SpotExplorar() {
  return (
    <Spot id="spot-explorar" bg={C.rosa} label="Ilustração: mapa dobrado com marcador">
      <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
        <polygon points="46,92 96,108 96,192 46,176" fill={C.paper} />
        <polygon points="96,108 146,92 146,176 96,192" fill={C.paper2} />
        <polygon points="96,108 146,92 146,176 96,192" fill="url(#spot-explorar-dots)" opacity={0.3} stroke="none" />
        <polygon points="146,92 196,108 196,192 146,176" fill={C.paper} />
        <path d="M60 160 C90 150 100 170 130 150 C150 138 170 150 186 132" stroke={C.ink} strokeWidth={2.5} strokeDasharray="2 7" strokeLinecap="round" fill="none" />
        <path d="M130 140 C112 114 104 104 104 90 A26 26 0 1 1 156 90 C156 104 148 114 130 140Z" fill={C.barro} />
        <circle cx={130} cy={88} r={9} fill={C.paper} />
      </g>
    </Spot>
  );
}

export function SpotVerificar() {
  return (
    <Spot id="spot-verificar" bg={C.cobalt} label="Ilustração: lupa sobre documento">
      <Doc x={106} y={122} w={92} h={118} rot={-5} mark />
      <Lupa cx={146} cy={140} r={34} angle={45} len={46} />
    </Spot>
  );
}

export function SpotAcompanhar() {
  return (
    <Spot id="spot-acompanhar" bg={C.barro} label="Ilustração: jornal dobrado">
      <g transform="rotate(4 120 124)">
        <rect x={58} y={64} width={130} height={128} fill={C.ink} />
        <rect x={52} y={58} width={130} height={128} fill={C.paper} stroke={C.ink} strokeWidth={3} />
        <rect x={64} y={70} width={106} height={12} fill={C.ink} />
        <rect x={64} y={90} width={84} height={6} fill={C.ink} />
        <rect x={64} y={104} width={52} height={44} fill={C.sol} stroke={C.ink} strokeWidth={2} />
        <rect x={64} y={104} width={52} height={44} fill="url(#spot-acompanhar-dots)" opacity={0.35} />
        <g stroke={C.ink} strokeWidth={2}>
          {[108, 118, 128, 138, 148, 160, 170].map(y => <line key={y} x1={124} y1={y} x2={170} y2={y} />)}
          {[160, 170].map(y => <line key={`l${y}`} x1={64} y1={y} x2={116} y2={y} />)}
        </g>
      </g>
    </Spot>
  );
}

/* ---------- Registro e moldura ---------- */

export const artworks = { caminho: CaminhoArt, sertao: SertaoArt, congresso: CongressoArt, documentos: DocumentosArt, mapa: MapaArt, fluxo: FluxoArt, autores: AutoresArt, estaduais: EstaduaisArt, dados: DadosArt, sobre: SobreArt, contato: ContatoArt, correcoes: CorrecoesArt, reportagens: ReportagensArt, privacidade: PrivacidadeArt, foraDoMapa: ForaDoMapaArt, funil: FunilArt, doisMapas: DoisMapasArt } as const;
export type ArtKey = keyof typeof artworks;

export function Art({ name, id }: { name: ArtKey; id?: string }) {
  const Cmp = artworks[name];
  return <Cmp id={id} />;
}

export const spots = { entender: SpotEntender, explorar: SpotExplorar, verificar: SpotVerificar, acompanhar: SpotAcompanhar } as const;
export type SpotKey = keyof typeof spots;

export function SpotArt({ name }: { name: SpotKey }) {
  const Cmp = spots[name];
  return <Cmp />;
}

/** Moldura editorial da ilustração (sem legenda visível — ADR-016; a descrição fica no aria-label do SVG). */
export function Figure({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <figure className={`art ${className}`}>
      <div className="art-frame">{children}</div>
    </figure>
  );
}
