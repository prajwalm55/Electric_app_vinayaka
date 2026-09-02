const KANNADA_RE = /[\u0C80-\u0CFF]/

const PHRASE_MAP: Array<[string, string]> = [
  ['gram panchayat', 'ಗ್ರಾಮ ಪಂಚಾಯಿತಿ'],
  ['rural panchayat', 'ಗ್ರಾಮ ಪಂಚಾಯಿತಿ'],
  ['urban municipality', 'ನಗರ ಪುರಸಭೆ'],
  ['revenue site', 'ರೆವೆನ್ಯೂ ಸೈಟ್'],
  ['chitradurga town', 'ಚಿತ್ರದುರ್ಗ ನಗರ'],
  ['new electricity connection', 'ಹೊಸ ವಿದ್ಯುತ್ ಸಂಪರ್ಕ'],
  ['single phase', 'ಏಕ ಹಂತ'],
  ['three phase', 'ತ್ರಿ ಹಂತ'],
]

const WORD_MAP: Record<string, string> = {
  domestic: 'ಗೃಹಬಳಕೆ',
  commercial: 'ವಾಣಿಜ್ಯ',
  industrial: 'ಕೈಗಾರಿಕೆ',
  agricultural: 'ಕೃಷಿ',
  temporary: 'ತಾತ್ಕಾಲಿಕ',
  municipality: 'ಪುರಸಭೆ',
  panchayat: 'ಪಂಚಾಯಿತಿ',
  village: 'ಗ್ರಾಮ',
  town: 'ನಗರ',
  taluk: 'ತಾಲ್ಲೂಕು',
  district: 'ಜಿಲ್ಲೆ',
  hosadurga: 'ಹೊಸದುರ್ಗ',
  chitradurga: 'ಚಿತ್ರದುರ್ಗ',
  hiriyur: 'ಹಿರಿಯೂರು',
  holalkere: 'ಹೊಳಲ್ಕೆರೆ',
  single: 'ಏಕ',
  three: 'ತ್ರಿ',
}

const cache = new Map<string, string>()

export function hasKannada(text: string) {
  return KANNADA_RE.test(text)
}

export async function toKannada(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return ''
  if (hasKannada(trimmed) && !/[A-Za-z]/.test(trimmed)) return trimmed

  const key = trimmed.toLowerCase()
  const cached = cache.get(key)
  if (cached) return cached

  const exact = lookupExact(trimmed)
  if (exact) {
    cache.set(key, exact)
    return exact
  }

  const translated = await googleTranslate(trimmed)
  if (translated && hasKannada(translated)) {
    cache.set(key, translated)
    return translated
  }

  const typed = await googleInputTools(trimmed)
  if (typed && hasKannada(typed)) {
    cache.set(key, typed)
    return typed
  }

  const local = transliterateRomanToKannada(applyMaps(trimmed))
  cache.set(key, local)
  return local
}

function lookupExact(text: string) {
  const lower = text.toLowerCase().trim()
  const phrase = PHRASE_MAP.find(([en]) => en === lower)
  if (phrase) return phrase[1]
  return WORD_MAP[lower]
}

function applyMaps(text: string) {
  let result = text
  for (const [en, kn] of PHRASE_MAP) {
    result = result.replace(new RegExp(en, 'ig'), kn)
  }
  result = result
    .split(/(\s+)/)
    .map((part) => WORD_MAP[part.toLowerCase()] || part)
    .join('')
  return result
}

