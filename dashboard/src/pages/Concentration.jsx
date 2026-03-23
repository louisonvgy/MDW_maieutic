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
      Gini = {gini.toFixed(4)}
    </span>
  )
}

// Gini par somme cumulative (formulation Salhi)
function computeGini(values) {
  const arr = [...values].sort((a, b) => a - b)
  const n = arr.length
  const sum = arr.reduce((a, b) => a + b, 0)
  if (sum === 0) return 0
  let cum = 0
  let weightedSum = 0
  for (let i = 0; i < n; i++) {
    cum += arr[i]
    weightedSum += cum
  }
  return (n + 1 - 2 * (weightedSum / sum)) / n
}

// Cumsum normalisé (0→1), trié décroissant
function computeCumsum(values) {
  const sorted = [...values].sort((a, b) => b - a)
  const total = sorted.reduce((a, b) => a + b, 0)
  let sum = 0
  return sorted.map((v, i) => {
    sum += v
    return { rank: i + 1, cumPct: parseFloat((sum / total * 100).toFixed(2)), cumRaw: sum / total }
  })
}

// Indice N tel que les N premiers couvrent >= seuil % des thèses
function findThreshold(cumData, seuil = 0.8) {
  for (let i = 0; i < cumData.length; i++) {
    if (cumData[i].cumRaw >= seuil) return i + 1
  }
  return cumData.length
}

const TooltipStyle = {
  contentStyle: { fontSize: 11, padding: '4px 10px', border: 'none', background: '#1e293b', color: '#fff', borderRadius: 6 },
  itemStyle: { color: '#fff' },
}

