# M@IEUTIC — Plateforme des doctorant·es

> Marathon du Web · Master MIASHS

---

## Présentation du projet

**M@ieutic** est une plateforme collaborative à destination des doctorant·es, pensée **pour eux et avec eux**. Elle s'organise autour d'une métaphore de la **maison** : chaque espace thématique correspond à une « pièce » dédiée à un usage spécifique.

| Pièce | Usage |
|---|---|
| Salon | Forum d'échange général |
| Cuisine | Méthodologie de recherche |
| Salle à manger | Espace conceptuel |
| Détente | Espace informel |

L'objectif principal est de **faire du lien** — entre les membres, entre les idées, et entre les données auxquelles M@ieutic donne accès.

Site web : [maieutic-projet.fr](https://maieutic-projet.fr)
Contact : Claire Noy & Alexandra Salou

---

## Objectifs — Analyse de données

### Application interactive

L'application propose une **cartographie interactive** des thèses construite à partir des données issues de [theses.fr](https://theses.fr), explorable via plusieurs filtres analytiques :

- Section disciplinaire
- Localisation géographique (lat/long)
- Présence d'une co-direction ou co-tutelle internationale
- Dynamique d'émergence ou de disparition de thématiques sur la période
- Concentration des thèses par établissement / directeur
- Cartographie des collaborations inter-établissements
- Poids relatif des sections disciplinaires
- Evolution de l'interdisciplinarité

### Dataset

Extraction via l'API `theses.fr` (format `.json`) des thèses soutenues et en cours sur **5 ans (2021–2026)**.

| Caractéristique | Valeur |
|---|---|
| Volume | ~120 000 lignes |
| Champs | 8 |
| Format source | JSON (API theses.fr) |

**Champs disponibles :**

```
titre · établissement · année · section_disciplinaire
directeurs · accessibilité · lat · long
```

---

## Objectifs — Communication

Conception d'une **affiche, d'un flyer et d'une vidéo de promotion** valorisant la plateforme en s'appuyant sur les principaux résultats du côté MIASHS.

Contraintes créatives :
- Identité visuelle cohérente avec le public visé (doctorant·es) et la dimension institutionnelle
- Déploiement de la métaphore de la **maison**
- Mise en valeur des données et des résultats analytiques

---

## Stack technique

> *(À compléter selon les outils utilisés dans le projet)*

---

## Équipe

Projet réalisé dans le cadre du **Marathon du Web**, Master MIASHS.
