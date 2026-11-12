import { Injectable } from '@nestjs/common';

@Injectable()
export class WebDashboardSpaService {
  public renderHtml(): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AgroSat AI — Teledetección GIS, Telemetría IoT y Agrónomo Virtual para Sandía</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    :root {
      --bg-dark: #0b1512;
      --bg-card: #12221d;
      --bg-card-alt: #182e27;
      --border: #25463b;
      --accent-green: #2ecc71;
      --accent-watermelon: #ff5252;
      --accent-amber: #ffa726;
      --accent-cyan: #26c6da;
      --text-main: #ecfdf5;
      --text-muted: #94b8ab;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: var(--bg-dark);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: linear-gradient(90deg, #0e221b 0%, #17362b 100%);
      border-bottom: 1px solid var(--border);
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #2ecc71, #ff5252);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      box-shadow: 0 4px 12px rgba(46,204,113,0.3);
    }
    .brand h1 { font-size: 18px; font-weight: 700; letter-spacing: 0.3px; }
    .brand p { font-size: 12px; color: var(--text-muted); }
    .header-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    select, input, button, textarea {
      font-family: inherit;
      font-size: 13px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg-card-alt);
      color: var(--text-main);
      padding: 8px 12px;
      outline: none;
    }
    button {
      cursor: pointer;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    button:hover { filter: brightness(1.12); transform: translateY(-1px); }
    .btn-green { background: #1b5e20; border-color: #2ecc71; color: #fff; }
    .btn-Frost { background: #0d47a1; border-color: #42a5f5; color: #fff; }
    .btn-Heat { background: #b71c1c; border-color: #ff5252; color: #fff; }
    .btn-Ndvi { background: #e65100; border-color: #ffa726; color: #fff; }
    .status-pill {
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(46,204,113,0.15);
      border: 1px solid var(--accent-green);
      color: var(--accent-green);
      font-weight: 600;
    }
    .main-grid {
      display: grid;
      grid-template-columns: 1.35fr 1fr;
      gap: 14px;
      padding: 14px;
      flex: 1;
    }
    @media (max-width: 1100px) {
      .main-grid { grid-template-columns: 1fr; }
    }
    .col-stack {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.28);
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      gap: 8px;
      flex-wrap: wrap;
    }
    .card-title {
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 7px;
      color: #a7f3d0;
    }
    #agroMap {
      width: 100%;
      height: 430px;
      border-radius: 10px;
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .map-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .legend {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
    }
    .swatch {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      display: inline-block;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
      gap: 10px;
    }
    .kpi-box {
      background: var(--bg-card-alt);
      border: 1px solid var(--border);
      border-radius: 9px;
      padding: 10px;
    }
    .kpi-label { font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
    .kpi-val { font-size: 18px; font-weight: 700; }
    .kpi-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
    .chaos-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
      gap: 8px;
    }
    .chat-box {
      height: 270px;
      overflow-y: auto;
      background: #0c1814;
      border: 1px solid var(--border);
      border-radius: 9px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 13px;
      line-height: 1.45;
    }
    .msg {
      padding: 10px 12px;
      border-radius: 9px;
      max-width: 94%;
    }
    .msg-user {
      align-self: flex-end;
      background: #1b4d3e;
      border: 1px solid #2ecc71;
    }
    .msg-ai {
      align-self: flex-start;
      background: var(--bg-card-alt);
      border: 1px solid var(--border);
      white-space: pre-wrap;
    }
    .chip-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin: 8px 0;
    }
    .chip {
      font-size: 11px;
      padding: 5px 9px;
      background: #173329;
      border: 1px solid #2b5b49;
      border-radius: 999px;
      cursor: pointer;
      color: #a7f3d0;
    }
    .chip:hover { background: #214d3e; }
    .badge-chunk {
      display: inline-block;
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(38,198,218,0.16);
      border: 1px solid var(--accent-cyan);
      color: var(--accent-cyan);
      margin-right: 5px;
      margin-top: 5px;
    }
    .alert-list {
      max-height: 210px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .alert-item {
      background: rgba(255, 82, 82, 0.1);
      border-left: 4px solid var(--accent-watermelon);
      border-radius: 6px;
      padding: 9px 11px;
      font-size: 12px;
    }
    .alert-item h4 { font-size: 13px; color: #ff8a80; margin-bottom: 3px; }
    .chart-wrap { height: 175px; position: relative; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-logo">🍉</div>
      <div>
        <h1>AgroSat AI — Centro de Control Agronómico y Satelital</h1>
        <p>PostGIS ST_SquareGrid • Telemetría Node-RED • Alertas n8n/Telegram • RAG pgvector 384d + DeepSeek</p>
      </div>
    </div>
    <div class="header-controls">
      <span id="healthBadge" class="status-pill">Conectando Ecosistema...</span>
      <select id="parcelSelect" onchange="onParcelChange()"></select>
      <button class="btn-green" onclick="toggleDrawParcelMode()" id="btnDrawMode">✏️ Trazar Nueva Parcela</button>
      <button onclick="refreshAll()">🔄 Actualizar</button>
    </div>
  </header>

  <main class="main-grid">
    <!-- COLUMNA IZQUIERDA: MAPA GIS POSTGIS + SIMULADOR CHAOS + ZONIFICACIÓN MS2 -->
    <div class="col-stack">
      <section class="card">
        <div class="card-header">
          <div class="card-title">🛰️ Mapa Multiespectral PostGIS (ST_SquareGrid NDVI/EVI — Sentinel-2 Simulado)</div>
          <div style="display:flex; gap:8px; align-items:center;">
            <select id="sceneSelect" onchange="onSceneSelectChange()"></select>
            <button class="btn-green" onclick="simulateNormalSatellitePass()">+ Nueva Pasada</button>
          </div>
        </div>
        <div id="agroMap"></div>
        <div class="map-toolbar">
          <div class="legend">
            <span class="legend-item"><i class="swatch" style="background:#1B5E20"></i>Óptimo (&gt;0.70)</span>
            <span class="legend-item"><i class="swatch" style="background:#689F38"></i>Vigor Bueno (0.50-0.70)</span>
            <span class="legend-item"><i class="swatch" style="background:#FBC02D"></i>Moderado (0.35-0.50)</span>
            <span class="legend-item"><i class="swatch" style="background:#F57C00"></i>Estrés Bajo (0.22-0.35)</span>
            <span class="legend-item"><i class="swatch" style="background:#D32F2F"></i>Crítico (&lt;0.22)</span>
          </div>
          <div>
            Opacidad NDVI:
            <input type="range" id="opacitySlider" min="0.15" max="0.95" step="0.05" value="0.72" oninput="updateGridOpacity(this.value)" style="width:90px; vertical-align:middle;" />
          </div>
        </div>
        <div id="drawHelpBar" style="display:none; margin-top:10px; padding:10px; background:#19382d; border:1px dashed #2ecc71; border-radius:8px; font-size:12px;">
          <strong>Modo Trazado PostGIS activo:</strong> Haz clic en al menos 3 vértices sobre el mapa satelital para delimitar el lote de sandía.
          <span id="drawVerticesCount">0 vértices</span>
          <input type="text" id="newParcelName" placeholder="Nombre (ej. Lote Sandía Este)" value="Parcela Sandía Lote Este" style="margin-left:8px;" />
          <button class="btn-green" onclick="submitDrawnParcel()">💾 Guardar Polígono en PostGIS</button>
          <button onclick="cancelDrawParcel()">Cancelar</button>
        </div>
      </section>

      <!-- MÓDULO 5: PANEL INTERACTIVO DE SIMULACIÓN DEMO EN VIVO -->
      <section class="card">
        <div class="card-header">
          <div class="card-title">⚡ Módulo 5: Panel de Simulación Demo en Vivo (Chaos Agronómico End-to-End)</div>
          <span id="chaosStatus" style="font-size:12px; color:var(--accent-amber);">Listo para disparar eventos</span>
        </div>
        <div class="chaos-bar">
          <button class="btn-Frost" onclick="triggerChaos('FROST')">❄️ Simular Helada Crítica (1.9 °C)</button>
          <button class="btn-Heat" onclick="triggerChaos('HEAT_DROUGHT')">🔥💧 Golpe Calor (41.2°C) + Sequía (17.8%)</button>
          <button class="btn-Ndvi" onclick="triggerChaos('NDVI_PLAGUE_DROP')">🛰️🥀 Caída Brusca NDVI (Fusarium / Cintilla)</button>
        </div>
      </section>

      <!-- MÓDULO 1 Y 2: APTITUD EDÁFICA (MS2) + CURVA FENOLÓGICA (MS1) -->
      <section class="card">
        <div class="card-header">
          <div class="card-title">🌱 Módulo 1 y 2: Aptitud Edáfica de Sandía (MS2) y Evolución Fenológica NDVI (MS1)</div>
          <span id="suitabilityBadge" class="status-pill">--</span>
        </div>
        <div class="kpi-grid" id="soilKpiGrid"></div>
        <div class="chart-wrap" style="margin-top:12px;">
          <canvas id="ndviChart"></canvas>
        </div>
      </section>
    </div>

    <!-- COLUMNA DERECHA: AGRÓNOMO VIRTUAL RAG (MS4) + TELEMETRÍA IoT (MS3) + ALERTAS (MS5) -->
    <div class="col-stack">
      <!-- MÓDULO 4: CHAT CON EL AGRÓNOMO VIRTUAL (MS4) -->
      <section class="card">
        <div class="card-header">
          <div class="card-title">🧠 Módulo 4: Agrónomo Virtual RAG (ONNX 384d + pgvector + DeepSeek)</div>
          <span id="ragModelBadge" style="font-size:11px; color:var(--accent-cyan);">VECTOR(384) HNSW</span>
        </div>
        <div class="chip-row">
          <span class="chip" onclick="askPreset('¿Cuánto y cómo debo regar hoy según la humedad a 20cm y 40cm y la etapa fenológica actual?')">💧 ¿Cuánto debo regar hoy?</span>
          <span class="chip" onclick="askPreset('Analiza la caída localizada de NDVI en mi parcela: ¿es falla de cintilla, Fusarium o Araña Roja?')">🛰️ Analizar caída de NDVI</span>
          <span class="chip" onclick="askPreset('¿Cómo prevengo la Necrosis Apical (Blossom-End Rot) con Calcio y Boro en floración y cuajado?')">🍉 Prevenir Necrosis Apical (Ca+B)</span>
          <span class="chip" onclick="askPreset('¿Qué protocolo de emergencia aplico ante helada (<4°C) o golpe de calor (>38°C)?')">🚨 Protocolo Helada / Calor</span>
        </div>
        <div class="chat-box" id="chatBox"></div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <input type="text" id="chatInput" placeholder="Escribe tu consulta técnica sobre riego, nutrición NPK/Ca/B, plagas o NDVI..." style="flex:1;" onkeydown="if(event.key==='Enter') sendChatQuestion()" />
          <button class="btn-green" onclick="sendChatQuestion()" id="btnSendChat">Preguntar a IA</button>
        </div>
      </section>

      <!-- MÓDULO 3: TELEMETRÍA CLIMÁTICA (MS3) Y ALERTAS CRÍTICAS + TELEGRAM (MS5) -->
      <section class="card">
        <div class="card-header">
          <div class="card-title">🌡️💧 Módulo 3: Telemetría IoT Node-RED (MS3) y Motor de Alertas Tempranas (MS5)</div>
          <span id="telemetryTimeBadge" style="font-size:11px; color:var(--text-muted);">--</span>
        </div>
        <div class="kpi-grid" id="telemetryKpiGrid"></div>
        <div class="chart-wrap" style="margin-top:10px;">
          <canvas id="telemetryChart"></canvas>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <div class="card-title">🚨 Historial de Alertas Críticas (PostgreSQL LISTEN/NOTIFY -> n8n -> Telegram)</div>
          <div style="display:flex; gap:6px; align-items:center;">
            <input type="text" id="telegramChatIdInput" placeholder="Telegram Chat ID" value="583920194" style="width:130px; padding:5px 8px; font-size:12px;" />
            <button class="btn-green" style="padding:5px 10px; font-size:12px;" onclick="linkTelegramChat()">📲 Vincular Telegram</button>
          </div>
        </div>
        <div class="alert-list" id="alertList"></div>
      </section>
    </div>
  </main>

  <script>
    let map, parcelLayerGroup, gridLayerGroup, drawLayerGroup;
    let currentParcelId = '00000000-0000-0000-0000-000000000001';
    let parcelsCache = [];
    let scenesCache = [];
    let gridOpacity = 0.72;
    let isDrawingMode = false;
    let drawnCoords = [];
    let ndviChartInstance = null;
    let telemetryChartInstance = null;

    function initMap() {
      map = L.map('agroMap', { center: [25.5420, -103.4138], zoom: 16 });
      const esriSat = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri — AgroSat AI PostGIS' }
      );
      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      });
      esriSat.addTo(map);
      L.control.layers({ 'Satélite Esri World Imagery': esriSat, 'Mapa OpenStreetMap': osm }).addTo(map);

      parcelLayerGroup = L.layerGroup().addTo(map);
      gridLayerGroup = L.layerGroup().addTo(map);
      drawLayerGroup = L.layerGroup().addTo(map);

      map.on('click', (e) => {
        if (!isDrawingMode) return;
        drawnCoords.push([Number(e.latlng.lng.toFixed(6)), Number(e.latlng.lat.toFixed(6))]);
        renderDrawPreview();
      });
    }

    async function loadHealth() {
      try {
        const res = await fetch('/api/v1/system/overview');
        const data = await res.json();
        const badge = document.getElementById('healthBadge');
        badge.textContent = data.status === 'ok'
          ? '✅ 5 Microservicios + PostGIS + pgvector Activos'
          : '⚠️ Estado Parcial: ' + data.status;
      } catch {
        document.getElementById('healthBadge').textContent = '⚠️ Verificando servicios...';
      }
    }

    async function loadParcels() {
      const res = await fetch('/api/v1/zoning/parcels');
      parcelsCache = await res.json();
      const sel = document.getElementById('parcelSelect');
      sel.innerHTML = parcelsCache.map(p =>
        \`<option value="\${p.parcelId}" \${p.parcelId === currentParcelId ? 'selected' : ''}>🍉 \${p.parcelName} (\${p.areaHectares} ha - \${p.watermelonVariety})</option>\`
      ).join('');
      if (parcelsCache.length && !parcelsCache.find(p => p.parcelId === currentParcelId)) {
        currentParcelId = parcelsCache[0].parcelId;
      }
      renderSelectedParcelInfo();
    }

    function renderSelectedParcelInfo() {
      const parcel = parcelsCache.find(p => p.parcelId === currentParcelId);
      if (!parcel) return;

      parcelLayerGroup.clearLayers();
      const geoLayer = L.geoJSON(parcel.boundaryGeoJson, {
        style: { color: '#00e676', weight: 3, fillOpacity: 0.05 }
      }).addTo(parcelLayerGroup);
      map.fitBounds(geoLayer.getBounds(), { padding: [24, 24] });

      const s = parcel.soilSuitability;
      if (s) {
        document.getElementById('suitabilityBadge').textContent =
          \`Viabilidad Sandía: \${s.viabilityScorePct}% (\${s.suitabilityCategory})\`;
        document.getElementById('soilKpiGrid').innerHTML = \`
          <div class="kpi-box"><div class="kpi-label">Superficie PostGIS</div><div class="kpi-val">\${parcel.areaHectares} ha</div><div class="kpi-sub">Perímetro: \${parcel.perimeterMeters} m</div></div>
          <div class="kpi-box"><div class="kpi-label">Textura Edáfica</div><div class="kpi-val" style="font-size:14px;">\${s.soilTexture}</div><div class="kpi-sub">Drenaje: \${s.drainageLevel}</div></div>
          <div class="kpi-box"><div class="kpi-label">pH del Suelo</div><div class="kpi-val">\${s.phLevel}</div><div class="kpi-sub">Óptimo: 6.0 - 6.8</div></div>
          <div class="kpi-box"><div class="kpi-label">Radiación Solar</div><div class="kpi-val">\${s.solarRadiationMjm2}</div><div class="kpi-sub">MJ/m²/día • Alt: \${s.altitudeMsnm}m</div></div>
        \`;
      }
    }

    async function loadSatelliteData() {
      const [tsRes, gridRes] = await Promise.all([
        fetch(\`/api/v1/satellite/parcels/\${currentParcelId}/timeseries\`),
        fetch(\`/api/v1/satellite/parcels/\${currentParcelId}/latest-grid\`)
      ]);
      const tsData = await tsRes.json();
      const gridData = await gridRes.json();

      scenesCache = tsData.series || [];
      const sceneSel = document.getElementById('sceneSelect');
      sceneSel.innerHTML = scenesCache.map((sc, idx) =>
        \`<option value="\${sc.sceneId}" \${idx === scenesCache.length - 1 ? 'selected' : ''}>Pasada DDS \${sc.daysAfterPlanting} (\${sc.phenologicalStage}) — NDVI \${sc.meanNdvi}</option>\`
      ).join('');

      renderSatelliteGrid(gridData);
      renderNdviChart(scenesCache);
    }

    function renderSatelliteGrid(gridData) {
      gridLayerGroup.clearLayers();
      if (!gridData || !gridData.gridGeoJson) return;

      L.geoJSON(gridData.gridGeoJson, {
        style: (feature) => ({
          color: feature.properties.isStressedCell ? '#ff1744' : '#1b5e20',
          weight: feature.properties.isStressedCell ? 1.5 : 0.4,
          fillColor: feature.properties.fillColorHex || '#2ecc71',
          fillOpacity: gridOpacity
        }),
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          layer.bindPopup(\`
            <div style="font-size:12px; color:#111;">
              <strong>Subcelda PostGIS (\${p.row}, \${p.col})</strong><br/>
              • <b>NDVI:</b> \${p.ndvi} | <b>EVI:</b> \${p.evi}<br/>
              • <b>Banda B04 (Rojo):</b> \${p.bandB04Red} | <b>B08 (NIR):</b> \${p.bandB08Nir}<br/>
              • <b>Nivel Vigor:</b> \${p.vigorLevel}<br/>
              • <b>Estrés Detectado:</b> \${p.isStressedCell ? '⚠️ SÍ' : '✅ NO'}
            </div>
          \`);
        }
      }).addTo(gridLayerGroup);
    }

    async function onSceneSelectChange() {
      const sceneId = document.getElementById('sceneSelect').value;
      if (!sceneId) return;
      const res = await fetch(\`/api/v1/satellite/scenes/\${sceneId}/grid\`);
      const data = await res.json();
      renderSatelliteGrid(data);
    }

    function updateGridOpacity(val) {
      gridOpacity = parseFloat(val);
      gridLayerGroup.eachLayer(l => {
        if (l.setStyle) l.setStyle({ fillOpacity: gridOpacity });
      });
    }

    function renderNdviChart(series) {
      const ctx = document.getElementById('ndviChart').getContext('2d');
      if (ndviChartInstance) ndviChartInstance.destroy();
      ndviChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: series.map(s => \`DDS \${s.daysAfterPlanting} (\${s.phenologicalStage})\`),
          datasets: [
            {
              label: 'NDVI Medio',
              data: series.map(s => s.meanNdvi),
              borderColor: '#2ecc71',
              backgroundColor: 'rgba(46,204,113,0.18)',
              fill: true,
              tension: 0.3
            },
            {
              label: 'NDVI Mínimo (Focos Estrés)',
              data: series.map(s => s.minNdvi),
              borderColor: '#ff5252',
              borderDash: [4, 4],
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#ecfdf5', font: { size: 11 } } } },
          scales: {
            x: { ticks: { color: '#94b8ab', font: { size: 10 } } },
            y: { min: 0, max: 1, ticks: { color: '#94b8ab', font: { size: 10 } } }
          }
        }
      });
    }

    async function loadTelemetryAndAlerts() {
      const [telRes, alertRes] = await Promise.all([
        fetch(\`/api/v1/telemetry/parcels/\${currentParcelId}/history?limit=24\`),
        fetch(\`/api/v1/alerts/parcels/\${currentParcelId}?limit=10\`)
      ]);
      const telData = await telRes.json();
      const alertsData = await alertRes.json();

      if (telData && telData.summary) {
        const c = telData.summary.current;
        const s24 = telData.summary.stats24h;
        document.getElementById('telemetryTimeBadge').textContent =
          'Última lectura: ' + new Date(c.recordedAt).toLocaleTimeString();

        const tempColor = c.ambientTempC < 4 ? '#42a5f5' : c.ambientTempC > 38 ? '#ff5252' : '#2ecc71';
        const moistColor = c.soilMoisture20cmPct < 25 ? '#ff5252' : '#26c6da';

        document.getElementById('telemetryKpiGrid').innerHTML = \`
          <div class="kpi-box"><div class="kpi-label">Temp. Ambiente</div><div class="kpi-val" style="color:\${tempColor}">\${c.ambientTempC} °C</div><div class="kpi-sub">24h: \${s24.tempMin}° / \${s24.tempMax}°C</div></div>
          <div class="kpi-box"><div class="kpi-label">Humedad Suelo 20cm</div><div class="kpi-val" style="color:\${moistColor}">\${c.soilMoisture20cmPct}%</div><div class="kpi-sub">Raíz Activa (Mín 25%)</div></div>
          <div class="kpi-box"><div class="kpi-label">Humedad Suelo 40cm</div><div class="kpi-val">\${c.soilMoisture40cmPct}%</div><div class="kpi-sub">Bulbo Profundo</div></div>
          <div class="kpi-box"><div class="kpi-label">Déficit VPD / Rad.</div><div class="kpi-val">\${c.vpdKpa} kPa</div><div class="kpi-sub">\${c.solarRadiationWm2} W/m²</div></div>
        \`;

        renderTelemetryChart((telData.readings || []).slice().reverse());
      }

      const listEl = document.getElementById('alertList');
      const alerts = Array.isArray(alertsData) ? alertsData : (alertsData.alerts || []);
      if (!alerts.length) {
        listEl.innerHTML = '<div style="font-size:12px; color:var(--text-muted);">Sin alertas críticas activas en este lote.</div>';
      } else {
        listEl.innerHTML = alerts.map(a => \`
          <div class="alert-item">
            <h4>\${a.title} <span style="float:right; font-size:10px; opacity:0.8;">\${new Date(a.triggeredAt).toLocaleTimeString()}</span></h4>
            <div>\${a.recommendedAction}</div>
            <div style="margin-top:4px; font-size:10px; color:#94b8ab;">Regla: <b>\${a.ruleCode}</b> • Severidad: <b>\${a.severity}</b> • Webhook n8n: <b>\${a.n8nWebhookStatus}</b></div>
          </div>
        \`).join('');
      }
    }

    function renderTelemetryChart(readings) {
      const ctx = document.getElementById('telemetryChart').getContext('2d');
      if (telemetryChartInstance) telemetryChartInstance.destroy();
      telemetryChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: readings.map(r => new Date(r.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
          datasets: [
            {
              label: 'Temp (°C)',
              data: readings.map(r => r.ambientTempC),
              borderColor: '#ffa726',
              tension: 0.3
            },
            {
              label: 'Humedad 20cm (%)',
              data: readings.map(r => r.soilMoisture20cmPct),
              borderColor: '#26c6da',
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#ecfdf5', font: { size: 11 } } } },
          scales: {
            x: { ticks: { color: '#94b8ab', font: { size: 10 } } },
            y: { ticks: { color: '#94b8ab', font: { size: 10 } } }
          }
        }
      });
    }

    async function loadChatHistory() {
      const box = document.getElementById('chatBox');
      try {
        const res = await fetch(\`/api/v1/agronomist/parcels/\${currentParcelId}/history?limit=6\`);
        const data = await res.json();
        const items = (data.consultations || []).slice().reverse();
        if (!items.length) {
          box.innerHTML = '<div class="msg msg-ai">👋 Hola, soy el <b>Agrónomo Virtual de AgroSat AI</b>. Consulto en tiempo real el NDVI satelital en PostGIS, la humedad a 20cm/40cm y los 8 manuales técnicos de sandía indexados en <code>pgvector (VECTOR 384)</code>. ¿Qué deseas evaluar hoy?</div>';
          return;
        }
        box.innerHTML = items.map(c => \`
          <div class="msg msg-user">\${c.question}</div>
          <div class="msg msg-ai">\${c.answer}<div>\${(c.retrievedChunks || []).map(ch => \`<span class="badge-chunk">📚 \${ch.documentCode} (\${Math.round((ch.similarityScore || 0)*100)}%)</span>\`).join('')}</div></div>
        \`).join('');
        box.scrollTop = box.scrollHeight;
      } catch {
        box.innerHTML = '<div class="msg msg-ai">Agrónomo Virtual listo para recibir consultas.</div>';
      }
    }

    function askPreset(text) {
      document.getElementById('chatInput').value = text;
      sendChatQuestion();
    }

    async function sendChatQuestion() {
      const input = document.getElementById('chatInput');
      const question = input.value.trim();
      if (!question) return;
      input.value = '';

      const box = document.getElementById('chatBox');
      box.innerHTML += \`<div class="msg msg-user">\${question}</div>\`;
      const loadingId = 'loading-' + Date.now();
      box.innerHTML += \`<div class="msg msg-ai" id="\${loadingId}">⏳ Vectorizando consulta en ONNX 384d, buscando en pgvector HNSW y consultando a DeepSeek...</div>\`;
      box.scrollTop = box.scrollHeight;

      try {
        const res = await fetch('/api/v1/agronomist/consult', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parcelId: currentParcelId, question, topK: 3 })
        });
        const data = await res.json();
        const badges = (data.retrievedChunks || [])
          .map(ch => \`<span class="badge-chunk">📚 \${ch.documentCode} (\${Math.round((ch.similarityScore || 0)*100)}%)</span>\`)
          .join('');
        const timing = data.metrics ? \`<div style="font-size:10px; color:#94b8ab; margin-top:6px;">⚡ ONNX 384d: \${data.metrics.embeddingTimeMs}ms • LLM (\${data.metrics.llmModel}): \${data.metrics.llmTimeMs}ms</div>\` : '';
        document.getElementById(loadingId).innerHTML = \`\${data.answerMarkdown || data.answer}<div>\${badges}</div>\${timing}\`;
        box.scrollTop = box.scrollHeight;
      } catch (e) {
        document.getElementById(loadingId).textContent = 'Error procesando la consulta RAG: ' + e.message;
      }
    }

    async function triggerChaos(scenario) {
      const statusEl = document.getElementById('chaosStatus');
      statusEl.textContent = '⏳ Disparando escenario ' + scenario + '...';
      try {
        const res = await fetch('/api/v1/simulation/trigger-chaos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parcelId: currentParcelId, scenario })
        });
        const data = await res.json();
        statusEl.textContent = '✅ ' + (data.description || 'Escenario ejecutado');
        await refreshAll();
      } catch (e) {
        statusEl.textContent = '❌ Error en simulación: ' + e.message;
      }
    }

    async function simulateNormalSatellitePass() {
      const nextDas = scenesCache.length ? (scenesCache[scenesCache.length - 1].daysAfterPlanting + 5) : 52;
      await fetch(\`/api/v1/satellite/parcels/\${currentParcelId}/simulate-pass\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysAfterPlanting: nextDas, injectStressPatch: false })
      });
      await loadSatelliteData();
    }

    function toggleDrawParcelMode() {
      isDrawingMode = !isDrawingMode;
      drawnCoords = [];
      drawLayerGroup.clearLayers();
      document.getElementById('drawHelpBar').style.display = isDrawingMode ? 'block' : 'none';
      document.getElementById('btnDrawMode').textContent = isDrawingMode ? '🛑 Salir de Modo Trazado' : '✏️ Trazar Nueva Parcela';
    }

    function cancelDrawParcel() {
      isDrawingMode = false;
      drawnCoords = [];
      drawLayerGroup.clearLayers();
      document.getElementById('drawHelpBar').style.display = 'none';
      document.getElementById('btnDrawMode').textContent = '✏️ Trazar Nueva Parcela';
    }

    function renderDrawPreview() {
      drawLayerGroup.clearLayers();
      document.getElementById('drawVerticesCount').textContent = drawnCoords.length + ' vértices';
      const latLngs = drawnCoords.map(c => [c[1], c[0]]);
      latLngs.forEach(ll => L.circleMarker(ll, { radius: 5, color: '#ffeb3b' }).addTo(drawLayerGroup));
      if (latLngs.length >= 2) {
        L.polygon(latLngs, { color: '#ffeb3b', dashArray: '4,4' }).addTo(drawLayerGroup);
      }
    }

    async function submitDrawnParcel() {
      if (drawnCoords.length < 3) {
        alert('Traza al menos 3 vértices en el mapa para cerrar el polígono.');
        return;
      }
      const ring = [...drawnCoords, drawnCoords[0]];
      const parcelName = document.getElementById('newParcelName').value || 'Nueva Parcela Sandía';
      const res = await fetch('/api/v1/zoning/parcels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: '00000000-0000-0000-0000-000000000010',
          parcelName,
          watermelonVariety: 'Crimson Sweet',
          boundaryGeoJson: { type: 'Polygon', coordinates: [ring] }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert('Error Topológico PostGIS: ' + (data.message || JSON.stringify(data)));
        return;
      }
      cancelDrawParcel();
      currentParcelId = data.parcelId;
      await fetch(\`/api/v1/satellite/parcels/\${currentParcelId}/simulate-pass\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysAfterPlanting: 35, injectStressPatch: false })
      });
      await refreshAll();
    }

    async function linkTelegramChat() {
      const chatId = document.getElementById('telegramChatIdInput').value.trim();
      if (!chatId) return;
      const res = await fetch('/api/v1/alerts/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: '00000000-0000-0000-0000-000000000010',
          fullName: 'Productor Demo AgroSat',
          telegramChatId: chatId,
          parcelId: currentParcelId,
          parcelAlias: 'Parcela Sandía Activa',
          cooldownMinutes: 15
        })
      });
      if (res.ok) {
        alert('✅ Chat ID de Telegram (' + chatId + ') vinculado exitosamente en MS5 para alertas críticas.');
      }
    }

    async function onParcelChange() {
      currentParcelId = document.getElementById('parcelSelect').value;
      renderSelectedParcelInfo();
      await Promise.all([loadSatelliteData(), loadTelemetryAndAlerts(), loadChatHistory()]);
    }

    async function refreshAll() {
      await loadHealth();
      await loadParcels();
      await Promise.all([loadSatelliteData(), loadTelemetryAndAlerts(), loadChatHistory()]);
    }

    window.addEventListener('DOMContentLoaded', () => {
      initMap();
      refreshAll();
    });
  </script>
</body>
</html>`;
  }
}
