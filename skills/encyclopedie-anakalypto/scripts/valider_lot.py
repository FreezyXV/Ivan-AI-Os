"""Valide un lot de fiches Anakalypto (format v2 : court, visuel, interactif) et la porte Jev.
Usage : python3 valider_lot.py <fichier.md> ... [--brouillon]
  sans --brouillon : format + décision Jev `publication.prete` obligatoire (fichier <lot>.jev.json)
  --brouillon      : format seul ; le lot est signalé NON PUBLIABLE."""
import json, re, sys
from pathlib import Path

CLES = ["type", "slug", "titre", "categorie", "resume", "accroche"]
SECTIONS = ["## L'essentiel", "## En images", "## Pour aller plus loin", "## Faits clés", "## Sources"]
VISUELS = {"timeline", "chart", "map", "diagramme", "quiz", "comparateur", "curseur", "chiffres-cles"}
MOTS_MIN, MOTS_MAX, SOURCES_MIN, SEUIL_JEV = 150, 450, 3, 0.7
BLOC = re.compile(r"^---\ntype: (article|category)\n(.*?)\n---\n(.*?)(?=^---\ntype: |\Z)", re.S | re.M)
VISUEL = re.compile(r"```anakalypto-visuel\n(.*?)\n```", re.S)


def section(corps, titre):
    m = re.search(re.escape(titre) + r"\n(.*?)(?=^## |\Z)", corps, re.S | re.M)
    return m.group(1) if m else ""


def verifier_visuel(slug, corps):
    m = VISUEL.search(corps)
    if not m:
        return [f"{slug}: bloc ```anakalypto-visuel absent"]
    try:
        v = json.loads(m.group(1))
    except json.JSONDecodeError:
        return [f"{slug}: bloc visuel JSON invalide"]
    if v.get("type") not in VISUELS:
        return [f"{slug}: type de visuel inconnu {v.get('type')!r}"]
    if not v.get("titre") or not isinstance(v.get("donnees"), list) or not v["donnees"]:
        return [f"{slug}: visuel sans titre ou sans données"]
    if v["type"] == "quiz":
        ok = len(v["donnees"]) >= 3 and all(
            isinstance(q, dict) and q.get("question") and isinstance(q.get("choix"), list) and 2 <= len(q["choix"]) <= 4
            and isinstance(q.get("bonne"), int) and 0 <= q["bonne"] < len(q["choix"]) for q in v["donnees"])
        if not ok:
            return [f"{slug}: quiz invalide (3 questions, 2 à 4 choix, index de bonne réponse)"]
    if v["type"] in {"comparateur", "chart", "chiffres-cles"}:
        # A value that is prose ("moins de 3") cannot be drawn: put it in the text, not the chart.
        prose = [d.get("valeur") for d in v["donnees"] if isinstance(d, dict) and "valeur" in d
                 and (isinstance(d["valeur"], bool) or not isinstance(d["valeur"], (int, float)))]
        if prose:
            return [f"{slug}: {v['type']} avec valeur non numérique {prose[0]!r}"]
    return []


def verifier(texte):
    erreurs, slugs, blocs = [], [], BLOC.findall(texte)
    if not blocs:
        return ["aucun bloc '---\\ntype: article' trouvé"], slugs
    for typ, fm, corps in blocs:
        if typ != "article":
            continue
        cles = dict(l.split(":", 1) for l in fm.splitlines() if ":" in l)
        slug = cles.get("slug", "?").strip()
        slugs.append(slug)
        manque = [c for c in CLES[1:] if not cles.get(c, "").strip()]
        if manque: erreurs.append(f"{slug}: frontmatter manquant {manque}")
        if len(cles.get("resume", "").strip()) > 200: erreurs.append(f"{slug}: résumé > 200 caractères")
        if len(cles.get("accroche", "").strip()) > 160: erreurs.append(f"{slug}: accroche > 160 caractères")
        for s in SECTIONS:
            if s not in corps: erreurs.append(f"{slug}: section absente '{s}'")
        puces = [l for l in section(corps, "## L'essentiel").splitlines() if l.startswith("- ")]
        if not 3 <= len(puces) <= 5: erreurs.append(f"{slug}: {len(puces)} puces dans L'essentiel (3 à 5)")
        if any(len(p[2:].split()) > 25 for p in puces): erreurs.append(f"{slug}: puce > 25 mots")
        if len(section(corps, "## Pour aller plus loin").split()) > 120: erreurs.append(f"{slug}: Pour aller plus loin > 120 mots")
        erreurs += verifier_visuel(slug, corps)
        n = len(VISUEL.sub("", corps).split())
        if not MOTS_MIN <= n <= MOTS_MAX: erreurs.append(f"{slug}: {n} mots hors visuel (cible {MOTS_MIN}-{MOTS_MAX})")
        if section(corps, "## Sources").count("http") < SOURCES_MIN: erreurs.append(f"{slug}: moins de {SOURCES_MIN} sources avec URL")
        if re.search(r"\[À VÉRIFIER\]|lorem|TODO", corps, re.I): erreurs.append(f"{slug}: marqueur non résolu")
    return erreurs, slugs


def verifier_jev(fichier, slugs):
    """Porte obligatoire : chaque fiche porte une décision Jev publication.prete suffisante."""
    jev = fichier.with_suffix(".jev.json")
    if not jev.exists():
        return [f"jev: {jev.name} absent — lot non publiable sans décision Jev"]
    try:
        decisions = json.loads(jev.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return [f"jev: {jev.name} invalide"]
    erreurs = []
    for slug in slugs:
        d = decisions.get(slug, {}).get("publication.prete")
        if not d or not isinstance(d.get("request_id"), str) or not d["request_id"]:
            erreurs.append(f"{slug}: décision Jev publication.prete absente")
        elif not isinstance(d.get("decision"), (int, float)) or d["decision"] < SEUIL_JEV:
            erreurs.append(f"{slug}: Jev juge la fiche non prête ({d.get('decision')})")
    return erreurs


if __name__ == "__main__":
    args = sys.argv[1:]
    brouillon = "--brouillon" in args
    fichiers = [f for a in args if a != "--brouillon" for f in (sorted(Path(a).glob("*.md")) if Path(a).is_dir() else [Path(a)])]
    total = 0
    for f in fichiers:
        e, slugs = verifier(f.read_text(encoding="utf-8"))
        if not brouillon:
            e += verifier_jev(f, slugs)
        total += len(e)
        print(f"{f.name}: " + ("OK" if not e else "\n  - " + "\n  - ".join(e)))
    if brouillon:
        print("\nBROUILLON : format seul vérifié — NON PUBLIABLE sans décision Jev.")
    print(f"\n{len(fichiers)} fichier(s), {total} problème(s).")
    sys.exit(1 if total else 0)
