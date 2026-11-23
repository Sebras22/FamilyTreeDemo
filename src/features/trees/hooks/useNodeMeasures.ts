import { useCallback, useState } from 'react'
import type { NodeChange } from '@xyflow/react'
import { mergeMeasures } from '@/domain/measures'
import type { NodeSize } from '@/interfaces/domain/NodeSize'

export function useNodeMeasures() {
  const [measures, setMeasures] = useState<Map<string, NodeSize>>(new Map())
  const applyMeasures = useCallback((changes: NodeChange[]) => setMeasures((current) => mergeMeasures(current, changes)), [])
  return { measures, applyMeasures }
}
