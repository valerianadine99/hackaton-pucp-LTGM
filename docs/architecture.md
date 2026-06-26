# Vigía — Arquitectura

> Diagramas del prototipo de arquitectura (Hito 1). Alcance cerrado en [`CONTEXT.md`](../CONTEXT.md); justificación extendida en [`vigia-brief.md`](vigia-brief.md).
>
> **Principio rector:** monolito pragmático, nada en vivo en la demo. El frontend consume **JSON estático precocido** servido por una API Django; el dato real de SINPAD se procesa **offline** antes del evento.

---

## 1. Módulos principales y cómo se comunican

```mermaid
flowchart TB
    subgraph offline["🛠️ Pipeline de datos (OFFLINE, pre-evento)"]
        direction TB
        sinpad["SINPAD CSV<br/>(datosabiertos.gob.pe)<br/>emergencias 2003→hoy"]
        ign["GeoJSON distrital<br/>(IGN / INEI)<br/>polígonos por ubigeo"]
        enfenSrc["Comunicado ENFEN<br/>(PDF/texto, precargado)"]
        etl["Script de Datos<br/>filtra fenómeno · agrupa por ubigeo · reconcilia ubigeos"]
        sinpad --> etl
        ign --> etl
        etl --> districtsJson["districts.json<br/>{ubigeo, nombre, conteo, nivel, anios[]}"]
        etl --> geo["northcoast.geojson<br/>(asset del frontend)"]
        enfenSrc --> enfenTxt["enfen_summary.json<br/>(texto resumido, 2-3 frases)"]
    end

    subgraph backend["⚙️ Backend — Django + DRF (backend/)"]
        api["REST API<br/>sirve JSON precocido"]
        districtsJson --> api
        enfenTxt --> api
        checklists["checklists.json<br/>guías INDECI por nivel (curado)"] --> api
    end

    subgraph frontend["🖥️ Frontend — Next.js 14 + React 18 (frontend/)"]
        map["Mapa choropleth<br/>(Leaflet)"]
        panel["Panel #quot;tu distrito#quot;<br/>histórico · ENFEN · checklist"]
        geoloc["Geoloc (botón 2º)<br/>point-in-polygon · Turf.js"]
        geo --> map
    end

    user(["👤 Ciudadano<br/>costa norte"])

    user -->|"clic en distrito / dropdown"| map
    map -->|"GET /api/districts"| api
    panel -->|"GET /api/districts/{ubigeo}"| api
    panel -->|"GET /api/enfen"| api
    map --> panel
    geoloc -.->|"ubigeo detectado"| panel

    classDef off fill:#fff7ed,stroke:#fb923c,color:#7c2d12;
    classDef be fill:#eff6ff,stroke:#3b82f6,color:#1e3a8a;
    classDef fe fill:#f0fdf4,stroke:#22c55e,color:#14532d;
    class sinpad,ign,enfenSrc,etl,districtsJson,geo,enfenTxt off;
    class api,checklists be;
    class map,panel,geoloc fe;
```

**Comunicación:** un único contrato HTTP/JSON entre `frontend` (Next.js) y `backend` (Django DRF). Sin microservicios, sin base de datos en runtime: la API lee artefactos JSON precocidos. El GeoJSON distrital vive como asset del frontend (es geometría, no cambia).

---

## 2. Flujo de datos: de la fuente pública a la pantalla

```mermaid
flowchart LR
    A["SINPAD CSV<br/>crudo"] -->|"filtrar:<br/>Inundación · Lluvias intensas · Huayco"| B["emergencias<br/>de lluvia"]
    B -->|"agrupar por ubigeo<br/>(conteo crudo, sin normalizar)"| C["conteo<br/>por distrito"]
    C -->|"asignar nivel<br/>(3 niveles + gris si N=0)"| D["districts.json"]
    E["GeoJSON IGN"] -->|"reconciliar ubigeos<br/>(pos-2013)"| F["northcoast.geojson"]
    D --> G["API Django<br/>/api/districts"]
    F --> H["Leaflet choropleth"]
    G --> H
    H -->|"clic"| I["/api/districts/{ubigeo}<br/>+ /api/enfen"]
    I --> J["Panel #quot;tu distrito#quot;"]
```

> **Regla de oro:** densidad sobre cobertura. El clímax necesita ~10–15 distritos de costa norte coloreados de forma convincente, no los 1.870 nacionales. Plan-B si el CSV falla (timebox 90 min): ~15 distritos anclados al reporte COEN (Piura: 91.835 damnificados; Catacaos ≈ 45 mil).

---

