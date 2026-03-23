# Cahier des charges — Dashboard M@ieutic

> Version 0.1 — 23 mars 2026

---

## 1. Contexte

Le projet **M@ieutic** analyse le champ académique des sciences humaines et sociales (SHS) en France à travers les thèses soutenues entre 2021 et 2026. Le corpus couvre 9 sections CNU (science politique, sociologie, philosophie, arts, ethnologie, info-com, sciences de l'éducation, épistémologie, sciences de gestion) pour environ 9 200 thèses.

Le dashboard est l'interface principale d'exploration. Il doit permettre à un utilisateur non-technique d'interroger et de visualiser les données sans compétences techniques particulières.

---

## 2. Objectifs

- Offrir une lecture rapide du corpus via indicateurs clés et visualisations
- Permettre de filtrer et rechercher les thèses par critères (année, discipline, établissement, titre)
- Analyser la concentration institutionnelle et encadrante (indice de Gini, courbes cumulées)
- Poser les bases pour des analyses futures : évolution temporelle, réseau de co-direction, carte disciplinaire

---

## 3. Périmètre fonctionnel

**Exploration générale**
- Indicateurs globaux : nombre de thèses, établissements, directeurs distincts, taux de co-encadrement
- Évolution annuelle du volume de thèses
- Répartition géographique par établissement (carte)
- Distribution par section CNU

**Filtrage**
- Filtres combinables : année, section CNU, établissement
- Recherche plein-texte sur les titres de thèses

**Analyse de concentration**
- Classements par établissement et par directeur
- Courbes de concentration cumulée et indice de Gini

**Modules à venir** *(hors périmètre v0)*
- Analyse temporelle fine par discipline
- Réseau de co-direction (graphe)
- Analyse lexicale des titres

---

## 4. Contraintes techniques

- Application front-end statique (React + Vite), sans backend ni API
- Données embarquées dans un fichier JSON remplaçable
- Calculs et filtres entièrement côté client

---
