import { useNavigate } from 'react-router-dom'
import {
  UserPlus,
  FolderKanban,
  CreditCard,
  TrendingUp,
  Users,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { Header } from '../components/layout/AppLayout'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProjectWorkCard } from '../components/common/ProjectWorkCard'
import { useData } from '../context/DataContext'
import { getProjectPaymentBalance, sumPayments } from '../utils/payments'
import { formatCurrency } from '../utils/formatters'

export function DashboardPage() {
  const navigate = useNavigate()
  const { projects, payments, customers } = useData()

  const activeProjects = projects.filter((p) => p.status === 'Active')
  const completedProjects = projects.filter((p) => p.status === 'Completed')

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

  const workQueue = [...activeProjects].sort((a, b) => {
    const balA = getProjectPaymentBalance(a, payments)
    const balB = getProjectPaymentBalance(b, payments)
    if (balB.remaining !== balA.remaining) return balB.remaining - balA.remaining
    return a.id.localeCompare(b.id)
  })

  return (
    <div>
      <Header title="Home" subtitle="Track work & payments" />

      <div className="px-4 lg:px-6 py-4 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-primary-200 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center mb-2">
              <FolderKanban className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{activeProjects.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Active works</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/payments')}
            className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-primary-200 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-xl font-bold text-amber-700 leading-tight">{formatCurrency(totalDue)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Balance amount</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/payments')}
            className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-primary-200 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xl font-bold text-green-700 leading-tight">{formatCurrency(totalReceived)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total received</p>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="bg-white rounded-xl border border-slate-200 p-3 text-left hover:border-primary-200 transition-colors"
          >
            <Users className="w-4 h-4 text-blue-600 mb-1" />
            <p className="text-lg font-bold text-slate-900">{customers.length}</p>
            <p className="text-[10px] text-slate-500">Customers</p>
          </button>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="bg-white rounded-xl border border-slate-200 p-3 text-left hover:border-primary-200 transition-colors"
          >
            <CheckCircle className="w-4 h-4 text-green-600 mb-1" />
            <p className="text-lg font-bold text-slate-900">{completedProjects.length}</p>
            <p className="text-[10px] text-slate-500">Completed</p>
          </button>
          <button
            type="button"
            onClick={() => navigate('/payments')}
            className="bg-white rounded-xl border border-slate-200 p-3 text-left hover:border-primary-200 transition-colors"
          >
            <CreditCard className="w-4 h-4 text-amber-600 mb-1" />
            <p className="text-lg font-bold text-slate-900">{projectsWithDue.length}</p>
            <p className="text-[10px] text-slate-500">Pending pay</p>
          </button>
        </div>

        {totalAgreed > 0 && (
          <Card padding="sm">
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Collection progress</CardTitle>
              <span className="text-sm font-bold text-primary-700">{collectionPercent}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${collectionPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Received {formatCurrency(totalReceived)}</span>
              <span>Target {formatCurrency(totalAgreed)}</span>
            </div>
          </Card>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Active works</h2>
            <button type="button" onClick={() => navigate('/projects')} className="text-xs text-primary-600 font-medium">
              View all
            </button>
          </div>

          {workQueue.length === 0 ? (
            <Card padding="sm">
              <p className="text-sm text-slate-500 text-center py-6">
                No active projects. Add a customer to start meter installation work.
              </p>
              <Button onClick={() => navigate('/customers/new')} fullWidth className="mt-2">
                <UserPlus className="w-4 h-4" /> New Customer & Project
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {workQueue.slice(0, 6).map((project) => (
                <ProjectWorkCard
                  key={project.id}
                  project={project}
                  customer={customers.find((c) => c.id === project.customerId)}
                  payments={payments}
                  onClick={() => navigate(`/projects/${project.id}`)}
                />
              ))}
              {workQueue.length > 6 && (
                <Button variant="outline" fullWidth onClick={() => navigate('/projects')}>
                  View {workQueue.length - 6} more active works
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
