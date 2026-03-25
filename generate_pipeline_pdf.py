from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

# ── Couleurs charte ──────────────────────────────────────────────────────────
CANARD   = colors.HexColor('#016d76')
ORANGE   = colors.HexColor('#ec8927')
CANARD_L = colors.HexColor('#e6f4f5')
ORANGE_L = colors.HexColor('#fef3e2')
GREY_BG  = colors.HexColor('#f8fafc')
GREY_TXT = colors.HexColor('#1e293b')
GREY_MID = colors.HexColor('#64748b')
WHITE    = colors.white

W, H = A4

doc = SimpleDocTemplate(
    '/Users/louisonvaugoyeau/MDW_maieutic/pipeline_clustering.pdf',
    pagesize=A4,
    leftMargin=15*mm, rightMargin=15*mm,
    topMargin=14*mm,  bottomMargin=14*mm,
)

# ── Styles ────────────────────────────────────────────────────────────────────
def S(name, **kw):
    base = dict(fontName='Helvetica', fontSize=9, textColor=GREY_TXT,
                leading=13, alignment=TA_LEFT, spaceAfter=0, spaceBefore=0)
    base.update(kw)
    return ParagraphStyle(name, **base)

s_title   = S('title',  fontName='Helvetica-Bold', fontSize=17,
               textColor=WHITE, alignment=TA_CENTER, leading=22)
s_sub     = S('sub',    fontName='Helvetica', fontSize=10,
               textColor=CANARD_L, alignment=TA_CENTER, leading=14)
s_h2      = S('h2',     fontName='Helvetica-Bold', fontSize=11,
               textColor=WHITE, leading=15)
s_label   = S('label',  fontName='Helvetica-Bold', fontSize=8,
               textColor=CANARD, leading=11)
s_body    = S('body',   fontSize=8, leading=12, textColor=GREY_TXT,
               alignment=TA_JUSTIFY)
s_mono    = S('mono',   fontName='Courier', fontSize=7.5,
               textColor=colors.HexColor('#015762'), leading=11)
s_param   = S('param',  fontName='Courier-Bold', fontSize=8,
               textColor=ORANGE, leading=12)
s_why     = S('why',    fontSize=7.8, textColor=GREY_MID, leading=11,
               alignment=TA_JUSTIFY)
s_arrow   = S('arrow',  fontName='Helvetica-Bold', fontSize=18,
               textColor=CANARD, alignment=TA_CENTER, leading=22)
s_badge   = S('badge',  fontName='Helvetica-Bold', fontSize=8,
               textColor=WHITE, alignment=TA_CENTER, leading=11)
s_caption = S('caption',fontSize=7.5, textColor=GREY_MID, alignment=TA_CENTER)
s_footer  = S('footer', fontSize=7, textColor=GREY_MID, alignment=TA_CENTER)

story = []

# ── HEADER ───────────────────────────────────────────────────────────────────
header_table = Table(
    [[Paragraph('Pipeline de Clustering Sémantique', s_title)],
     [Paragraph('Notebook 02 — Thèses MAIEUTiC · paraphrase-multilingual-MiniLM-L12-v2 + UMAP + HDBSCAN', s_sub)]],
    colWidths=[W - 30*mm],
)
header_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), CANARD),
    ('ROUNDEDCORNERS', [6]),
    ('TOPPADDING',    (0,0), (-1,-1), 8),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ('LEFTPADDING',   (0,0), (-1,-1), 12),
    ('RIGHTPADDING',  (0,0), (-1,-1), 12),
]))
story.append(header_table)
story.append(Spacer(1, 7*mm))

