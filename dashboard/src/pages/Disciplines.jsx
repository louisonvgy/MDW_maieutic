import { useEffect, useRef, useState, useMemo } from 'react'
import { forceSimulation, forceManyBody, forceCenter, forceCollide } from 'd3-force'

// Couleurs par section CNU (cohérentes avec le reste du dashboard)
const CNU_COLORS = {
  'Science politique':                              '#6366f1',
  'Sciences de gestion':                           '#f97316',
  'Philosophie':                                   '#8b5cf6',
  'Arts':                                          '#ec4899',
  'Sociologie':                                    '#14b8a6',
  'Ethnologie':                                    '#f59e0b',
  "Sciences de l'éducation":                       '#10b981',
  'Sciences de l\'information et de la communication': '#3b82f6',
  'Épistémologie, histoire des sciences et des techniques': '#64748b',
}
const DEFAULT_COLOR = '#94a3b8'

function getColor(cnuLabel) {
  if (!cnuLabel) return DEFAULT_COLOR
  const match = Object.keys(CNU_COLORS).find(k => cnuLabel.includes(k.split(' ')[0]))
  return CNU_COLORS[cnuLabel] ?? CNU_COLORS[match] ?? DEFAULT_COLOR
}

const MAX_R = 60
const MIN_R = 14

