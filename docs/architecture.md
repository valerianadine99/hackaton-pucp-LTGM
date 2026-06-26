# Vigía — Arquitectura

> Diagramas del prototipo de arquitectura (Hito 1). Alcance cerrado en [`CONTEXT.md`](../CONTEXT.md); principios en [`constitution`](../.specify/memory/constitution.md) (v2.0.0); justificación extendida en [`vigia-brief.md`](vigia-brief.md).
>
> **Principio rector:** monolito pragmático con **integración real y datos reales**. El frontend (Next.js) consume una API Django DRF que sirve datos desde una **base de datos real PostgreSQL en AWS RDS**. Un **ETL** carga la data de las fuentes oficiales (SINPAD, ENFEN, GeoJSON IGN/INEI) en la BD antes/durante el evento; la app sirve esa data **en vivo desde la BD**. El resumen ENFEN se genera con una **llamada real al modelo Claude (Anthropic)**, cacheada en la BD. Nada hardcodeado ni fake. Toda la información vive en el backend (Principio VIII: escalabilidad y mantenibilidad).

---

## 1. Módulos principales y cómo se comunican

```mermaid
flowchart TB
    subgraph sources["🌐 Fuentes oficiales (públicas)"]
        sinpad["SINPAD CSV<br/>datosabiertos.gob.pe<br/>emergencias 2003→hoy"]
        ign["GeoJSON distrital<br/>IGN / INEI<br/>polígonos por ubigeo"]
        enfenSrc["Comunicado ENFEN<br/>enfen.imarpe.gob.pe"]
    end

    subgraph etl["🛠️ ETL de ingesta (Django management command)"]
        load["Filtra fenómeno · agrupa por ubigeo · reconcilia ubigeos · asigna nivel"]
    end

    subgraph backend["⚙️ Backend — Django + DRF (backend/)"]
        api["REST API (DRF)<br/>serializers + vistas"]
        orm["ORM / modelos"]
        api <--> orm
    end

    subgraph db["🗄️ PostgreSQL — AWS RDS"]
        tDistrict[("districts<br/>ubigeo, nombre, conteo, nivel, anios")]
        tGeo[("geometría distrital<br/>GeoJSON en JSONField")]
        tChecklist[("checklists INDECI<br/>por nivel")]
        tEnfen[("enfen_summary<br/>resumen Claude, cacheado")]
    end

    subgraph ai["🤖 Claude (Anthropic)"]
        claude["API — resume el comunicado ENFEN<br/>a 2-3 frases (llamada real)"]
    end

    subgraph frontend["🖥️ Frontend — Next.js 14 + React 18 (frontend/)"]
        map["Mapa choropleth (Leaflet)"]
        panel["Panel tu distrito<br/>histórico · ENFEN · checklist"]
        geoloc["Geoloc (botón 2º)<br/>point-in-polygon · Turf.js"]
    end

    user(["👤 Ciudadano<br/>costa norte (móvil)"])

    sinpad --> load
    ign --> load
    enfenSrc --> load
    load --> orm
    enfenSrc -.->|texto crudo| claude
    claude -.->|resumen real| orm
    orm <--> tDistrict
    orm <--> tGeo
    orm <--> tChecklist
    orm <--> tEnfen

    user -->|"clic en distrito / dropdown"| map
    map -->|"GET /api/districts"| api
    panel -->|"GET /api/districts/{ubigeo}"| api
    panel -->|"GET /api/enfen"| api
    map --> panel
    map -.->|"polígonos GeoJSON (asset servido por API)"| geoloc
    geoloc -.->|"ubigeo detectado (Turf.js)"| panel

    classDef src fill:#fff7ed,stroke:#fb923c,color:#7c2d12;
    classDef be fill:#eff6ff,stroke:#3b82f6,color:#1e3a8a;
    classDef store fill:#faf5ff,stroke:#a855f7,color:#581c87;
    classDef aicls fill:#fdf2f8,stroke:#ec4899,color:#831843;
    classDef fe fill:#f0fdf4,stroke:#22c55e,color:#14532d;
    class sinpad,ign,enfenSrc,load src;
    class api,orm be;
    class tDistrict,tGeo,tChecklist,tEnfen store;
    class claude aicls;
    class map,panel,geoloc fe;
```

