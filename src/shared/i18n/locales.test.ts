import { describe, expect, it } from 'vitest'
import { en, fr } from './locales'

describe('traductions', () => {
  it('ont exactement les mêmes clés en français et en anglais', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort())
  })

  it('ne contiennent aucune valeur vide', () => {
    for (const dict of [fr, en]) {
      for (const [key, value] of Object.entries(dict)) expect(value.trim(), key).not.toBe('')
    }
  })

  it('utilisent les mêmes paramètres dans les deux langues', () => {
    const params = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    for (const key of Object.keys(fr)) expect(params(en[key]), key).toEqual(params(fr[key]))
  })
})
