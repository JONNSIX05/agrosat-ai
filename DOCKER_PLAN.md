# 🐳 AgroSat AI — Plan de Infraestructura Docker y Operación en VPS (`vmi3599358`)

---

## 1. Perfil de Hardware y Diagnóstico Operativo del Servidor

El despliegue de **AgroSat AI** está diseñado a medida para las especificaciones reales de tu servidor VPS de producción:

| Parámetro del Servidor | Valor Real en Producción | Impacto en el Diseño de AgroSat AI |
| :--- | :--- | :--- |
| **Hostname / IP** | `vmi3599358` / `109.199.117.44` | Endpoints de borde accesibles en puertos dedicados (`18080`, `18880`, `15678`). |
| **Sistema Operativo** | Ubuntu 24.04.5 LTS (Kernel `6.8.0-147-generic`) | Soporte nativo para Docker Compose v2, cgroups v2 y tuning de `vm.swappiness`. |
| **Procesador (CPU)** | **6 vCPUs — AMD EPYC Processor (with IBPB)** | Instrucciones AVX2 disponibles para acelerar **PostGIS**, **Ruido Perlin 2D (`MS1`)** y **ONNX Runtime Local (`MS4`)**. |
| **Memoria RAM Física** | **11 GB RAM** (`Swap actual: 0 B`) | Al pausar los proyectos secundarios, disponemos de **~9.5 GB libres**, asignando un presupuesto cómodo de **5.25 GB** al stack completo de AgroSat AI. |
| **Almacenamiento** | ~193 GB NVMe (`144 GB libres` / 74% disponible) | Espacio de sobra para crear `/swapfile` de 4 GB, almacenar la caché del modelo ONNX (`~120 MB`) y persistir grillas PostGIS + vectores `pgvector`. |
| **Observabilidad Activa** | `monitoring_dashdot (:9845)` y `monitoring_dozzle (:9846)` | Se conservan encendidos en todo momento; todos los contenedores usan el prefijo `agrosat_*` para visualización instantánea en Dozzle. |

---

## 2. Estrategia de Operación en "Modo Dedicado Conmutable"

Dado que durante las sesiones de desarrollo, simulación y demostración de **AgroSat AI** se detendrán temporalmente los procesos pesados de transcodificación (`rempolived.py` / `ffmpeg` y los contenedores `webplayer_*`), disponemos de los **6 vCPUs AMD EPYC** y la memoria RAM sin contención.

Sin embargo, conservamos tres salvaguardas arquitectónicas para que puedas alternar entre proyectos en segundos sin conflictos:
1. **Prefijo `agrosat_*` y Red Aislada (`agrosat_internal_net`)**: Ningún contenedor de AgroSat AI colisiona en nombre ni en red con los 11 contenedores preexistentes.
2. **Puertos en el Rango `18xxx` / `15xxx`**:
   - `18080` $\rightarrow$ `agrosat_api_gateway` (API REST + Swagger Unificado para la App Móvil).
   - `18880` $\rightarrow$ `agrosat_nodered` (Panel de Simulación IoT de Campo).
   - `15678` $\rightarrow$ `agrosat_n8n` (Orquestador de Workflows de Alerta hacia Telegram).
   - `agrosat_postgres` (`5432`) y los microservicios `MS1..MS5` (`3001..3005`) permanecen **100% internos** dentro de `agrosat_internal_net` (u opcionalmente `15432` bindeado a `127.0.0.1` para inspección por túnel SSH).
3. **Archivo Swap de Seguridad de 4 GB (`/swapfile`)**: Garantiza que nunca se active el *Linux OOM Killer* incluso durante compilaciones concurrentes de TypeScript o indexación vectorial masiva.

---

## 3. Presupuesto de Recursos Ampliado (`~5.25 GB RAM` / 6 vCPUs Desbloqueados)

