import { useState, useEffect } from 'react'
import Sidebar from './components/layout/Sidebar'
import SearchBar from './components/SearchBar'
import Overview from './pages/Overview'
import Concentration from './pages/Concentration'
import Temporel from './pages/Temporel'
import Reseau from './pages/Reseau'
import Disciplines from './pages/Disciplines'
import Tutorial from './components/layout/Tutorial'
import { useFilteredData } from './hooks/useFilteredData'

export default function App() {
  const [page, setPage] = useState('overview')
  const [filters, setFilters] = useState({ annee: null, cnu: null, etablissement: null, query: '' })
  const data = useFilteredData(filters)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isTutorialActive, setIsTutorialActive] = useState(false)

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [isDarkMode])

  return (
    <div className={`flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors ${isDarkMode ? 'dark' : ''}`}>
      <Sidebar filters={filters} onChange={setFilters} activePage={page} onNavigate={setPage} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} isTutorialActive={isTutorialActive} />
      <Tutorial onNavigate={setPage} currentPage={page} onActiveChange={setIsTutorialActive} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {page !== 'disciplines' && (
          <SearchBar
            query={filters.query}
            onQueryChange={q => setFilters(f => ({ ...f, query: q }))}
            data={data}
          />
        )}
        <div className="flex-1 overflow-y-auto">
          {page === 'overview'      && <Overview data={data} />}
          {page === 'temporel'      && <Temporel data={data} filters={filters} />}
          {page === 'concentration' && <Concentration data={data} />}
          {page === 'reseau'        && <Reseau data={data} filters={filters} isDarkMode={isDarkMode} />}
          {page === 'disciplines'   && <Disciplines data={data} filters={filters} isDarkMode={isDarkMode} />}
        </div>
      </main>
    </div>
  )
}
