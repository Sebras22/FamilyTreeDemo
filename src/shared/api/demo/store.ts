import { buildSeed } from './seed'
import type { DemoState } from '@/interfaces/demo/DemoState'

export const state: DemoState = buildSeed()

export const nextId = () => state.nextId++