export default function Disciplines() {
  const [clusters, setClusters] = useState(null)
  const [error, setError] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const [nodes, setNodes] = useState([])
  const [dims, setDims] = useState({ w: 900, h: 680 })
  const svgRef = useRef()
  const containerRef = useRef()
  const simRef = useRef()
  const dragRef = useRef(null)

  // Charger clusters.json
  useEffect(() => {
    fetch('/clusters.json')
      .then(r => r.json())
      .then(data => setClusters(data))
      .catch(() => setError(true))
  }, [])

  // Observer la taille du conteneur
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(([e]) => {
      setDims({ w: e.contentRect.width, h: Math.max(600, e.contentRect.width * 0.75) })
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // Drag handlers
  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation()
    const node = simRef.current?.nodes().find(n => n.id === nodeId)
    if (!node) return
    node.fx = node.x
    node.fy = node.y
    simRef.current?.alphaTarget(0.3).restart()
    dragRef.current = nodeId
  }

  const handleSvgMouseMove = (e) => {
    if (dragRef.current === null) return
    e.preventDefault()
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const node = simRef.current?.nodes().find(n => n.id === dragRef.current)
    if (!node) return
    node.fx = x
    node.fy = y
  }

  const handleSvgMouseUp = () => {
    if (dragRef.current === null) return
    const node = simRef.current?.nodes().find(n => n.id === dragRef.current)
    if (node) { node.fx = null; node.fy = null }
    simRef.current?.alphaTarget(0)
    dragRef.current = null
  }

  const handleNodeClick = (e, nodeId) => {
    // Ignore click if we just finished dragging (mousemove fired)
    if (e.defaultPrevented) return
    setSelected(prev => prev === nodeId ? null : nodeId)
  }

  // Calculer les rayons
  const maxNb = useMemo(() => clusters ? Math.max(...clusters.map(c => c.nb)) : 1, [clusters])

  const scaleR = (nb) => MIN_R + (MAX_R - MIN_R) * Math.sqrt(nb / maxNb)

  // Lancer la simulation D3
  useEffect(() => {
    if (!clusters?.length) return
    if (simRef.current) simRef.current.stop()

    const PAD = 8
    const MARGIN = 80
    const cxMin = Math.min(...clusters.map(c => c.cx))
    const cxMax = Math.max(...clusters.map(c => c.cx))
    const cyMin = Math.min(...clusters.map(c => c.cy))
    const cyMax = Math.max(...clusters.map(c => c.cy))
    const mapX = cx => MARGIN + (cx - cxMin) / (cxMax - cxMin) * (dims.w - MARGIN * 2)
    const mapY = cy => MARGIN + (cy - cyMin) / (cyMax - cyMin) * (dims.h - MARGIN * 2)

    const initial = clusters.map(c => ({
      ...c,
      r: scaleR(c.nb),
      x: mapX(c.cx),
      y: mapY(c.cy),
    }))

    simRef.current = forceSimulation(initial)
      .force('charge', forceManyBody().strength(8))
      .force('center', forceCenter(dims.w / 2, dims.h / 2).strength(0.05))
      .force('collision', forceCollide(d => d.r + PAD).strength(0.9))
      .force('umap', () => {
        const alpha = simRef.current.alpha()
        for (const n of simRef.current.nodes()) {
          n.vx += (mapX(n.cx) - n.x) * alpha * 0.4
          n.vy += (mapY(n.cy) - n.y) * alpha * 0.4
        }
      })
      .force('bounds', () => {
        for (const n of simRef.current.nodes()) {
          n.x = Math.max(n.r + PAD, Math.min(dims.w - n.r - PAD, n.x))
          n.y = Math.max(n.r + PAD, Math.min(dims.h - n.r - PAD, n.y))
        }
      })
      .alphaDecay(0.012)
      .on('tick', () => setNodes(simRef.current.nodes().map(n => ({ ...n }))))

    return () => simRef.current?.stop()
  }, [clusters, dims])

  // --- États de chargement / erreur / vide ---
  if (error) return (
    <div className="p-8 flex items-center justify-center h-full">
      <p className="text-slate-400">Impossible de charger clusters.json</p>
    </div>
  )

  if (clusters === null) return (
    <div className="p-8 flex items-center justify-center h-full">
      <p className="text-slate-400">Chargement…</p>
    </div>
  )

  if (clusters.length === 0) return (
    <div className="p-8 flex flex-col items-center justify-center gap-4 h-full">
      <div className="text-center max-w-md">
        <p className="text-slate-700 font-semibold text-lg mb-2">Aucune donnée de clustering</p>
        <p className="text-slate-400 text-sm">
          Lance d'abord le notebook Python <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">notebooks/02_clustering_titres.ipynb</code> pour générer <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">clusters.json</code>, puis place le fichier dans <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">dashboard/public/</code>.
        </p>
      </div>
    </div>
  )

  const selectedCluster = clusters.find(c => c.id === selected)

  return (
    <div className="p-8 flex flex-col gap-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Disciplines</h2>
        <p className="text-slate-500 text-sm mt-1">
          Clustering sémantique des titres — {clusters.length} groupes · chaque bulle représente un cluster thématique
        </p>
      </div>

      <div className="flex gap-6 items-start">

        {/* Bubble chart */}
        <div
          ref={containerRef}
          className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <svg
            ref={svgRef}
            width={dims.w}
            height={dims.h}
            className="block"
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onMouseLeave={handleSvgMouseUp}
          >
            {nodes.map(node => {
              const isHov = hovered === node.id
              const isSel = selected === node.id
              const color = getColor(node.cnu_dominant)
              const label = node.keywords?.slice(0, 2).join(' / ') || node.label
              const fontSize = Math.max(9, Math.min(13, node.r / 4.5))

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  style={{ cursor: dragRef.current === node.id ? 'grabbing' : 'grab' }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={(e) => handleNodeClick(e, node.id)}
                >
                  {/* Cercle principal */}
                  <circle
                    r={node.r}
                    fill={color}
                    fillOpacity={isSel ? 0.9 : isHov ? 0.75 : 0.45}
                    stroke={color}
                    strokeWidth={isSel ? 2.5 : isHov ? 1.5 : 0.5}
                    style={{ transition: 'fill-opacity 0.15s, stroke-width 0.15s' }}
                  />

                  {/* Label (visible si bulle assez grande) */}
                  {node.r > 28 && (
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={fontSize}
                      fontWeight={isSel ? 700 : 500}
                      fill={isSel || isHov ? '#1e293b' : '#334155'}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {/* Découper le label en 2 lignes si besoin */}
                      {label.split(' / ').map((word, i, arr) => (
                        <tspan
                          key={i}
                          x={0}
                          dy={i === 0 ? -(arr.length - 1) * fontSize * 0.6 : fontSize * 1.2}
                        >
                          {word}
                        </tspan>
                      ))}
                    </text>
                  )}

                  {/* Compteur */}
                  {node.r > 36 && (
                    <text
                      y={node.r - 10}
                      textAnchor="middle"
                      fontSize={9}
                      fill={color}
                      fontWeight={600}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {node.nb}
                    </text>
                  )}

                  {/* Tooltip au survol */}
                  {isHov && (
                    <g transform={`translate(${node.r + 8}, ${-node.r / 2})`}>
                      <rect
                        x={0} y={0}
                        width={200}
                        height={16 + (node.keywords?.length ?? 0) * 14 + 18}
                        rx={8}
                        fill="white"
                        stroke="#e2e8f0"
                        strokeWidth={1}
                        filter="drop-shadow(0 2px 6px rgba(0,0,0,0.12))"
                      />
                      <text x={10} y={14} fontSize={11} fontWeight={700} fill="#1e293b">
                        {node.label}
                      </text>
                      {node.keywords?.slice(0, 6).map((kw, i) => (
                        <text key={kw} x={10} y={14 + (i + 1) * 14} fontSize={10} fill="#64748b">
                          • {kw}
                        </text>
                      ))}
                      <text
                        x={10}
                        y={14 + (node.keywords?.slice(0, 6).length ?? 0) * 14 + 14}
                        fontSize={10}
                        fill={color}
                        fontWeight={600}
                      >
                        {node.nb} thèses · {node.cnu_dominant ?? '—'}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Panneau latéral : détail du cluster sélectionné */}
        <div className="w-72 shrink-0 flex flex-col gap-4">

          {/* Légende CNU */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Sections CNU
            </p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(CNU_COLORS).map(([label, color]) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-slate-600 leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Détail cluster sélectionné */}
          {selectedCluster && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 leading-snug">
                  {selectedCluster.label}
                </p>
                <button
                  onClick={() => setSelected(null)}
                  className="text-slate-300 hover:text-slate-500 text-xs shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getColor(selectedCluster.cnu_dominant) }}
                />
                <span className="text-xs text-slate-500">{selectedCluster.cnu_dominant ?? '—'}</span>
                <span className="ml-auto text-xs font-semibold text-indigo-600">
                  {selectedCluster.nb} thèses
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Mots-clés TF-IDF
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCluster.keywords?.map((kw, i) => (
                    <span
                      key={kw}
                      className="text-xs px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: getColor(selectedCluster.cnu_dominant) + '18',
                        borderColor: getColor(selectedCluster.cnu_dominant) + '40',
                        color: '#334155',
                        opacity: 1 - i * 0.06,
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {selectedCluster.cnu_dist && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                    Répartition disciplines
                  </p>
                  <div className="flex flex-col gap-1">
                    {Object.entries(selectedCluster.cnu_dist)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cnu, nb]) => {
                        const pct = Math.round(nb / selectedCluster.nb * 100)
                        return (
                          <div key={cnu} className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500 truncate flex-1">{cnu}</span>
                            <div className="w-20 bg-slate-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: getColor(cnu),
                                }}
                              />
                            </div>
                            <span className="text-slate-400 w-6 text-right">{pct}%</span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {!selectedCluster && (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-400">Clique sur une bulle pour voir le détail du cluster</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
