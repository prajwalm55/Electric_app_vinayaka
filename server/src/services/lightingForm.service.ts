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
  const [nameKn, fatherKn, villageKn, panchayatKn, talukKn, districtKn, purposeKn] = await Promise.all([
    toKannada(customer.name),
    toKannada(customer.fatherSpouseName),
    toKannada(customer.village),
    toKannada(customer.panchayat),
    toKannada(customer.taluk),
    toKannada(customer.district),
    toKannada('new electricity connection'),
  ])

  const addressKn = [villageKn, panchayatKn, talukKn, districtKn].filter(Boolean).join(', ')
  const phase = connection?.phase === 'Three' ? 'three' : 'single'
  const phaseKn = phase === 'three' ? '3 ಫೇಸ್' : '1 ಫೇಸ್'
  const load = connection?.requiredLoad || ''
  const date = formatDate(new Date())

  return {
    nameKn,
    fatherKn,
    villageKn,
    panchayatKn,
    talukKn,
    districtKn,
    addressKn,
    purposeKn,
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
    { page: 0, x: 42, yFromTop: 86, text: 'ಬೆಂಗಳೂರು', size: 11, maxWidth: 120 },
    { page: 0, x: 128, yFromTop: 106, text: v.nameKn, size: 11, maxWidth: 250 },
    { page: 0, x: 48, yFromTop: 125, text: v.purposeKn, size: 10, maxWidth: 280 },
    { page: 0, x: 88, yFromTop: 147, text: v.customerId, size: 9, maxWidth: 180 },
    { page: 0, x: 78, yFromTop: 164, text: v.phaseKn, size: 10, maxWidth: 140 },
    { page: 0, x: 368, yFromTop: 164, text: v.date, size: 9, maxWidth: 80 },

    // Page 3 — field report
    { page: 2, x: 130, yFromTop: 108, text: v.nameKn, size: 11, maxWidth: 220 },
    { page: 2, x: 340, yFromTop: 128, text: v.date, size: 9, maxWidth: 90 },
    { page: 2, x: 210, yFromTop: 148, text: v.addressKn, size: 9, maxWidth: 220 },
    { page: 2, x: 48, yFromTop: 166, text: `${v.villageKn} - ${v.pin}`, size: 9, maxWidth: 380 },
    ...(v.rrNumber ? [{ page: 2, x: 220, yFromTop: 188, text: v.rrNumber, size: 9, maxWidth: 120 }] : []),

    // Page 5 — applicant name in the covering letter
    { page: 4, x: 200, yFromTop: 182, text: v.nameKn, size: 11, maxWidth: 220 },

    // Page 7 — sketch sheet
    { page: 6, x: 78, yFromTop: 78, text: v.nameKn, size: 12, maxWidth: 340 },
    { page: 6, x: 78, yFromTop: 102, text: v.villageKn, size: 11, maxWidth: 220 },
    { page: 6, x: 330, yFromTop: 102, text: v.talukKn, size: 11, maxWidth: 110 },

    // Page 8 — Form-1 applicant details
    { page: 7, x: 92, yFromTop: 312, text: v.nameKn, size: 11, maxWidth: 340 },
    { page: 7, x: 172, yFromTop: 328, text: v.fatherKn, size: 11, maxWidth: 260 },
    { page: 7, x: 155, yFromTop: 496, text: v.villageKn, size: 10, maxWidth: 140 },
    { page: 7, x: 285, yFromTop: 513, text: v.districtKn, size: 10, maxWidth: 140 },
    { page: 7, x: 92, yFromTop: 530, text: v.pin, size: 10, maxWidth: 70 },
    { page: 7, x: 330, yFromTop: 530, text: v.mobile, size: 10, maxWidth: 110 },
    { page: 7, x: 168, yFromTop: 547, text: v.panchayatKn, size: 10, maxWidth: 250 },
    { page: 7, x: 348, yFromTop: 748, text: v.load, size: 10, maxWidth: 90 },

    // Page 9 — Form-1 continued + declaration
    ...(v.rrNumber ? [{ page: 8, x: 160, yFromTop: 118, text: v.rrNumber, size: 10, maxWidth: 140 }] : []),
    { page: 8, x: 198, yFromTop: 682, text: v.nameKn, size: 11, maxWidth: 200 },
    { page: 8, x: 198, yFromTop: 742, text: v.date, size: 9, maxWidth: 90 },
    { page: 8, x: 92, yFromTop: 758, text: v.villageKn, size: 10, maxWidth: 140 },
  ]
}

function drawTicks(pages: PDFPage[], v: FormValues) {
  // Page 9: required phase
  if (v.phase === 'three') {
    drawTick(pages[8], 378, 58)
  } else {
    drawTick(pages[8], 292, 58)
  }
  // Page 9: new service
  drawTick(pages[8], 118, 84)
  // Page 9: usage category
  if (v.propertyType === 'Commercial') drawTick(pages[8], 178, 176)
  else if (v.propertyType === 'Industrial') drawTick(pages[8], 328, 176)
  else if (v.propertyType === 'Agricultural') drawTick(pages[8], 178, 192)
  else drawTick(pages[8], 42, 176)
  // Page 8: regular application
  drawTick(pages[7], 120, 248)
  // Page 8: LT category
  if (v.propertyType === 'Commercial') drawTick(pages[7], 48, 190)
  else if (v.propertyType === 'Industrial') drawTick(pages[7], 48, 218)
  else if (v.propertyType === 'Agricultural') drawTick(pages[7], 200, 190)
  else drawTick(pages[7], 118, 168)
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

function splitScript(text: string): Array<{ text: string; kannada: boolean }> {
  const segments: Array<{ text: string; kannada: boolean }> = []
  for (const char of text) {
    const kannada = !/[A-Za-z]/.test(char)
    const last = segments[segments.length - 1]
    if (last && last.kannada === kannada) last.text += char
    else segments.push({ text: char, kannada })
  }
  return segments
}

function wrapText(text: string, fonts: Fonts, size: number, maxWidth: number) {
  const widthOf = (value: string) =>
    splitScript(value).reduce((sum, segment) => {
      const font = segment.kannada ? fonts.kannada : fonts.latin
      return sum + font.widthOfTextAtSize(segment.text, size)
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
