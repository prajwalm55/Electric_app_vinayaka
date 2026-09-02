import { z } from 'zod'
import { store } from '../storage/createStore.js'
import type { Payment, Project } from '../types/domain.js'
import { nextId, requireEntity } from '../utils/helpers.js'
import { recordActivity } from './activity.service.js'

const paymentSchema = z.object({
  projectId: z.string().min(1),
  customerId: z.string().optional(),
  type: z.enum([
    'VEEW Service Charges',
    'ESCOM Fees',
    'Meter Cost',
    'Customer Advance',
    'Final Customer Payment',
    'Other',
  ]),
  amount: z.number().nonnegative(),
  date: z.string().min(1),
  mode: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Other']),
  referenceNumber: z.string().optional().default(''),
  remarks: z.string().optional().default(''),
})

export async function listPayments() {
  return store.getAll<Payment>('payments')
}

export async function createPayment(body: unknown) {
  const input = paymentSchema.parse(body)
  const project = await requireEntity<Project>(store, 'projects', input.projectId, 'Project')
  const payment: Payment = {
    ...input,
    id: await nextId(store, 'payments', 'PAY'),
    customerId: input.customerId || project.customerId,
  }
  await store.insert('payments', payment)
  await recordActivity({
    type: 'Payment Added',
    description: `Payment of ₹${payment.amount} recorded`,
    entityType: 'project',
    entityId: payment.projectId,
  })
  return payment
}
