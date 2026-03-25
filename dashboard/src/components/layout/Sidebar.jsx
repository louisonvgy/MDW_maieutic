import { allData } from '../../hooks/useFilteredData'

const years = [...new Set(allData.map(d => d.annee))].sort()
const cnus = [...new Set(allData.map(d => d.cnu_norm).filter(Boolean))].sort()
const etabs = [...new Set(allData.map(d => d.etablissement_norm))].sort()

const NAV = [
  { id: 'overview',      label: 'Vue d\'ensemble' },
  { id: 'temporel',      label: 'Évolution temporelle' },
  { id: 'concentration', label: 'Concentration' },
  { id: 'reseau',        label: 'Réseau' },
  { id: 'disciplines',   label: 'Regroupement par mot clé' },
]

export default function Sidebar({ filters, onChange, activePage, onNavigate, isDarkMode, toggleDarkMode }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value || null })

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 flex flex-col transition-colors">
      <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 flex-1">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">M@ieutic</span>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Cartographie des thèses</h1>
            <button 
              onClick={toggleDarkMode} 
              className="p-1.5 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0" 
              title={isDarkMode ? "Passer au mode clair" : "Passer au mode nuit"}
            >
              <img 
                src={isDarkMode ? "/mode-lumiere.png" : "/mode-nuit.png"} 
                alt={isDarkMode ? "Soleil" : "Lune"} 
                className="w-6 h-6 object-contain"
              />
            </button>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ id, label, soon }) => (
          <button
            key={id}
            disabled={soon}
            onClick={() => !soon && onNavigate(id)}
            className={`text-sm text-left rounded-lg px-3 py-2 transition-colors flex items-center justify-between
              ${soon
                ? 'text-slate-300 dark:text-slate-600 cursor-default'
                : activePage === id
                  ? 'bg-canard-50 text-canard-700 font-medium dark:bg-canard-900/30 dark:text-canard-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-canard-600 dark:hover:text-canard-400 hover:bg-canard-50 dark:hover:bg-slate-800'
              }`}
          >
            {label}
            {soon && <span className="text-xs bg-slate-100 text-slate-400 rounded px-1.5 py-0.5">bientôt</span>}
          </button>
        ))}
      </nav>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Filtres</p>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Année</span>
          <select value={filters.annee ?? ''} onChange={set('annee')}
            className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none">
            <option value="">Toutes</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Section CNU</span>
          <select value={filters.cnu ?? ''} onChange={set('cnu')}
            className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none">
            <option value="">Toutes</option>
            {cnus.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Établissement</span>
          <select value={filters.etablissement ?? ''} onChange={set('etablissement')}
            className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none">
            <option value="">Tous</option>
            {etabs.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>

        {(filters.annee || filters.cnu || filters.etablissement) && (
          <button onClick={() => onChange({ annee: null, cnu: null, etablissement: null })}
            className="text-xs text-red-500 hover:text-red-700 text-left">
            Réinitialiser les filtres
          </button>
        )}
      </div>
      </div>
    </aside>
  )
}
