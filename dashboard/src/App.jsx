import { useState, useEffect } from 'react'
import Sidebar from './components/layout/Sidebar'
import Overview from './pages/Overview'
import Concentration from './pages/Concentration'
import Temporel from './pages/Temporel'
import Reseau from './pages/Reseau'
import Disciplines from './pages/Disciplines'
import { useFilteredData } from './hooks/useFilteredData'

export default function App() {
  const [page, setPage] = useState('overview')
  const [filters, setFilters] = useState({ annee: null, cnu: null, etablissement: null, query: '' })
  const data = useFilteredData(filters)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [isDarkMode])

  return (
    <div className={`flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors ${isDarkMode ? 'dark' : ''}`}>
      <Sidebar filters={filters} onChange={setFilters} activePage={page} onNavigate={setPage} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
      <main className="flex-1 overflow-y-auto">
        {page === 'overview'      && <Overview data={data} query={filters.query} onQueryChange={q => setFilters(f => ({ ...f, query: q }))} />}
        {page === 'temporel'      && <Temporel data={data} />}
        {page === 'concentration' && <Concentration data={data} />}
        {page === 'reseau'        && <Reseau data={data} filters={filters} isDarkMode={isDarkMode} />}
        {page === 'disciplines'   && <Disciplines data={data} filters={filters} isDarkMode={isDarkMode} />}
      </main>
    </div>
  )
}
