import type { Person } from '@/interfaces/api/Person'
import type { RankedItem } from '@/interfaces/domain/RankedItem'

export interface TreeStats {
  persons: Person[]
  living: number
  sex: { MALE: number; FEMALE: number; UNKNOWN: number }
  decadeBars: [number, number][]
  oldest: { person: Person; age: number } | null
  birthdays: { person: Person; day: number; age: number | null }[]
  surnames: RankedItem[]
  places: RankedItem[]
  birthPlaces: (string | null)[]
  generations: number
  couples: number
  missingBirth: number
  missingPhoto: number
  isolated: number
  floating: number
  withWarnings: number
}
