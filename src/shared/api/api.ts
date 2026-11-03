import { ApiError } from './apiError'
import { demoApi } from './demo/demoApi'
import type { Api } from '@/interfaces/api/Api'


export { ApiError }


export const api: Api = demoApi
