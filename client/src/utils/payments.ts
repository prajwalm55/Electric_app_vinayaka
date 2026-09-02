import type { Customer, Payment, Project } from '../types'

export function sumPayments(payments: Payment[]) {
  return payments.reduce((sum, payment) => sum + payment.amount, 0)
}

export interface PaymentBalance {
  agreedTotal?: number
  paid: number
  remaining: number
  hasTarget: boolean
  progressPercent: number
}

export function getProjectPaymentBalance(project: Project, payments: Payment[]): PaymentBalance {
  const paid = sumPayments(payments.filter((payment) => payment.projectId === project.id))
  const agreedTotal = project.totalAmount
  const hasTarget = agreedTotal != null && agreedTotal > 0
  const remaining = hasTarget ? Math.max(agreedTotal - paid, 0) : 0
  const progressPercent = hasTarget ? Math.min(Math.round((paid / agreedTotal) * 100), 100) : 0

  return { agreedTotal, paid, remaining, hasTarget, progressPercent }
}

export function getCustomerPaymentBalance(projects: Project[], payments: Payment[], customerId: string): PaymentBalance {
  const customerProjects = projects.filter((project) => project.customerId === customerId)
  const customerPayments = payments.filter((payment) => payment.customerId === customerId)
  const paid = sumPayments(customerPayments)
  const agreedTotal = customerProjects.reduce((sum, project) => sum + (project.totalAmount || 0), 0)
  const hasTarget = agreedTotal > 0
  const remaining = hasTarget ? Math.max(agreedTotal - paid, 0) : 0
  const progressPercent = hasTarget ? Math.min(Math.round((paid / agreedTotal) * 100), 100) : 0

  return { agreedTotal: hasTarget ? agreedTotal : undefined, paid, remaining, hasTarget, progressPercent }
}

export interface ProjectPaymentSummary {
  project: Project
  payments: Payment[]
  total: number
  balance: PaymentBalance
}

export interface CustomerPaymentSummary {
  customer: Customer
  projects: ProjectPaymentSummary[]
  total: number
  paymentCount: number
  balance: PaymentBalance
}

export function buildCustomerPaymentSummaries(
  payments: Payment[],
  customers: Customer[],
  projects: Project[],
): CustomerPaymentSummary[] {
  const customerIds = new Set<string>()
  payments.forEach((p) => customerIds.add(p.customerId))
  projects.forEach((p) => {
    customerIds.add(p.customerId)
    if (p.totalAmount) customerIds.add(p.customerId)
  })

  return customers
    .filter((customer) => customerIds.has(customer.id))
    .map((customer) => {
      const customerProjects = projects.filter((project) => project.customerId === customer.id)
      const projectSummaries: ProjectPaymentSummary[] = customerProjects.map((project) => {
        const projectPayments = payments.filter((payment) => payment.projectId === project.id)
        const paid = sumPayments(projectPayments)
        return {
          project,
          payments: projectPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          total: paid,
          balance: getProjectPaymentBalance(project, payments),
        }
      })

      const allCustomerPayments = payments.filter((payment) => payment.customerId === customer.id)

      return {
        customer,
        projects: projectSummaries.sort((a, b) => b.total - a.total),
        total: sumPayments(allCustomerPayments),
        paymentCount: allCustomerPayments.length,
        balance: getCustomerPaymentBalance(projects, payments, customer.id),
      }
    })
    .filter(
      (summary) =>
        summary.balance.hasTarget ||
        summary.projects.some((p) => p.payments.length > 0) ||
        summary.total > 0,
    )
    .sort((a, b) => b.total - a.total)
}

export function getProjectPaymentTotal(payments: Payment[], projectId: string) {
  return sumPayments(payments.filter((payment) => payment.projectId === projectId))
}

export function groupPaymentsByType(payments: Payment[]) {
  return payments.reduce<Record<string, number>>((acc, payment) => {
    acc[payment.type] = (acc[payment.type] || 0) + payment.amount
    return acc
  }, {})
}