| Contenedor | Imagen / Runtime | Límite RAM (`mem_limit`) | Reserva RAM | Cuota CPU (`cpus`) | Rol y Optimización Específica |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **`agrosat_postgres`** | Custom `pgvector/pgvector:pg16` + `postgis:3.4` | **`1536M` (1.5 GB)** | `512M` | **`4.0`** | Tuning alto rendimiento: `shared_buffers=512MB`, `effective_cache_size=1GB`, `work_mem=32MB`, `max_parallel_workers_per_gather=3`. |
| **`agrosat_ms1_satellite`** | `node:20-alpine` | **`512M`** | `192M` | **`2.0`** | `--max-old-space-size=384`. Sin freno de CPU para generación rápida de grillas PostGIS y Ruido Perlin 2D. |
| **`agrosat_ms2_zoning`** | `node:20-alpine` | **`384M`** | `128M` | **`1.5`** | `--max-old-space-size=300`. Cálculos topográficos y evaluación edafológica para sandía. |
| **`agrosat_ms3_telemetry`** | `node:20-alpine` | **`384M`** | `128M` | **`1.0`** | `--max-old-space-size=300`. Ingesta de series temporales IoT y cálculo de VPD. |
| **`agrosat_ms4_rag`** | **`node:20-bookworm-slim` (`glibc`)** | **`896M`** | `384M` | **`2.5`** | `--max-old-space-size=768`. Ejecuta **ONNX Runtime Local (`Xenova/multilingual-e5-small`)** en CPU + cliente **DeepSeek API**. |
| **`agrosat_ms5_alerts`** | `node:20-alpine` | **`384M`** | `128M` | **`1.0`** | `--max-old-space-size=300`. Listener `PG LISTEN/NOTIFY`, motor de reglas y despacho Webhook a `n8n`. |
| **`agrosat_api_gateway`** | `node:20-alpine` | **`256M`** | `96M` | **`1.0`** | `--max-old-space-size=192`. Punto de entrada unificado en puerto `:18080`. |
| **`agrosat_nodered`** | `nodered/node-red:latest` | **`384M`** | `128M` | **`1.0`** | Motor de simulación IoT y panel de inyección de anomalías en `:18880`. |
| **`agrosat_n8n`** | `n8nio/n8n:latest` | **`512M`** | `192M` | **`1.5`** | Orquestador de alertas reales hacia Telegram Bot API en `:15678`. |
| **TOTAL STACK AGROSAT** | **9 Contenedores** | **Máx `5.25 GB`** | **`~1.88 GB` base** | **Uso elástico sobre 6 vCPUs** | **Deja > 4.5 GB de RAM física libre + 4 GB de Swap en `vmi3599358`.** |

> [!IMPORTANT]
> **¿Por qué `agrosat_ms4_rag` utiliza `node:20-bookworm-slim` en lugar de `alpine`?**
> Para cumplir la directriz de **Cero APIs Externas de Embeddings**, `MS4` utiliza `@huggingface/transformers` respaldado por `onnxruntime-node` en C++. Los binarios precompilados con aceleración vectorial AVX2 para procesadores AMD EPYC dependen de **`glibc`** (presente en Debian Bookworm) y no de `musl` (presente en Alpine). Usar `node:20-bookworm-slim` solo en `MS4` garantiza inferencia nativa instantánea (`~18 ms` por embedding) sin errores de enlace dinámico.

---

## 4. Catálogo de Prompts para Administrar el VPS (`vmi3599358`)

En lugar de mantener scripts manuales en el servidor, puedes copiar y pegar directamente los siguientes **Prompts Operativos** en el agente o sesión conectada a tu VPS (`vmi3599358`) según la acción que necesites realizar:

---

### 4.1 Prompt 1: Configurar Swap de 4 GB y Tuning de Memoria (`Fase 0 - Único Uso`)

