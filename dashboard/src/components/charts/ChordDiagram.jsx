import { useMemo } from 'react'
import { ResponsiveChord } from '@nivo/chord'

const CNU_LABELS = {
  '04': 'Sc. politique',
  '06': 'Gestion',
  '17': 'Philosophie',
  '18': 'Arts',
  '19': 'Sociologie',
  '20': 'Ethnologie',
  '70': "Sc. éducation",
  '71': 'Info-com',
  '72': 'Épistémologie',
}

const CHORD_COLORS = [
  '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
]

export default function ChordDiagram({ data }) {
  const { matrix, keys } = useMemo(() => {
    if (!data.length) return { matrix: [], keys: [] }

    // For each director, find all CNU sections they have directed theses in
    const directorCnus = {}
    data.forEach(d => {
      const dirs = d.directeurs ?? []
      const cnu = d.cnu || d.cnu_norm
      if (!cnu) return
      dirs.forEach(dir => {
        if (!directorCnus[dir]) directorCnus[dir] = {}
        directorCnus[dir][cnu] = (directorCnus[dir][cnu] || 0) + 1
      })
    })

    // Build CNU-to-CNU connection matrix
    const cnuPairs = {}
    const allCnus = new Set()

    Object.values(directorCnus).forEach(cnuMap => {
      const cnuList = Object.keys(cnuMap)
      if (cnuList.length < 2) return
      cnuList.forEach(c => allCnus.add(c))
      for (let i = 0; i < cnuList.length; i++) {
        for (let j = i + 1; j < cnuList.length; j++) {
          const key = [cnuList[i], cnuList[j]].sort().join('|||')
          const weight = Math.min(cnuMap[cnuList[i]], cnuMap[cnuList[j]])
          cnuPairs[key] = (cnuPairs[key] || 0) + weight
        }
      }
    })

    const sortedCnus = [...allCnus].sort()
    if (sortedCnus.length < 2) return { matrix: [], keys: [] }

    const cnuIndex = {}
    sortedCnus.forEach((c, i) => { cnuIndex[c] = i })
    const n = sortedCnus.length

    const mat = Array.from({ length: n }, () => Array(n).fill(0))

    Object.entries(cnuPairs).forEach(([key, count]) => {
      const [a, b] = key.split('|||')
      const ai = cnuIndex[a]
      const bi = cnuIndex[b]
      if (ai !== undefined && bi !== undefined) {
        mat[ai][bi] = count
        mat[bi][ai] = count
      }
    })

    const lbls = sortedCnus.map(c => CNU_LABELS[c] || `CNU ${c}`)

    return { matrix: mat, keys: lbls }
  }, [data])

  if (!matrix.length) {
    return <p className="text-slate-400 text-sm p-4">Pas assez de données interdisciplinaires avec les filtres actuels.</p>
  }

  return (
    <div style={{ height: 500 }}>
      <ResponsiveChord
        data={matrix}
        keys={keys}
        margin={{ top: 60, right: 60, bottom: 60, left: 60 }}
        padAngle={0.04}
        innerRadiusRatio={0.9}
        innerRadiusOffset={0.02}
        arcOpacity={0.85}
        activeArcOpacity={1}
        inactiveArcOpacity={0.25}
        arcBorderWidth={1}
        arcBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
        ribbonOpacity={0.4}
        activeRibbonOpacity={0.75}
        inactiveRibbonOpacity={0.1}
        ribbonBorderWidth={1}
        ribbonBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
        colors={CHORD_COLORS}
        enableLabel={true}
        label={d => d.id}
        labelRotation={-90}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.2]] }}
        isInteractive={true}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  )
}
