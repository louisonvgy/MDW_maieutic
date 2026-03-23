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
