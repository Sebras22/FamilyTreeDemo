import { describe, expect, it } from 'vitest'
import type { NodeChange } from '@xyflow/react'
import type { NodeSize } from '@/interfaces/domain/NodeSize'
import { mergeMeasures } from './measures'

const dimensions = (id: string, width: number, height: number): NodeChange => ({ type: 'dimensions', id, dimensions: { width, height } })

describe('mergeMeasures', () => {
  it('enregistre les dimensions mesurées', () => {
    const next = mergeMeasures(new Map(), [dimensions('1', 184, 84), dimensions('2', 184, 84)])
    expect(next.get('1')).toEqual({ width: 184, height: 84 })
    expect(next.size).toBe(2)
  })

  it('renvoie la même instance si rien ne change', () => {
    const current = new Map<string, NodeSize>([['1', { width: 184, height: 84 }]])
    expect(mergeMeasures(current, [dimensions('1', 184, 84)])).toBe(current)
  })

  it('ignore les changements qui ne sont pas des dimensions', () => {
    const current = new Map<string, NodeSize>()
    const changes: NodeChange[] = [{ type: 'position', id: '1', position: { x: 1, y: 2 } }, { type: 'select', id: '1', selected: true }]
    expect(mergeMeasures(current, changes)).toBe(current)
  })

  it('met à jour une dimension modifiée sans toucher à l’original', () => {
    const current = new Map<string, NodeSize>([['1', { width: 184, height: 84 }]])
    const next = mergeMeasures(current, [dimensions('1', 200, 90)])
    expect(next.get('1')).toEqual({ width: 200, height: 90 })
    expect(current.get('1')).toEqual({ width: 184, height: 84 })
  })
})
