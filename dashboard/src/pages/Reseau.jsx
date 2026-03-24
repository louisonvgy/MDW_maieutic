import { useMemo, useState, useRef, useEffect } from 'react'
import ForceGraph from '../components/charts/ForceGraph'
import KeywordTrends from '../components/charts/KeywordTrends'
import KeywordDrillDown from '../components/charts/KeywordDrillDown'
import MapNetwork from '../components/charts/MapNetwork'

export default function Reseau({ data, filters }) {
  const [graphWidth, setGraphWidth] = useState(800)
  const containerRef = useRef()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      setGraphWidth(entry.contentRect.width - 40) // subtract padding
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const stats = useMemo(() => {
    if (!data.length) return null

    const directorTheses = {}
    const coDirections = {}
    const directorEtabs = {}

    data.forEach(d => {
      const dirs = d.directeurs ?? []
      dirs.forEach(dir => {
        directorTheses[dir] = (directorTheses[dir] || 0) + 1
        if (!directorEtabs[dir]) directorEtabs[dir] = new Set()
        directorEtabs[dir].add(d.etablissement_norm || d.etablissement)
      })
      if (dirs.length > 1) {
        for (let i = 0; i < dirs.length; i++) {
          for (let j = i + 1; j < dirs.length; j++) {
            const key = [dirs[i], dirs[j]].sort().join('|||')
            coDirections[key] = (coDirections[key] || 0) + 1
          }
        }
      }
    })

    const nbCoDir = data.filter(d => (d.directeurs?.length ?? 0) > 1).length
    const pctCoDir = ((nbCoDir / data.length) * 100).toFixed(1)
    const nbDirecteurs = Object.keys(directorTheses).length
    const nbPairs = Object.keys(coDirections).length
    const nbBridge = Object.values(directorEtabs).filter(s => s.size > 1).length

    return { nbCoDir, pctCoDir, nbDirecteurs, nbPairs, nbBridge }
  }, [data])

  if (!stats) return <p className="p-8 text-slate-400">Aucune donnée</p>

  return (
    <div className="p-8 flex flex-col gap-8" ref={containerRef}>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Analyse de réseau</h2>
        <p className="text-slate-500 text-sm mt-1">
          Collaborations entre directeurs, co-encadrements et liens inter-établissements
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border p-5 flex flex-col gap-1 bg-violet-50 text-violet-700 border-violet-100">
          <span className="text-xs font-semibold uppercase tracking-widest opacity-60">Directeurs distincts</span>
          <span className="text-3xl font-bold">{stats.nbDirecteurs.toLocaleString('fr-FR')}</span>
        </div>
        <div className="rounded-2xl border p-5 flex flex-col gap-1 bg-indigo-50 text-indigo-700 border-indigo-100">
          <span className="text-xs font-semibold uppercase tracking-widest opacity-60">Thèses co-dirigées</span>
          <span className="text-3xl font-bold">{stats.nbCoDir.toLocaleString('fr-FR')}</span>
          <span className="text-xs opacity-70">{stats.pctCoDir}% du corpus</span>
        </div>
        <div className="rounded-2xl border p-5 flex flex-col gap-1 bg-emerald-50 text-emerald-700 border-emerald-100">
          <span className="text-xs font-semibold uppercase tracking-widest opacity-60">Paires de co-directeurs</span>
          <span className="text-3xl font-bold">{stats.nbPairs.toLocaleString('fr-FR')}</span>
        </div>
        <div className="rounded-2xl border p-5 flex flex-col gap-1 bg-amber-50 text-amber-700 border-amber-100">
          <span className="text-xs font-semibold uppercase tracking-widest opacity-60">Directeurs multi-étab.</span>
          <span className="text-3xl font-bold">{stats.nbBridge}</span>
          <span className="text-xs opacity-70">actifs dans 2+ établissements</span>
        </div>
      </div>

      {/* Chart 1: Force-directed co-direction graph */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-1">🔗 Réseau des co-directions</p>
        <p className="text-xs text-slate-400 mb-4">
          Chaque nœud est un directeur de thèse. Un lien relie deux chercheurs ayant co-dirigé au moins une thèse.
          La taille du nœud reflète le nombre de thèses dirigées, l'épaisseur du lien le nombre de co-directions.
        </p>
        <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
          <ForceGraph data={data} width={graphWidth > 0 ? graphWidth : 800} height={550} />
        </div>
      </div>

      {/* Chart 2 & 3: Keyword Trends and Drill-Down */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-[500px]">
        {/* Trend Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
          <p className="text-sm font-semibold text-slate-700 mb-1">📈 Tendances des mots-clés</p>
          <p className="text-xs text-slate-400 mb-4 flex-none">
            {filters?.annee 
              ? `Top mot-clé par domaine (CNU) pour l'année ${filters.annee}.`
              : "Chaque courbe représente une discipline (CNU). Survolez les points pour découvrir quel était le mot le plus utilisé cette année-là !"}
          </p>
          <div className="flex-1 w-full relative">
            <KeywordTrends data={data} selectedYear={filters?.annee} />
          </div>
        </div>

        {/* Drill-down Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
          <p className="text-sm font-semibold text-slate-700 mb-1">🔍 Exploration Profonde (Drill-Down)</p>
          <p className="text-xs text-slate-400 mb-4 flex-none">
            Cliquez sur un arc pour plonger dans la donnée : Disciplines (CNU) → Années → Mots-clés.
          </p>
          <div className="flex-1 w-full relative">
            <KeywordDrillDown filters={filters} />
          </div>
        </div>
      </div>

      {/* Chart 3: Map with inter-establishment links */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-1">🏛️ Réseau inter-établissements</p>
        <p className="text-xs text-slate-400 mb-4">
          Les lignes sur la carte relient les établissements partageant au moins un directeur de thèse.
          L'épaisseur du trait reflète le nombre de directeurs partagés.
        </p>
        <MapNetwork data={data} filters={filters} />
      </div>

    </div>
  )
}
