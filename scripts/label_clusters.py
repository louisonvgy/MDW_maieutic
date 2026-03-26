"""
label_clusters.py
-----------------
Génère des labels conceptuels pour chaque cluster en envoyant
les titres de thèses directement à Claude (claude-haiku).

Usage :
    pip install anthropic
    export ANTHROPIC_API_KEY=sk-ant-...
    python3 scripts/label_clusters.py
"""

import json, os, time
from pathlib import Path
import anthropic

# ── Chemins ───────────────────────────────────────────────────────────────────

DATA_JSON    = Path(__file__).parent.parent / "dashboard/src/data.json"
CLUSTERS_IN  = Path(__file__).parent.parent / "dashboard/public/clusters.json"
CLUSTERS_OUT = Path(__file__).parent.parent / "dashboard/public/clusters.json"

# ── Chargement ────────────────────────────────────────────────────────────────

print("Chargement des données…")
with open(DATA_JSON, encoding="utf-8") as f:
    data = json.load(f)

with open(CLUSTERS_IN, encoding="utf-8") as f:
    clusters = json.load(f)

# Index cluster_id → liste de titres
titres_par_cluster: dict[int, list[str]] = {}
for entry in data:
    cid = entry.get("cluster_id")
    titre = entry.get("titre", "").strip()
    if cid is not None and titre:
        titres_par_cluster.setdefault(cid, []).append(titre)

print(f"  {len(data)} thèses · {len(clusters)} clusters\n")

# ── Appels Claude ─────────────────────────────────────────────────────────────

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

for i, cluster in enumerate(clusters):
    cid   = cluster["id"]
    titres = titres_par_cluster.get(cid, [])

    if not titres:
        print(f"[{i+1}/{len(clusters)}] Cluster {cid} — aucun titre, label conservé : {cluster['label']}")
        continue

    # On prend jusqu'à 60 titres (représentatif sans surcharger le prompt)
    sample = titres[:60]

    prompt = (
        f"Voici {len(sample)} titres de thèses académiques appartenant au même cluster thématique :\n\n"
        + "\n".join(f"- {t}" for t in sample)
        + "\n\nDonne un label court (3 à 6 mots maximum) en français qui capture "
        "le thème scientifique commun à ces thèses. "
        "Réponds UNIQUEMENT avec le label, sans ponctuation finale ni guillemets."
    )

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=30,
            messages=[{"role": "user", "content": prompt}]
        )
        label = response.content[0].text.strip().strip('"').strip("'")
        cluster["label"] = label
        print(f"[{i+1}/{len(clusters)}] Cluster {cid} ({len(titres)} thèses) → {label}")
    except Exception as e:
        print(f"[{i+1}/{len(clusters)}] Cluster {cid} — ERREUR : {e} (label conservé)")

    # Petite pause pour ne pas saturer le rate limit
    time.sleep(0.3)

# ── Sauvegarde ────────────────────────────────────────────────────────────────

with open(CLUSTERS_OUT, "w", encoding="utf-8") as f:
    json.dump(clusters, f, ensure_ascii=False, indent=2)

# Copie aussi dans data/ pour cohérence
copy_path = Path(__file__).parent.parent / "data/clusters.json"
if copy_path.exists():
    with open(copy_path, "w", encoding="utf-8") as f:
        json.dump(clusters, f, ensure_ascii=False, indent=2)

print(f"\nDone — {len(clusters)} labels mis à jour dans {CLUSTERS_OUT}")
