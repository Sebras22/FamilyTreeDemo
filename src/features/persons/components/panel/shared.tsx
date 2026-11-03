import { Anchor } from '@mantine/core'
import { nameOf } from '@/domain/graph'
import type { PersonLinkProps } from '@/interfaces/components/PersonLinkProps'


export function PersonLink({ graph, id, onSelect }: PersonLinkProps) {
  return (
    <Anchor component="button" type="button" onClick={() => onSelect(id)}>
      {nameOf(graph, id)}
    </Anchor>
  )
}
