"""Recorta el GeoJSON distrital nacional a costa norte -> processed/northcoast.geojson.

Filtra por prefijo de ubigeo (13=La Libertad, 14=Lambayeque, 20=Piura, 24=Tumbes) y reporta
la cobertura vs processed/districts.json (cuántos polígonos quedan grises / cuántos ubigeos
de la data no tienen polígono por desajuste de límites pre-2013).

Uso:
    # 1) descargar la fuente nacional a data/geo/ (una vez):
    #    curl -sL -o ../geo/peru_distrital_simple.geojson \
    #      https://raw.githubusercontent.com/juaneladio/peru-geojson/master/peru_distrital_simple.geojson
    # 2) python filter_geojson.py
"""
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SRC = REPO / "data/geo/peru_distrital_simple.geojson"
OUT = REPO / "data/processed/northcoast.geojson"
DISTRICTS = REPO / "data/processed/districts.json"

PREFIXES = {"13": "LA LIBERTAD", "14": "LAMBAYEQUE", "20": "PIURA", "24": "TUMBES"}


def main() -> None:
    gj = json.loads(SRC.read_text(encoding="utf-8"))
    out_features = []
    for ft in gj["features"]:
        p = ft["properties"]
        ubigeo = str(p.get("IDDIST", "")).zfill(6)
        if ubigeo[:2] in PREFIXES:
            out_features.append({
                "type": "Feature",
                "geometry": ft["geometry"],
                "properties": {
                    "ubigeo": ubigeo,
                    "nombre": str(p.get("NOMBDIST", "")).title(),
                    "provincia": str(p.get("NOMBPROV", "")).title(),
                    "departamento": str(p.get("NOMBDEP", "")).title(),
                },
            })

    OUT.write_text(json.dumps({"type": "FeatureCollection", "features": out_features}, ensure_ascii=False),
                   encoding="utf-8")

    geo_ubigeos = {f["properties"]["ubigeo"] for f in out_features}
    data_ubigeos = {d["ubigeo"] for d in json.loads(DISTRICTS.read_text(encoding="utf-8"))}
    print(f"Polígonos costa norte: {len(out_features)} | "
          f"con registro: {len(geo_ubigeos & data_ubigeos)} | "
          f"gris: {len(geo_ubigeos - data_ubigeos)} | "
          f"data sin polígono (mismatch pre-2013): {len(data_ubigeos - geo_ubigeos)}")
    print(f"Escrito: {OUT}")


if __name__ == "__main__":
    main()
