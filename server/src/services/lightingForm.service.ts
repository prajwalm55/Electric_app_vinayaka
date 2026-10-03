import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'regenerator-runtime/runtime.js'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { store } from '../storage/createStore.js'
import type { ConnectionEntry, Customer, Project, Property } from '../types/domain.js'
import { AppError } from '../utils/helpers.js'
import { toKannada } from './kannada.service.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const TEMPLATE_PATH = path.join(ROOT, 'assets/forms/Lighting_File_Formates.pdf')
const FONT_PATH = path.join(ROOT, 'assets/fonts/NotoSansKannada-Regular.ttf')

const INK = rgb(0.05, 0.05, 0.08)

type Fonts = {
  kannada: PDFFont
  latin: PDFFont
}

type Overlay = {
  page: number
  x: number
  yFromTop: number
  text: string
  size?: number
  maxWidth?: number
}

export async function generateLightingFormPdf(customerId: string) {
  const customer = await store.getById<Customer>('customers', customerId)
  if (!customer) throw new AppError(404, 'Customer not found')

  const properties = (await store.getAll<Property>('properties')).filter((p) => p.customerId === customerId)
  const projects = (await store.getAll<Project>('projects'))
    .filter((p) => p.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const property = properties[0]
  const project = projects.find((p) => p.propertyId === property?.id) || projects[0]
  const connection = project?.connections?.[0]
  const values = await buildFormValues(customer, property, project, connection)

  const [templateBytes, fontBytes] = await Promise.all([readFile(TEMPLATE_PATH), readFile(FONT_PATH)])
  const pdf = await PDFDocument.load(templateBytes)
  pdf.registerFontkit(fontkit)
  const fonts: Fonts = {
    kannada: await pdf.embedFont(fontBytes, { subset: false }),
    latin: await pdf.embedFont(StandardFonts.Helvetica),
  }

  const pages = pdf.getPages()
  const overlays = buildOverlays(values)
  for (const overlay of overlays) {
    if (!overlay.text.trim() || !pages[overlay.page]) continue
    drawOverlay(pages[overlay.page], fonts, overlay)
  }

  drawTicks(pages, values)

  return pdf.save()
}

export function lightingFormFilename(customerId: string) {
  return `lighting-form-${customerId}.pdf`
}

async function buildFormValues(
  customer: Customer,
  property: Property | undefined,
  project: Project | undefined,
  connection: ConnectionEntry | undefined,
) {
  const [nameKn, fatherKn, villageKn, talukKn, districtKn] = await Promise.all([
    toKannada(customer.name),
    toKannada(customer.fatherSpouseName),
    toKannada(customer.village),
    toKannada(customer.taluk),
    toKannada(customer.district),
  ])

  // "<village> (ಗ್ರಾಮ), <taluk> (ತಾ), <district>" — the standard rural-address phrasing
  // used throughout this form (estimate header, field report, Form-1 site address).
  const siteAddressKn = `${villageKn} (ಗ್ರಾಮ), ${talukKn} (ತಾ), ${districtKn}`
  const phase = connection?.phase === 'Three' ? 'three' : 'single'
  const phaseKn = phase === 'three' ? '3 ಫೇಸ್' : '1 ಫೇಸ್'
  const load = connection?.requiredLoad || ''
  const date = formatDate(new Date())

  return {
    nameKn,
    fatherKn,
    villageKn,
    talukKn,
    districtKn,
    siteAddressKn,
    phaseKn,
    load,
    date,
    pin: customer.pinCode,
    mobile: customer.mobile,
    customerId: customer.id,
    propertyType: property?.type || 'Domestic',
    phase,
    rrNumber: project?.rrNumber || '',
  }
}

type FormValues = Awaited<ReturnType<typeof buildFormValues>>

function buildOverlays(v: FormValues): Overlay[] {
  return [
    // Page 1 — estimate / bill header
    { page: 0, x: 72, yFromTop: 48, text: 'ಬೆಂಗಳೂರು', size: 11, maxWidth: 120 },
    { page: 0, x: 150, yFromTop: 85, text: `${v.nameKn} S/o ${v.fatherKn}`, size: 10, maxWidth: 350 },
    { page: 0, x: 42, yFromTop: 107, text: v.siteAddressKn, size: 9, maxWidth: 390 },

    // Page 3 — field report
    { page: 2, x: 180, yFromTop: 112, text: v.nameKn, size: 11, maxWidth: 220 },
    { page: 2, x: 245, yFromTop: 146, text: `S/o ${v.fatherKn},`, size: 9, maxWidth: 110 },
    { page: 2, x: 104, yFromTop: 163, text: `${v.siteAddressKn}.`, size: 9, maxWidth: 400 },
    ...(v.rrNumber ? [{ page: 2, x: 220, yFromTop: 198, text: v.rrNumber, size: 9, maxWidth: 120 }] : []),

    // Page 5 — wiring contractor completion report
    { page: 4, x: 382, yFromTop: 85, text: v.villageKn, size: 9, maxWidth: 75 },
    { page: 4, x: 320, yFromTop: 301, text: `${v.nameKn} S/o`, size: 10, maxWidth: 215 },
    { page: 4, x: 100, yFromTop: 315, text: v.fatherKn, size: 10, maxWidth: 360 },
    { page: 4, x: 40, yFromTop: 329, text: v.siteAddressKn, size: 9, maxWidth: 420 },
    // Page 5 — applicant declaration block (ವಿಳಾಸ, bottom-left) — ಪ್ರತಿನಿಧಿಯ ಸಹಿ stays blank
    { page: 4, x: 50, yFromTop: 735, text: `S/o ${v.fatherKn}, ${v.siteAddressKn}`, size: 8, maxWidth: 125 },

    // Page 7 — sketch sheet
    { page: 6, x: 65, yFromTop: 83, text: v.nameKn, size: 12, maxWidth: 340 },
    { page: 6, x: 62, yFromTop: 109, text: v.villageKn, size: 11, maxWidth: 220 },
    { page: 6, x: 332, yFromTop: 109, text: v.talukKn, size: 11, maxWidth: 110 },

    // Page 8 — Form-1 applicant details
    { page: 7, x: 100, yFromTop: 311, text: v.nameKn, size: 11, maxWidth: 340 },
    { page: 7, x: 200, yFromTop: 326, text: v.fatherKn, size: 11, maxWidth: 240 },
    { page: 7, x: 305, yFromTop: 438, text: v.siteAddressKn, size: 9, maxWidth: 150 },
    { page: 7, x: 200, yFromTop: 490, text: v.villageKn, size: 8, maxWidth: 72 },
    { page: 7, x: 375, yFromTop: 510, text: v.talukKn, size: 9, maxWidth: 80 },
    { page: 7, x: 75, yFromTop: 528, text: v.pin, size: 10, maxWidth: 85 },
    { page: 7, x: 390, yFromTop: 528, text: v.mobile, size: 10, maxWidth: 90 },
    { page: 7, x: 400, yFromTop: 733, text: v.load, size: 10, maxWidth: 80 },

    // Page 9 — Form-1 continued + declaration
    ...(v.rrNumber ? [{ page: 8, x: 160, yFromTop: 118, text: v.rrNumber, size: 10, maxWidth: 140 }] : []),
    { page: 8, x: 220, yFromTop: 686, text: `${v.nameKn} S/o ${v.fatherKn}`, size: 10, maxWidth: 330 },
    { page: 8, x: 115, yFromTop: 720, text: v.date, size: 9, maxWidth: 90 },
    { page: 8, x: 180, yFromTop: 744, text: v.villageKn, size: 10, maxWidth: 150 },
  ]
}

function drawTicks(pages: PDFPage[], v: FormValues) {
  // Page 9: required phase (ಒಂದು ಫೇಸು / ಮೂರು ಫೇಸು)
  if (v.phase === 'three') {
    drawTick(pages[8], 390, 60)
  } else {
    drawTick(pages[8], 297, 60)
  }
  // Page 9: new service (ಹೊಸ ಸೇವೆಗಾಗಿ)
  drawTick(pages[8], 118, 80)
  // Page 9: usage category table (ಗೃಹಬಳಕೆ / ವಾಣಿಜ್ಯ / ಕೈಗಾರಿಕೆ / ಕೃಷಿ ನೀ.ಪಂ.ಸೆಟ್ಟು)
  if (v.propertyType === 'Commercial') drawTick(pages[8], 172, 185)
  else if (v.propertyType === 'Industrial') drawTick(pages[8], 317, 185)
  else if (v.propertyType === 'Agricultural') drawTick(pages[8], 172, 200)
  else drawTick(pages[8], 39, 185)
  // Page 8: application type (ನಿಯತ — regular/permanent)
  drawTick(pages[7], 170, 253)
  // Page 8: permanent address same as site address (ಮೇಲೆ ತಿಳಿಸಿರುವಂತೆ)
  drawTick(pages[7], 50, 588)
  // Page 8: LT category (ಎಲ್.ಟಿ-2 ಗೃಹಬಳಕೆ / ಎಲ್.ಟಿ-3 ವಾಣಿಜ್ಯ / ಎಲ್.ಟಿ-4 ಕೃಷಿ / ಎಲ್.ಟಿ-5 ಕೈಗಾರಿಕೆ)
  if (v.propertyType === 'Commercial') drawTick(pages[7], 38, 187)
  else if (v.propertyType === 'Industrial') drawTick(pages[7], 38, 214)
  else if (v.propertyType === 'Agricultural') drawTick(pages[7], 38, 200)
  else drawTick(pages[7], 38, 174)
}

function drawOverlay(page: PDFPage, fonts: Fonts, overlay: Overlay) {
  const { height } = page.getSize()
  const size = overlay.size ?? 10
  const maxWidth = overlay.maxWidth ?? 240
  const lines = wrapText(overlay.text, fonts, size, maxWidth)
  lines.forEach((line, index) => {
    const y = height - overlay.yFromTop - index * (size + 2) + 1
    drawMixed(page, fonts, line, overlay.x, y, size)
  })
}

function drawMixed(page: PDFPage, fonts: Fonts, text: string, x: number, y: number, size: number) {
  let cursor = x
  for (const segment of splitScript(text)) {
    const font = segment.kannada ? fonts.kannada : fonts.latin
    page.drawText(segment.text, { x: cursor, y, size, font, color: INK })
    cursor += font.widthOfTextAtSize(segment.text, size)
  }
}

const KANNADA_CHAR_RE = /[ಀ-೿]/
const LATIN_LETTER_RE = /[A-Za-z]/

// Letters decide the script; a "neutral" character (space, digit, punctuation) has no
// script of its own, so it joins whichever run it sits inside — e.g. the space and
// comma in "ಹೊಸದುರ್ಗ (ಗ್ರಾಮ)," stay part of the Kannada run, while "/" in "S/o" stays
// Latin. Treating every neutral character as Latin (or as Kannada) on its own breaks a
// single Kannada phrase into many tiny draw calls, and since pdf-lib's width
// measurement for this Kannada font doesn't perfectly match what it renders, each extra
// seam between fragments accumulates a small positioning error — enough to visibly
// misalign or overlap a long phrase.
function splitScript(text: string): Array<{ text: string; kannada: boolean }> {
  const segments: Array<{ text: string; kannada: boolean }> = []
  let pendingNeutral = ''

  const append = (chunk: string, kannada: boolean) => {
    if (!chunk) return
    const last = segments[segments.length - 1]
    if (last && last.kannada === kannada) last.text += chunk
    else segments.push({ text: chunk, kannada })
  }

  for (const char of text) {
    if (LATIN_LETTER_RE.test(char)) {
      append(pendingNeutral, false)
      pendingNeutral = ''
      append(char, false)
    } else if (KANNADA_CHAR_RE.test(char)) {
      append(pendingNeutral, true)
      pendingNeutral = ''
      append(char, true)
    } else {
      pendingNeutral += char
    }
  }
  if (pendingNeutral) {
    const last = segments[segments.length - 1]
    append(pendingNeutral, last ? last.kannada : true)
  }

  return segments
}

// pdf-lib's widthOfTextAtSize() under-measures this Kannada font relative to what actually
// renders — likely because the width call doesn't fully account for the font's conjunct/matra
// shaping the way drawText's glyph layout does. This safety factor keeps line-wrap decisions
// from under-wrapping and spilling text past its column.
const KANNADA_WIDTH_SAFETY_FACTOR = 1.3

function wrapText(text: string, fonts: Fonts, size: number, maxWidth: number) {
  const widthOf = (value: string) =>
    splitScript(value).reduce((sum, segment) => {
      const font = segment.kannada ? fonts.kannada : fonts.latin
      const raw = font.widthOfTextAtSize(segment.text, size)
      return sum + (segment.kannada ? raw * KANNADA_WIDTH_SAFETY_FACTOR : raw)
    }, 0)

  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word
    if (widthOf(trial) <= maxWidth) {
      current = trial
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 3)
}

function drawTick(page: PDFPage | undefined, x: number, yFromTop: number) {
  if (!page) return
  const { height } = page.getSize()
  const y = height - yFromTop
  page.drawLine({
    start: { x, y: y + 1 },
    end: { x: x + 3.5, y: y - 3 },
    thickness: 1.3,
    color: INK,
  })
  page.drawLine({
    start: { x: x + 3.5, y: y - 3 },
    end: { x: x + 9, y: y + 5 },
    thickness: 1.3,
    color: INK,
  })
}

function formatDate(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}