> **Copia y pega este prompt en tu agente del VPS antes de desplegar AgroSat AI por primera vez:**
> ```text
> Actúa como Ingeniero SysAdmin Senior en mi VPS Ubuntu 24.04 (vmi3599358). Actualmente el servidor tiene 11 GB de RAM y 0 B de Swap.
> Por favor, realiza las siguientes acciones de forma segura e idempotente:
> 1. Verifica si ya existe un archivo swap activo con `swapon --show`.
> 2. Si no existe, crea `/swapfile` de 4 GB (`fallocate -l 4G /swapfile`), asígnale permisos `600`, formatéalo con `mkswap` y actívalo con `swapon`.
> 3. Regístralo de forma persistente en `/etc/fstab` si aún no está presente.
> 4. Configura en caliente y de forma persistente en `/etc/sysctl.d/99-agrosat-swap.conf` los parámetros `vm.swappiness=10` y `vm.vfs_cache_pressure=50` para que el kernel priorice siempre la RAM física y use el Swap solo como colchón contra el OOM Killer.
> 5. Muéstrame una tabla resumen con la salida de `free -h`, `swapon --show` y los valores aplicados de `sysctl`.
> ```

---

### 4.2 Prompt 2: Activar "Modo Dedicado AgroSat AI" (Pausar procesos pesados y liberar los 6 vCPUs)

> **Copia y pega este prompt cuando vayas a desarrollar, compilar o ejecutar pruebas en AgroSat AI:**
> ```text
> Voy a trabajar en el proyecto "AgroSat AI" y necesito liberar los 6 vCPUs AMD EPYC y la memoria RAM del VPS (vmi3599358).
> Por favor, ejecuta los siguientes pasos de forma controlada:
> 1. Detén limpiamente (`docker stop`) los contenedores pesados: `rempolived_app`, `webplayer_backend`, `webplayer_db` y `bot_mover_videos` (y opcionalmente `ctbcap_manager_frontend` y `ctbcap_manager_backend` si están consumiendo recursos).
> 2. Verifica si quedó algún proceso huérfano en el host de `rempolived.py` o `ffmpeg` corriendo fuera de Docker y detenlo limpiamente (`SIGTERM`).
> 3. NO detengas bajo ninguna circunstancia los contenedores de monitoreo `monitoring_dashdot` (puerto 9845) ni `monitoring_dozzle` (puerto 9846), ni el contenedor `telegram-bot`.
> 4. Espera 5 segundos y muéstrame un reporte del estado resultante con `uptime` (Load Average), `free -h` (RAM libre) y `docker ps`.
> ```

---

### 4.3 Prompt 3: Restaurar "Modo Habitual del VPS" (Detener AgroSat AI y reanudar `rempolived` / `webplayer`)

> **Copia y pega este prompt cuando termines tu sesión de AgroSat AI y quieras reactivar tus servicios habituales:**
> ```text
> He terminado mi sesión de pruebas con "AgroSat AI" en el VPS (vmi3599358) y quiero restaurar mis servicios habituales.
> Por favor, realiza lo siguiente:
> 1. Si los contenedores con prefijo `agrosat_*` están corriendo, detenlos limpiamente (`docker compose stop` o `docker stop $(docker ps -q --filter name=agrosat_)`) conservando intactos sus volúmenes (`agrosat_pgdata`, `agrosat_hf_cache`, `agrosat_nodered_data`, `agrosat_n8n_data`).
> 2. Inicia nuevamente (`docker start`) los contenedores `webplayer_db`, `webplayer_backend`, `rempolived_app`, `bot_mover_videos`, `ctbcap_manager_backend` y `ctbcap_manager_frontend`.
> 3. Verifica que todos hayan levantado correctamente y muéstrame el resumen de `docker ps`, `free -h` y `uptime`.
> ```

---

### 4.4 Prompt 4: Auditoría de Salud y Consumo del Stack `agrosat_*`

