import { useState, useEffect, useMemo } from 'react'
import { Joyride, STATUS, EVENTS, ACTIONS } from 'react-joyride'

/* ───────────────────── Étapes du tutoriel ───────────────────── */

const COMMON = { disableBeacon: true }

const buildSteps = () => [
  // ── 0. Bienvenue ──
  {
    ...COMMON,
    target: 'body',
    placement: 'center',
    content: (
      <div className="text-center">
        <p className="text-lg font-bold mb-2">Bienvenue sur M@ieutic 👋</p>
        <p className="text-sm text-slate-600">
          Ce tableau de bord interactif vous permet d'explorer <strong>9 000+ thèses</strong> en sciences humaines et sociales.
          Nous allons vous guider à travers les principales fonctionnalités.
        </p>
      </div>
    ),
    _page: 'overview',
  },

  // ── 1. Navigation Sidebar ──
  {
    ...COMMON,
    target: '#tour-nav',
    placement: 'right',
    content: (
      <div>
        <p className="font-semibold mb-1">📍 Navigation</p>
        <p className="text-sm text-slate-600">
          Utilisez ce menu pour naviguer entre les 5 vues du dashboard :
          <strong> Vue d'ensemble</strong>, <strong>Évolution temporelle</strong>,
          <strong> Concentration</strong>, <strong>Réseau</strong> et <strong>Regroupement par mot clé</strong>.
        </p>
      </div>
    ),
    _page: 'overview',
  },

  // ── 2. Filtres ──
  {
    ...COMMON,
    target: '#tour-filters',
    placement: 'right',
    content: (
      <div>
        <p className="font-semibold mb-1">🎛️ Filtres</p>
        <p className="text-sm text-slate-600">
          Filtrez les données par <strong>année</strong>, <strong>section CNU</strong> ou <strong>établissement</strong>.
          Les graphiques de toutes les pages se mettent à jour instantanément.
        </p>
      </div>
    ),
    _page: 'overview',
  },

  // ── 3. Mode nuit ──
  {
    ...COMMON,
    target: '#tour-darkmode',
    placement: 'bottom',
    content: (
      <div>
        <p className="font-semibold mb-1">🌙 Mode nuit</p>
        <p className="text-sm text-slate-600">
          Cliquez ici pour basculer entre le mode jour et le mode nuit. L'interface entière s'adapte.
        </p>
      </div>
    ),
    _page: 'overview',
  },

  // ── 4. Barre de recherche ──
  {
    ...COMMON,
    target: '#tour-search',
    placement: 'bottom',
    content: (
      <div>
        <p className="font-semibold mb-1">🔍 Recherche</p>
        <p className="text-sm text-slate-600">
          Tapez un mot-clé pour chercher une thèse par titre, directeur ou établissement.
          Les résultats s'affichent en direct et tous les graphiques se filtrent automatiquement.
        </p>
      </div>
    ),
    _page: 'overview',
  },

  // ── 5. KPIs ──
  {
    ...COMMON,
    target: '#tour-kpis',
    placement: 'bottom',
    content: (
      <div>
        <p className="font-semibold mb-1">📊 Indicateurs clés</p>
        <p className="text-sm text-slate-600">
          Ces cartes résument les chiffres principaux : nombre de thèses, d'établissements,
          de directeurs et le taux de co-encadrement.
        </p>
      </div>
    ),
    _page: 'overview',
  },

  // ── 6. Sparkline ──
  {
    ...COMMON,
    target: '#tour-sparkline',
    placement: 'top',
    content: (
      <div>
        <p className="font-semibold mb-1">📈 Évolution annuelle</p>
        <p className="text-sm text-slate-600">
          Ce mini-graphique montre la tendance du nombre de thèses soutenues par année.
        </p>
      </div>
    ),
    _page: 'overview',
  },

  // ── 7. Carte géographique ──
  {
    ...COMMON,
    target: '#tour-map',
    placement: 'top',
    content: (
      <div>
        <p className="font-semibold mb-1">🗺️ Carte géographique</p>
        <p className="text-sm text-slate-600">
          Chaque cercle représente un établissement. Plus le cercle est grand, plus l'établissement a produit de thèses.
          Survolez pour voir le détail.
        </p>
      </div>
    ),
    _page: 'overview',
  },

  // ── 8. Répartition CNU ──
  {
    ...COMMON,
    target: '#tour-cnu',
    placement: 'top',
    content: (
      <div>
        <p className="font-semibold mb-1">📚 Sections CNU</p>
        <p className="text-sm text-slate-600">
          La distribution des thèses par section disciplinaire du CNU (Conseil National des Universités).
        </p>
      </div>
    ),
    _page: 'overview',
  },

  // ── 9. Page Évolution temporelle ──
  {
    ...COMMON,
    target: 'body',
    placement: 'center',
    content: (
      <div className="text-center">
        <p className="text-lg font-bold mb-2">📅 Évolution temporelle</p>
        <p className="text-sm text-slate-600">
          Cette page présente 3 graphiques : le <strong>nombre de thèses par année</strong>,
          le <strong>nombre de directeurs actifs</strong>, et les <strong>thèses par discipline au fil du temps</strong>.
          Survolez les graphiques pour voir les détails dans les tooltips.
        </p>
      </div>
    ),
    _page: 'temporel',
  },

  // ── 10. Page Concentration ──
  {
    ...COMMON,
    target: 'body',
    placement: 'center',
    content: (
      <div className="text-center">
        <p className="text-lg font-bold mb-2">🏛️ Concentration</p>
        <p className="text-sm text-slate-600">
          Deux classements : les <strong>établissements</strong> et les <strong>directeurs</strong> qui produisent
          le plus de thèses. Utilisez le sélecteur « Top N » pour ajuster le nombre affiché.
        </p>
      </div>
    ),
    _page: 'concentration',
  },

  // ── 11. Page Réseau ──
  {
    ...COMMON,
    target: 'body',
    placement: 'center',
    content: (
      <div className="text-center">
        <p className="text-lg font-bold mb-2">🕸️ Analyse de réseau</p>
        <p className="text-sm text-slate-600">
          Explorez les collaborations entre directeurs à travers 3 visualisations :
          le <strong>réseau circulaire de co-direction</strong> (Top 100),
          le <strong>graphe de force interactif</strong> (déplacez les nœuds !),
          et la <strong>carte inter-établissements</strong>.
        </p>
      </div>
    ),
    _page: 'reseau',
  },

  // ── 12. Page Disciplines ──
  {
    ...COMMON,
    target: 'body',
    placement: 'center',
    content: (
      <div className="text-center">
        <p className="text-lg font-bold mb-2">🔬 Regroupement par mot clé</p>
        <p className="text-sm text-slate-600">
          Les thèses sont regroupées par similarité sémantique grâce à un algorithme de clustering.
          <strong> Cliquez sur une bulle</strong> pour voir ses mots-clés et la liste des thèses associées.
          Plus bas : les <strong>tendances de mots-clés</strong> et le <strong>top 10 par CNU</strong>.
        </p>
      </div>
    ),
    _page: 'disciplines',
  },

  // ── 13. Fin ──
  {
    ...COMMON,
    target: 'body',
    placement: 'center',
    content: (
      <div className="text-center">
        <p className="text-lg font-bold mb-2">🎉 C'est parti !</p>
        <p className="text-sm text-slate-600">
          Vous connaissez maintenant toutes les fonctionnalités du dashboard.
          Vous pouvez relancer ce tutoriel à tout moment depuis le bouton <strong>« ? »</strong> en bas de la barre latérale.
          Bonne exploration !
        </p>
      </div>
    ),
    _page: 'overview',
  },
]

