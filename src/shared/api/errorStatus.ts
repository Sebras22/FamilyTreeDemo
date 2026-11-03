import { ApiError } from './api'

export function errorStatus(e: unknown): number {
  return e instanceof ApiError ? e.status : 0
}
