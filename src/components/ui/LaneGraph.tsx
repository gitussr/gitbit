import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/**
 * Geometry, in px. SVG coordinates can't read CSS custom properties, so
 * the graph's measurements live here — once — and the HTML rows take
 * their height from the same constant, which is what keeps every dot
 * level with its text.
 */
const LANE = 24
const ROW = 44
const NODE_R = 6
/** Room between the last lane and the row's text. */
const GUTTER = 8

export interface LaneGraphRow {
  id: string
  lane: number
  /** `diamond` marks a node with more than one parent — a merge (Section 31's ◆). */
  shape?: 'dot' | 'diamond'
  /**
   * A larger ink ring with a lime core. The graph uses it for the node HEAD
   * resolves to. Not a plain lime fill: that vanishes against a lit (lime)
   * panel, which is exactly when HEAD has just moved.
   */
  emphasis?: boolean
  /** Plays the entrance when this row has just arrived. */
  entering?: boolean
  /** Rings the node — the one being looked at elsewhere, e.g. in the Time Machine. */
  selected?: boolean
  content: ReactNode
}

export interface LaneGraphEdge {
  from: string
  to: string
  /** The lane the line runs down between the two rows. */
  lane: number
}

export interface LaneGraphProps {
  /** Top to bottom. */
  rows: LaneGraphRow[]
  edges: LaneGraphEdge[]
  lanes: number
  /** Names the list for assistive tech, e.g. "Commits, newest first". */
  label: string
  className?: string
}

const x = (lane: number) => LANE / 2 + lane * LANE
const y = (row: number) => ROW / 2 + row * ROW

/**
 * A line from a child down to its parent: out of the child's lane into the
 * travel lane, straight down, then into the parent's lane. Each bend takes
 * one row, as `git log --graph` draws them, so lines never cut across a
 * node on the way.
 */
function edgePath(from: { row: number; lane: number }, to: { row: number; lane: number }, lane: number) {
  let cursor = y(from.row)
  let d = `M ${x(from.lane)} ${cursor}`

  if (lane !== from.lane) {
    const next = cursor + ROW
    d += ` C ${x(from.lane)} ${cursor + ROW / 2}, ${x(lane)} ${cursor + ROW / 2}, ${x(lane)} ${next}`
    cursor = next
  }

  const end = y(to.row)
  if (lane !== to.lane && end - cursor >= ROW) {
    const bend = end - ROW
    if (bend > cursor) d += ` L ${x(lane)} ${bend}`
    d += ` C ${x(lane)} ${bend + ROW / 2}, ${x(to.lane)} ${bend + ROW / 2}, ${x(to.lane)} ${end}`
  } else {
    d += ` L ${x(to.lane)} ${end}`
  }

  return d
}

/**
 * Rows of content with a lane diagram beside them — the drawing half of a
 * history graph (Section 13).
 *
 * Knows nothing about Git: it draws nodes in lanes and lines between them,
 * and whoever uses it decides what a row means. The picture is decorative
 * (`aria-hidden`); the rows are a real ordered list, so a screen reader
 * gets the history as structure rather than a description of a drawing.
 * Whatever the lines show — which node is built on which — the row
 * content must also say in words.
 */
export function LaneGraph({ rows, edges, lanes, label, className }: LaneGraphProps) {
  const at = new Map(rows.map((row, index) => [row.id, { row: index, lane: row.lane }]))
  const width = Math.max(lanes, 1) * LANE

  return (
    <div className={cn('relative', className)}>
      <svg
        aria-hidden="true"
        width={width}
        height={rows.length * ROW}
        viewBox={`0 0 ${width} ${rows.length * ROW}`}
        className="absolute top-0 left-0 overflow-visible"
      >
        <g className="fill-none stroke-accent" strokeWidth={2}>
          {edges.map((edge) => {
            const from = at.get(edge.from)
            const to = at.get(edge.to)
            if (!from || !to) return null
            return <path key={`${edge.from}-${edge.to}`} d={edgePath(from, to, edge.lane)} />
          })}
        </g>

        {rows.map((row, index) => {
          const cx = x(row.lane)
          const cy = y(index)
          const r = row.emphasis ? NODE_R + 2 : NODE_R
          return (
            <g
              key={row.id}
              className={cn('fill-accent stroke-accent', row.entering && 'motion-safe:animate-viz-drop')}
              strokeWidth={2}
            >
              {row.shape === 'diamond' ? (
                <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} transform={`rotate(45 ${cx} ${cy})`} />
              ) : (
                <circle cx={cx} cy={cy} r={r} />
              )}
              {row.emphasis && <circle cx={cx} cy={cy} r={NODE_R - 3} className="fill-highlight stroke-none" />}
              {row.selected && (
                <circle cx={cx} cy={cy} r={r + 5} className="fill-none" strokeDasharray="3 2" />
              )}
            </g>
          )
        })}
      </svg>

      <ol aria-label={label} style={{ paddingLeft: width + GUTTER }}>
        {rows.map((row) => (
          <li
            key={row.id}
            style={{ height: ROW }}
            className={cn('flex min-w-0 items-center', row.entering && 'motion-safe:animate-viz-drop')}
          >
            {row.content}
          </li>
        ))}
      </ol>
    </div>
  )
}