# ── Helper : bloc d'étape ─────────────────────────────────────────────────────
def etape_block(numero, titre, couleur_bg, couleur_header,
                params, pourquois, input_txt, output_txt):
    """Retourne une Table représentant une étape du pipeline."""

    # Header
    header = Table(
        [[Paragraph(f'ÉTAPE {numero}', s_badge),
          Paragraph(titre, s_h2)]],
        colWidths=[18*mm, W - 30*mm - 20*mm],
    )
    header.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), couleur_header),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING',    (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING',   (0,0), (0,-1),  6),
        ('RIGHTPADDING',  (0,0), (-1,-1), 8),
        ('ROUNDEDCORNERS',[5]),
    ]))

    # Params col
    param_rows = [[Paragraph('Hyperparamètres', s_label)]]
    for k, v in params:
        param_rows.append([Paragraph(f'<b>{k}</b> = {v}', s_mono)])
    param_table = Table(param_rows, colWidths=[55*mm])
    param_table.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), couleur_bg),
        ('TOPPADDING',    (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
        ('RIGHTPADDING',  (0,0), (-1,-1), 6),
        ('LINEBELOW',     (0,0), (-1,0),  0.5, couleur_header),
    ]))

    # Justification col
    why_rows = [[Paragraph('Justification des choix', s_label)]]
    for txt in pourquois:
        why_rows.append([Paragraph(f'• {txt}', s_why)])
    why_table = Table(why_rows, colWidths=[W - 30*mm - 55*mm - 8*mm])
    why_table.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), couleur_bg),
        ('TOPPADDING',    (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
        ('RIGHTPADDING',  (0,0), (-1,-1), 6),
        ('LINEBELOW',     (0,0), (-1,0),  0.5, couleur_header),
    ]))

    # Body row : params | why
    body = Table(
        [[param_table, why_table]],
        colWidths=[55*mm, W - 30*mm - 55*mm - 8*mm],
        hAlign='LEFT',
    )
    body.setStyle(TableStyle([
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (-1,-1), 0),
        ('TOPPADDING',    (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('LINEAFTER',     (0,0), (0,-1),  0.5, couleur_header),
    ]))

    # IO bar
    io = Table(
        [[Paragraph(f'<b>↳ Entrée :</b> {input_txt}', s_caption),
          Paragraph(f'<b>Sortie →</b> {output_txt}', s_caption)]],
        colWidths=[(W-30*mm)/2, (W-30*mm)/2],
    )
    io.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), couleur_header),
        ('TOPPADDING',    (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING',   (0,0), (-1,-1), 8),
        ('RIGHTPADDING',  (0,0), (-1,-1), 8),
        ('TEXTCOLOR',     (0,0), (-1,-1), WHITE),
    ]))

    outer = Table(
        [[header], [body], [io]],
        colWidths=[W - 30*mm],
    )
    outer.setStyle(TableStyle([
        ('BOX',           (0,0), (-1,-1), 1,   couleur_header),
        ('TOPPADDING',    (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (-1,-1), 0),
        ('ROUNDEDCORNERS',[5]),
    ]))
    return outer


def arrow(txt='▼'):
    return Table(
        [[Paragraph(txt, s_arrow)]],
        colWidths=[W - 30*mm],
    )

# ── ÉTAPE 0 : INPUT ──────────────────────────────────────────────────────────
input_block = Table(
    [[Paragraph('INPUT', s_badge),
      Paragraph('9 246 titres de thèses bruts (FR + EN)', s_h2)]],
    colWidths=[18*mm, W - 30*mm - 20*mm],
)
input_block.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,-1), GREY_MID),
    ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING',    (0,0), (-1,-1), 7),
    ('BOTTOMPADDING', (0,0), (-1,-1), 7),
    ('LEFTPADDING',   (0,0), (0,-1),  6),
    ('RIGHTPADDING',  (0,0), (-1,-1), 8),
    ('ROUNDEDCORNERS',[5]),
]))
story.append(input_block)
story.append(Spacer(1, 2*mm))
story.append(arrow())
story.append(Spacer(1, 2*mm))

# ── ÉTAPE 1 : Embedding ───────────────────────────────────────────────────────
story.append(etape_block(
    '1', 'Vectorisation sémantique — Sentence Transformer',
    CANARD_L, CANARD,
    params=[
        ('modèle', 'paraphrase-multilingual-MiniLM-L12-v2'),
        ('batch_size', '64'),
        ('normalize_embeddings', 'True'),
        ('dimensions de sortie', '384'),
    ],
    pourquois=[
        'Modèle multilingue (50+ langues) → traite FR et EN sans prétraitement.',
        'Fine-tuné sur des paires de paraphrases → deux titres au même sens ont des vecteurs proches même sans mot commun.',
        'MiniLM = distillé de grands modèles BERT → rapide, 384D au lieu de 768D, qualité quasi-identique.',
        'normalize_embeddings=True → tous les vecteurs ont |v|=1 (vecteurs unitaires). Conséquence : euclidean(a,b)² = 2 − 2·cos(a,b), les deux métriques sont équivalentes.',
    ],
    input_txt='9 246 titres bruts (str)',
    output_txt='matrice (9 246 × 384) float32 — embeddings normalisés',
))

story.append(Spacer(1, 2*mm))
story.append(arrow())
story.append(Spacer(1, 2*mm))

# ── ÉTAPE 2 : UMAP (deux colonnes) ───────────────────────────────────────────
umap_header = Table(
    [[Paragraph('ÉTAPE 2', s_badge),
      Paragraph('Réduction de dimension — UMAP (deux projections distinctes)', s_h2)]],
    colWidths=[18*mm, W - 30*mm - 20*mm],
)
umap_header.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,-1), CANARD),
    ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING',    (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING',   (0,0), (0,-1),  6),
    ('RIGHTPADDING',  (0,0), (-1,-1), 8),
]))