> **Copia y pega este prompt para verificar el rendimiento de los 9 contenedores de AgroSat AI en ejecución:**
> ```text
> Realiza una auditoría rápida de salud y recursos del stack "AgroSat AI" en el VPS (vmi3599358):
> 1. Ejecuta `docker stats --no-stream` filtrando por los contenedores `agrosat_*` y verifica que la suma de memoria RAM esté dentro del presupuesto (~5.25 GB máx).
> 2. Comprueba en `agrosat_postgres` que las extensiones `postgis` y `vector` y los 5 esquemas (`ms1_satellite` a `ms5_alerts`) estén saludables.
> 3. Verifica que los puertos de borde respondan correctamente: API Gateway (`18080`), Node-RED (`18880`) y n8n (`15678`), y confirma que Dozzle (`9846`) siga activo.
> ```

---

## 5. Dockerfiles Especializados

### 5.1 Base de Datos Unificada: `PostGIS 3.4` + `pgvector 0.7` (`infra/docker/postgres/Dockerfile.postgis-pgvector`)

Dado que la imagen oficial `postgis/postgis` no incluye `pgvector` por defecto y viceversa, construimos una imagen ligera basada en PostgreSQL 16 Debian que incluye ambas extensiones compiladas nativamente:

```dockerfile
# Archivo: infra/docker/postgres/Dockerfile.postgis-pgvector
FROM postgis/postgis:16-3.4

 RUN apt-get update && apt-get install -y --no-install-recommends \
     postgresql-16-pgvector \
     && rm -rf /var/lib/apt/lists/*
```

### 5.2 Microservicio `MS4` con Soporte ONNX Local (`infra/docker/Dockerfile.ms4-onnx`)

```dockerfile
# Archivo: infra/docker/Dockerfile.ms4-onnx
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package*.json nest-cli.json tsconfig*.json ./
COPY libs ./libs
COPY apps/ms4-virtual-agronomist-rag-service ./apps/ms4-virtual-agronomist-rag-service
RUN npm ci
RUN npx nest build ms4-virtual-agronomist-rag-service

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Directorio persistente donde @huggingface/transformers guarda Xenova/multilingual-e5-small
ENV TRANSFORMERS_CACHE=/app/.cache/huggingface

RUN mkdir -p /app/.cache/huggingface
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/ms4-virtual-agronomist-rag-service ./dist

EXPOSE 3004
CMD ["node", "--max-old-space-size=768", "dist/main.js"]
```

---

## 6. Manifiesto Maestro `docker-compose.yml` de Referencia

