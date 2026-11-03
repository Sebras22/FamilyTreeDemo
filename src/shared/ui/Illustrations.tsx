import type { ChildrenProps } from '@/interfaces/components/ChildrenProps'
import type { EmptyStateProps } from '@/interfaces/components/EmptyStateProps'
import type { IllustrationNodeProps } from '@/interfaces/components/IllustrationNodeProps'
import type { IllustrationProps } from '@/interfaces/components/IllustrationProps'

function Node({ x, y, tone }: IllustrationNodeProps) {
  return (
    <g>
      <rect x={x - 24} y={y - 15} width="48" height="30" rx="12" className="il-s il-stroke" />
      <circle cx={x - 11} cy={y} r="8" className={`il-${tone}`} />
      <rect x={x + 1} y={y - 7} width="16" height="4" rx="2" className="il-line-fill" />
      <rect x={x + 1} y={y + 1} width="10" height="4" rx="2" className="il-line-fill soft" />
    </g>
  )
}

function Frame({ children }: ChildrenProps) {
  return (
    <svg viewBox="0 0 240 180" role="img" aria-hidden="true" className="illustration">
      {children}
    </svg>
  )
}

export function Illustration({ kind }: IllustrationProps) {
  switch (kind) {
    case 'tree':
      return (
        <Frame>
          <circle cx="120" cy="92" r="76" className="il-p2" />
          <circle cx="40" cy="40" r="6" className="il-f soft" />
          <circle cx="210" cy="60" r="8" className="il-m soft" />
          <circle cx="198" cy="150" r="5" className="il-p soft" />
          <g className="il-line" fill="none">
            <path d="M120 44V58H70V72" />
            <path d="M120 58H170V72" />
            <path d="M70 88V104H44V118M70 104H98V118" />
            <path d="M170 88V104H142V118M170 104H198V118" />
          </g>
          <Node x={120} y={30} tone="p" />
          <Node x={70} y={80} tone="f" />
          <Node x={170} y={80} tone="m" />
          <Node x={44} y={134} tone="m" />
          <Node x={98} y={134} tone="f" />
          <Node x={142} y={134} tone="p" />
          <Node x={198} y={134} tone="f" />
        </Frame>
      )
    case 'family':
      return (
        <Frame>
          <circle cx="120" cy="96" r="78" className="il-p2" />
          <ellipse cx="120" cy="158" rx="92" ry="8" className="il-shadow" />
          {[
            { x: 52, h: 70, tone: 'f' },
            { x: 92, h: 84, tone: 'm' },
            { x: 134, h: 58, tone: 'p' },
            { x: 172, h: 76, tone: 'f' },
            { x: 204, h: 44, tone: 'm' },
          ].map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={152 - p.h - 12} r="11" className={`il-${p.tone}`} />
              <path d={`M${p.x - 14} 152 V${152 - p.h + 8} a14 14 0 0 1 28 0 V152 Z`} className={`il-${p.tone}`} opacity="0.85" />
            </g>
          ))}
        </Frame>
      )
    case 'album':
      return (
        <Frame>
          <circle cx="120" cy="92" r="76" className="il-p2" />
          {[
            { r: -9, x: 60, tone: 'f' },
            { r: 8, x: 128, tone: 'm' },
            { r: -2, x: 94, tone: 'p' },
          ].map((p, i) => (
            <g key={i} transform={`rotate(${p.r} ${p.x + 28} 90)`}>
              <rect x={p.x} y="46" width="56" height="88" rx="8" className="il-s il-stroke" />
              <rect x={p.x + 6} y="52" width="44" height="58" rx="5" className="il-s2" />
              <circle cx={p.x + 38} cy="66" r="5" className="il-m soft" />
              <path d={`M${p.x + 6} 110 L${p.x + 20} 84 L${p.x + 30} 98 L${p.x + 38} 88 L${p.x + 50} 110 Z`} className={`il-${p.tone}`} />
              <rect x={p.x + 10} y="118" width="26" height="4" rx="2" className="il-line-fill soft" />
            </g>
          ))}
        </Frame>
      )
    case 'share':
      return (
        <Frame>
          <circle cx="120" cy="92" r="76" className="il-p2" />
          <g className="il-line" fill="none">
            <path d="M120 92L52 46M120 92L190 52M120 92L120 150" />
          </g>
          <circle cx="120" cy="92" r="24" className="il-p" />
          <path d="M111 92h18M120 83v18" stroke="var(--primary-text)" strokeWidth="4" strokeLinecap="round" />
          {[
            { x: 52, y: 46, tone: 'f' },
            { x: 190, y: 52, tone: 'm' },
            { x: 120, y: 150, tone: 'p' },
          ].map((s, i) => (
            <g key={i}>
              <circle cx={s.x} cy={s.y} r="17" className="il-s il-stroke" />
              <circle cx={s.x} cy={s.y - 4} r="5" className={`il-${s.tone}`} />
              <path d={`M${s.x - 9} ${s.y + 9} a9 7 0 0 1 18 0Z`} className={`il-${s.tone}`} />
            </g>
          ))}
        </Frame>
      )
    case 'chart':
      return (
        <Frame>
          <circle cx="120" cy="92" r="76" className="il-p2" />
          <rect x="44" y="40" width="152" height="104" rx="14" className="il-s il-stroke" />
          {[
            { x: 62, h: 30, tone: 'f' },
            { x: 92, h: 56, tone: 'p' },
            { x: 122, h: 42, tone: 'm' },
            { x: 152, h: 70, tone: 'p' },
          ].map((b, i) => (
            <rect key={i} x={b.x} y={130 - b.h} width="20" height={b.h} rx="6" className={`il-${b.tone}`} />
          ))}
          <path d="M56 56h40" className="il-line" strokeLinecap="round" />
        </Frame>
      )
    case 'search':
      return (
        <Frame>
          <circle cx="120" cy="92" r="76" className="il-p2" />
          <circle cx="108" cy="84" r="34" className="il-s il-stroke" strokeWidth="6" />
          <path d="M134 110l34 34" className="il-line" strokeWidth="9" strokeLinecap="round" />
          <circle cx="108" cy="78" r="9" className="il-p" />
          <path d="M92 100a16 12 0 0 1 32 0Z" className="il-p" />
        </Frame>
      )
    case 'import':
      return (
        <Frame>
          <circle cx="120" cy="92" r="76" className="il-p2" />
          <path d="M82 40h56l24 24v76a8 8 0 0 1-8 8H82a8 8 0 0 1-8-8V48a8 8 0 0 1 8-8Z" className="il-s il-stroke" />
          <path d="M138 40v24h24" className="il-s2 il-stroke" />
          <rect x="88" y="78" width="60" height="6" rx="3" className="il-line-fill soft" />
          <rect x="88" y="92" width="44" height="6" rx="3" className="il-line-fill soft" />
          <path d="M118 132v-22M108 120l10-10 10 10" className="il-p-stroke" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </Frame>
      )
  }
}

export function EmptyState({ kind, title, text, children }: EmptyStateProps) {
  return (
    <div className="empty-block">
      <Illustration kind={kind} />
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {children}
    </div>
  )
}