col_w = (W - 30*mm - 4*mm) / 2

def umap_col(titre, params, whys, bg):
    rows = [[Paragraph(titre, s_label)]]
    for k, v in params:
        rows.append([Paragraph(f'<b>{k}</b> = {v}', s_mono)])
    rows.append([Paragraph(' ', s_mono)])
    rows.append([Paragraph('Justification', s_label)])
    for w in whys:
        rows.append([Paragraph(f'• {w}', s_why)])
    t = Table(rows, colWidths=[col_w - 8*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), bg),
        ('TOPPADDING',    (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
        ('RIGHTPADDING',  (0,0), (-1,-1), 6),
    ]))
    return t

left_col  = umap_col(
    '2a — UMAP 10D  (pour le clustering)',
    [('n_components','10'), ('n_neighbors','15'),
     ('min_dist','0.0'), ('metric','cosine'), ('random_state','42')],
    [
        '10D = sweet spot : assez petit pour que HDBSCAN trouve des zones denses/creuses, assez grand pour préserver la structure sémantique.',
        'min_dist=0.0 → points d\'un même cluster aussi compacts que possible → HDBSCAN les détecte plus facilement.',
        'n_neighbors=15 → équilibre structure locale et globale.',
        'metric=cosine → mesure l\'angle entre vecteurs d\'embeddings (invariant à la norme).',
    ],
    CANARD_L,
)
right_col = umap_col(
    '2b — UMAP 2D  (pour la visualisation)',
    [('n_components','2'), ('n_neighbors','15'),
     ('min_dist','0.1'), ('metric','cosine'), ('random_state','42')],
    [
        '2D uniquement pour afficher les points sur le dashboard — n\'est PAS utilisé pour le clustering.',
        'min_dist=0.1 (vs 0.0) → laisse un peu d\'espace entre points pour une meilleure lisibilité visuelle.',
        'random_state=42 → positions reproductibles d\'une exécution à l\'autre.',
        'Résultat stocké dans x, y de data_clustered.json.',
    ],
    ORANGE_L,
)

umap_body = Table(
    [[left_col, right_col]],
    colWidths=[col_w, col_w],
)
umap_body.setStyle(TableStyle([
    ('TOPPADDING',    (0,0), (-1,-1), 0),
    ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ('LEFTPADDING',   (0,0), (-1,-1), 0),
    ('RIGHTPADDING',  (0,0), (-1,-1), 0),
    ('VALIGN',        (0,0), (-1,-1), 'TOP'),
    ('LINEAFTER',     (0,0), (0,-1),  0.5, CANARD),
]))

umap_io = Table(
    [[Paragraph('↳ Entrée : matrice (9 246 × 384)', s_caption),
      Paragraph('Sortie 2a → (9 246 × 10) | Sortie 2b → (9 246 × 2) coords (x,y)', s_caption)]],
    colWidths=[(W-30*mm)/2, (W-30*mm)/2],
)
umap_io.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,-1), CANARD),
    ('TOPPADDING',    (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING',   (0,0), (-1,-1), 8),
    ('RIGHTPADDING',  (0,0), (-1,-1), 8),
    ('TEXTCOLOR',     (0,0), (-1,-1), WHITE),
]))

umap_outer = Table(
    [[umap_header], [umap_body], [umap_io]],
    colWidths=[W - 30*mm],
)
umap_outer.setStyle(TableStyle([
    ('BOX',           (0,0), (-1,-1), 1, CANARD),
    ('TOPPADDING',    (0,0), (-1,-1), 0),
    ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ('LEFTPADDING',   (0,0), (-1,-1), 0),
    ('RIGHTPADDING',  (0,0), (-1,-1), 0),
    ('ROUNDEDCORNERS',[5]),
]))
story.append(umap_outer)

story.append(Spacer(1, 2*mm))
story.append(arrow('▼  (sortie 2a — 10D)'))
story.append(Spacer(1, 2*mm))

