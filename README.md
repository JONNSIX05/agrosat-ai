# 🍉 AgroSat AI — Teledetección y Monitoreo Agrícola Inteligente para Cultivos (Sandía)

Plataforma basada en **Microservicios (Monorepo NestJS + TypeScript)** diseñada bajo **Domain-Driven Design (DDD)** y **Arquitectura Hexagonal**, combinando **simulación sintética realista de entradas** (pasadas Sentinel-2 con Ruido Perlin 2D, perfiles edafológicos y telemetría IoT desde Node-RED) con **procesamiento e integraciones 100% reales** (`PostGIS 3.4`, `pgvector 0.7`, Embeddings ONNX locales con `Xenova/multilingual-e5-small`, razonamiento con `DeepSeek API` y alertas vía `n8n` + `Telegram Bot API`).

---

## 📚 Documentación de Arquitectura y Especificaciones Técnicas

- [**ARCHITECTURE.md**](./ARCHITECTURE.md) — Arquitectura General del Monorepo, Diagramas de Flujo Híbrido (Mermaid) y Modelo Entidad-Relación (`PostGIS` + `pgvector`).
- [**DOCKER_PLAN.md**](./DOCKER_PLAN.md) — Plan de Contenedores Docker, Presupuesto de Recursos para el VPS (`vmi3599358`) y Catálogo de Prompts Operativos.
- [**ROADMAP.md**](./ROADMAP.md) — Hoja de Ruta Incremental por Sprints (`Fase 0` a `Fase 5`).
- [**BACKEND_SPEC.md**](./BACKEND_SPEC.md) — Especificación DDD + Hexagonal de los 5 Microservicios (`MS1` a `MS5`), Esquemas SQL y Rutas del API Gateway (`:18080`).
- [**AI_AUTOMATION_SPEC.md**](./AI_AUTOMATION_SPEC.md) — Corpus Agronómico de Sandía para `pgvector`, Ingeniería de Prompts para DeepSeek, `nodered-flows.json` (`:18880`) y Workflows de `n8n` (`:15678`) + Telegram.
- [**FRONTEND_SPEC.md**](./FRONTEND_SPEC.md) — Especificación del Frontend Universal (iOS, Android y Web GIS Dashboard) con Expo Router y Abstracción Geoespacial `<AgroMap />`.

---

## 🚀 Estado de Avance por Fases

- [x] **Fase 0 (Sprint 0)**: Configuración del Monorepo NestJS, Librerías Compartidas (`@agrosat/shared-kernel`, `@agrosat/gis-contracts`, `@agrosat/service-contracts`), Base de Datos Unificada (`PostGIS 3.4` + `pgvector 0.7` con los 5 esquemas y semilla inicial) y Activos de Simulación (`Node-RED`, `n8n`, Corpus de Sandía).
- [ ] **Fase 1 (Sprint 1)**: Implementación de `MS2 (crop-zoning-service)` — Polígonos GIS en PostGIS y Aptitud Edafológica para Sandía.
- [ ] **Fase 2 (Sprint 2)**: Implementación de `MS1 (satellite-ingestion-service)` — Grillas Espaciales PostGIS e Índices NDVI/EVI con Ruido Perlin 2D.
- [ ] **Fase 3 (Sprint 3)**: Implementación de `MS3 (agronomic-telemetry-service)` y `MS5 (alert-notification-service)` — Integración con Node-RED, n8n y Telegram Bot API.
- [ ] **Fase 4 (Sprint 4)**: Implementación de `MS4 (virtual-agronomist-rag-service)` — Embeddings Locales ONNX (`VECTOR(384)`) + `pgvector` + API Oficial de DeepSeek.
- [ ] **Fase 5 (Sprint 5)**: Implementación de `API Gateway (:18080)` y Frontend Multiplataforma (Móvil + Web GIS).
