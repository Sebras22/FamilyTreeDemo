import dayjs from 'dayjs'
import type { PDate } from '@/interfaces/api/PDate'
import type { ParsedDate } from '@/interfaces/domain/ParsedDate'
import type { Person } from '@/interfaces/api/Person'

const monthNames = (lang: 'fr' | 'en') => {
  const fmt = new Intl.DateTimeFormat(lang, { month: 'short', timeZone: 'UTC' })
  return Array.from({ length: 12 }, (_, i) => fmt.format(Date.UTC(2000, i, 1)))
}
const MONTHS = { fr: monthNames('fr'), en: monthNames('en') }

export const hasDate = (d: PDate | null | undefined): d is PDate =>
  !!d && (d.year != null || d.month != null || d.day != null)

export function formatDate(d: PDate | null | undefined, lang: 'fr' | 'en'): string {
  if (!hasDate(d)) return ''
  const parts: string[] = []
  if (d.day != null && d.month != null) parts.push(String(d.day))
  if (d.month != null) parts.push(MONTHS[lang][d.month - 1])
  if (d.year != null) parts.push(String(d.year))
  const text = parts.join(' ')
  return d.approximate ? `${lang === 'fr' ? 'vers' : 'c.'} ${text}` : text
}

export function lifeSpan(p: Person, lang: 'fr' | 'en'): string {
  const b = p.birth?.year != null ? `${p.birth.approximate ? '~' : ''}${p.birth.year}` : ''
  const d = p.death?.year != null ? `${p.death.approximate ? '~' : ''}${p.death.year}` : ''
  if (!b && !d) return ''
  if (p.living) return b ? `${lang === 'fr' ? 'né(e) en ' : 'b. '}${b}` : ''
  return `${b || '?'} – ${d || '?'}`
}

export const birthYear = (p: Person): number | null => p.birth?.year ?? null
export const deathYear = (p: Person): number | null => p.death?.year ?? null

export const fullName = (p: Pick<Person, 'firstName' | 'lastName'>) => `${p.firstName} ${p.lastName}`.trim()

const MONTH_WORDS: Record<string, number> = {}
const addMonths = (names: string[], month: number) => names.forEach((n) => (MONTH_WORDS[n] = month))
addMonths(['janvier', 'janv', 'january', 'jan'], 1)
addMonths(['fevrier', 'fevr', 'fev', 'february', 'feb'], 2)
addMonths(['mars', 'march', 'mar'], 3)
addMonths(['avril', 'avr', 'april', 'apr'], 4)
addMonths(['mai', 'may'], 5)
addMonths(['juin', 'june', 'jun'], 6)
addMonths(['juillet', 'juil', 'july', 'jul'], 7)
addMonths(['aout', 'august', 'aug'], 8)
addMonths(['septembre', 'sept', 'sep', 'september'], 9)
addMonths(['octobre', 'oct', 'october'], 10)
addMonths(['novembre', 'nov', 'november'], 11)
addMonths(['decembre', 'dec', 'december'], 12)

function build(year: number | null, month: number | null, day: number | null, approximate: boolean): ParsedDate {
  if (year == null || year < 1 || year > 9999) return { value: null, invalid: true }
  if (month != null && (month < 1 || month > 12)) return { value: null, invalid: true }
  if (day != null && (month == null || day < 1 || day > dayjs().date(1).year(year).month(month - 1).daysInMonth())) return { value: null, invalid: true }
  return { value: { year, month, day, approximate }, invalid: false }
}

export function parsePartialDate(raw: string): ParsedDate {
  let text = raw
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return { value: null, invalid: false }

  let approximate = false
  const prefix = /^(vers|environ|env\.?|~|ca\.?|circa|c\.|about|abt\.?|approx\.?)\s*/
  if (prefix.test(text)) {
    approximate = true
    text = text.replace(prefix, '')
  }

  let m = text.match(/^(\d{4})$/)
  if (m) return build(+m[1], null, null, approximate)
  m = text.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?$/)
  if (m) return build(+m[1], +m[2], m[3] ? +m[3] : null, approximate)
  m = text.match(/^(?:(\d{1,2})[-/. ])?(\d{1,2})[-/. ](\d{3,4})$/)
  if (m && /[-/.]/.test(text)) return build(+m[3], +m[2], m[1] ? +m[1] : null, approximate)
  m = text.match(/^(?:(\d{1,2})(?:er)? )?([a-z]+)\.? (\d{3,4})$/)
  if (m && MONTH_WORDS[m[2]]) return build(+m[3], MONTH_WORDS[m[2]], m[1] ? +m[1] : null, approximate)
  m = text.match(/^([a-z]+)\.? (\d{1,2})(?:st|nd|rd|th)? (\d{3,4})$/)
  if (m && MONTH_WORDS[m[1]]) return build(+m[3], MONTH_WORDS[m[1]], +m[2], approximate)
  m = text.match(/^(\d{3})$/)
  if (m) return build(+m[1], null, null, approximate)
  return { value: null, invalid: true }
}
