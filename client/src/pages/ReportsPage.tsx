import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Users,
  FolderKanban,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { Header } from '../components/layout/AppLayout'
import { Card, CardTitle } from '../components/ui/Card'
import { LoadingState } from '../components/ui/LoadingState'
import { useData } from '../context/DataContext'
import { formatCurrency } from '../utils/formatters'
import { getCustomerPaymentBalance, getProjectPaymentBalance, sumPayments } from '../utils/payments'
import { WORKFLOW_STAGES } from '../types'

type ReportTab = 'overview' | 'work' | 'payments' | 'customers'

const tabs: { id: ReportTab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'work', label: 'Work', icon: FolderKanban },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'customers', label: 'Customers', icon: Users },
]

export function ReportsPage() {
  const navigate = useNavigate()
  const { customers, projects, payments, loading } = useData()
  const [tab, setTab] = useState<ReportTab>('overview')

  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === 'Active')
    const completedProjects = projects.filter((p) => p.status === 'Completed')
    const cancelledProjects = projects.filter((p) => p.status === 'Cancelled')
    const onHoldProjects = projects.filter((p) => p.status === 'On Hold')

    const totalReceived = sumPayments(payments)
    const totalAgreed = projects.reduce((sum, p) => sum + (p.totalAmount || 0), 0)
    const totalDue = projects.reduce((sum, p) => sum + getProjectPaymentBalance(p, payments).remaining, 0)
    const collectionPercent = totalAgreed > 0 ? Math.min(Math.round((totalReceived / totalAgreed) * 100), 100) : 0

    const stageBreakdown = WORKFLOW_STAGES.map((stage) => ({
      stage,
      count: activeProjects.filter((p) => p.currentStage === stage).length,
    }))
    const maxStageCount = Math.max(...stageBreakdown.map((s) => s.count), 1)

    const paymentByType = Object.entries(
      payments.reduce(
        (acc, p) => {
          acc[p.type] = (acc[p.type] || 0) + p.amount
          return acc
        },
        {} as Record<string, number>,
      ),
    )
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => b.amount - a.amount)
    const maxTypeAmount = Math.max(...paymentByType.map((p) => p.amount), 1)

    const now = new Date()
    const newCustomersThisMonth = customers.filter((c) => {
      const created = new Date(c.createdAt)
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length

    const customersWithMultipleProjects = customers.filter(
      (c) => projects.filter((p) => p.customerId === c.id).length > 1,
    ).length

    const projectRows = [...projects]
      .map((project) => {
        const balance = getProjectPaymentBalance(project, payments)
        const customer = customers.find((c) => c.id === project.customerId)
        return {
          project,
          customer,
          balance,
          paid: balance.paid,
        }
      })
      .sort((a, b) => b.balance.remaining - a.balance.remaining || b.paid - a.paid)

    const dueProjects = projectRows.filter((row) => row.balance.hasTarget && row.balance.remaining > 0)
    const topPaidProjects = [...projectRows].filter((row) => row.paid > 0).sort((a, b) => b.paid - a.paid).slice(0, 8)

    const villageCounts = customers.reduce(
      (acc, c) => {
        const village = c.village || 'Unknown'
        acc[village] = (acc[village] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    const topVillages = Object.entries(villageCounts)
      .map(([village, count]) => ({ village, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
    const maxVillageCount = Math.max(...topVillages.map((v) => v.count), 1)

    return {
      activeProjects,
      completedProjects,
      cancelledProjects,
      onHoldProjects,
      totalReceived,
      totalAgreed,
      totalDue,
      collectionPercent,
      stageBreakdown,
      maxStageCount,
      paymentByType,
      maxTypeAmount,
      newCustomersThisMonth,
      customersWithMultipleProjects,
      projectRows,
      dueProjects,
      topPaidProjects,
      topVillages,
      maxVillageCount,
    }
  }, [customers, projects, payments])

  if (loading) {
    return (
      <div>
        <Header title="Reports" subtitle="Quick view of work, money & customers" />
        <div className="px-4 lg:px-6 py-4"><LoadingState label="Loading reports..." /></div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Reports" subtitle="Quick view of work, money & customers" />

      <div className="px-4 lg:px-6 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                tab === id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Snapshot KPIs — always visible */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setTab('payments')}
            className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-green-200 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-lg font-bold text-green-700 leading-tight">{formatCurrency(stats.totalReceived)}</p>
            <p className="text-xs text-slate-500 mt-1">Total received</p>
          </button>

          <button
            type="button"
            onClick={() => setTab('payments')}
            className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-amber-200 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-lg font-bold text-amber-700 leading-tight">{formatCurrency(stats.totalDue)}</p>
            <p className="text-xs text-slate-500 mt-1">Balance due</p>
          </button>

          <button
            type="button"
            onClick={() => setTab('work')}
            className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-primary-200 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center mb-2">
              <FolderKanban className="w-5 h-5 text-primary-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.activeProjects.length}</p>
            <p className="text-xs text-slate-500 mt-1">Active works</p>
          </button>

          <button
            type="button"
            onClick={() => setTab('customers')}
            className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-blue-200 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{customers.length}</p>
            <p className="text-xs text-slate-500 mt-1">Customers</p>
          </button>
        </div>

        {tab === 'overview' && (
          <>
            {stats.totalAgreed > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <CardTitle>Collection progress</CardTitle>
                  <span className="text-sm font-bold text-primary-700">{stats.collectionPercent}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all ${stats.collectionPercent >= 100 ? 'bg-green-500' : 'bg-primary-500'}`}
                    style={{ width: `${stats.collectionPercent}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 px-2 py-2">
                    <p className="text-[10px] text-slate-500">Target</p>
                    <p className="text-sm font-semibold text-slate-800">{formatCurrency(stats.totalAgreed)}</p>
                  </div>
                  <div className="rounded-xl bg-green-50 px-2 py-2">
                    <p className="text-[10px] text-green-700">Received</p>
                    <p className="text-sm font-semibold text-green-800">{formatCurrency(stats.totalReceived)}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 px-2 py-2">
                    <p className="text-[10px] text-amber-700">Remaining</p>
                    <p className="text-sm font-semibold text-amber-800">{formatCurrency(stats.totalDue)}</p>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <CardTitle>Work status</CardTitle>
                  <button type="button" onClick={() => setTab('work')} className="text-xs text-primary-600 font-medium">
                    Details
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Active', value: stats.activeProjects.length, icon: Clock, tone: 'bg-primary-50 text-primary-700' },
                    { label: 'Completed', value: stats.completedProjects.length, icon: CheckCircle, tone: 'bg-green-50 text-green-700' },
                    { label: 'On Hold', value: stats.onHoldProjects.length, icon: AlertTriangle, tone: 'bg-amber-50 text-amber-700' },
                    { label: 'Cancelled', value: stats.cancelledProjects.length, icon: AlertTriangle, tone: 'bg-red-50 text-red-700' },
                  ].map(({ label, value, icon: Icon, tone }) => (
                    <div key={label} className={`rounded-xl px-3 py-3 ${tone.split(' ')[0]}`}>
                      <Icon className={`w-4 h-4 mb-1 ${tone.split(' ')[1]}`} />
                      <p className={`text-xl font-bold ${tone.split(' ')[1]}`}>{value}</p>
                      <p className="text-[10px] text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-3">
                  <CardTitle>Where money came from</CardTitle>
                  <button type="button" onClick={() => setTab('payments')} className="text-xs text-primary-600 font-medium">
                    Details
                  </button>
                </div>
                {stats.paymentByType.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No payments yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats.paymentByType.slice(0, 4).map(({ type, amount }) => (
                      <div key={type}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 truncate pr-2">{type}</span>
                          <span className="font-semibold text-green-700 shrink-0">{formatCurrency(amount)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(amount / stats.maxTypeAmount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <Card>
              <div className="flex items-center justify-between mb-3">
                <CardTitle>Highest balance due</CardTitle>
                <button type="button" onClick={() => setTab('payments')} className="text-xs text-primary-600 font-medium">
                  See all
                </button>
              </div>
              {stats.dueProjects.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">All projects are fully paid or have no target set</p>
              ) : (
                <div className="space-y-2">
                  {stats.dueProjects.slice(0, 5).map(({ project, customer, balance }) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{customer?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{project.id} · {project.currentStage}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-amber-700">{formatCurrency(balance.remaining)}</p>
                        <p className="text-[10px] text-slate-400">
                          {formatCurrency(balance.paid)} / {formatCurrency(balance.agreedTotal!)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {tab === 'work' && (
          <>
            <Card>
              <CardTitle className="mb-3">Project status</CardTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: projects.length, color: 'text-slate-900', bg: 'bg-slate-50' },
                  { label: 'Active', value: stats.activeProjects.length, color: 'text-primary-700', bg: 'bg-primary-50' },
                  { label: 'Completed', value: stats.completedProjects.length, color: 'text-green-700', bg: 'bg-green-50' },
                  { label: 'Cancelled', value: stats.cancelledProjects.length, color: 'text-red-700', bg: 'bg-red-50' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`rounded-xl ${bg} px-3 py-3 text-center`}>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardTitle className="mb-1">Active work by stage</CardTitle>
              <p className="text-xs text-slate-500 mb-4">Where current jobs are stuck or moving</p>
              <div className="space-y-3">
                {stats.stageBreakdown.map(({ stage, count }) => (
                  <div key={stage}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-slate-700 font-medium">{stage}</span>
                      <span className={`text-xs font-semibold ${count > 0 ? 'text-primary-700' : 'text-slate-400'}`}>
                        {count} work{count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: count > 0 ? `${Math.max((count / stats.maxStageCount) * 100, 8)}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardTitle className="mb-3">Active works list</CardTitle>
              {stats.activeProjects.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No active projects</p>
              ) : (
                <div className="space-y-2">
                  {stats.activeProjects.map((project) => {
                    const customer = customers.find((c) => c.id === project.customerId)
                    const balance = getProjectPaymentBalance(project, payments)
                    return (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{customer?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{project.id} · {project.currentStage}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {balance.hasTarget ? (
                            <>
                              <p className="text-xs font-semibold text-slate-700">
                                {formatCurrency(balance.paid)} / {formatCurrency(balance.agreedTotal!)}
                              </p>
                              <p className="text-[10px] text-amber-600">{formatCurrency(balance.remaining)} due</p>
                            </>
                          ) : (
                            <p className="text-xs text-slate-400">No target</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>
          </>
        )}

        {tab === 'payments' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card padding="sm">
                <p className="text-xs text-slate-500 mb-1">Transactions</p>
                <p className="text-2xl font-bold text-slate-900">{payments.length}</p>
              </Card>
              <Card padding="sm">
                <p className="text-xs text-slate-500 mb-1">Projects with dues</p>
                <p className="text-2xl font-bold text-amber-700">{stats.dueProjects.length}</p>
              </Card>
            </div>

            <Card>
              <CardTitle className="mb-1">Payment by type</CardTitle>
              <p className="text-xs text-slate-500 mb-4">How collections are split</p>
              {stats.paymentByType.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No payments recorded</p>
              ) : (
                <div className="space-y-3">
                  {stats.paymentByType.map(({ type, amount }) => (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-700">{type}</span>
                        <span className="font-semibold text-green-700">{formatCurrency(amount)}</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(amount / stats.maxTypeAmount) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {stats.totalReceived > 0 ? Math.round((amount / stats.totalReceived) * 100) : 0}% of total received
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardTitle className="mb-3">Projects with balance due</CardTitle>
              {stats.dueProjects.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No outstanding balances</p>
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="text-left font-semibold px-2 py-2">Customer</th>
                        <th className="text-left font-semibold px-2 py-2">Project</th>
                        <th className="text-right font-semibold px-2 py-2">Paid / Total</th>
                        <th className="text-right font-semibold px-2 py-2">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.dueProjects.map(({ project, customer, balance }) => (
                        <tr
                          key={project.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <td className="px-2 py-2.5 font-medium text-slate-900">{customer?.name || 'Unknown'}</td>
                          <td className="px-2 py-2.5 text-slate-500">{project.id}</td>
                          <td className="px-2 py-2.5 text-right tabular-nums">
                            <span className="text-green-700">{formatCurrency(balance.paid)}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span>{formatCurrency(balance.agreedTotal!)}</span>
                          </td>
                          <td className="px-2 py-2.5 text-right font-semibold text-amber-700 tabular-nums">
                            {formatCurrency(balance.remaining)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card>
              <CardTitle className="mb-3">Top collections by project</CardTitle>
              {stats.topPaidProjects.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No payments yet</p>
              ) : (
                <div className="space-y-2">
                  {stats.topPaidProjects.map(({ project, customer, paid, balance }) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{customer?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{project.id}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-green-700">{formatCurrency(paid)}</p>
                        {balance.hasTarget && (
                          <p className="text-[10px] text-slate-400">of {formatCurrency(balance.agreedTotal!)}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {tab === 'customers' && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Card padding="sm" className="text-center">
                <p className="text-2xl font-bold text-blue-700">{customers.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Total</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-2xl font-bold text-teal-700">{stats.newCustomersThisMonth}</p>
                <p className="text-xs text-slate-500 mt-0.5">New this month</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-2xl font-bold text-indigo-700">{stats.customersWithMultipleProjects}</p>
                <p className="text-xs text-slate-500 mt-0.5">Multi-project</p>
              </Card>
            </div>

            <Card>
              <CardTitle className="mb-1">Customers by village</CardTitle>
              <p className="text-xs text-slate-500 mb-4">Where most customers come from</p>
              {stats.topVillages.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No customers yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.topVillages.map(({ village, count }) => (
                    <div key={village}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-700">{village}</span>
                        <span className="font-semibold text-slate-900">{count}</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(count / stats.maxVillageCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardTitle className="mb-3">Customer payment snapshot</CardTitle>
              <div className="space-y-2">
                {[...customers]
                  .map((customer) => {
                    const balance = getCustomerPaymentBalance(projects, payments, customer.id)
                    const projectCount = projects.filter((p) => p.customerId === customer.id).length
                    return { customer, balance, projectCount }
                  })
                  .filter(({ balance }) => balance.hasTarget || balance.paid > 0)
                  .sort((a, b) => b.balance.remaining - a.balance.remaining)
                  .slice(0, 10)
                  .map(({ customer, balance, projectCount }) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{customer.name}</p>
                        <p className="text-xs text-slate-500">
                          {customer.village} · {projectCount} project{projectCount === 1 ? '' : 's'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {balance.hasTarget ? (
                          <>
                            <p className="text-xs font-semibold text-slate-700">
                              {formatCurrency(balance.paid)} / {formatCurrency(balance.agreedTotal!)}
                            </p>
                            <p className={`text-[10px] ${balance.remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                              {balance.remaining > 0 ? `${formatCurrency(balance.remaining)} due` : 'Fully paid'}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-semibold text-green-700">{formatCurrency(balance.paid)}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </button>
                  ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