/* ───────────────────── Style Joyride (Canard theme) ───────────────────── */

const JOYRIDE_STYLES = {
  options: {
    arrowColor: '#fff',
    backgroundColor: '#fff',
    overlayColor: 'rgba(15, 23, 42, 0.6)',
    primaryColor: '#016d76',
    textColor: '#1e293b',
    zIndex: 100000,
  },
  tooltip: {
    borderRadius: 16,
    padding: '20px 24px',
    boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
  },
  tooltipContent: {
    padding: 0,
  },
  buttonNext: {
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 20px',
    backgroundColor: '#016d76',
  },
  buttonBack: {
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
    marginRight: 8,
  },
  buttonSkip: {
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 20px',
    color: '#475569',
  },
}

const LOCALE = {
  back: '← Retour',
  close: 'Fermer',
  last: 'Terminer ✓',
  next: 'Suivant →',
  open: 'Ouvrir',
  skip: 'Passer',
}

/* ───────────────────── Composant Tutorial ───────────────────── */

const STORAGE_KEY = 'mdw_tutorial_completed'

export default function Tutorial({ onNavigate, currentPage, onActiveChange }) {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const steps = useMemo(() => buildSteps(), [])

  useEffect(() => {
    onActiveChange?.(run)
  }, [run, onActiveChange])

  // Auto-lancer au premier chargement si pas encore vu
  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      const t = setTimeout(() => setRun(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  const handleCallback = (data) => {
    const { status, index, type, action } = data

    // Tutoriel terminé ou skippé
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false)
      setStepIndex(0)
      localStorage.setItem(STORAGE_KEY, 'true')
      onNavigate('overview')
      return
    }

    // Avancer ou reculer entre étapes
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1
      if (nextIndex < 0 || nextIndex >= steps.length) return

      const neededPage = steps[nextIndex]?._page
      if (neededPage && neededPage !== currentPage) {
        // Naviguer vers la bonne page, puis avancer après le rendu
        onNavigate(neededPage)
        setTimeout(() => setStepIndex(nextIndex), 400)
      } else {
        setStepIndex(nextIndex)
      }
    }
  }

  // Expose la méthode de relance globale (utilisée par le bouton "?")
  useEffect(() => {
    window.__restartTutorial = () => {
      localStorage.removeItem(STORAGE_KEY)
      onNavigate('overview')
      setTimeout(() => {
        setStepIndex(0)
        setRun(true)
      }, 400)
    }
    return () => { delete window.__restartTutorial }
  }, [onNavigate])

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous={true}
      scrollToFirstStep={true}
      scrollOffset={120}
      spotlightPadding={8}
      disableOverlayClose={true}
      callback={handleCallback}
      styles={JOYRIDE_STYLES}
      locale={LOCALE}
      showSkipButton={true}
    />
  )
}
