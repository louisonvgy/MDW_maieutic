# M@IEUTIC — Plateforme des doctorant·es

> Marathon du Web · Master MIASHS

---

## Présentation du projet

**M@ieutic** est une plateforme collaborative à destination des doctorant·es, pensée **pour eux et avec eux**. Elle répond à un besoin réel et urgent : offrir aux doctorant·es un espace numérique qui conjugue entraide, valorisation des savoirs et accompagnement professionnel.

La plateforme vise à transformer les défis du parcours doctoral en opportunités de collaboration et d'innovation, en offrant un cadre structuré mais flexible pour les échanges entre jeunes chercheurs. Elle s'organise autour d'une métaphore de la **maison** : chaque espace thématique correspond à une « pièce » dédiée à un usage spécifique.

| Pièce | Usage |
|---|---|
| Salon | Forum d'échange général |
| Cuisine | Méthodologie de recherche |
| Salle à manger | Espace conceptuel |
| Détente | Espace informel |

Site web : [maieutic-projet.fr](https://maieutic-projet.fr)
Contact : Claire Noy & Alexandra Salou

---

## Objectifs — Analyse de données

### Corpus

Le projet repose sur l'exploitation d'un corpus de thèses françaises soutenues entre **2021 et 2026**, collecté à partir de l'API de [Thèses.fr](https://theses.fr) et filtré sur un ensemble de **9 sections disciplinaires CNU** :

| Code | Discipline |
|---|---|
| 04 | Science politique |
| 06 | Sciences de gestion |
| 17 | Philosophie |
| 18 | Arts |
| 19 | Sociologie |
| 20 | Ethnologie |
| 70 | Sciences de l'éducation |
| 71 | Sciences de l'information et de la communication |
| 72 | Épistémologie, histoire des sciences et des techniques |

### Dataset

| Caractéristique | Valeur |
|---|---|
| Volume | 9 246 thèses |
| Période | 2021 – 2026 |
| Format source | JSON (API theses.fr) |
| Champs (après enrichissement) | 11 |

**Variables intégrées :**

| Champ | Catégorie |
|---|---|
| `titre` | Métadonnée bibliographique |
| `annee` | Métadonnée bibliographique |
| `etablissement` / `etablissement_norm` | Affiliation institutionnelle |
| `cnu` / `cnu_norm` | Indexation disciplinaire |
| `directeurs` | Encadrement |
| `accessible` | Open access / embargo |
| `lat` / `lon` | Dimension géographique |

---

## I. Structuration et préparation des données

### 1.1 Nettoyage et enrichissement

Les données brutes de l'API ont été nettoyées, normalisées et enrichies de deux champs calculés :

- **`cnu_norm`** — libellé textuel de la section CNU (ex : `"17"` → `"Philosophie"`)
- **`etablissement_norm`** — forme canonique du nom d'établissement, corrigeant les variantes dues aux renommages institutionnels, aux différences d'encodage et aux incohérences de casse (22 variantes fusionnées, 118 → 96 noms distincts)

### 1.2 Complétion géographique

**2 210 thèses** (23,9 % du corpus) ne disposaient d'aucune coordonnée géographique. Toutes ont été géolocalisées via l'API **Nominatim (OpenStreetMap)** avec un complément manuel pour les établissements non résolus automatiquement.

Résultat : **couverture géographique 100 %**.

---

## II. Modélisation des données

Les données sont organisées autour de plusieurs entités principales et de leurs relations :

**Entités**

| Entité | Description |
|---|---|
| Thèse | Unité centrale du corpus |
| Personne | Doctorant·e, directeur·rice |
| Institution | Université, laboratoire, école doctorale |
| Discipline / Section | Section CNU, domaine |
| Thématique | Mots-clés associés à la thèse |

**Relations**

| Relation | Type |
|---|---|
| encadrement | thèse → directeur·rice |
| affiliation | thèse → établissement |
| co-encadrement / co-tutelle | relations multiples entre thèse et personnes/institutions |
| co-occurrence de mots-clés | analyse thématique transversale |

---

## III. Modules analytiques

Le dashboard intègre plusieurs modules d'analyse interpretative :

| Module | Contenu |
|---|---|
| **Vue d'ensemble** | KPIs globaux, carte des établissements, distribution CNU, évolution annuelle |
| **Recherche** | Moteur de recherche plein texte (titre, directeur, établissement) |
| **Concentration** | Distribution par établissement et directeur, courbes de concentration, indice de Gini |
| **Temporel** *(à venir)* | Évolution annuelle par section, tendances OA, saisonnalité |
| **Réseau** *(à venir)* | Graphe de collaborations inter-établissements, co-encadrements |
| **Disciplines** *(à venir)* | Interdisciplinarité, croisement sections × mots-clés, treemap CNU |

### Finalité

L'outil vise une double fonction :

- **Exploration** — navigation intuitive dans un corpus complexe de près de 10 000 thèses
- **Analyse et médiation** — production d'indicateurs interprétables pour la recherche, la pédagogie et l'aide à la décision

Il s'inscrit dans une logique de valorisation des données académiques et de cartographie des dynamiques de recherche, en mobilisant des approches issues des **humanités numériques** et de la **science des données**.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Données | Python · Pandas · API Thèses.fr · Nominatim |
| Exploration | Jupyter Notebook |
| Dashboard | React (Vite) · Recharts · React-Leaflet · Tailwind CSS |

### Lancer le dashboard

```bash
cd dashboard
npm install
npm run dev
```

Puis ouvrir [http://localhost:5173](http://localhost:5173).

---

## Structure du dépôt

```
MDW_maieutic/
├── data/
│   └── data.json          # Corpus enrichi (9 246 thèses, 11 champs)
├── notebooks/
│   └── 01_exploration.ipynb  # Analyse exploratoire (EDA)
├── dashboard/             # Application React
│   └── src/
│       ├── pages/         # Vue d'ensemble, Recherche, Concentration…
│       ├── components/    # Sidebar, graphiques réutilisables
│       └── hooks/         # Filtrage des données
├── visuals/               # Exports graphiques (PNG)
└── README.md
```

---

## Équipe

Projet réalisé dans le cadre du **Marathon du Web**, Master MIASHS.
