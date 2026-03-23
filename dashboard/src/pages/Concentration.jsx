import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, ReferenceLine,
} from 'recharts'

const CNU_LABELS = {
  '04': 'Science politique', '06': 'Sciences de gestion',
  '17': 'Philosophie', '18': 'Arts', '19': 'Sociologie',
  '20': 'Ethnologie', '70': "Sciences de l'éducation",
  '71': 'Info-com', '72': 'Épistémologie',
}

function SectionTitle({ children }) {
  return <h3 className="text-base font-semibold text-slate-700 mb-4">{children}</h3>
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 ${className}`}>
      {children}
    </div>
  )
}

function GiniChip({ gini }) {
  const color = gini > 0.6 ? 'text-red-600 bg-red-50 border-red-100'
    : gini > 0.4 ? 'text-amber-600 bg-amber-50 border-amber-100'
    : 'text-emerald-600 bg-emerald-50 border-emerald-100'
  return (
    <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${color}`}>
      Gini = {gini.toFixed(3)}
    </span>
  )
}

function computeConcentration(values) {
  const sorted = [...values].sort((a, b) => b - a)
  const total = sorted.reduce((s, v) => s + v, 0)
  let sum = 0
  return sorted.map((v, i) => {
    sum += v
    return { rank: i + 1, cumPct: parseFloat((sum / total * 100).toFixed(2)) }
  })
}

function computeGini(values) {
  const n = values.length
  if (n === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const total = sorted.reduce((s, v) => s + v, 0)
  let sumNumerator = 0
  sorted.forEach((v, i) => { sumNumerator += (2 * (i + 1) - n - 1) * v })
  return sumNumerator / (n * total)
}

const TooltipStyle = {
  contentStyle: { fontSize: 11, padding: '4px 10px', border: 'none', background: '#1e293b', color: '#fff', borderRadius: 6 },
  itemStyle: { color: '#fff' },
}

export default function Concentration({ data }) {
  const stats = useMemo(() => {
    if (!data.length) return null

    // --- Établissements ---
    const etabCount = {}
    data.forEach(d => { etabCount[d.etablissement_norm] = (etabCount[d.etablissement_norm] || 0) + 1 })

    const etabEntries = Object.entries(etabCount).sort((a, b) => b[1] - a[1])
    const top20Etab = etabEntries.slice(0, 20).map(([name, nb]) => ({ name, nb }))

    const etabValues = etabEntries.map(([, nb]) => nb)
    const concEtab = computeConcentration(etabValues)
    const giniEtab = computeGini(etabValues)

    // Distribution : nb thèses par établissement → histogramme
    const bins = {}
    etabValues.forEach(v => {
      const bin = v <= 10 ? `1–10` : v <= 50 ? `11–50` : v <= 100 ? `51–100` : v <= 200 ? `101–200` : `>200`
      bins[bin] = (bins[bin] || 0) + 1
    })
    const binOrder = ['1–10', '11–50', '51–100', '101–200', '>200']
    const histogram = binOrder.map(b => ({ bin: b, nb: bins[b] || 0 }))

    // --- Directeurs ---
    const dirCount = {}
    data.forEach(d => d.directeurs?.forEach(dir => { dirCount[dir] = (dirCount[dir] || 0) + 1 }))
    const dirValues = Object.values(dirCount).sort((a, b) => b - a)
    const concDir = computeConcentration(dirValues)
    const giniDir = computeGini(dirValues)
    const top20Dir = Object.entries(dirCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, nb]) => ({ name, nb }))

    // --- CNU ---
    const cnuCount = {}
    data.forEach(d => { cnuCount[d.cnu] = (cnuCount[d.cnu] || 0) + 1 })
    const cnuData = Object.entries(cnuCount)
      .sort((a, b) => b[1] - a[1])
      .map(([cnu, nb]) => ({ cnu, label: CNU_LABELS[cnu] || cnu, nb }))

    return { top20Etab, concEtab, giniEtab, histogram, top20Dir, concDir, giniDir, cnuData, nbEtab: etabEntries.length }
  }, [data])

  if (!stats) return <p className="p-8 text-slate-400">Aucune donnée</p>

  return (
    <div className="p-8 flex flex-col gap-8">

      <div>
        <h2 className="text-2xl font-bold text-slate-800">Concentration</h2>
        <p className="text-slate-500 text-sm mt-1">
          Distribution et concentration des thèses par établissement et directeur
        </p>
      </div>

      {/* Top 20 établissements */}
      <Card>
        <SectionTitle>Top 20 établissements</SectionTitle>
        <ResponsiveContainer width="100%" height={480}>
          <BarChart data={stats.top20Etab} layout="vertical" margin={{ left: 200, right: 40, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 11 }} />
            <Tooltip {...TooltipStyle} formatter={v => [v.toLocaleString('fr-FR'), 'thèses']} />
            <Bar dataKey="nb" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Histogramme + Concentration établissements */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Distribution par établissement</SectionTitle>
          </div>
          <p className="text-xs text-slate-400 mb-3">Nombre d'établissements selon leur volume de thèses</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.histogram} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="bin" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...TooltipStyle} formatter={v => [v, 'établissements']} />
              <Bar dataKey="nb" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-1">
            <SectionTitle>Courbe de concentration — établissements</SectionTitle>
            <GiniChip gini={stats.giniEtab} />
          </div>
          <p className="text-xs text-slate-400 mb-3">
            % cumulé de thèses selon le rang de l'établissement (ordre décroissant)
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.concEtab} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rank" tick={{ fontSize: 10 }} label={{ value: 'Rang', position: 'insideBottom', offset: -2, fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
              <Tooltip {...TooltipStyle} formatter={v => [`${v}%`, 'cumulé']} labelFormatter={l => `Rang ${l}`} />
              <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: '80%', fontSize: 10, fill: '#f59e0b' }} />
              <Line type="monotone" dataKey="cumPct" stroke="#6366f1" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

      </div>

      {/* Top 20 directeurs */}
      <Card>
        <SectionTitle>Top 20 directeurs de thèse</SectionTitle>
        <ResponsiveContainer width="100%" height={480}>
          <BarChart data={stats.top20Dir} layout="vertical" margin={{ left: 200, right: 40, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 11 }} />
            <Tooltip {...TooltipStyle} formatter={v => [v, 'thèses encadrées']} />
            <Bar dataKey="nb" fill="#f97316" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Concentration directeurs + CNU */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <Card>
          <div className="flex items-center justify-between mb-1">
            <SectionTitle>Courbe de concentration — directeurs</SectionTitle>
            <GiniChip gini={stats.giniDir} />
          </div>
          <p className="text-xs text-slate-400 mb-3">
            % cumulé de thèses selon le rang du directeur (ordre décroissant)
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.concDir} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rank" tick={{ fontSize: 10 }} label={{ value: 'Rang', position: 'insideBottom', offset: -2, fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
              <Tooltip {...TooltipStyle} formatter={v => [`${v}%`, 'cumulé']} labelFormatter={l => `Rang ${l}`} />
              <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: '80%', fontSize: 10, fill: '#f59e0b' }} />
              <Line type="monotone" dataKey="cumPct" stroke="#f97316" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Thèses par section CNU</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.cnuData} margin={{ left: 0, right: 10, top: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...TooltipStyle} formatter={v => [v.toLocaleString('fr-FR'), 'thèses']} labelFormatter={l => l} />
              <Bar dataKey="nb" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

      </div>
    </div>
  )
}