async function googleTranslate(text: string): Promise<string | null> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=kn&dt=t&q=${encodeURIComponent(text)}`
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) return null
    const data = (await response.json()) as unknown
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null
    const joined = data[0]
      .map((part) => (Array.isArray(part) && typeof part[0] === 'string' ? part[0] : ''))
      .join('')
      .trim()
    return joined || null
  } catch {
    return null
  }
}

async function googleInputTools(text: string): Promise<string | null> {
  const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=kn-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) return null
    const data = (await response.json()) as unknown
    if (!Array.isArray(data) || data[0] !== 'SUCCESS') return null
    const suggestion = data[1]?.[0]?.[1]?.[0]
    return typeof suggestion === 'string' ? suggestion : null
  } catch {
    return null
  }
}

const VOWELS: Array<[string, { independent: string; matra: string }]> = [
  ['ai', { independent: 'ಐ', matra: 'ೈ' }],
  ['au', { independent: 'ಔ', matra: 'ೌ' }],
  ['ou', { independent: 'ಔ', matra: 'ೌ' }],
  ['ow', { independent: 'ಔ', matra: 'ೌ' }],
  ['aa', { independent: 'ಆ', matra: 'ಾ' }],
  ['ee', { independent: 'ಈ', matra: 'ೀ' }],
  ['ii', { independent: 'ಈ', matra: 'ೀ' }],
  ['oo', { independent: 'ಊ', matra: 'ೂ' }],
  ['uu', { independent: 'ಊ', matra: 'ೂ' }],
  ['ae', { independent: 'ಏ', matra: 'ೇ' }],
  ['a', { independent: 'ಅ', matra: '' }],
  ['i', { independent: 'ಇ', matra: 'ಿ' }],
  ['u', { independent: 'ಉ', matra: 'ು' }],
  ['e', { independent: 'ಎ', matra: 'ೆ' }],
  ['o', { independent: 'ಒ', matra: 'ೊ' }],
]

const CONSONANTS: Array<[string, string]> = [
  ['ksh', 'ಕ್ಷ'],
  ['jnh', 'ಜ್ಞ'],
  ['jn', 'ಜ್ಞ'],
  ['shr', 'ಶ್ರ'],
  ['kh', 'ಖ'],
  ['gh', 'ಘ'],
  ['chh', 'ಛ'],
  ['ch', 'ಚ'],
  ['jh', 'ಝ'],
  ['th', 'ಥ'],
  ['dh', 'ಧ'],
  ['ph', 'ಫ'],
  ['bh', 'ಭ'],
  ['sh', 'ಶ'],
  ['ng', 'ಂಗ'],
  ['nk', 'ಂಕ'],
  ['nj', 'ಂಜ'],
  ['nt', 'ಂತ'],
  ['nd', 'ಂದ'],
  ['mp', 'ಂಪ'],
  ['mb', 'ಂಬ'],
  ['tr', 'ತ್ರ'],
  ['k', 'ಕ'],
  ['g', 'ಗ'],
  ['c', 'ಕ'],
  ['j', 'ಜ'],
  ['t', 'ತ'],
  ['d', 'ದ'],
  ['n', 'ನ'],
  ['p', 'ಪ'],
  ['b', 'ಬ'],
  ['m', 'ಮ'],
  ['y', 'ಯ'],
  ['r', 'ರ'],
  ['l', 'ಲ'],
  ['v', 'ವ'],
  ['w', 'ವ'],
  ['s', 'ಸ'],
  ['h', 'ಹ'],
  ['f', 'ಫ'],
  ['q', 'ಕ'],
  ['x', 'ಕ್ಸ'],
  ['z', 'ಜ'],
]

export function transliterateRomanToKannada(input: string): string {
  return input
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token) || hasKannada(token) || /^\d+$/.test(token)) return token
      return transliterateWord(token)
    })
    .join('')
}

function transliterateWord(raw: string): string {
  let word = raw.toLowerCase().replace(/[^a-z]/g, '')
  if (!word) return raw
  if (/esh$/.test(word)) word = word.replace(/esh$/, 'Esh')
  if (/ev[iIyY]$/.test(word)) word = word.replace(/e/, 'E')

  let i = 0
  let out = ''
  let pendingVirama = false

  const take = (table: Array<[string, unknown]>) => {
    for (const [key] of table) {
      if (word.toLowerCase().startsWith(key, i)) return key
    }
    return null
  }

  while (i < word.length) {
    const ch = word[i]
    if (ch === 'E') {
      if (pendingVirama) {
        out = out.slice(0, -1) + 'ೇ'
        pendingVirama = false
      } else {
        out += 'ಏ'
      }
      i += 1
      continue
    }

    const vowelKey = take(VOWELS)
    if (vowelKey) {
      const vowel = VOWELS.find(([key]) => key === vowelKey)![1]
      if (pendingVirama) {
        out = out.slice(0, -1) + vowel.matra
        pendingVirama = false
      } else {
        out += vowel.independent
      }
      i += vowelKey.length
      continue
    }

    const consKey = take(CONSONANTS)
    if (consKey) {
      const cons = CONSONANTS.find(([key]) => key === consKey)![1]
      out += cons + '್'
      pendingVirama = true
      i += consKey.length
      continue
    }

    i += 1
  }

  return out || raw
}