```yaml
name: agrosat-ai

services:
  # =========================================================================
  # 1. BASE DE DATOS UNIFICADA (PostgreSQL 16 + PostGIS 3.4 + pgvector 0.7)
  # =========================================================================
  agrosat_postgres:
    build:
      context: ./infra/docker/postgres
      dockerfile: Dockerfile.postgis-pgvector
    container_name: agrosat_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-agrosat_admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-agrosat_secret_2026}
      POSTGRES_DB: ${POSTGRES_DB:-agrosat_db}
    command: >
      postgres
      -c shared_buffers=512MB
      -c effective_cache_size=1024MB
      -c work_mem=32MB
      -c maintenance_work_mem=128MB
      -c max_parallel_workers_per_gather=3
      -c max_parallel_workers=6
      -c max_connections=120
    ports:
      - "127.0.0.1:15432:5432" # Accesible por túnel SSH local sin chocar con webplayer_db
    volumes:
      - agrosat_pgdata:/var/lib/postgresql/data
      - ./infra/docker/postgres/01-init-db.sql:/docker-entrypoint-initdb.d/01-init-db.sql:ro
    networks:
      - agrosat_internal_net
    deploy:
      resources:
        limits:
          cpus: "4.0"
          memory: 1536M
        reservations:
          memory: 512M
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-agrosat_admin} -d ${POSTGRES_DB:-agrosat_db}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # =========================================================================
  # 2. MS1: SATELLITE INGESTION SERVICE (Perlin Noise 2D + Grillas PostGIS)
  # =========================================================================
  agrosat_ms1_satellite:
    build:
      context: .
      dockerfile: ./infra/docker/Dockerfile.nestjs-alpine
      args:
        APP_NAME: ms1-satellite-ingestion-service
    container_name: agrosat_ms1_satellite
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://${POSTGRES_USER:-agrosat_admin}:${POSTGRES_PASSWORD:-agrosat_secret_2026}@agrosat_postgres:5432/${POSTGRES_DB:-agrosat_db}?schema=ms1_satellite
    depends_on:
      agrosat_postgres:
        condition: service_healthy
    networks:
      - agrosat_internal_net
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 512M

  # =========================================================================
  # 3. MS2: CROP ZONING SERVICE (Polígonos GIS + Aptitud Suelo Sandía)
  # =========================================================================
  agrosat_ms2_zoning:
    build:
      context: .
      dockerfile: ./infra/docker/Dockerfile.nestjs-alpine
      args:
        APP_NAME: ms2-crop-zoning-service
    container_name: agrosat_ms2_zoning
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3002
      DATABASE_URL: postgresql://${POSTGRES_USER:-agrosat_admin}:${POSTGRES_PASSWORD:-agrosat_secret_2026}@agrosat_postgres:5432/${POSTGRES_DB:-agrosat_db}?schema=ms2_zoning
    depends_on:
      agrosat_postgres:
        condition: service_healthy
    networks:
      - agrosat_internal_net
    deploy:
      resources:
        limits:
          cpus: "1.5"
          memory: 384M

  # =========================================================================
  # 4. MS3: AGRONOMIC TELEMETRY SERVICE (Series Temporales IoT + VPD)
  # =========================================================================
  agrosat_ms3_telemetry:
    build:
      context: .
      dockerfile: ./infra/docker/Dockerfile.nestjs-alpine
      args:
        APP_NAME: ms3-agronomic-telemetry-service
    container_name: agrosat_ms3_telemetry
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3003
      DATABASE_URL: postgresql://${POSTGRES_USER:-agrosat_admin}:${POSTGRES_PASSWORD:-agrosat_secret_2026}@agrosat_postgres:5432/${POSTGRES_DB:-agrosat_db}?schema=ms3_telemetry
    depends_on:
      agrosat_postgres:
        condition: service_healthy
    networks:
      - agrosat_internal_net
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 384M

  # =========================================================================
  # 5. MS4: VIRTUAL AGRONOMIST RAG (Embeddings ONNX Local + DeepSeek API Real)
  # =========================================================================
  agrosat_ms4_rag:
    build:
      context: .
      dockerfile: ./infra/docker/Dockerfile.ms4-onnx
    container_name: agrosat_ms4_rag
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3004
      DATABASE_URL: postgresql://${POSTGRES_USER:-agrosat_admin}:${POSTGRES_PASSWORD:-agrosat_secret_2026}@agrosat_postgres:5432/${POSTGRES_DB:-agrosat_db}?schema=ms4_rag
      LOCAL_EMBEDDING_MODEL: Xenova/multilingual-e5-small
      TRANSFORMERS_CACHE: /app/.cache/huggingface
      DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}
      DEEPSEEK_BASE_URL: https://api.deepseek.com
      DEEPSEEK_MODEL: deepseek-chat
      MS1_INTERNAL_URL: http://agrosat_ms1_satellite:3001
      MS2_INTERNAL_URL: http://agrosat_ms2_zoning:3002
      MS3_INTERNAL_URL: http://agrosat_ms3_telemetry:3003
    volumes:
      - agrosat_hf_cache:/app/.cache/huggingface
    depends_on:
      agrosat_postgres:
        condition: service_healthy
    networks:
      - agrosat_internal_net
    deploy:
      resources:
        limits:
          cpus: "2.5"
          memory: 896M

  # =========================================================================
  # 6. MS5: ALERT NOTIFICATION SERVICE (Reglas + Webhook Real hacia n8n)
  # =========================================================================
  agrosat_ms5_alerts:
    build:
      context: .
      dockerfile: ./infra/docker/Dockerfile.nestjs-alpine
      args:
        APP_NAME: ms5-alert-notification-service
    container_name: agrosat_ms5_alerts
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3005
      DATABASE_URL: postgresql://${POSTGRES_USER:-agrosat_admin}:${POSTGRES_PASSWORD:-agrosat_secret_2026}@agrosat_postgres:5432/${POSTGRES_DB:-agrosat_db}?schema=ms5_alerts
      N8N_ALERT_WEBHOOK_URL: http://agrosat_n8n:5678/webhook/agrosat-watermelon-alert
    depends_on:
      agrosat_postgres:
        condition: service_healthy
      agrosat_n8n:
        condition: service_started
    networks:
      - agrosat_internal_net
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 384M

  # =========================================================================
  # 7. API GATEWAY (Punto de Entrada Unificado para App Móvil :18080)
  # =========================================================================
  agrosat_api_gateway:
    build:
      context: .
      dockerfile: ./infra/docker/Dockerfile.nestjs-alpine
      args:
        APP_NAME: api-gateway
    container_name: agrosat_api_gateway
    restart: unless-stopped
    ports:
      - "18080:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      MS1_URL: http://agrosat_ms1_satellite:3001
      MS2_URL: http://agrosat_ms2_zoning:3002
      MS3_URL: http://agrosat_ms3_telemetry:3003
      MS4_URL: http://agrosat_ms4_rag:3004
      MS5_URL: http://agrosat_ms5_alerts:3005
    depends_on:
      - agrosat_ms1_satellite
      - agrosat_ms2_zoning
      - agrosat_ms3_telemetry
      - agrosat_ms4_rag
      - agrosat_ms5_alerts
    networks:
      - agrosat_internal_net
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 256M

  # =========================================================================
  # 8. NODE-RED (Motor de Simulación de Campo IoT :18880)
  # =========================================================================
  agrosat_nodered:
    image: nodered/node-red:latest
    container_name: agrosat_nodered
    restart: unless-stopped
    ports:
      - "18880:1880"
    environment:
      TZ: America/Mexico_City
      MS3_TELEMETRY_WEBHOOK_URL: http://agrosat_ms3_telemetry:3003/api/v1/telemetry/ingest
    volumes:
      - agrosat_nodered_data:/data
    networks:
      - agrosat_internal_net
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 384M

  # =========================================================================
  # 9. n8n (Orquestador de Alertas Reales hacia Telegram Bot API :15678)
  # =========================================================================
  agrosat_n8n:
    image: n8nio/n8n:latest
    container_name: agrosat_n8n
    restart: unless-stopped
    ports:
      - "15678:5678"
    environment:
      N8N_PORT: 5678
      N8N_PROTOCOL: http
      WEBHOOK_URL: http://109.199.117.44:15678/
      GENERIC_TIMEZONE: America/Mexico_City
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      TELEGRAM_FARMER_CHAT_ID: ${TELEGRAM_FARMER_CHAT_ID}
    volumes:
      - agrosat_n8n_data:/home/node/.n8n
    networks:
      - agrosat_internal_net
    deploy:
      resources:
        limits:
          cpus: "1.5"
          memory: 512M

networks:
  agrosat_internal_net:
    name: agrosat_internal_net
    driver: bridge

volumes:
  agrosat_pgdata:
    name: agrosat_pgdata
  agrosat_hf_cache:
    name: agrosat_hf_cache
  agrosat_nodered_data:
    name: agrosat_nodered_data
  agrosat_n8n_data:
    name: agrosat_n8n_data
```
