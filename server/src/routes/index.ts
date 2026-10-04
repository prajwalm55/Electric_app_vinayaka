import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { store } from '../storage/createStore.js'
import * as authService from '../services/auth.service.js'
import * as customerService from '../services/customer.service.js'
import * as propertyService from '../services/property.service.js'
import * as serviceRequestService from '../services/serviceRequest.service.js'
import * as projectService from '../services/project.service.js'
import * as paymentService from '../services/payment.service.js'
import * as documentService from '../services/document.service.js'
import * as lightingFormService from '../services/lightingForm.service.js'
import * as searchService from '../services/search.service.js'
import * as reportService from '../services/report.service.js'
import { uploadRouter } from './upload.routes.js'

export const router = Router()

router.get('/health', (_req, res) => {
  res.json({ ok: true, storage: 'json' })
})

router.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    res.json(await authService.login(req.body))
  }),
)

router.use(requireAuth)

// Upload routes
router.use('/upload', uploadRouter)

router.get(
  '/auth/me',
  asyncHandler(async (req, res) => {
    res.json({ profile: await authService.getProfile(req.userId!) })
  }),
)

router.put(
  '/auth/profile',
  asyncHandler(async (req, res) => {
    res.json({ profile: await authService.updateProfile(req.userId!, req.body) })
  }),
)

router.put(
  '/auth/password',
  asyncHandler(async (req, res) => {
    await authService.changePassword(req.userId!, req.body)
    res.json({ ok: true })
  }),
)

router.get(
  '/data',
  asyncHandler(async (_req, res) => {
    res.json(await store.snapshot())
  }),
)

router.get(
  '/customers',
  asyncHandler(async (_req, res) => {
    res.json(await customerService.listCustomers())
  }),
)

router.post(
  '/customers',
  asyncHandler(async (req, res) => {
    res.status(201).json(await customerService.createCustomer(req.body))
  }),
)

router.get(
  '/customers/:id',
  asyncHandler(async (req, res) => {
    res.json(await customerService.getCustomer(req.params.id))
  }),
)

router.put(
  '/customers/:id',
  asyncHandler(async (req, res) => {
    res.json(await customerService.updateCustomer(req.params.id, req.body))
  }),
)

router.delete(
  '/customers/:id',
  asyncHandler(async (req, res) => {
    res.json(await customerService.deleteCustomer(req.params.id))
  }),
)

router.get(
  '/customers/:id/lighting-form',
  asyncHandler(async (req, res) => {
    const pdf = await lightingFormService.generateLightingFormPdf(req.params.id)
    const filename = lightingFormService.lightingFormFilename(req.params.id)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Cache-Control', 'no-store')
    res.send(Buffer.from(pdf))
  }),
)

router.post(
  '/customers/:id/contacts',
  asyncHandler(async (req, res) => {
    res.status(201).json(await customerService.addContact(req.params.id, req.body))
  }),
)

router.put(
  '/customers/:id/contacts',
  asyncHandler(async (req, res) => {
    res.json(await customerService.replaceContacts(req.params.id, req.body))
  }),
)

router.get(
  '/properties',
  asyncHandler(async (_req, res) => {
    res.json(await propertyService.listProperties())
  }),
)

router.post(
  '/properties',
  asyncHandler(async (req, res) => {
    res.status(201).json(await propertyService.createProperty(req.body))
  }),
)

router.put(
  '/properties/:id',
  asyncHandler(async (req, res) => {
    res.json(await propertyService.updateProperty(req.params.id, req.body))
  }),
)

router.get(
  '/service-requests',
  asyncHandler(async (_req, res) => {
    res.json(await serviceRequestService.listServiceRequests())
  }),
)

router.post(
  '/service-requests',
  asyncHandler(async (req, res) => {
    res.status(201).json(await serviceRequestService.createServiceRequest(req.body))
  }),
)

router.get(
  '/service-requests/:id',
  asyncHandler(async (req, res) => {
    res.json(await serviceRequestService.getServiceRequest(req.params.id))
  }),
)

router.patch(
  '/service-requests/:id',
  asyncHandler(async (req, res) => {
    res.json(await serviceRequestService.updateServiceRequest(req.params.id, req.body))
  }),
)

router.post(
  '/service-requests/:id/convert',
  asyncHandler(async (req, res) => {
    res.status(201).json(await serviceRequestService.convertToProject(req.params.id))
  }),
)

router.post(
  '/projects',
  asyncHandler(async (req, res) => {
    res.status(201).json(await projectService.createProject(req.body))
  }),
)

router.get(
  '/projects',
  asyncHandler(async (_req, res) => {
    res.json(await projectService.listProjects())
  }),
)

router.get(
  '/projects/:id',
  asyncHandler(async (req, res) => {
    res.json(await projectService.getProject(req.params.id))
  }),
)

router.patch(
  '/projects/:id',
  asyncHandler(async (req, res) => {
    res.json(await projectService.updateProject(req.params.id, req.body))
  }),
)

router.get(
  '/payments',
  asyncHandler(async (_req, res) => {
    res.json(await paymentService.listPayments())
  }),
)

router.post(
  '/payments',
  asyncHandler(async (req, res) => {
    res.status(201).json(await paymentService.createPayment(req.body))
  }),
)

router.post(
  '/documents',
  asyncHandler(async (req, res) => {
    res.status(201).json(await documentService.createDocument(req.body))
  }),
)

router.post(
  '/photos',
  asyncHandler(async (req, res) => {
    res.status(201).json(await documentService.createPhoto(req.body))
  }),
)

router.patch(
  '/notifications/read-all',
  asyncHandler(async (_req, res) => {
    await documentService.markAllNotificationsRead()
    res.json({ ok: true })
  }),
)

router.patch(
  '/notifications/:id/read',
  asyncHandler(async (req, res) => {
    res.json(await documentService.markNotificationRead(req.params.id))
  }),
)

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : ''
    res.json(await searchService.searchRecords(q))
  }),
)

router.get(
  '/reports',
  asyncHandler(async (_req, res) => {
    res.json(await reportService.getReports())
  }),
)
