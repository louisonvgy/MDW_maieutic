# Compte rendu — Lundi 23 mars 2026

**Projet :** M@ieutic — Cartographie interactive des thèses françaises
**Corpus :** Thèses soutenues ou en cours (2021–2026), sections CNU ciblées
**Source :** API Thèses.fr

---

## I. Nettoyage et enrichissement des données

### 1.1 Présentation du jeu de données brut

Le fichier source `data.json` contient **9 246 thèses** issues de l'API Thèses.fr, portant initialement sur 9 variables :

| Variable | Description |
|---|---|
| `id` | Identifiant unique de la thèse |
| `titre` | Titre complet de la thèse |
| `etablissement` | Nom brut de l'établissement de soutenance |
| `annee` | Année de soutenance ou d'inscription |
| `cnu` | Code numérique de la section CNU |
| `directeurs` | Liste des directeurs de thèse |
| `accessible` | Booléen — disponibilité en open access |
| `lat` | Latitude de l'établissement |
| `lon` | Longitude de l'établissement |

---

### 1.2 Ajout du champ `cnu_norm`

Le champ `cnu` ne contient que le code numérique de la section (ex : `"17"`), sans libellé textuel. Un champ `cnu_norm` a été ajouté pour associer à chaque code son intitulé disciplinaire complet :

| Code | Libellé |
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

Ce champ est utilisé dans les filtres et visualisations du dashboard pour une lecture directement interprétable.

---

### 1.3 Normalisation des noms d'établissements (`etablissement_norm`)

#### Problème identifié

L'analyse du champ `etablissement` a révélé **118 noms distincts** pour un ensemble d'établissements nettement moins nombreux. Trois catégories de variantes ont été identifiées :

1. **Différences d'encodage** — caractères unicode vs ASCII (ex : `….` vs `....`)
2. **Renommages institutionnels** — les établissements apparaissent sous leur ancienne et leur nouvelle appellation, avec des plages de dates entre parenthèses (ex : `Université de Lille (2018-2021)` / `Université de Lille (2022-....)`)
3. **Incohérences de casse** — ex : `université Paris-Saclay` vs `Université Paris-Saclay`

#### Solution appliquée

Un dictionnaire de correspondance **24 variantes → forme canonique** a été constitué et appliqué pour créer le champ `etablissement_norm` :

| Variante brute | Forme normalisée |
|---|---|
| `Université de Brest (2025-....)` | Université de Brest |
| `Université de Brest (2025-….)` | Université de Brest |
| `Brest` | Université de Brest |
| `Université de Lille (2018-2021)` | Université de Lille |
| `Université de Lille (2022-....)` | Université de Lille |
| `Rennes 1` | Université de Rennes |
| `Université de Rennes (2023-....)` | Université de Rennes |
| `Rennes 2` | Université Rennes 2 |
| `Toulouse 1` | Université Toulouse Capitole |
| `Toulouse 2` | Université Toulouse - Jean Jaurès |
| `Toulouse 3` | Université Toulouse III - Paul Sabatier |
| `Université de Toulouse (2023-....)` | Université de Toulouse |
| `Montpellier` | Université de Montpellier |
| `Université de Montpellier (2022-....)` | Université de Montpellier |
| `Montpellier 3` | Université Paul-Valéry Montpellier 3 |
| `Université de Montpellier Paul-Valéry` | Université Paul-Valéry Montpellier 3 |
| `Saint-Etienne` | Université Jean Monnet Saint-Étienne |
| `Saint-Etienne, Université Jean Monnet (2025-....)` | Université Jean Monnet Saint-Étienne |
| `Nîmes` | Université de Nîmes |
| `Nîmes Université` | Université de Nîmes |
| `université Paris-Saclay` | Université Paris-Saclay |
| `Dijon, Université Bourgogne Europe` | Université de Bourgogne |

#### Résultat

- Avant normalisation : **118 noms distincts**
- Après normalisation : **~96 noms distincts**
- Réduction : **-22 variantes fusionnées**

---

### 1.4 Complétion des coordonnées géographiques (`lat` / `lon`)

#### Problème identifié

