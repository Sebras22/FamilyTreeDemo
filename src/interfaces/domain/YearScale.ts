export interface YearScale {
  minYear: number
  maxYear: number
  yearToY: (year: number) => number
}