export default function Concentration({ data }) {
  const stats = useMemo(() => {
    if (!data.length) return null

    const total = data.length

    // --- Établissements ---
    const etabCount = {}
    data.forEach(d => { etabCount[d.etablissement_norm] = (etabCount[d.etablissement_norm] || 0) + 1 })
    const etabEntries = Object.entries(etabCount).sort((a, b) => b[1] - a[1])
    const etabValues = etabEntries.map(([, nb]) => nb)

    const concEtab = computeCumsum(etabValues)
    const giniEtab = computeGini(etabValues)
    const N_etab = findThreshold(concEtab, 0.8)
    const topNEtab = etabEntries.slice(0, N_etab).map(([name, nb]) => ({ name, nb }))

    // Proportion top 10
    const ratioTop10 = etabEntries.slice(0, 10).reduce((acc, [, nb]) => acc + nb, 0) / total

    // --- Directeurs ---
    const dirCount = {}
    data.forEach(d => d.directeurs?.forEach(dir => { dirCount[dir] = (dirCount[dir] || 0) + 1 }))
    const dirEntries = Object.entries(dirCount).sort((a, b) => b[1] - a[1])
    const dirValues = dirEntries.map(([, nb]) => nb)

    const concDir = computeCumsum(dirValues)
    const giniDir = computeGini(dirValues)
    const N_dir = findThreshold(concDir, 0.8)
    const topNDir = dirEntries.slice(0, N_dir).map(([name, nb]) => ({ name, nb }))

    // --- CNU ---
    const cnuCount = {}
    data.forEach(d => { cnuCount[d.cnu] = (cnuCount[d.cnu] || 0) + 1 })
    const cnuData = Object.entries(cnuCount)
      .sort((a, b) => b[1] - a[1])
      .map(([cnu, nb]) => ({ cnu, label: CNU_LABELS[cnu] || cnu, nb }))

    return {
      topNEtab, concEtab, giniEtab, N_etab, ratioTop10,
      topNDir, concDir, giniDir, N_dir,
      cnuData, nbEtab: etabEntries.length, nbDir: dirEntries.length, total,
    }
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

      {/* KPIs synthèse */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Gini établissements</span>
          <span className="text-2xl font-bold text-indigo-700">{stats.giniEtab.toFixed(4)}</span>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-orange-400">Gini directeurs</span>
          <span className="text-2xl font-bold text-orange-700">{stats.giniDir.toFixed(4)}</span>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-500">Top 10 étab.</span>
          <span className="text-2xl font-bold text-amber-700">{(stats.ratioTop10 * 100).toFixed(1)}%</span>
          <span className="text-xs text-amber-500">des thèses</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Seuil 80%</span>
          <span className="text-2xl font-bold text-slate-700">{stats.N_etab} étab. · {stats.N_dir} dir.</span>
          <span className="text-xs text-slate-400">couvrent 80 % des thèses</span>
        </div>
      </div>

      {/* Top N établissements */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>
            Top {stats.N_etab} établissements — seuil 80 %
          </SectionTitle>
          <GiniChip gini={stats.giniEtab} />
        </div>
        <p className="text-xs text-slate-400 mb-3">
          {stats.N_etab} établissements sur {stats.nbEtab} concentrent 80 % des thèses du corpus
        </p>
        <ResponsiveContainer width="100%" height={Math.max(320, stats.N_etab * 26)}>
          <BarChart data={stats.topNEtab} layout="vertical" margin={{ left: 220, right: 50, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={210} tick={{ fontSize: 11 }} />
            <Tooltip {...TooltipStyle} formatter={v => [v.toLocaleString('fr-FR'), 'thèses']} />
            <Bar dataKey="nb" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Courbe de concentration établissements */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <SectionTitle>Courbe de concentration — établissements</SectionTitle>
          <GiniChip gini={stats.giniEtab} />
        </div>
        <p className="text-xs text-slate-400 mb-3">
          % cumulé de thèses selon le rang de l'établissement (ordre décroissant) · ligne à 80 %
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={stats.concEtab} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rank" tick={{ fontSize: 10 }} label={{ value: 'Rang établissement', position: 'insideBottom', offset: -2, fontSize: 11 }} />
            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
            <Tooltip {...TooltipStyle} formatter={v => [`${v}%`, 'cumulé']} labelFormatter={l => `Rang ${l}`} />
            <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: `80% → N=${stats.N_etab}`, fontSize: 10, fill: '#f59e0b', position: 'insideTopRight' }} />
            <Line type="monotone" dataKey="cumPct" stroke="#6366f1" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Top N directeurs */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>
            Top {stats.N_dir} directeurs — seuil 80 %
          </SectionTitle>
          <GiniChip gini={stats.giniDir} />
        </div>
        <p className="text-xs text-slate-400 mb-3">
          {stats.N_dir} directeurs sur {stats.nbDir} encadrent 80 % des thèses du corpus
        </p>
        <ResponsiveContainer width="100%" height={Math.max(320, stats.N_dir * 22)}>
          <BarChart data={stats.topNDir} layout="vertical" margin={{ left: 220, right: 50, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={210} tick={{ fontSize: 11 }} />
            <Tooltip {...TooltipStyle} formatter={v => [v, 'thèses encadrées']} />
            <Bar dataKey="nb" fill="#f97316" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Courbe de concentration directeurs + CNU */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <Card>
          <div className="flex items-center justify-between mb-1">
            <SectionTitle>Courbe de concentration — directeurs</SectionTitle>
            <GiniChip gini={stats.giniDir} />
          </div>
          <p className="text-xs text-slate-400 mb-3">
            % cumulé de thèses selon le rang du directeur (ordre décroissant) · ligne à 80 %
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.concDir} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rank" tick={{ fontSize: 10 }} label={{ value: 'Rang directeur', position: 'insideBottom', offset: -2, fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
              <Tooltip {...TooltipStyle} formatter={v => [`${v}%`, 'cumulé']} labelFormatter={l => `Rang ${l}`} />
              <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: `80% → N=${stats.N_dir}`, fontSize: 10, fill: '#f59e0b', position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="cumPct" stroke="#f97316" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Thèses par section CNU</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
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
