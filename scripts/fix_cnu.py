"""
fix_cnu.py
----------
Compare les codes CNU de data.json avec la source officielle data.gouv.fr.

Jointure sur : (titre_normalisé, annee)  — les IDs ayant été retravaillés.

Usage :
    python3 scripts/fix_cnu.py               # compare + génère corrections_cnu.json
    python3 scripts/fix_cnu.py --apply       # applique les corrections dans data.json
"""

import json, csv, re, unicodedata, sys, urllib.request, io, gzip
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

DATA_JSON   = Path(__file__).parent.parent / "dashboard/src/data.json"
OUTPUT      = Path(__file__).parent.parent / "data/corrections_cnu.json"
CSV_URL     = "https://static.data.gouv.fr/resources/theses-soutenues-en-france-depuis-1985/20240108-140403/theses-soutenues.csv"
CSV_LOCAL   = Path(__file__).parent.parent / "data/theses-soutenues.csv"

# Colonnes utiles dans le CSV
COL_NNT        = "nnt"
COL_TITRE_FR   = "titres.fr"
COL_DATE       = "date_soutenance"
COL_DISCIPLINE = "discipline"


# ── Normalisation des titres ──────────────────────────────────────────────────

def normalize(text: str) -> str:
    """Minuscule, sans accents, sans ponctuation, espaces condensés."""
    if not text:
        return ""
    # Décompose les caractères accentués et supprime les diacritiques
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)   # ponctuation → espace
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ── Chargement de nos données ─────────────────────────────────────────────────

print("Chargement de data.json…")
with open(DATA_JSON, encoding="utf-8") as f:
    our_data = json.load(f)

# Index : (titre_normalisé, annee) → entrée
our_index: dict[tuple, dict] = {}
for entry in our_data:
    titre = entry.get("titre", "")
    annee = str(entry.get("annee", ""))
    key = (normalize(titre), annee)
    our_index[key] = entry

print(f"  {len(our_data)} thèses chargées, {len(our_index)} clés uniques")


# ── Lecture du CSV (local ou distant) ────────────────────────────────────────

def open_csv():
    if CSV_LOCAL.exists():
        print(f"CSV local trouvé : {CSV_LOCAL}")
        return open(CSV_LOCAL, encoding="utf-8", errors="ignore", newline="")
    else:
        print(f"Téléchargement du CSV depuis data.gouv.fr…")
        print(f"  URL : {CSV_URL}")
        print("  (Fichier ~1.5 GB — peut prendre plusieurs minutes)")
        response = urllib.request.urlopen(
            urllib.request.Request(CSV_URL, headers={"User-Agent": "Mozilla/5.0"}),
            timeout=30,
        )
        # Streaming : on ne charge pas tout en mémoire
        return io.TextIOWrapper(response, encoding="utf-8", errors="ignore", newline="")


# ── Correspondance & détection d'écarts ──────────────────────────────────────

matches   = []   # correspondances trouvées (même CNU)
mismatches = []  # correspondances avec CNU différent
not_found  = 0

print("\nParcours du CSV (peut prendre quelques minutes)…")

with open_csv() as fh:
    reader = csv.DictReader(fh)
    for i, row in enumerate(reader):
        if i % 50_000 == 0 and i > 0:
            print(f"  {i:,} lignes lues — {len(mismatches)} écarts trouvés jusqu'ici")

        titre_csv = row.get(COL_TITRE_FR, "")
        date_csv  = row.get(COL_DATE, "")
        annee_csv = date_csv[:4] if date_csv else ""
        key = (normalize(titre_csv), annee_csv)

        if key not in our_index:
            continue  # pas dans notre dataset

        entry      = our_index[key]
        disc_csv   = row.get(COL_DISCIPLINE, "").strip()
        nnt_csv    = row.get(COL_NNT, "").strip()
        notre_cnu  = entry.get("cnu", "")
        notre_norm = entry.get("cnu_norm", "")

        record = {
            "notre_id":     entry.get("id"),
            "titre":        entry.get("titre"),
            "annee":        entry.get("annee"),
            "nnt_csv":      nnt_csv,
            "notre_cnu":    notre_cnu,
            "notre_cnu_norm": notre_norm,
            "discipline_csv": disc_csv,
        }

        if normalize(disc_csv) == normalize(notre_norm):
            matches.append(record)
        else:
            mismatches.append(record)


# ── Résultats ─────────────────────────────────────────────────────────────────

total_found = len(matches) + len(mismatches)
print(f"\n── Résultats ──────────────────────────────────────────────────")
print(f"  Thèses dans data.json        : {len(our_data)}")
print(f"  Correspondances trouvées     : {total_found}")
print(f"  ✓ CNU cohérent              : {len(matches)}")
print(f"  ✗ Écart détecté             : {len(mismatches)}")
print(f"  Non trouvées dans le CSV    : {len(our_data) - total_found}")

if mismatches:
    print(f"\n── Exemples d'écarts (10 premiers) ────────────────────────────")
    for m in mismatches[:10]:
        print(f"  ID        : {m['notre_id']}")
        print(f"  Titre     : {m['titre'][:80]}")
        print(f"  Annee     : {m['annee']}")
        print(f"  Notre CNU : {m['notre_cnu']} ({m['notre_cnu_norm']})")
        print(f"  CSV discip: {m['discipline_csv']}")
        print()

# ── Sauvegarde ────────────────────────────────────────────────────────────────

OUTPUT.parent.mkdir(exist_ok=True)
result = {
    "stats": {
        "total_our_data": len(our_data),
        "total_matched": total_found,
        "cohérent": len(matches),
        "ecarts": len(mismatches),
        "non_trouvées": len(our_data) - total_found,
    },
    "mismatches": mismatches,
}
with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print(f"Fichier de corrections sauvegardé : {OUTPUT}")


# ── Mode --apply ──────────────────────────────────────────────────────────────

if "--apply" in sys.argv:
    print("\n── Application des corrections ─────────────────────────────────")
    print("ATTENTION : les disciplines CSV sont des textes libres,")
    print("pas des codes CNU normalisés. Vérification manuelle recommandée.")
    print()

    # Construit un index de corrections : notre_id → discipline_csv
    corr_map = {m["notre_id"]: m["discipline_csv"] for m in mismatches}

    applied = 0
    for entry in our_data:
        if entry.get("id") in corr_map:
            old = entry.get("cnu_norm", "")
            entry["cnu_norm_source_officielle"] = corr_map[entry["id"]]
            applied += 1

    print(f"  {applied} thèses annotées avec 'cnu_norm_source_officielle'")
    print("  (champ informatif — pas de modification du champ cnu/cnu_norm)")
    print("  Revérifiez manuellement avant de remplacer cnu_norm.")

    with open(DATA_JSON, "w", encoding="utf-8") as f:
        json.dump(our_data, f, ensure_ascii=False)
    print(f"  data.json mis à jour.")