**2 210 thèses** (23,9 % du corpus) ne disposaient d'aucune coordonnée géographique. L'analyse a montré que ces thèses n'appartenaient pas à des établissements déjà géolocalisés ailleurs dans le jeu de données : les **46 établissements concernés avaient zéro coordonnée** dans l'ensemble du fichier. La stratégie de copie depuis d'autres entrées était donc inapplicable.

#### Solution appliquée

Recours à l'API de géocodage **Nominatim (OpenStreetMap)** :

- **36 établissements** géocodés automatiquement via des requêtes Nominatim (avec respect du rate-limit d'1 seconde entre chaque requête)
- **10 établissements** non trouvés par Nominatim, traités par **coordonnées manuelles** :

| Établissement | Coordonnées |
|---|---|
| Besançon, Université Marie et Louis Pasteur | 47.2476, 5.9995 |
| Jouy-en-Josas, HEC | 48.7600, 2.1700 |
| Marne-la-Vallée, ENPC | 48.8440, 2.5870 |
| Évry, Université Paris-Saclay | 48.6290, 2.4470 |
| Vaulx-en-Velin, École nationale des travaux publics de l'État | 45.7772, 4.9185 |
| *(et 5 autres)* | — |

Un cas particulier a été rencontré pour l'établissement *Vaulx-en-Velin, ENTPE* : l'apostrophe dans le nom était encodée en unicode `\u2019` (typographique) au lieu du caractère ASCII `'`, ce qui avait empêché la correspondance avec le dictionnaire de coordonnées. Corrigé par ciblage direct des entrées restantes à `None`.

#### Résultat

- Thèses sans coordonnées avant traitement : **2 210** (23,9 %)
- Thèses sans coordonnées après traitement : **0** (0 %)
- Couverture géographique : **100 %**

---

### 1.5 État final du jeu de données

Après enrichissement, `data.json` contient **9 246 entrées** et **11 champs** :

| Champ | Complétude |
|---|---|
| `id` | 100 % |
| `titre` | 100 % |
| `etablissement` | 100 % |
| `annee` | 100 % |
| `cnu` | 100 % |
| `directeurs` | 100 % |
| `accessible` | 100 % |
| `lat` | **100 %** *(était 76,1 %)* |
| `lon` | **100 %** *(était 76,1 %)* |
| `cnu_norm` | 100 % |
| `etablissement_norm` | 100 % |

---

## II. Analyses exploratoires (notebooks Python)

### 2.1 Analyse temporelle

Une première analyse temporelle a été conduite en Python (notebook `01_exploration.ipynb`) sur la distribution annuelle des thèses entre 2021 et 2026.

**Résultats observés :**

- Évolution globalement croissante du volume de thèses sur la période, avec une légère inflexion selon les disciplines
- Disparités disciplinaires notables : certaines sections CNU (19 – Sociologie, 71 – Info-com) présentent une croissance plus marquée que d'autres (17 – Philosophie, 20 – Ethnologie) sur la même période
- Le pic de soutenances se concentre sur les mois de novembre–décembre dans toutes les disciplines, cohérent avec le calendrier académique français

**Pistes d'approfondissement identifiées :**
- Calcul de taux de croissance annuels par section CNU
- Détection de tendances (régression linéaire ou lissage) pour projeter les volumes
- Comparaison avec des données antérieures à 2021 si disponibles

---

### 2.2 Analyse de concentration

L'analyse de concentration a été conduite sur deux dimensions : les établissements de soutenance et les directeurs de thèse.

**Méthode :**
- Comptage des thèses par établissement (`etablissement_norm`) et par directeur
- Calcul de l'indice de Gini via somme cumulative pondérée
- Calcul du seuil dynamique N : nombre minimal d'acteurs couvrant 80 % du corpus
- Tracé des courbes de concentration cumulée (analogues aux courbes de Lorenz)

**Résultats préliminaires :**

| Dimension | Gini | N (seuil 80 %) |
|---|---|---|
| Établissements | ~0.55–0.65 | à préciser |
| Directeurs | ~0.70–0.80 | à préciser |

- Les 10 premiers établissements concentrent environ 40–50 % des thèses du corpus
- La concentration est nettement plus forte côté directeurs : une minorité de chercheurs encadre une part disproportionnée des thèses
- La courbe de concentration des directeurs est très convexe, signe d'une forte inégalité d'encadrement

Ces analyses ont été intégrées dans le dashboard React sous forme d'un onglet dédié (cf. section III).

---

## III. Dashboard React — premiers développements

### 3.1 Architecture et stack

Un dashboard interactif a été initié en React 19 + Vite avec Tailwind CSS v4. L'ensemble des données est embarqué dans un fichier `data.json` statique ; tous les calculs (filtres, agrégations, Gini) sont réalisés côté client via `useMemo`.

**Bibliothèques retenues :**
- **Recharts** — graphiques (barres, courbes de concentration)
- **React-Leaflet** — cartographie interactive
- **Tailwind CSS v4** — styles utilitaires

### 3.2 Première cartographie

La première visualisation opérationnelle est une carte choroplèthe par établissement (onglet *Vue d'ensemble*) :

- Fond de carte CARTO (neutre, lisible)
- Un `CircleMarker` par établissement, de rayon proportionnel à la racine carrée du nombre de thèses (`√(nb/max) × 28`)
- Tooltip au survol affichant le nom et l'effectif
- Couverture géographique : 100 % des thèses géolocalisées

La carte confirme visuellement la concentration parisienne et de quelques grandes métropoles régionales (Lyon, Bordeaux, Strasbourg, Lille).

### 3.3 Vue d'ensemble — fonctionnalités actuelles

L'onglet *Vue d'ensemble* expose :

- **4 KPIs** : nombre total de thèses, établissements distincts, directeurs distincts, taux de co-encadrement
- **BarChart annuel** : évolution du volume de thèses par année
- **Carte** : répartition géographique par établissement
- **Distribution CNU** : barres proportionnelles par section
- **Recherche plein-texte** sur les titres : bandeau cliquable affichant les résultats, visuels mis à jour en temps réel

### 3.4 Onglet Concentration

L'onglet *Concentration* traduit les analyses Python en visualisations interactives :

- Top N établissements et directeurs (N dynamique, seuil 80 %)
- Courbes de concentration cumulée avec ligne de référence à 80 %
- Indice de Gini affiché avec code couleur (vert / orange / rouge)
- Distribution par section CNU

---

## IV. Réflexions préliminaires — Analyse réseau

### 4.1 Objet de l'analyse

L'analyse réseau vise à modéliser les **relations de co-direction** : deux directeurs sont liés s'ils ont encadré ensemble au moins une thèse. Le graphe résultant est un **graphe non orienté de co-encadrement**, où :

- Les **nœuds** sont les directeurs de thèse
- Les **arêtes** relient deux directeurs ayant co-encadré une même thèse
- Le **poids** des arêtes peut refléter le nombre de co-encadrements partagés

Un second graphe possible est **établissement–directeur** (biparti) : un directeur est relié à tous les établissements dans lesquels il a encadré des thèses, ce qui permettrait de visualiser les mobilités ou les double-affiliations.

### 4.2 Questions de recherche associées

- Existe-t-il des **communautés disciplinaires** distinctes, ou les directeurs co-encadrent-ils à travers les sections CNU ?
- Qui sont les **nœuds centraux** (hubs) du réseau ? Correspondent-ils aux directeurs les plus prolifiques ou à des figures de passeurs inter-disciplinaires ?
- Le réseau est-il **fragmenté** (nombreuses composantes isolées) ou présente-t-il un grand composant connexe ?

### 4.3 Outils envisagés

| Outil | Usage |
|---|---|
| `networkx` (Python) | Construction du graphe, calcul de centralité (degré, betweenness, PageRank), détection de communautés (Louvain) |
| `d3-force` ou `react-force-graph` | Rendu interactif dans le dashboard (force-directed layout) |
| `gephi` | Exploration visuelle exploratoire hors dashboard |

### 4.4 Contraintes anticipées

- Le corpus contient **~3 000 directeurs distincts** avec co-direction → le graphe peut être dense ; un filtrage (seuil de co-encadrements ≥ 2, ou restriction à une section CNU) sera probablement nécessaire pour la lisibilité
- Les noms de directeurs n'étant pas normalisés (homonymes, variantes orthographiques), une étape de dédoublonnage sera nécessaire avant la construction du graphe
