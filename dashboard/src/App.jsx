import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Overview from './pages/Overview'
import Search from './pages/Search'
import { useFilteredData } from './hooks/useFilteredData'

export default function App() {
  const [page, setPage] = useState('overview')
  const [filters, setFilters] = useState({ annee: null, cnu: null, etablissement: null })
  const data = useFilteredData(filters)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar filters={filters} onChange={setFilters} activePage={page} onNavigate={setPage} />
      <main className="flex-1 overflow-y-auto">
        {page === 'overview' && <Overview data={data} />}
        {page === 'search'   && <Search />}
      </main>
    </div>
  )
}
