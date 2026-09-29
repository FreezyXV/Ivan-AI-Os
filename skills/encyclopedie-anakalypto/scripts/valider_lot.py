"""Valide le format de brouillons d'articles. Usage : python valider_lot.py <dossier|fichier.md> ...
Ajuster SECTIONS / CLES / bornes UNE fois pour coller au depot reel."""
import re, sys
from pathlib import Path

CLES = ["type", "slug", "titre", "categorie", "resume"]
SECTIONS = ["## Résumé", "## Faits clés", "## Chronologie", "## Sources"]
MOTS_MIN, MOTS_MAX, SOURCES_MIN = 900, 1500, 3
BLOC = re.compile(r"^---\ntype: (article|category)\n(.*?)\n---\n(.*?)(?=^---\ntype: |\Z)", re.S | re.M)


def verifier(texte):
    erreurs, blocs = [], BLOC.findall(texte)
    if not blocs:
        return ["aucun bloc '---\\ntype: article' trouvé"]
    for typ, fm, corps in blocs:
        if typ != "article":
            continue
        cles = dict(l.split(":", 1) for l in fm.splitlines() if ":" in l)
        slug = cles.get("slug", "?").strip()
        manque = [c for c in CLES[1:] if not cles.get(c, "").strip()]
        if manque: erreurs.append(f"{slug}: frontmatter manquant {manque}")
        for s in SECTIONS:
            if s not in corps: erreurs.append(f"{slug}: section absente '{s}'")
        n = len(corps.split())
        if not MOTS_MIN <= n <= MOTS_MAX: erreurs.append(f"{slug}: {n} mots (cible {MOTS_MIN}-{MOTS_MAX})")
        src = corps.split("## Sources")[-1] if "## Sources" in corps else ""
        if src.count("http") < SOURCES_MIN: erreurs.append(f"{slug}: moins de {SOURCES_MIN} sources avec URL")
        if re.search(r"\[À VÉRIFIER\]|lorem|TODO", corps, re.I): erreurs.append(f"{slug}: marqueur non résolu")
    return erreurs


if __name__ == "__main__":
    fichiers = [f for a in sys.argv[1:] for f in (sorted(Path(a).glob("*.md")) if Path(a).is_dir() else [Path(a)])]
    total = 0
    for f in fichiers:
        e = verifier(f.read_text(encoding="utf-8"))
        total += len(e)
        print(f"{f.name}: " + ("OK" if not e else "\n  - " + "\n  - ".join(e)))
    print(f"\n{len(fichiers)} fichier(s), {total} problème(s).")
    sys.exit(1 if total else 0)
