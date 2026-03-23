import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import SparkLine from '../components/charts/SparkLine'
import { allData } from '../hooks/useFilteredData'

const CNU_LABELS = {
  '04': 'Science politique',
  '06': 'Sciences de gestion',
  '17': 'Philosophie',
  '18': 'Arts',
  '19': 'Sociologie',
  '20': 'Ethnologie',
  '70': "Sciences de l'éducation",
  '71': 'Info-com',
  '72': 'Épistémologie',
}

function KpiCard({ label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  }
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-1 ${colors[color]}`}>
      <span className="text-xs font-semibold uppercase tracking-widest opacity-60">{label}</span>
      <span className="text-3xl font-bold">{value}</span>
      {sub && <span className="text-xs opacity-70">{sub}</span>}
    </div>
  )
}

function highlight(text, query) {
  if (!query || !text) return text
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark>
      : part
  )
}

function ThesisCard({ thesis, query }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <p className="text-sm font-semibold text-slate-800 leading-snug">
        {highlight(thesis.titre, query)}
      </p>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2.5 py-0.5 font-medium">{thesis.annee}</span>
        <span className="bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5">{thesis.etablissement_norm}</span>
        <span className="bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2.5 py-0.5">{thesis.cnu} – {CNU_LABELS[thesis.cnu] || thesis.cnu}</span>
        {thesis.accessible && <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5">Open Access</span>}
      </div>
      {thesis.directeurs?.length > 0 && (
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-600">Directeur{thesis.directeurs.length > 1 ? 's' : ''} : </span>
          {thesis.directeurs.join(', ')}
        </p>
      )}
    </div>
  )
}

export default function Overview({ data, query = '', onQueryChange }) {
  const [showResults, setShowResults] = useState(false)
  // Si la recherche ne donne aucun résultat, les visuels restent sur les données globales
  const visData = data.length > 0 ? data : allData

  const stats = useMemo(() => {
    const nbTheses = visData.length
    const nbEtabs = new Set(visData.map(d => d.etablissement_norm)).size
    const tauxCoEnc = (visData.filter(d => d.directeurs?.length > 1).length / nbTheses * 100).toFixed(1)
    const nbDirecteurs = new Set(visData.flatMap(d => d.directeurs ?? [])).size

    // Sparkline : thèses par année
    const byYear = {}
    visData.forEach(d => { byYear[d.annee] = (byYear[d.annee] || 0) + 1 })
    const sparkData = Object.entries(byYear).sort().map(([annee, nb]) => ({ annee: +annee, nb }))

    // Carte : agrégation par établissement (lat/lon + count)
    const etabMap = {}
    visData.forEach(d => {
      if (d.lat == null || d.lon == null) return
      const key = d.etablissement_norm
      if (!etabMap[key]) etabMap[key] = { lat: d.lat, lon: d.lon, nb: 0, name: key }
      etabMap[key].nb++
    })
    const mapPoints = Object.values(etabMap)
    const maxNb = Math.max(...mapPoints.map(p => p.nb))

    // CNU distribution
    const byCnu = {}
    visData.forEach(d => { byCnu[d.cnu] = (byCnu[d.cnu] || 0) + 1 })
    const cnuData = Object.entries(byCnu)
      .sort((a, b) => b[1] - a[1])
      .map(([cnu, nb]) => ({ cnu, label: CNU_LABELS[cnu] || cnu, nb, pct: (nb / nbTheses * 100).toFixed(1) }))

    return { nbTheses, nbEtabs, nbDirecteurs, tauxCoEnc, sparkData, mapPoints, maxNb, cnuData }
  }, [visData])

  return (
    <div className="p-8 flex flex-col gap-8">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Vue d'ensemble</h2>
        <p className="text-slate-500 text-sm mt-1">
          {stats.nbTheses.toLocaleString('fr-FR')} thèses · 2021–2026 · {stats.nbEtabs} établissements
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Rechercher une thèse, un directeur, un établissement…"
          className="w-full pl-12 pr-10 py-4 text-base border border-slate-300 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-slate-400"
        />
        {query && (
          <button onClick={() => onQueryChange('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
        )}
      </div>

      {/* Encadré résultats de recherche (cliquable) */}
      {query.trim().length >= 2 && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowResults(v => !v)}
            className="flex items-center justify-between w-full bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-4 text-left hover:bg-indigo-100 transition-colors"
          >
            <span className="text-sm text-indigo-700">
              {data.length === 0
                ? 'Aucun résultat'
                : <><span className="font-bold text-indigo-800">{data.length.toLocaleString('fr-FR')}</span> thèse{data.length > 1 ? 's' : ''} trouvée{data.length > 1 ? 's' : ''}</>
              }
            </span>
            <svg
              className={`w-4 h-4 text-indigo-500 transition-transform ${showResults ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showResults && data.length > 0 && (
            <>
              {data.slice(0, 100).map(thesis => (
                <ThesisCard key={thesis.id} thesis={thesis} query={query.trim()} />
              ))}
              {data.length > 100 && (
                <p className="text-center text-sm text-slate-400 py-2">
                  Affichage des 100 premiers résultats — affinez votre recherche
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Thèses totales" value={stats.nbTheses.toLocaleString('fr-FR')} color="indigo" />
        <KpiCard label="Établissements" value={stats.nbEtabs} color="amber" />
        <KpiCard label="Directeurs distincts" value={stats.nbDirecteurs.toLocaleString('fr-FR')} sub="chercheurs encadrants" color="emerald" />
        <KpiCard label="Co-encadrement" value={`${stats.tauxCoEnc}%`} sub="thèses avec plusieurs directeurs" color="rose" />
      </div>

      {/* Évolution annuelle */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Évolution annuelle</p>
        <div className="flex items-end gap-6">
          <div className="flex-1">
            <SparkLine data={stats.sparkData} />
            <div className="flex justify-between mt-1">
              {stats.sparkData.map(d => (
                <span key={d.annee} className="text-xs text-slate-400">{d.annee}</span>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0">
            {stats.sparkData.map(d => (
              <div key={d.annee} className="text-xs text-slate-600">
                <span className="font-medium">{d.nb.toLocaleString('fr-FR')}</span>
                <span className="text-slate-400 ml-1">en {d.annee}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carte + CNU */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Répartition géographique</p>
          <div className="rounded-xl overflow-hidden" style={{ height: 380 }}>
            <MapContainer center={[46.5, 2.5]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com">CARTO</a>'
              />
              {stats.mapPoints.map(p => (
                <CircleMarker
                  key={p.name}
                  center={[p.lat, p.lon]}
                  radius={Math.max(4, Math.sqrt(p.nb / stats.maxNb) * 28)}
                  pathOptions={{ fillColor: '#6366f1', fillOpacity: 0.65, color: '#4338ca', weight: 1 }}
                >
                  <Tooltip>
                    <span className="font-semibold">{p.name}</span><br />
                    {p.nb.toLocaleString('fr-FR')} thèse{p.nb > 1 ? 's' : ''}
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">Par section CNU</p>
          <div className="flex flex-col gap-3">
            {stats.cnuData.map(({ cnu, label, nb, pct }) => (
              <div key={cnu}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-700 font-medium">{cnu} – {label}</span>
                  <span className="text-slate-500">{nb.toLocaleString('fr-FR')}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