## 3. Secuencia: "tu distrito" (clímax de la demo)

```mermaid
sequenceDiagram
    actor U as Ciudadano
    participant M as Mapa (Leaflet)
    participant API as Django DRF
    participant P as Panel "tu distrito"

    U->>M: Carga la app
    M->>API: GET /api/districts
    API-->>M: [{ubigeo, nombre, conteo, nivel, anios[]}]
    M-->>U: Choropleth costa norte (gris = sin registro ≠ sin riesgo)

    U->>M: Clic en su distrito
    M->>API: GET /api/districts/{ubigeo}
    API-->>M: histórico + checklist por nivel
    M->>API: GET /api/enfen
    API-->>M: resumen ENFEN (texto precomputado)
    M->>P: Abrir panel (memoria + presente yuxtapuestos)
    P-->>U: "Tu distrito se inundó N veces" + estado ENFEN + qué hacer
    Note over P,U: Termina en memoria + riesgo + acción.<br/>IA = cierre, no héroe. Disclaimer al pie.
```

---

## 4. Modelo de datos (artefactos precocidos)

No hay base de datos en runtime para el MVP. Estos son los esquemas de los JSON que sirve la API.

```mermaid
classDiagram
    class District {
        +string ubigeo
        +string nombre
        +string departamento
        +int conteo
        +string nivel  // "alto" | "medio" | "bajo" | "sin_registro"
        +int[] anios
    }
    class DistrictDetail {
        +string ubigeo
        +string nombre
        +int conteo
        +Emergencia[] historico
        +string nivel
        +ChecklistItem[] checklist
    }
    class Emergencia {
        +int anio
        +string fenomeno
        +string fuente  // "SINPAD" | "COEN"
    }
    class ChecklistItem {
        +string nivel
        +string accion
        +string fuente  // "INDECI"
    }
    class EnfenSummary {
        +string estado     // alerta vigente
        +string resumen    // 2-3 frases, texto precomputado
        +string fecha
        +string fuente_url
    }
    District "1" --> "1" DistrictDetail : /api/districts/{ubigeo}
    DistrictDetail "1" --> "*" Emergencia
    DistrictDetail "1" --> "*" ChecklistItem
```

### Endpoints (Django DRF — sobre el starter de `backend/api/`)

| Método | Ruta | Devuelve |
|---|---|---|
| `GET` | `/api/districts` | Lista costa norte `{ubigeo, nombre, conteo, nivel, anios[]}` para el choropleth |
| `GET` | `/api/districts/<ubigeo>` | Detalle: histórico + resumen ENFEN (texto) + checklist por nivel |
| `GET` | `/api/enfen` | Estado/comunicado ENFEN resumido (precargado) |
| `GET` | `/health` | Liveness probe *(del starter)* |
| `GET` | `/api/items` | Mock del starter — **se reemplaza** |

---

## 5. Despliegue

```mermaid
flowchart LR
    subgraph vercel["Vercel"]
        fe["Next.js 14<br/>frontend/<br/>+ northcoast.geojson"]
    end
    subgraph railway["Railway"]
        be["Django + DRF<br/>backend/<br/>(gunicorn)"]
    end
    dev(["💻 Local<br/>:3000 ↔ :8000"])
    fe -->|"HTTPS · NEXT_PUBLIC_API_BASE_URL"| be
    dev -.->|"git push"| gh["GitHub repo<br/>(release Hito 1)"]
    gh -.->|"deploy"| vercel
    gh -.->|"deploy"| railway
```

- **Frontend:** Vercel (URL pública automática). Var `NEXT_PUBLIC_API_BASE_URL` → backend desplegado.
- **Backend:** Railway (`gunicorn config.wsgi`, ver `backend/Procfile` / `backend/railway.toml`). Setear `CORS_ORIGINS`, `ALLOWED_HOSTS`, `SECRET_KEY`, `DEBUG=False`.
- **Datos:** los JSON precocidos se versionan en el repo (sin red en vivo en la demo).

---

## Decisiones de diseño que la arquitectura respeta

- **Agencia, no amenaza:** toda respuesta termina en *memoria + nivel de riesgo + acción*; nunca un diagnóstico binario.
- **IA = una sola llamada, y para la demo es texto precomputado** (coherente con "nada en vivo"). Llamada real al modelo = roadmap.
- **Sin fórmula combinada de riesgo:** memoria histórica y estado ENFEN se muestran **yuxtapuestos**.
- **Sin verde engañoso:** distritos sin registro van en **gris explícito** ("no significa sin riesgo").
- **Susceptibilidad ≠ registro:** mostramos lo que ocurrió, no predicción.
