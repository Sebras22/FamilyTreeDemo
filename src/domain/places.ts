const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[’']/g, '-')
    .replace(/\bsaint\b/g, 'st')
    .replace(/\bsainte\b/g, 'ste')
    .replace(/[\s-]+/g, ' ')
    .trim()

const CITIES: Record<string, string> = {
  'bourg en bresse': '01', laon: '02', 'saint quentin': '02', moulins: '03', montlucon: '03', vichy: '03',
  'digne les bains': '04', gap: '05', nice: '06', cannes: '06', antibes: '06', grasse: '06', privas: '07',
  'charleville mezieres': '08', sedan: '08', foix: '09', troyes: '10', carcassonne: '11', narbonne: '11',
  rodez: '12', marseille: '13', 'aix en provence': '13', arles: '13', caen: '14', lisieux: '14', aurillac: '15',
  angouleme: '16', cognac: '16', 'la rochelle': '17', rochefort: '17', bourges: '18', tulle: '19', brive: '19',
  'brive la gaillarde': '19', dijon: '21', beaune: '21', 'st brieuc': '22', lannion: '22', gueret: '23',
  perigueux: '24', bergerac: '24', besancon: '25', montbeliard: '25', valence: '26', romans: '26',
  'romans sur isere': '26', evreux: '27', chartres: '28', dreux: '28', quimper: '29', brest: '29', morlaix: '29',
  ajaccio: '2A', bastia: '2B', nimes: '30', ales: '30', toulouse: '31', auch: '32', bordeaux: '33',
  merignac: '33', pessac: '33', libourne: '33', montpellier: '34', beziers: '34', sete: '34', rennes: '35',
  'st malo': '35', fougeres: '35', chateauroux: '36', tours: '37', amboise: '37', grenoble: '38', vienne: '38',
  voiron: '38', 'lons le saunier': '39', dole: '39', 'mont de marsan': '40', dax: '40', blois: '41',
  'st etienne': '42', roanne: '42', firminy: '42', 'le puy en velay': '43', nantes: '44', 'st nazaire': '44',
  orleans: '45', montargis: '45', cahors: '46', agen: '47', mende: '48', angers: '49', cholet: '49', saumur: '49',
  'st lo': '50', cherbourg: '50', 'cherbourg en cotentin': '50', 'chalons en champagne': '51', reims: '51',
  epernay: '51', chaumont: '52', laval: '53', nancy: '54', luneville: '54', 'bar le duc': '55', verdun: '55',
  vannes: '56', lorient: '56', metz: '57', thionville: '57', sarreguemines: '57', forbach: '57', nevers: '58',
  lille: '59', roubaix: '59', tourcoing: '59', dunkerque: '59', valenciennes: '59', douai: '59', cambrai: '59',
  beauvais: '60', compiegne: '60', creil: '60', alencon: '61', arras: '62', calais: '62', lens: '62',
  'boulogne sur mer': '62', 'clermont ferrand': '63', thiers: '63', pau: '64', bayonne: '64', biarritz: '64',
  tarbes: '65', lourdes: '65', perpignan: '66', strasbourg: '67', haguenau: '67', colmar: '68', mulhouse: '68',
  lyon: '69', villeurbanne: '69', venissieux: '69', bron: '69', oullins: '69', 'st priest': '69',
  'caluire et cuire': '69', 'villefranche sur saone': '69', vesoul: '70', macon: '71', 'chalon sur saone': '71',
  'le creusot': '71', 'le mans': '72', chambery: '73', 'aix les bains': '73', annecy: '74', annemasse: '74',
  'thonon les bains': '74', paris: '75', rouen: '76', 'le havre': '76', dieppe: '76', melun: '77', meaux: '77',
  versailles: '78', poissy: '78', niort: '79', amiens: '80', abbeville: '80', albi: '81', castres: '81',
  montauban: '82', toulon: '83', frejus: '83', avignon: '84', orange: '84', 'la roche sur yon': '85',
  poitiers: '86', limoges: '87', epinal: '88', auxerre: '89', sens: '89', belfort: '90', evry: '91',
  nanterre: '92', 'boulogne billancourt': '92', courbevoie: '92', bobigny: '93', 'st denis': '93',
  montreuil: '93', creteil: '94', 'vitry sur seine': '94', cergy: '95', argenteuil: '95',
}

export function locatePlace(raw: string | null | undefined, departments: { code: string; nom: string }[]): string | null {
  const text = raw?.trim()
  if (!text) return null
  const byName = new Map(departments.map((d) => [norm(d.nom), d.code]))
  const parts = text.split(',').map(norm).filter(Boolean)
  if (parts.length === 0) return null
  for (const p of parts.slice(1)) {
    const hit = byName.get(p)
    if (hit) return hit
  }
  const city = CITIES[parts[0]]
  if (city) return city
  return byName.get(parts[0]) ?? null
}