**Comunicación:** un único contrato HTTP/JSON entre `frontend` (Next.js) y `backend` (Django DRF).
El backend es la **única fuente de verdad**: toda la información (conteos, geometría, checklists,
resumen ENFEN) vive en **PostgreSQL (AWS RDS)** y se sirve por la API vía el ORM. El frontend no
embebe data ni GeoJSON — los pide al backend (Principio VIII). El ETL es un *management command*
de Django que se corre antes/durante el evento para poblar la BD con datos reales.

---

## 2. Flujo de datos: de la fuente pública a la pantalla

```mermaid
flowchart LR
    A["SINPAD CSV crudo"] -->|"filtrar:<br/>Inundación · Lluvias · Huayco"| B["emergencias de lluvia"]
    B -->|"agrupar por ubigeo<br/>(conteo crudo, sin normalizar)"| C["conteo por distrito"]
    C -->|"asignar nivel<br/>(3 niveles + gris si N=0)"| D[("tabla districts<br/>PostgreSQL/RDS")]
    E["GeoJSON IGN"] -->|"reconciliar ubigeos (pos-2013)"| F[("geometría<br/>PostgreSQL/RDS")]
    G["Comunicado ENFEN"] -->|"llamada real a Claude"| H[("enfen_summary<br/>cacheado en RDS")]
    D --> API["Django DRF<br/>(ORM)"]
    F --> API
    H --> API
    API -->|"GET /api/districts"| MAP["Leaflet choropleth"]
    MAP -->|"clic"| DET["/api/districts/{ubigeo} + /api/enfen"]
    DET --> PANEL["Panel tu distrito"]
```

> **Regla de oro:** densidad sobre cobertura. El clímax necesita ~10–15 distritos de costa norte
> coloreados de forma convincente con **datos reales**, no los 1.870 nacionales. Plan-B si el CSV
> de SINPAD falla (timebox 90 min): ~15 distritos anclados al reporte COEN (Piura: 91.835
> damnificados; Catacaos ≈ 45 mil) — sigue siendo dato real, cargado en la misma BD.

---

## 3. Secuencia: "tu distrito" (clímax de la demo)

```mermaid
sequenceDiagram
    actor U as Ciudadano (móvil)
    participant M as Mapa (Leaflet)
    participant API as Django DRF
    participant DB as PostgreSQL (RDS)
    participant AI as Claude
    participant P as Panel

    U->>M: Carga la app
    M->>API: GET /api/districts
    API->>DB: SELECT districts (costa norte)
    DB-->>API: [{ubigeo, nombre, conteo, nivel, anios[]}]
    API-->>M: lista de distritos
    M-->>U: Choropleth (gris = sin registro ≠ sin riesgo)

    U->>M: Clic en su distrito
    M->>API: GET /api/districts/{ubigeo}
    API->>DB: SELECT detalle + checklist por nivel
    DB-->>API: histórico + checklist
    M->>API: GET /api/enfen
    API->>DB: ¿resumen cacheado?
    alt cache vacío
        API->>AI: resume este comunicado ENFEN
        AI-->>API: resumen (2-3 frases, real)
        API->>DB: guarda resumen (cache)
    end
    API-->>M: resumen ENFEN real
    M->>P: Abrir panel (memoria + presente yuxtapuestos)
    Note over M,U: Termina en memoria + riesgo + acción.<br/>IA = cierre real, no héroe. Disclaimer al pie.
```

---

## 4. Modelo de datos (PostgreSQL / Django ORM)

Modelos ORM persistidos en PostgreSQL (AWS RDS). El ETL los puebla; la API los sirve.

```mermaid
classDiagram
    class District {
        +string ubigeo
        +string nombre
        +string departamento
        +int conteo
        +string nivel
        +int[] anios
        +json geom
    }
    class Emergencia {
        +int anio
        +string fenomeno
        +string fuente
        +District district
    }
    class ChecklistItem {
        +string nivel
        +string accion
        +string fuente
    }
    class EnfenSummary {
        +string estado
        +string resumen
        +string fecha
        +string fuente_url
    }
    District "1" --> "*" Emergencia : histórico
    District "1" --> "*" ChecklistItem : checklist según nivel
```

### Endpoints (Django DRF — sobre el starter de `backend/api/`)

