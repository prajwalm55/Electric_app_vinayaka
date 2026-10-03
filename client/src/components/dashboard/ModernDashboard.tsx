import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { Header } from '../layout/AppLayout'
import { DonutChart } from './DonutChart'
import { BarChart } from './BarChart'
import { getProjectPaymentBalance, sumPayments } from '../../utils/payments'
import { formatCurrency } from '../../utils/formatters'

export function ModernDashboard() {
  const navigate = useNavigate()
  const { projects, payments, customers } = useData()

  const activeProjects = projects.filter((p) => p.status === 'Active')
  const completedProjects = projects.filter((p) => p.status === 'Completed')
  const onHoldProjects = projects.filter((p) => p.status === 'On Hold')
  const cancelledProjects = projects.filter((p) => p.status === 'Cancelled')
  const totalReceived = sumPayments(payments)

  const totalDue = projects.reduce((sum, project) => {
    return sum + getProjectPaymentBalance(project, payments).remaining
  }, 0)

  const totalAgreed = projects.reduce((sum, project) => sum + (project.totalAmount || 0), 0)
  const collectionPercent = totalAgreed > 0 ? Math.min(Math.round((totalReceived / totalAgreed) * 100), 100) : 0

  const projectsWithDue = activeProjects.filter((project) => {
    const balance = getProjectPaymentBalance(project, payments)
    return balance.hasTarget && balance.remaining > 0
  })

  // Project status distribution
  const statusDistribution = [
    { label: 'Active', value: activeProjects.length, color: '#3b82f6' },
    { label: 'Completed', value: completedProjects.length, color: '#14b8a6' },
    { label: 'On Hold', value: onHoldProjects.length, color: '#f59e0b' },
    { label: 'Cancelled', value: cancelledProjects.length, color: '#ef4444' },
  ].filter(item => item.value > 0)

  // Payments by month (last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString('en', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth()
    }
  })

  const paymentsByMonth = last6Months.map(m => {
    const total = payments.filter(p => {
      const pDate = new Date(p.date)
      const pYear = pDate.getFullYear()
      const pMonth = pDate.getMonth()
      return pYear === m.year && pMonth === m.month
    }).reduce((sum, p) => sum + p.amount, 0)
    return total
  })

  // Show all payments if last 6 months have none (for better visualization)
  const hasRecentPayments = paymentsByMonth.some(v => v > 0)

  // If no recent payments, show a different time range that has data
  let displayLabels = last6Months.map(m => m.label)
  let displayData = paymentsByMonth

  if (!hasRecentPayments && payments.length > 0) {
    // Find the earliest and latest payment dates
    const paymentDates = payments.map(p => new Date(p.date).getTime())
    const earliestDate = new Date(Math.min(...paymentDates))
    const latestDate = new Date(Math.max(...paymentDates))

    // Create months from earliest to latest (max 6 months)
    const monthsToShow = Math.min(6, Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
    displayLabels = []
    displayData = []

    for (let i = 0; i < monthsToShow; i++) {
      const d = new Date(earliestDate)
      d.setMonth(d.getMonth() + i)
      displayLabels.push(d.toLocaleString('en', { month: 'short' }))

      const total = payments.filter(p => {
        const pDate = new Date(p.date)
        return pDate.getFullYear() === d.getFullYear() && pDate.getMonth() === d.getMonth()
      }).reduce((sum, p) => sum + p.amount, 0)

      displayData.push(total)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Dashboard" subtitle="Overview of all metrics" />

      <div className="px-4 lg:px-6 py-6 space-y-6">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/customers')}
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-left hover:shadow-lg transition-shadow shadow-sm"
          >
            <div className="text-white/90 text-sm font-medium mb-2">Total Customers</div>
            <div className="text-4xl font-bold text-white">{customers.length}</div>
          </button>

          <button
            onClick={() => navigate('/projects')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-left hover:shadow-lg transition-shadow shadow-sm"
          >
            <div className="text-white/90 text-sm font-medium mb-2">Active Works</div>
            <div className="text-4xl font-bold text-white">{activeProjects.length}</div>
          </button>

          <button
            onClick={() => navigate('/payments')}
            className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-left hover:shadow-lg transition-shadow shadow-sm"
          >
            <div className="text-white/90 text-sm font-medium mb-2">Total Received</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalReceived)}</div>
          </button>

          <button
            onClick={() => navigate('/payments')}
            className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-left hover:shadow-lg transition-shadow shadow-sm"
          >
            <div className="text-white/90 text-sm font-medium mb-2">Balance Due</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalDue)}</div>
          </button>
        </div>

        {/* Collection Progress */}
        {totalAgreed > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-800 font-semibold">Collection Progress</h3>
              <span className="text-xl font-bold text-blue-600">{collectionPercent}%</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                style={{ width: `${collectionPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-teal-600 font-medium">Received {formatCurrency(totalReceived)}</span>
              <span className="text-slate-500">Target {formatCurrency(totalAgreed)}</span>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Project Status Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-800 font-semibold mb-6">Project Status</h3>
            {projects.length > 0 ? (
              <DonutChart
                data={statusDistribution}
                centerText={projects.length.toString()}
                centerLabel="Total Projects"
              />
            ) : (
              <p className="text-slate-500 text-center py-8">No projects yet</p>
            )}
          </div>

          {/* Payments by Month */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-800 font-semibold mb-6">
              Payments Received {hasRecentPayments ? '(Last 6 Months)' : '(Recent Activity)'}
            </h3>
            {payments.length > 0 ? (
              <BarChart
                labels={displayLabels}
                data={displayData}
              />
            ) : (
              <p className="text-slate-500 text-center py-8">No payments yet</p>
            )}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Completed</div>
            <div className="text-2xl font-bold text-teal-600">{completedProjects.length}</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Pending Payment</div>
            <div className="text-2xl font-bold text-amber-600">{projectsWithDue.length}</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">On Hold</div>
            <div className="text-2xl font-bold text-orange-600">{onHoldProjects.length}</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Total Payments</div>
            <div className="text-2xl font-bold text-blue-600">{payments.length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
