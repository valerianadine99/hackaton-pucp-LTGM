"""Procesa el Excel SINPAD -> processed/districts.json + processed/sinpad_costa_norte.csv.

Filtra emergencias por fenómeno de lluvia (LLUVIA INTENSA / INUNDACIÓN / HUAYCO) y por
los 4 departamentos de costa norte, agrupa por ubigeo y asigna nivel por terciles del conteo.

Uso:
    pip install -r requirements.txt
    python build_districts.py
"""
import json
import re
import unicodedata
from pathlib import Path

import pandas as pd

REPO = Path(__file__).resolve().parents[2]
XLSX = REPO / "data/raw/BD-EMER-Y-DAÑOS-INTEGRADA-2003-2020-validada.xlsx"
OUT_JSON = REPO / "data/processed/districts.json"
OUT_CSV = REPO / "data/processed/sinpad_costa_norte.csv"

COSTA_NORTE = {"TUMBES", "PIURA", "LAMBAYEQUE", "LA LIBERTAD"}
# Fenómenos asociados a lluvia/Niño. Filtro por "contiene", insensible a tildes/mayúsculas.
# (Strings reales del campo EMERGENCIA verificados en la BD: 'LLUVIA INTENSA', 'INUNDACIÓN', 'HUAYCO'.)
FENOMENO_RE = re.compile(r"LLUVIA|INUNDAC|HUAYCO", re.IGNORECASE)


def strip_accents(s) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", str(s)) if unicodedata.category(c) != "Mn")


def main() -> None:
    df = pd.read_excel(XLSX, sheet_name="BD 2003-2020", header=2, dtype={"COD. DISTRITO": str})
    df = df.dropna(subset=["EMERGENCIA", "COD. DISTRITO", "DPTO."])

    mask_fen = df["EMERGENCIA"].map(lambda x: bool(FENOMENO_RE.search(strip_accents(x))))
    mask_dep = df["DPTO."].str.upper().str.strip().isin(COSTA_NORTE)
    f = df[mask_fen & mask_dep].copy()
    f["AÑO"] = f["AÑO"].astype(int)
    f["COD. DISTRITO"] = f["COD. DISTRITO"].str.zfill(6)

    rows = []
    for ubigeo, g in f.groupby("COD. DISTRITO"):
        rows.append({
            "ubigeo": ubigeo,
            "nombre": str(g["DIST."].iloc[0]).strip().title(),
            "departamento": str(g["DPTO."].iloc[0]).strip().title(),
            "conteo": int(len(g)),
            "anios": sorted(int(a) for a in g["AÑO"].unique()),
        })

    counts = pd.Series([r["conteo"] for r in rows])
    q33, q66 = counts.quantile(0.33), counts.quantile(0.66)

    def nivel(c):
        return "alto" if c >= q66 else "medio" if c >= q33 else "bajo"

    for r in rows:
        r["nivel"] = nivel(r["conteo"])
    rows.sort(key=lambda r: r["conteo"], reverse=True)

    OUT_JSON.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    cols = ["CÓDIGO DE EMERGENCIA-SINPAD", "AÑO", "MES", "COD. DISTRITO", "DPTO.", "PROV.", "DIST.",
            "EMERGENCIA", "FALLECIDOS", "DAMNIFICADOS", "AFECTADOS", "VIVIENDAS DESTRUIDAS"]
    f[cols].to_csv(OUT_CSV, index=False, encoding="utf-8")

    print(f"Filas tras filtro: {len(f):,} | distritos: {len(rows)} | "
          f"umbrales: bajo<{q33:.0f}<=medio<{q66:.0f}<=alto")
    print(f"Escrito: {OUT_JSON}")
    print(f"Escrito: {OUT_CSV}")


if __name__ == "__main__":
    main()
