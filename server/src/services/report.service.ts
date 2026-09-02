import { store } from '../storage/createStore.js'
import type { Customer, Payment, Project } from '../types/domain.js'
import { WORKFLOW_STAGES } from '../types/domain.js'

export async function getReports() {
  const [customers, projects, payments] = await Promise.all([
    store.getAll<Customer>('customers'),
    store.getAll<Project>('projects'),
    store.getAll<Payment>('payments'),
  ])

  const activeProjects = projects.filter((project) => project.status === 'Active')
  const now = new Date()

  const paymentByType = payments.reduce<Record<string, number>>((acc, payment) => {
    acc[payment.type] = (acc[payment.type] || 0) + payment.amount
    return acc
  }, {})

  return {
    projects: {
      total: projects.length,
      active: activeProjects.length,
      completed: projects.filter((project) => project.status === 'Completed').length,
      cancelled: projects.filter((project) => project.status === 'Cancelled').length,
    },
    workflow: WORKFLOW_STAGES.map((stage) => ({
      stage,
      count: activeProjects.filter((project) => project.currentStage === stage).length,
    })),
    payments: {
      totalReceived: payments.reduce((sum, payment) => sum + payment.amount, 0),
      count: payments.length,
      byType: paymentByType,
      byProject: projects
        .map((project) => {
          const projectPayments = payments.filter((payment) => payment.projectId === project.id)
          const customer = customers.find((item) => item.id === project.customerId)
          return {
            id: project.id,
            customer: customer?.name || 'Unknown',
            total: projectPayments.reduce((sum, payment) => sum + payment.amount, 0),
            count: projectPayments.length,
          }
        })
        .filter((item) => item.total > 0),
    },
    customers: {
      total: customers.length,
      newThisMonth: customers.filter((customer) => {
        const created = new Date(customer.createdAt)
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length,
      multiProject: customers.filter(
        (customer) => projects.filter((project) => project.customerId === customer.id).length > 1,
      ).length,
    },
  }
}
