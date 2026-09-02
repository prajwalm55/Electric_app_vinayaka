import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, FolderKanban, Home } from 'lucide-react'
import { Header } from '../components/layout/AppLayout'
import { Card } from '../components/ui/Card'
import { useData } from '../context/DataContext'
import type { SearchResult } from '../context/DataContext'

const typeIcons = {
  customer: Users,
  project: FolderKanban,
  property: Home,
}

const typeLabels = {
  customer: 'Customer',
  project: 'Project',
  property: 'Property',
}

export function SearchPage() {
  const navigate = useNavigate()
  const { search } = useData()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (value.trim().length >= 2) {
      setResults(search(value))
    } else {
      setResults([])
    }
  }

  return (
    <div>
      <Header title="Search" subtitle="Find customers, projects, properties" backTo="/" />

      <div className="px-4 lg:px-6 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            autoFocus
            placeholder="Name, mobile, Aadhaar, SR/PRJ number, RR number..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 min-h-[48px]"
          />
        </div>

        {query.length > 0 && query.length < 2 && (
          <p className="text-sm text-slate-500 text-center">Type at least 2 characters to search</p>
        )}

        {results.length === 0 && query.length >= 2 && (
          <p className="text-sm text-slate-500 text-center py-8">No results found for "{query}"</p>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">{results.length} result(s)</p>
            {results.map((result) => {
              const Icon = typeIcons[result.type]
              return (
                <Card key={`${result.type}-${result.id}`} onClick={() => navigate(result.link)} padding="sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{result.title}</p>
                      <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full shrink-0">
                      {typeLabels[result.type]}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        <div className="pt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Search by</p>
          <div className="flex flex-wrap gap-2">
            {['Customer Name', 'Mobile', 'Aadhaar', 'Document No.', 'SR Number', 'Project No.', 'RR Number', 'Village', 'Status'].map((tag) => (
              <span key={tag} className="text-xs bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
