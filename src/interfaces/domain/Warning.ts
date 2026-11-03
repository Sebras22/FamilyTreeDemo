export interface Warning {
  code: string
  personId: number
  otherId?: number
  params?: Record<string, string | number>
  severity: 'error' | 'doubt'
  confirmed?: boolean
}