# ── ÉTAPE 3 : HDBSCAN ────────────────────────────────────────────────────────
story.append(etape_block(
    '3', 'Clustering — HDBSCAN',
    ORANGE_L, ORANGE,
    params=[
        ('min_cluster_size', '50'),
        ('min_samples', '5'),
        ('metric', 'euclidean  (≡ cosinus car |v|=1)'),
        ('cluster_selection_method', 'eom'),
        ('prediction_data', 'True'),
    ],
    pourquois=[
        'HDBSCAN vs K-Means : K-Means impose de fixer K à l\'avance et force chaque thèse dans un cluster. HDBSCAN trouve K automatiquement et assigne le label −1 (bruit) aux thèses atypiques.',
        'min_cluster_size=50 : avec ~9 000 thèses, un cluster < 50 est trop petit pour représenter une thématique. Augmenter → moins de clusters, moins de bruit.',
        'min_samples=5 : un point est "core" s\'il a ≥ 5 voisins proches. Faible = tolérant au bruit local.',
        'eom (Excess of Mass) : favorise des clusters stables et bien délimités (vs "leaf" qui donne des micro-clusters très denses).',
        'euclidean sur vecteurs normalisés = cosinus : les distances sont donc bien sémantiques.',
    ],
    input_txt='matrice (9 246 × 10) UMAP 10D',
    output_txt='tableau de labels entiers — −1 = bruit, 0…K = cluster',
))

story.append(Spacer(1, 2*mm))
story.append(arrow())
story.append(Spacer(1, 2*mm))

# ── ÉTAPE 4 : TF-IDF ────────────────────────────────────────────────────────
story.append(etape_block(
    '4', 'Interprétation des clusters — TF-IDF',
    CANARD_L, CANARD,
    params=[
        ('max_features', '5 000'),
        ('ngram_range', '(1, 2)  — unigrams + bigrams'),
        ('min_df', '2'),
        ('top_words', '10  (top 3 → label)'),
    ],
    pourquois=[
        'TF-IDF mesure quels mots sont SPÉCIFIQUES à un cluster : fréquents dans ce cluster, rares dans les autres.',
        'Chaque cluster → 1 "document" (concaténation des titres nettoyés) → TF-IDF inter-clusters.',
        'ngram_range=(1,2) : capture aussi les expressions de 2 mots ("apprentissage coopératif", "formation initiale").',
        'Les 3 premiers mots = label lisible du cluster affiché dans le dashboard.',
    ],
    input_txt='titres nettoyés groupés par cluster_id',
    output_txt='dict cluster_id → [mots-clés] + labels str',
))

story.append(Spacer(1, 2*mm))
story.append(arrow())
story.append(Spacer(1, 2*mm))

# ── OUTPUT ───────────────────────────────────────────────────────────────────
out_data = [
    ['Fichier', 'Contenu', 'Usage'],
    ['clusters.json', '42 entrées — id, label, keywords, nb, cx, cy, cnu_dist', 'Bulles du dashboard (ForceGraph)'],
    ['data_clustered.json', '9 246 entrées — données + cluster_id, cluster_label, x, y', 'Position de chaque thèse (UMAP 2D)'],
    ['umap_clusters.png', 'Scatter UMAP 2D coloré par cluster et par CNU', 'Vérification qualitative'],
    ['umap_annotated.png', 'Scatter UMAP 2D annoté avec les labels des clusters', 'Vérification qualitative'],
]
out_table = Table(out_data, colWidths=[52*mm, 90*mm, 38*mm])
out_table.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,0),  GREY_MID),
    ('TEXTCOLOR',     (0,0), (-1,0),  WHITE),
    ('FONTNAME',      (0,0), (-1,0),  'Helvetica-Bold'),
    ('FONTSIZE',      (0,0), (-1,-1), 8),
    ('FONTNAME',      (0,1), (-1,-1), 'Helvetica'),
    ('ROWBACKGROUNDS',(0,1), (-1,-1), [GREY_BG, WHITE]),
    ('GRID',          (0,0), (-1,-1), 0.4, colors.HexColor('#cbd5e1')),
    ('TOPPADDING',    (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING',   (0,0), (-1,-1), 6),
    ('RIGHTPADDING',  (0,0), (-1,-1), 6),
    ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ('ROUNDEDCORNERS',[4]),
]))

output_outer = Table(
    [[Paragraph('OUTPUT — Fichiers générés', s_h2)],
     [out_table]],
    colWidths=[W - 30*mm],
)
output_outer.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,0),  GREY_MID),
    ('BOX',           (0,0), (-1,-1), 1, GREY_MID),
    ('TOPPADDING',    (0,0), (0,0),   6),
    ('BOTTOMPADDING', (0,0), (0,0),   6),
    ('LEFTPADDING',   (0,0), (-1,-1), 6),
    ('RIGHTPADDING',  (0,0), (-1,-1), 6),
    ('ROUNDEDCORNERS',[5]),
]))
story.append(output_outer)

story.append(Spacer(1, 5*mm))
story.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#cbd5e1')))
story.append(Spacer(1, 2*mm))
story.append(Paragraph('Pipeline Notebook 02 — MAIEUTiC · Généré automatiquement', s_footer))

doc.build(story)
print('PDF généré → pipeline_clustering.pdf')
