import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts'

const PALETTE = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a',
  '#0891b2', '#4f46e5', '#dc2626', '#65a30d', '#0f766e',
  '#9333ea', '#c2410c', '#0284c7', '#be185d', '#059669', '#6d28d9',
]

function groupCount(items, keyBuilder) {
  const map = new Map()
  for (const item of items) {
    const key = keyBuilder(item)
    map.set(key, (map.get(key) || 0) + 1)
  }
  return map
}

function DirectorTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const rows = payload.filter(e => e.value > 0).sort((a, b) => b.value - a.value)
  return (
    <div className="rounded-2xl border bg-white p-3 shadow-xl text-sm">
      <div className="mb-2 font-semibold">Année : {label}</div>
      {rows.map(entry => (
        <div key={entry.dataKey} className="mb-1">
          <div className="font-medium" style={{ color: entry.color }}>{entry.name}</div>
          <div>Thèses cette année : {entry.value}</div>
          <div>Total : {entry.payload?.[`__total__${entry.dataKey}`] ?? 0}</div>
        </div>
      ))}
    </div>
  )
}

function SimpleTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl border bg-white p-3 shadow-xl text-sm">
      <div className="mb-1 font-semibold">{label}</div>
      {payload.map(entry => (
        <div key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name} : {entry.value}
        </div>
      ))}
    </div>
  )
}

function Card({ title, description, children, height = 360 }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="mb-1 text-base font-semibold text-slate-800">{title}</div>
      {description && <div className="mb-3 text-xs text-slate-400">{description}</div>}
      <div style={{ height }}>{children}</div>
    </div>
  )
}

export default function Temporel({ data }) {
  const [disciplineFilter, setDisciplineFilter] = useState('')

  const processed = useMemo(() => {
    const rows = disciplineFilter
      ? data.filter(d => d.cnu_norm?.toLowerCase().includes(disciplineFilter.toLowerCase()))
      : data

    // Volume annuel
    const byYearMap = groupCount(rows, d => String(d.annee))
    const byYear = Array.from(byYearMap.entries())
      .map(([annee, count]) => ({ annee: Number(annee), count }))
      .sort((a, b) => a.annee - b.annee)

    // Disciplines × années
    const disciplineYearMap = new Map()
    for (const item of rows) {
      const disc = item.cnu_norm || 'Non renseigné'
      const key = `${disc}|||${item.annee}`
      disciplineYearMap.set(key, (disciplineYearMap.get(key) || 0) + 1)
    }
    const disciplineYearRows = Array.from(disciplineYearMap.entries())
      .map(([key, count]) => { const [discipline, annee] = key.split('|||'); return { discipline, annee: Number(annee), count } })
      .sort((a, b) => a.discipline.localeCompare(b.discipline) || a.annee - b.annee)

    const disciplines = [...new Set(disciplineYearRows.map(d => d.discipline))].sort()

    const lineMap = new Map()
    for (const row of disciplineYearRows) {
      if (!lineMap.has(row.annee)) lineMap.set(row.annee, { annee: row.annee })
      lineMap.get(row.annee)[row.discipline] = row.count
    }
    const disciplineLineData = Array.from(lineMap.values()).sort((a, b) => a.annee - b.annee)

    const disciplineSmallMultiples = disciplines.map(discipline => ({
      discipline,
      values: disciplineYearRows.filter(r => r.discipline === discipline),
    }))

    // Directeurs actifs par année
    const directorRows = []
    for (const item of rows) {
      for (const dir of (item.directeurs ?? [])) {
        directorRows.push({ annee: item.annee, directeur: dir })
      }
    }
    const years = [...new Set(directorRows.map(r => r.annee))].sort((a, b) => a - b)
    const directorsByYear = years.map(year => ({
      annee: year,
      nbDirecteurs: new Set(directorRows.filter(r => r.annee === year).map(r => r.directeur)).size,
    }))

    // Top 15 directeurs empilés
    const totalByDirector = new Map()
    for (const r of directorRows) totalByDirector.set(r.directeur, (totalByDirector.get(r.directeur) || 0) + 1)
    const top15 = Array.from(totalByDirector.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([n]) => n)

    const groupedRows = directorRows.map(r => ({ ...r, grp: top15.includes(r.directeur) ? r.directeur : 'Autres' }))
    const groupedTotal = new Map()
    for (const r of groupedRows) groupedTotal.set(r.grp, (groupedTotal.get(r.grp) || 0) + 1)

    const stackMap = new Map()
    for (const r of groupedRows) {
      if (!stackMap.has(r.annee)) stackMap.set(r.annee, { annee: r.annee })
      const t = stackMap.get(r.annee)
      t[r.grp] = (t[r.grp] || 0) + 1
    }
    const stackedDirectors = Array.from(stackMap.values())
      .sort((a, b) => a.annee - b.annee)
      .map(row => {
        const enriched = { ...row }
        for (const dir of [...top15, 'Autres']) {
          if (!(dir in enriched)) enriched[dir] = 0
          enriched[`__total__${dir}`] = groupedTotal.get(dir) || 0
        }
        return enriched
      })

    return { total: rows.length, disciplines, byYear, disciplineLineData, disciplineSmallMultiples, directorsByYear, top15, stackedDirectors }
  }, [data, disciplineFilter])

  return (
    <div className="p-8 flex flex-col gap-8">

      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Analyse temporelle</h2>
          <p className="text-slate-500 text-sm mt-1">Évolution des thèses et des directeurs dans le temps</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={disciplineFilter}
            onChange={e => setDisciplineFilter(e.target.value)}
            placeholder="Filtrer une discipline..."
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 w-56 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <span className="text-xs bg-slate-100 text-slate-500 rounded-xl px-3 py-1.5 font-medium">
            {processed.total.toLocaleString('fr-FR')} thèses
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Thèses par année">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processed.byYear}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<SimpleTooltip />} />
              <Bar dataKey="count" name="Thèses" radius={[6, 6, 0, 0]}>
                {processed.byYear.map((_, i) => <Cell key={i} fill={PALETTE[0]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Directeurs actifs par année">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processed.directorsByYear}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<SimpleTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="nbDirecteurs" name="Directeurs actifs"
                stroke={PALETTE[1]} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Thèses par année et par discipline" description="Une courbe par section CNU" height={440}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processed.disciplineLineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<SimpleTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {processed.disciplines.slice(0, 12).map((disc, i) => (
              <Line key={disc} type="monotone" dataKey={disc} name={disc}
                stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{ r: 2 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card
        title="Thèses par directeur par année"
        description="Top 15 directeurs + regroupement des autres. Cliquez dans la légende pour isoler."
        height={480}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processed.stackedDirectors}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<DirectorTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {[...processed.top15, 'Autres'].map((dir, i) => (
              <Bar key={dir} dataKey={dir} name={dir} stackId="directors"
                fill={PALETTE[i % PALETTE.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div>
        <h3 className="text-base font-semibold text-slate-700 mb-4">Détail par discipline</h3>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {processed.disciplineSmallMultiples.map((block, i) => (
            <div key={block.discipline} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-700 mb-2">{block.discipline}</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={block.values}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="annee" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip content={<SimpleTooltip />} />
                  <Line type="monotone" dataKey="count" name="Thèses"
                    stroke={PALETTE[i % PALETTE.length]} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