| Método | Ruta | Devuelve | Fuente |
|---|---|---|---|
| `GET` | `/api/districts` | Lista costa norte `{ubigeo, nombre, conteo, nivel, anios[]}` para el choropleth | BD |
| `GET` | `/api/districts/<ubigeo>` | Detalle: histórico + checklist por nivel (+ geometría si aplica) | BD |
| `GET` | `/api/enfen` | Resumen ENFEN real (Claude), cacheado en BD | BD + Claude |
| `GET` | `/health` | Liveness probe *(del starter)* | — |
| `GET` | `/api/items` | Mock del starter — **se reemplaza** | — |

> **Decisión:** geometría como **GeoJSON en un `JSONField`** de Postgres (sin PostGIS). El backend
> es la única fuente de verdad y sirve los polígonos por la API; el mapa los pinta y la geoloc (P4)
> resuelve el point-in-polygon en el front con **Turf.js** (`booleanPointInPolygon`) sobre esos mismos
> polígonos. PostGIS + geoloc server-side queda como upgrade de roadmap.

---

## 5. Despliegue

```mermaid
flowchart LR
    subgraph vercel["Vercel"]
        fe["Next.js 14<br/>frontend/"]
    end
    subgraph aws["AWS"]
        ec2["EC2 + Elastic IP (estática)<br/>Django + DRF · gunicorn config.wsgi"]
        rds[("RDS PostgreSQL")]
        ec2 -->|"DATABASE_URL (psycopg)"| rds
    end
    anthropic["Claude API<br/>(Anthropic)"]
    dev(["💻 Local<br/>:3000 ↔ :8000 ↔ Postgres"])

    fe -->|"HTTPS · NEXT_PUBLIC_API_BASE_URL → Elastic IP"| ec2
    ec2 -.->|"ANTHROPIC_API_KEY"| anthropic
    dev -.->|"git push → deploy"| vercel
    dev -.->|"deploy (EC2)"| ec2
```

- **Frontend:** Vercel (URL pública automática). Var `NEXT_PUBLIC_API_BASE_URL` → Elastic IP del EC2.
- **Backend:** **EC2 con Elastic IP (estática)** dentro de AWS, junto a RDS. `gunicorn config.wsgi`
  detrás de Nginx, setear `ALLOWED_HOSTS` (Elastic IP/dominio), `CORS_ORIGINS`, `SECRET_KEY`, `DEBUG=False`.
- **Base de datos:** **PostgreSQL en AWS RDS**. El ETL corre como management command para poblarla.
- **IA:** `ANTHROPIC_API_KEY` en el backend; la llamada a Claude vive en el servidor, nunca en el front.
- **Plan-B de infra:** si RDS se complica en tiempo, la misma app corre contra Postgres local
  (o SQLite) sin cambiar código — solo la cadena de conexión (Principio VIII: capas limpias).

---

## 6. Alcance y orden de degradación (si el tiempo aprieta)

Decisión de equipo: **real pero con plan de recorte** — BD real + IA real, y si el tiempo aprieta se
recorta por prioridad, **nunca** se mete data fake.

- **In-scope hoy (las 4 historias):** P1 mapa de memoria (clímax) · P2 acción (nivel + checklist
  INDECI) · P3 resumen ENFEN real (Claude) · P4 geoloc (botón 2º, Turf.js en el front).
- **Orden de recorte si falta tiempo:** primero **P4 geoloc**; luego degradar **P3** a un resumen
  ENFEN ya generado/cacheado (sigue siendo salida real del modelo, no fake). **P1 y P2 son intocables**
  — son la pantalla. El clímax (clic en distrito) nunca se recorta.

---

## Decisiones de diseño que la arquitectura respeta

- **Integración real, datos reales (Ppio. II):** BD PostgreSQL/RDS + llamada real a Claude; nada hardcodeado ni fake en la demo.
- **Escalabilidad y mantenibilidad (Ppio. VIII):** toda la info vive en el backend/BD, no en el front; capas limpias (modelos · serializers · vistas); un MVP que escala a Nacional sin reescribir.
- **Agencia, no amenaza (Ppio. I):** toda respuesta termina en *memoria + nivel + acción*; nunca diagnóstico binario.
- **Sin fórmula combinada de riesgo:** memoria histórica y estado ENFEN se muestran **yuxtapuestos**.
- **Sin verde engañoso:** distritos sin registro van en **gris explícito** ("no significa sin riesgo").
- **Susceptibilidad ≠ registro:** mostramos lo que ocurrió, no predicción.
- **Mobile-first (Ppio. VII):** la app se consume en celular; responsive desde el inicio.
