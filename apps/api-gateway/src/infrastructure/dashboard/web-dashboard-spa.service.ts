import { Injectable } from '@nestjs/common';

@Injectable()
export class WebDashboardSpaService {
  public renderHtml(): string {
    return `<!DOCTYPE html>
<html lang="es" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
  <title>AgroSat AI — Centro de Control Agronómico, GIS Satelital y Agrónomo Virtual para Sandía</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked@12.0.1/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.9/dist/purify.min.js"></script>
  <style>
    /* =========================================================================
       PALETA TEMÁTICA AGROSAT AI — CULTIVO DE SANDÍA, SUELO, AGUA Y SATÉLITE
       ========================================================================= */
    :root,
    [data-theme="dark"] {
      --bg-base: #07130f;
      --bg-surface: #0d1f18;
      --bg-elevated: #132c22;
      --bg-input: #0a1813;
      --bg-glass: rgba(13, 31, 24, 0.88);
      --border: #1e4435;
      --border-strong: #2c634d;
      --brand: #10b981;
      --brand-strong: #059669;
      --brand-soft: rgba(16, 185, 129, 0.14);
      --accent: #f43f5e;
      --accent-soft: rgba(244, 63, 94, 0.14);
      --soil: #f59e0b;
      --soil-soft: rgba(245, 158, 11, 0.14);
      --water: #06b6d4;
      --water-soft: rgba(6, 182, 212, 0.14);
      --sat: #a855f7;
      --sat-soft: rgba(168, 85, 247, 0.15);
      --frost: #38bdf8;
      --text-primary: #ecfdf5;
      --text-secondary: #99c2b3;
      --text-muted: #648c7e;
      --shadow-card: 0 10px 28px rgba(0, 0, 0, 0.36);
      --chart-grid: rgba(153, 194, 179, 0.12);
      --chart-tick: #99c2b3;
      --chat-bg: #081510;
      --ai-bubble-bg: #10261e;
      --user-bubble-bg: linear-gradient(135deg, #065f46 0%, #047857 100%);
      --header-grad: linear-gradient(90deg, #091913 0%, #112a20 55%, #163529 100%);
    }

    [data-theme="light"] {
      --bg-base: #f2f7f4;
      --bg-surface: #ffffff;
      --bg-elevated: #e9f3ec;
      --bg-input: #f8fbf9;
      --bg-glass: rgba(255, 255, 255, 0.92);
      --border: #c5ddd0;
      --border-strong: #80b9a3;
      --brand: #059669;
      --brand-strong: #047857;
      --brand-soft: rgba(5, 150, 105, 0.12);
      --accent: #e11d48;
      --accent-soft: rgba(225, 29, 72, 0.1);
      --soil: #d97706;
      --soil-soft: rgba(217, 119, 6, 0.12);
      --water: #0284c7;
      --water-soft: rgba(2, 132, 199, 0.12);
      --sat: #7c3aed;
      --sat-soft: rgba(124, 58, 237, 0.12);
      --frost: #0284c7;
      --text-primary: #091e16;
      --text-secondary: #2e5646;
      --text-muted: #597e6e;
      --shadow-card: 0 8px 22px rgba(9, 30, 22, 0.08);
      --chart-grid: rgba(46, 86, 70, 0.12);
      --chart-tick: #2e5646;
      --chat-bg: #f5faf7;
      --ai-bubble-bg: #ffffff;
      --user-bubble-bg: linear-gradient(135deg, #059669 0%, #047857 100%);
      --header-grad: linear-gradient(90deg, #ffffff 0%, #edf7f0 60%, #e3f2e8 100%);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg-base);
      color: var(--text-primary);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      transition: background 0.25s ease, color 0.25s ease;
    }

    /* =========================================================================
       HEADER PRINCIPAL Y CONTROLES GLOBALES
       ========================================================================= */
    header.top-header {
      background: var(--header-grad);
      border-bottom: 1px solid var(--border);
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 1050;
      backdrop-filter: blur(12px);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.32);
      flex-shrink: 0;
    }

    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.2px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .brand-tag {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      border: 1px solid var(--accent);
    }

    .brand-sub {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    select, input, button, textarea {
      font-family: inherit;
      font-size: 13px;
      border-radius: 9px;
      border: 1px solid var(--border);
      background: var(--bg-input);
      color: var(--text-primary);
      padding: 8px 12px;
      outline: none;
      transition: all 0.16s ease;
    }

    select:focus, input:focus, textarea:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px var(--brand-soft);
    }

    button {
      cursor: pointer;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: var(--bg-elevated);
      user-select: none;
    }

    button:hover:not(:disabled) {
      transform: translateY(-1px);
      filter: brightness(1.08);
      border-color: var(--brand);
    }

    button:active:not(:disabled) {
      transform: translateY(0);
    }

    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--brand) 0%, var(--brand-strong) 100%);
      border-color: var(--brand);
      color: #ffffff;
    }

    .btn-watermelon {
      background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
      border-color: #f43f5e;
      color: #ffffff;
    }

    .btn-theme {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      padding: 8px 12px;
      font-weight: 600;
    }

    .status-pill {
      font-size: 11px;
      padding: 5px 11px;
      border-radius: 999px;
      background: var(--brand-soft);
      border: 1px solid var(--brand);
      color: var(--brand);
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--brand);
      display: inline-block;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulseGlow 2s infinite;
    }

    @keyframes pulseGlow {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.65); }
      70% { box-shadow: 0 0 0 7px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    /* =========================================================================
       BARRA EJECUTIVA DE SALUD AGRONÓMICA (TOP KPI STRIP)
       ========================================================================= */
    .exec-ribbon {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      padding: 12px 16px 0 16px;
    }

    .exec-pill-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 13px;
      display: flex;
      align-items: center;
      gap: 11px;
      box-shadow: var(--shadow-card);
    }

    .exec-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 19px;
      flex-shrink: 0;
    }

    .exec-meta {
      min-width: 0;
      flex: 1;
    }

    .exec-label {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .exec-value {
      font-family: 'Outfit', sans-serif;
      font-size: 16px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .exec-sub {
      font-size: 11px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* =========================================================================
       GRID PRINCIPAL Y TARJETAS
       ========================================================================= */
    .main-grid {
      display: grid;
      grid-template-columns: 1.32fr 1fr;
      gap: 14px;
      padding: 14px 16px 28px 16px;
      flex: 1;
    }

    .col-stack {
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-width: 0;
    }

    .card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 15px;
      box-shadow: var(--shadow-card);
      transition: background 0.25s ease, border-color 0.25s ease;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 11px;
      gap: 10px;
      flex-wrap: wrap;
    }

    .card-title {
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
    }

    .card-subtitle {
      font-size: 11px;
      color: var(--text-secondary);
    }

    /* =========================================================================
       MAPA MULTIESPECTRAL POSTGIS Y TIMELINE DE PASADAS
       ========================================================================= */
    .scene-timeline-strip {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 8px;
      margin-bottom: 8px;
      scrollbar-width: thin;
    }

    .scene-pill {
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .scene-pill:hover {
      border-color: var(--brand);
      color: var(--text-primary);
    }

    .scene-pill.active {
      background: var(--brand-soft);
      border-color: var(--brand);
      color: var(--brand);
      font-weight: 700;
    }

    .scene-pill.stressed {
      border-color: var(--accent);
    }

    .scene-pill.stressed.active {
      background: var(--accent-soft);
      color: var(--accent);
    }

    #agroMap {
      width: 100%;
      height: 430px;
      border-radius: 12px;
      border: 1px solid var(--border);
      overflow: hidden;
      z-index: 1;
    }

    .map-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
      padding: 8px 10px;
      background: var(--bg-elevated);
      border-radius: 10px;
      border: 1px solid var(--border);
      font-size: 12px;
      color: var(--text-secondary);
    }

    .legend {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 500;
    }

    .swatch {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      display: inline-block;
      border: 1px solid rgba(255,255,255,0.2);
    }

    /* Inspector de Subcelda PostGIS */
    .subcell-inspector {
      margin-top: 10px;
      padding: 11px 13px;
      border-radius: 10px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 12px;
    }

    .subcell-metrics {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .mono-val {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }

    /* Barra de Trazado PostGIS */
    .draw-toolbar {
      display: none;
      margin-top: 10px;
      padding: 12px;
      background: var(--brand-soft);
      border: 1px dashed var(--brand);
      border-radius: 10px;
      font-size: 12px;
    }

    .draw-controls-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    /* =========================================================================
       MÓDULO 5: PANEL INTERACTIVO CHAOS Y STEPPER DE PROGRESO
       ========================================================================= */
    .chaos-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .btn-chaos {
      padding: 11px 12px;
      border-radius: 10px;
      font-size: 12.5px;
      font-weight: 700;
      text-align: left;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 3px;
      color: #ffffff;
      border: 1px solid rgba(255,255,255,0.18);
    }

    .btn-chaos small {
      font-size: 10.5px;
      font-weight: 500;
      opacity: 0.88;
    }

    .btn-frost { background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%); }
    .btn-heat  { background: linear-gradient(135deg, #be123c 0%, #e11d48 100%); }
    .btn-ndvi  { background: linear-gradient(135deg, #b45309 0%, #d97706 100%); }

    .chaos-stepper {
      display: none;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-top: 10px;
      padding: 9px;
      border-radius: 10px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
    }

    .chaos-step {
      font-size: 11px;
      padding: 6px 8px;
      border-radius: 7px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }

    .chaos-step.active {
      border-color: var(--soil);
      color: var(--soil);
      background: var(--soil-soft);
    }

    .chaos-step.done {
      border-color: var(--brand);
      color: var(--brand);
      background: var(--brand-soft);
    }

    /* =========================================================================
       KPIS Y GRÁFICAS (MS1, MS2, MS3)
       ========================================================================= */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 9px;
    }

    .kpi-box {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 11px;
    }

    .kpi-label {
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 3px;
      font-weight: 600;
    }

    .kpi-val {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 700;
    }

    .kpi-sub {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .chart-wrap {
      height: 185px;
      position: relative;
      margin-top: 12px;
    }

    /* =========================================================================
       MÓDULO 4: CHATBOT AGRÓNOMO VIRTUAL RAG (ONNX + PGVECTOR + DEEPSEEK)
       ========================================================================= */
    .rag-context-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      padding: 7px 10px;
      border-radius: 9px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      margin-bottom: 8px;
      font-size: 11px;
    }

    .rag-ctx-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 600;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      color: var(--text-secondary);
    }

    .rag-ctx-pill.ok {
      border-color: var(--brand);
      color: var(--brand);
    }

    .chip-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 9px;
    }

    .chip {
      font-size: 11.5px;
      padding: 5px 10px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 999px;
      cursor: pointer;
      color: var(--text-secondary);
      font-weight: 600;
      transition: all 0.15s ease;
    }

    .chip:hover {
      border-color: var(--brand);
      color: var(--brand);
      background: var(--brand-soft);
    }

    .chat-box {
      height: 360px;
      overflow-y: auto;
      background: var(--chat-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 13px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-size: 13px;
      line-height: 1.55;
    }

    .msg {
      padding: 11px 14px;
      border-radius: 12px;
      max-width: 95%;
      position: relative;
      word-wrap: break-word;
    }

    .msg-user {
      align-self: flex-end;
      background: var(--user-bubble-bg);
      color: #ffffff;
      border-bottom-right-radius: 3px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.22);
    }

    .msg-ai {
      align-self: flex-start;
      background: var(--ai-bubble-bg);
      border: 1px solid var(--border);
      border-bottom-left-radius: 3px;
      width: 100%;
    }

    /* Estilos ricos para el Markdown del Agrónomo Virtual */
    .md-content h3, .md-content h4 {
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: var(--brand);
      margin: 10px 0 5px 0;
      padding-bottom: 3px;
      border-bottom: 1px solid var(--border);
    }

    .md-content h3:first-child, .md-content h4:first-child {
      margin-top: 0;
    }

    .md-content p {
      margin: 6px 0;
    }

    .md-content ul, .md-content ol {
      margin: 6px 0 8px 18px;
    }

    .md-content li {
      margin-bottom: 4px;
    }

    .md-content strong {
      color: var(--text-primary);
      font-weight: 700;
    }

    .md-content code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      padding: 1px 5px;
      border-radius: 4px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      color: var(--water);
    }

    .citation-inline {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 1px 7px;
      border-radius: 5px;
      background: var(--sat-soft);
      border: 1px solid var(--sat);
      color: var(--sat);
      margin: 0 2px;
    }

    /* Acordeón de fuentes pgvector y barra de acciones del mensaje */
    .msg-footer {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px dashed var(--border);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .msg-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 11px;
      color: var(--text-muted);
    }

    .btn-copy-msg {
      padding: 3px 8px;
      font-size: 11px;
      border-radius: 6px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      color: var(--text-secondary);
    }

    details.rag-sources-drawer {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 11.5px;
    }

    details.rag-sources-drawer summary {
      cursor: pointer;
      font-weight: 600;
      color: var(--water);
      user-select: none;
    }

    .rag-chunk-card {
      margin-top: 7px;
      padding: 7px 9px;
      border-radius: 6px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
    }

    .similarity-bar-track {
      height: 5px;
      background: var(--border);
      border-radius: 99px;
      overflow: hidden;
      margin: 4px 0;
    }

    .similarity-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--water), var(--brand));
    }

    .chat-input-row {
      display: flex;
      gap: 8px;
      margin-top: 9px;
      align-items: stretch;
    }

    textarea#chatInput {
      flex: 1;
      resize: none;
      height: 44px;
      line-height: 1.35;
      padding: 10px 12px;
    }

    /* =========================================================================
       HISTORIAL DE ALERTAS CRÍTICAS (MS5)
       ========================================================================= */
    .alert-list {
      max-height: 230px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .alert-item {
      background: var(--accent-soft);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 9px;
      padding: 10px 12px;
      font-size: 12px;
    }

    .alert-item.frost-alert {
      background: rgba(56, 189, 248, 0.12);
      border-left-color: var(--frost);
    }

    .alert-item h4 {
      font-size: 13px;
      color: var(--text-primary);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .webhook-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
    }

    .webhook-ok {
      background: var(--brand-soft);
      color: var(--brand);
      border: 1px solid var(--brand);
    }

    /* =========================================================================
       TOAST NOTIFICATIONS Y NAVEGACIÓN MÓVIL INFERIOR
       ========================================================================= */
    #toastContainer {
      position: fixed;
      bottom: 22px;
      right: 22px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 360px;
    }

    .toast-item {
      background: var(--bg-surface);
      color: var(--text-primary);
      border: 1px solid var(--brand);
      border-left: 4px solid var(--brand);
      padding: 11px 14px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      font-size: 12.5px;
      font-weight: 500;
      animation: slideInRight 0.2s ease;
    }

    .toast-item.error {
      border-color: var(--accent);
      border-left-color: var(--accent);
    }

    @keyframes slideInRight {
      from { transform: translateX(30px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .mobile-bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--bg-glass);
      backdrop-filter: blur(14px);
      border-top: 1px solid var(--border);
      z-index: 1040;
      justify-content: space-around;
      padding: 6px 4px;
    }

    .mobile-nav-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 10.5px;
      font-weight: 600;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 5px 8px;
      border-radius: 8px;
    }

    .mobile-nav-btn span.nav-ico {
      font-size: 17px;
    }

    /* =========================================================================
       RESPONSIVE BREAKPOINTS (TABLET Y NAVEGADOR MÓVIL)
       ========================================================================= */
    @media (max-width: 1180px) {
      .exec-ribbon {
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      }
      .main-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      body {
        padding-bottom: 66px;
      }
      header.top-header {
        padding: 10px 12px;
      }
      .brand-title {
        font-size: 15px;
      }
      .brand-sub {
        display: none;
      }
      .header-controls {
        width: 100%;
        justify-content: space-between;
      }
      .header-controls select#parcelSelect {
        flex: 1;
        min-width: 160px;
      }
      .exec-ribbon {
        grid-template-columns: repeat(2, 1fr);
        padding: 10px 10px 0 10px;
        gap: 8px;
      }
      .main-grid {
        padding: 10px;
        gap: 12px;
      }
      #agroMap {
        height: 330px;
      }
      .chaos-bar {
        grid-template-columns: 1fr;
      }
      .chaos-stepper {
        grid-template-columns: 1fr 1fr;
      }
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .mobile-bottom-nav {
        display: flex;
      }
      #toastContainer {
        bottom: 74px;
        right: 12px;
        left: 12px;
        max-width: none;
      }
    }
  </style>
</head>
<body>
  <!-- HEADER GLOBAL -->
  <header class="top-header">
    <div class="brand">
      <div class="brand-logo" title="AgroSat AI — Citrullus lanatus">🍉</div>
      <div>
        <div class="brand-title">
          AgroSat AI
          <span class="brand-tag">Citrullus lanatus • GIS &amp; IA</span>
        </div>
        <p class="brand-sub">PostGIS ST_SquareGrid • Telemetría Node-RED • Alertas n8n/Telegram • Agrónomo Virtual ONNX 384d + DeepSeek</p>
      </div>
    </div>
    <div class="header-controls">
      <span id="healthBadge" class="status-pill"><i class="pulse-dot"></i> Conectando...</span>
      <select id="parcelSelect" onchange="onParcelChange()" aria-label="Seleccionar parcela"></select>
      <button class="btn-primary" onclick="toggleDrawParcelMode()" id="btnDrawMode" title="Delimitar nuevo lote de sandía en PostGIS">✏️ Trazar Parcela</button>
      <button onclick="refreshAll(false)" id="btnRefresh" title="Sincronizar telemetría, escenas y alertas">🔄 Actualizar</button>
      <button class="btn-theme" onclick="toggleTheme()" id="btnThemeToggle" title="Cambiar entre Modo Noche y Modo Día de Campo">☀️ Modo Día</button>
    </div>
  </header>

  <!-- CINTA EJECUTIVA DE SALUD DEL LOTE -->
  <section class="exec-ribbon" aria-label="Resumen ejecutivo de la parcela">
    <div class="exec-pill-card">
      <div class="exec-icon" style="background:var(--brand-soft); color:var(--brand);">🛰️</div>
      <div class="exec-meta">
        <div class="exec-label">Vigor Satelital (MS1)</div>
        <div class="exec-value" id="execNdviVal">--</div>
        <div class="exec-sub" id="execNdviSub">Cargando escena Sentinel-2...</div>
      </div>
    </div>
    <div class="exec-pill-card">
      <div class="exec-icon" style="background:var(--soil-soft); color:var(--soil);">🌱</div>
      <div class="exec-meta">
        <div class="exec-label">Aptitud Edáfica (MS2)</div>
        <div class="exec-value" id="execSoilVal">--</div>
        <div class="exec-sub" id="execSoilSub">Evaluando suelo PostGIS...</div>
      </div>
    </div>
    <div class="exec-pill-card">
      <div class="exec-icon" style="background:var(--accent-soft); color:var(--accent);">🌡️</div>
      <div class="exec-meta">
        <div class="exec-label">Clima &amp; VPD (MS3)</div>
        <div class="exec-value" id="execClimateVal">--</div>
        <div class="exec-sub" id="execClimateSub">Telemetría Node-RED...</div>
      </div>
    </div>
    <div class="exec-pill-card">
      <div class="exec-icon" style="background:var(--water-soft); color:var(--water);">💧</div>
      <div class="exec-meta">
        <div class="exec-label">Humedad Raíz 20 / 40cm</div>
        <div class="exec-value" id="execMoistureVal">--</div>
        <div class="exec-sub" id="execMoistureSub">Umbral crítico: &ge; 25%</div>
      </div>
    </div>
    <div class="exec-pill-card">
      <div class="exec-icon" style="background:var(--sat-soft); color:var(--sat);">🚨</div>
      <div class="exec-meta">
        <div class="exec-label">Alertas &amp; Bot Telegram</div>
        <div class="exec-value" id="execAlertVal">--</div>
        <div class="exec-sub" id="execAlertSub">@AgrosatAi_bot • ID 1074033728</div>
      </div>
    </div>
  </section>

  <!-- CONTENIDO PRINCIPAL -->
  <main class="main-grid">
    <!-- COLUMNA IZQUIERDA: MAPA GIS POSTGIS + SIMULADOR CHAOS + APTITUD EDÁFICA -->
    <div class="col-stack">
      <!-- MÓDULO 1 & 2: MAPA MULTIESPECTRAL -->
      <section class="card" id="secMap">
        <div class="card-header">
          <div>
            <div class="card-title">🛰️ Mapa Multiespectral PostGIS (ST_SquareGrid 168 Subceldas NDVI / EVI)</div>
            <div class="card-subtitle">Haz clic en cualquier subcelda de 18m×18m para inspeccionar bandas B02, B04, B08 y diagnosticar con IA</div>
          </div>
          <div style="display:flex; gap:7px; align-items:center; flex-wrap:wrap;">
            <select id="sceneSelect" onchange="onSceneSelectChange(this.value)" aria-label="Seleccionar pasada satelital"></select>
            <button onclick="centerOnCurrentParcel()" title="Centrar vista en el polígono de la parcela">🎯 Centrar</button>
            <button class="btn-primary" id="btnSimulatePass" onclick="simulateNormalSatellitePass()">+ Nueva Pasada</button>
          </div>
        </div>

        <!-- Píldoras de Línea de Tiempo Fenológica -->
        <div class="scene-timeline-strip" id="sceneTimelinePills"></div>

        <!-- Lienzo Leaflet GIS -->
        <div id="agroMap"></div>

        <!-- Leyenda Espectral + Control de Opacidad -->
        <div class="map-toolbar">
          <div class="legend">
            <span class="legend-item"><i class="swatch" style="background:#1B5E20"></i>Óptimo (&gt;0.70)</span>
            <span class="legend-item"><i class="swatch" style="background:#689F38"></i>Vigor Bueno (0.50–0.70)</span>
            <span class="legend-item"><i class="swatch" style="background:#FBC02D"></i>Moderado (0.35–0.50)</span>
            <span class="legend-item"><i class="swatch" style="background:#F57C00"></i>Estrés Bajo (0.22–0.35)</span>
            <span class="legend-item"><i class="swatch" style="background:#D32F2F"></i>Crítico (&lt;0.22)</span>
          </div>
          <div style="display:flex; align-items:center; gap:7px;">
            <span>Opacidad NDVI (<strong id="opacityValLabel">72%</strong>):</span>
            <input type="range" id="opacitySlider" min="0.15" max="0.95" step="0.05" value="0.72" oninput="updateGridOpacity(this.value)" style="width:95px; padding:0;" />
          </div>
        </div>

        <!-- Inspector de Subcelda Seleccionada -->
        <div class="subcell-inspector" id="subcellInspector">
          <div class="subcell-metrics" id="subcellInfoText">
            <span>🔎 <strong>Inspector Espectral PostGIS:</strong> Toca cualquier celda del mapa para ver sus bandas NIR/Red y nivel de estrés.</span>
          </div>
          <button class="btn-primary" id="btnAskSubcellAi" style="display:none; padding:5px 10px; font-size:11.5px;" onclick="askAiAboutSelectedSubcell()">🧠 Diagnosticar Subcelda con IA</button>
        </div>

        <!-- Barra Interactiva de Trazado de Polígonos PostGIS -->
        <div id="drawHelpBar" class="draw-toolbar">
          <div>
            <strong>✏️ Modo Trazado Topológico PostGIS (SRID 4326):</strong> Marca al menos 3 vértices sobre el mapa satelital para delimitar el nuevo lote.
            <span id="drawVerticesCount" class="status-pill" style="margin-left:6px;">0 vértices</span>
          </div>
          <div class="draw-controls-row">
            <input type="text" id="newParcelName" placeholder="Nombre del lote" value="Parcela Sandía Lote Este" style="min-width:175px;" />
            <select id="newParcelVariety" aria-label="Variedad de sandía">
              <option value="Crimson Sweet">🍉 Crimson Sweet (Ciclo 85 días)</option>
              <option value="Charleston Gray">🍉 Charleston Gray (Resistente Fusarium)</option>
              <option value="Jubilee">🍉 Jubilee (Fruto Alargado Grande)</option>
              <option value="Sugar Baby">🍉 Sugar Baby (Ciclo Precoz 75 días)</option>
              <option value="Sangria">🍉 Sangria (Híbrido Alto Brix)</option>
            </select>
            <button onclick="undoLastDrawVertex()" title="Eliminar el último vértice marcado">↩️ Deshacer punto</button>
            <button onclick="clearDrawVertices()" title="Reiniciar todos los puntos">🗑️ Limpiar</button>
            <button class="btn-primary" id="btnSaveParcel" onclick="submitDrawnParcel()">💾 Guardar Polígono en PostGIS</button>
            <button onclick="cancelDrawParcel()">Cancelar</button>
          </div>
        </div>
      </section>

      <!-- MÓDULO 5: PANEL INTERACTIVO DE SIMULACIÓN DEMO EN VIVO -->
      <section class="card" id="secChaos">
        <div class="card-header">
          <div>
            <div class="card-title">⚡ Módulo 5: Simulador Demo de Eventos Críticos End-to-End (Chaos Agronómico)</div>
            <div class="card-subtitle">Dispara anomalías físicas o satelitales en vivo hacia PostgreSQL LISTEN/NOTIFY &rarr; MS5 &rarr; n8n &rarr; Telegram</div>
          </div>
          <span id="chaosStatus" class="status-pill">Listo para simulación</span>
        </div>
        <div class="chaos-bar">
          <button class="btn-chaos btn-frost" id="btnChaosFrost" onclick="triggerChaos('FROST')">
            <span>❄️ Simular Helada Crítica (1.9 °C)</span>
            <small>Umbral &lt; 4.0 °C • Activa riego térmico anti-helada</small>
          </button>
          <button class="btn-chaos btn-heat" id="btnChaosHeat" onclick="triggerChaos('HEAT_DROUGHT')">
            <span>🔥💧 Golpe Calor (41.2°C) + Sequía (17.8%)</span>
            <small>Temp &gt; 38 °C y Humedad 20cm &lt; 25% • Pulso urgente</small>
          </button>
          <button class="btn-chaos btn-ndvi" id="btnChaosNdvi" onclick="triggerChaos('NDVI_PLAGUE_DROP')">
            <span>🛰️🥀 Caída Brusca NDVI (-0.39 puntos)</span>
            <small>Foco Fusarium / Falla de cintilla en sector NE</small>
          </button>
        </div>
        <div class="chaos-stepper" id="chaosStepper">
          <div class="chaos-step" id="cstep1">1️⃣ Inyección MS1/MS3</div>
          <div class="chaos-step" id="cstep2">2️⃣ Evento pg_notify</div>
          <div class="chaos-step" id="cstep3">3️⃣ Regla MS5 + DeepSeek</div>
          <div class="chaos-step" id="cstep4">4️⃣ Despacho Telegram</div>
        </div>
      </section>

      <!-- MÓDULO 1 Y 2: APTITUD EDÁFICA (MS2) + CURVA FENOLÓGICA (MS1) -->
      <section class="card" id="secSoil">
        <div class="card-header">
          <div>
            <div class="card-title">🌱 Módulo 1 y 2: Aptitud Edáfica de Sandía (MS2) y Curva Fenológica NDVI (MS1)</div>
            <div class="card-subtitle">Evaluación multicriterio de textura, pH, drenaje, altitud y evolución espectral por etapa DDS</div>
          </div>
          <span id="suitabilityBadge" class="status-pill">--</span>
        </div>
        <div class="kpi-grid" id="soilKpiGrid"></div>
        <div class="chart-wrap">
          <canvas id="ndviChart"></canvas>
        </div>
      </section>
    </div>

    <!-- COLUMNA DERECHA: AGRÓNOMO VIRTUAL RAG (MS4) + TELEMETRÍA IoT (MS3) + ALERTAS (MS5) -->
    <div class="col-stack">
      <!-- MÓDULO 4: CHAT CON EL AGRÓNOMO VIRTUAL (MS4) -->
      <section class="card" id="secChat">
        <div class="card-header">
          <div>
            <div class="card-title">🧠 Módulo 4: Agrónomo Virtual RAG (ONNX 384d + pgvector + DeepSeek)</div>
            <div class="card-subtitle">Diagnóstico contextualizado en vivo con métricas MS1 + MS2 + MS3 y manuales técnicos de sandía</div>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <span id="ragModelBadge" class="status-pill" style="font-size:10.5px;">VECTOR(384) HNSW</span>
            <button onclick="clearChatView()" style="padding:5px 9px; font-size:11px;" title="Limpiar mensajes en pantalla">🧹 Limpiar vista</button>
          </div>
        </div>

        <!-- Barra de Contexto Multi-Servicio Activo -->
        <div class="rag-context-bar" id="chatContextPills">
          <span style="font-weight:700; color:var(--text-primary);">Contexto IA en Vivo:</span>
          <span class="rag-ctx-pill ok" id="ctxPillMs1">🛰️ MS1 NDVI: --</span>
          <span class="rag-ctx-pill ok" id="ctxPillMs2">🌱 MS2 Suelo: --</span>
          <span class="rag-ctx-pill ok" id="ctxPillMs3">🌡️ MS3 Clima: --</span>
        </div>

        <!-- Preguntas Rápidas Sugeridas -->
        <div class="chip-row">
          <span class="chip" onclick="askPreset('¿Cuánto y cómo debo regar hoy según la humedad a 20cm y 40cm, el VPD y la etapa fenológica actual?')">💧 ¿Cuánto debo regar hoy?</span>
          <span class="chip" onclick="askPreset('Analiza el NDVI satelital actual y las celdas con estrés en mi parcela: ¿es falla de cintilla, Fusarium o Araña Roja?')">🛰️ Analizar vigor y caída de NDVI</span>
          <span class="chip" onclick="askPreset('¿Cómo prevengo la Necrosis Apical (Blossom-End Rot) con Calcio y Boro según el pH y textura de mi suelo?')">🍉 Prevenir Necrosis Apical (Ca+B)</span>
          <span class="chip" onclick="askPreset('¿Qué protocolo urgente aplico ante helada (<4°C) o golpe de calor (>38°C) con sequía radicular?')">🚨 Protocolo Helada / Golpe de Calor</span>
        </div>

        <!-- Historial de Conversación -->
        <div class="chat-box" id="chatBox"></div>

        <!-- Entrada de Consulta -->
        <div class="chat-input-row">
          <textarea
            id="chatInput"
            placeholder="Escribe tu consulta sobre riego por goteo, fertirriego NPK/Ca/B, plagas o NDVI... (Enter para enviar, Shift+Enter nueva línea)"
            onkeydown="handleChatKeydown(event)"
          ></textarea>
          <button class="btn-primary" onclick="sendChatQuestion()" id="btnSendChat" style="padding:0 16px;">Preguntar a IA 🧠</button>
        </div>
      </section>

      <!-- MÓDULO 3: TELEMETRÍA CLIMÁTICA (MS3) -->
      <section class="card" id="secTelemetry">
        <div class="card-header">
          <div>
            <div class="card-title">🌡️💧 Módulo 3: Telemetría Agroclimática IoT Node-RED (MS3)</div>
            <div class="card-subtitle">Monitoreo continuo de temperatura, humedad radicular a doble profundidad (20cm / 40cm) y VPD</div>
          </div>
          <span id="telemetryTimeBadge" class="status-pill" style="font-size:10.5px;">--</span>
        </div>
        <div class="kpi-grid" id="telemetryKpiGrid"></div>
        <div class="chart-wrap">
          <canvas id="telemetryChart"></canvas>
        </div>
      </section>

      <!-- MÓDULO 5 / MS5: HISTORIAL DE ALERTAS Y VINCULACIÓN TELEGRAM -->
      <section class="card" id="secAlerts">
        <div class="card-header">
          <div>
            <div class="card-title">🚨 Historial de Alertas Críticas (MS5 &rarr; n8n &rarr; Telegram Bot)</div>
            <div class="card-subtitle">Suscriptor activo: <strong>Juan Carlos Reyes (@JamesFranco05)</strong> vía <code>@AgrosatAi_bot</code></div>
          </div>
          <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
            <input type="text" id="telegramChatIdInput" placeholder="Telegram Chat ID" value="1074033728" style="width:125px; padding:6px 9px; font-size:12px;" />
            <button class="btn-primary" id="btnLinkTelegram" style="padding:6px 11px; font-size:12px;" onclick="linkTelegramChat()">📲 Vincular Telegram</button>
          </div>
        </div>
        <div class="alert-list" id="alertList"></div>
      </section>
    </div>
  </main>

  <!-- NAVEGACIÓN INFERIOR PARA NAVEGADOR MÓVIL (< 768px) -->
  <nav class="mobile-bottom-nav" aria-label="Navegación rápida móvil">
    <button class="mobile-nav-btn" onclick="scrollToSection('secMap')"><span class="nav-ico">🗺️</span>Mapa GIS</button>
    <button class="mobile-nav-btn" onclick="scrollToSection('secChaos')"><span class="nav-ico">⚡</span>Simulador</button>
    <button class="mobile-nav-btn" onclick="scrollToSection('secChat')"><span class="nav-ico">🧠</span>IA Agrónomo</button>
    <button class="mobile-nav-btn" onclick="scrollToSection('secTelemetry')"><span class="nav-ico">🌡️</span>Clima IoT</button>
    <button class="mobile-nav-btn" onclick="scrollToSection('secAlerts')"><span class="nav-ico">🚨</span>Alertas</button>
  </nav>

  <!-- CONTENEDOR DE TOASTS NO BLOQUEANTES -->
  <div id="toastContainer"></div>

  <script>
    // =========================================================================
    // ESTADO GLOBAL DEL DASHBOARD AGROSAT AI
    // =========================================================================
    let map, parcelLayerGroup, gridLayerGroup, drawLayerGroup;
    let currentParcelId = '00000000-0000-0000-0000-000000000001';
    let lastFittedParcelId = null;
    let parcelsCache = [];
    let scenesCache = [];
    let currentSceneId = null;
    let selectedSubcellProps = null;
    let gridOpacity = 0.72;
    let isDrawingMode = false;
    let drawnCoords = [];
    let ndviChartInstance = null;
    let telemetryChartInstance = null;
    let latestTelemetrySummary = null;
    let latestSceneSummary = null;
    const aiAnswersStore = {};

    // =========================================================================
    // 1. GESTIÓN DE TEMA CLARO / OSCURO CON PERSISTENCIA
    // =========================================================================
    function initTheme() {
      const saved = localStorage.getItem('agrosat_theme') || 'dark';
      applyTheme(saved);
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(
        next === 'light'
          ? '☀️ Modo Día de Campo activado (alto contraste solar)'
          : '🌙 Modo Noche de Campo activado',
        'info'
      );
    }

    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('agrosat_theme', theme);
      const btn = document.getElementById('btnThemeToggle');
      if (btn) {
        btn.innerHTML = theme === 'dark' ? '☀️ Modo Día' : '🌙 Modo Noche';
      }
      if (scenesCache.length) {
        renderNdviChart(scenesCache);
      }
      if (window._lastTelemetryReadings) {
        renderTelemetryChart(window._lastTelemetryReadings);
      }
    }

    function getChartThemeColors() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      return {
        text: isLight ? '#091e16' : '#ecfdf5',
        tick: isLight ? '#2e5646' : '#99c2b3',
        grid: isLight ? 'rgba(46, 86, 70, 0.13)' : 'rgba(153, 194, 179, 0.12)',
      };
    }

    // =========================================================================
    // 2. SISTEMA DE NOTIFICACIONES TOAST Y NAVEGACIÓN MÓVIL
    // =========================================================================
    function showToast(message, type = 'success') {
      const container = document.getElementById('toastContainer');
      if (!container) return;
      const el = document.createElement('div');
      el.className = 'toast-item' + (type === 'error' ? ' error' : '');
      el.innerHTML = message;
      container.appendChild(el);
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.25s ease';
        setTimeout(() => el.remove(), 260);
      }, 4200);
    }

    function scrollToSection(id) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // =========================================================================
    // 3. INICIALIZACIÓN DEL MAPA LEAFLET POSTGIS
    // =========================================================================
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
      L.control.layers({ '🛰️ Satélite Esri World Imagery': esriSat, '🗺️ OpenStreetMap': osm }).addTo(map);

      parcelLayerGroup = L.layerGroup().addTo(map);
      gridLayerGroup = L.layerGroup().addTo(map);
      drawLayerGroup = L.layerGroup().addTo(map);

      map.on('click', (e) => {
        if (!isDrawingMode) return;
        drawnCoords.push([Number(e.latlng.lng.toFixed(6)), Number(e.latlng.lat.toFixed(6))]);
        renderDrawPreview();
      });
    }

    function centerOnCurrentParcel() {
      const parcel = parcelsCache.find(p => p.parcelId === currentParcelId);
      if (!parcel || !parcel.boundaryGeoJson) return;
      const geoLayer = L.geoJSON(parcel.boundaryGeoJson);
      map.fitBounds(geoLayer.getBounds(), { padding: [24, 24] });
    }

    // =========================================================================
    // 4. SALUD DEL ECOSISTEMA Y CARGA DE PARCELAS (MS2)
    // =========================================================================
    async function loadHealth() {
      try {
        const res = await fetch('/api/v1/system/overview');
        const data = await res.json();
        const badge = document.getElementById('healthBadge');
        badge.innerHTML = data.status === 'ok'
          ? '<i class="pulse-dot"></i> 5 Microservicios + PostGIS + pgvector Activos'
          : '⚠️ Estado Parcial: ' + data.status;
      } catch {
        document.getElementById('healthBadge').textContent = '⚠️ Verificando servicios...';
      }
    }

    async function loadParcels(forceFitBounds = false) {
      const res = await fetch('/api/v1/zoning/parcels');
      const data = await res.json();
      parcelsCache = Array.isArray(data) ? data : (data.parcels || []);

      if (!parcelsCache.find(p => p.parcelId === currentParcelId)) {
        const defaultDemo = parcelsCache.find(p => p.parcelId === '00000000-0000-0000-0000-000000000001');
        currentParcelId = defaultDemo ? defaultDemo.parcelId : (parcelsCache[0]?.parcelId || currentParcelId);
      }

      const sel = document.getElementById('parcelSelect');
      sel.innerHTML = parcelsCache.map(p =>
        \`<option value="\${p.parcelId}" \${p.parcelId === currentParcelId ? 'selected' : ''}>🍉 \${p.parcelName} (\${p.areaHectares} ha • \${p.watermelonVariety})</option>\`
      ).join('');

      renderSelectedParcelInfo(forceFitBounds);
    }

    function renderSelectedParcelInfo(forceFitBounds = false) {
      const parcel = parcelsCache.find(p => p.parcelId === currentParcelId);
      if (!parcel) return;

      parcelLayerGroup.clearLayers();
      const geoLayer = L.geoJSON(parcel.boundaryGeoJson, {
        style: { color: '#10b981', weight: 3, fillOpacity: 0.04 }
      }).addTo(parcelLayerGroup);

      if (forceFitBounds || lastFittedParcelId !== currentParcelId) {
        map.fitBounds(geoLayer.getBounds(), { padding: [24, 24] });
        lastFittedParcelId = currentParcelId;
      }

      const s = parcel.soilSuitability;
      if (s) {
        document.getElementById('suitabilityBadge').textContent =
          \`Viabilidad Sandía: \${s.viabilityScorePct}% (\${s.suitabilityCategory})\`;
        document.getElementById('soilKpiGrid').innerHTML = \`
          <div class="kpi-box"><div class="kpi-label">Superficie PostGIS</div><div class="kpi-val">\${parcel.areaHectares} ha</div><div class="kpi-sub">Perímetro: \${parcel.perimeterMeters} m</div></div>
          <div class="kpi-box"><div class="kpi-label">Textura Edáfica</div><div class="kpi-val" style="font-size:14.5px; color:var(--soil);">\${s.soilTexture}</div><div class="kpi-sub">Drenaje: \${s.drainageLevel}</div></div>
          <div class="kpi-box"><div class="kpi-label">pH del Suelo</div><div class="kpi-val" style="color:var(--brand);">\${s.phLevel}</div><div class="kpi-sub">Óptimo sandía: 6.0–6.8</div></div>
          <div class="kpi-box"><div class="kpi-label">Radiación Solar</div><div class="kpi-val">\${s.solarRadiationMjm2}</div><div class="kpi-sub">MJ/m²/día • Alt: \${s.altitudeMsnm}m</div></div>
        \`;

        document.getElementById('execSoilVal').textContent = \`\${s.viabilityScorePct}% (\${s.suitabilityCategory})\`;
        document.getElementById('execSoilSub').textContent = \`\${s.soilTexture} • pH \${s.phLevel} • \${parcel.areaHectares} ha\`;
        document.getElementById('ctxPillMs2').textContent = \`🌱 MS2: \${s.soilTexture} • pH \${s.phLevel} (\${s.viabilityScorePct}%)\`;
      }
    }

    // =========================================================================
    // 5. DATOS SATELITALES SENTINEL-2, TIMELINE Y SUBCELDAS POSTGIS (MS1)
    // =========================================================================
    async function loadSatelliteData() {
      const [tsRes, gridRes] = await Promise.all([
        fetch(\`/api/v1/satellite/parcels/\${currentParcelId}/timeseries\`),
        fetch(\`/api/v1/satellite/parcels/\${currentParcelId}/latest-grid\`)
      ]);
      const tsData = await tsRes.json();
      const gridData = await gridRes.json();

      scenesCache = tsData.series || [];
      const latestScene = gridData?.scene || scenesCache[scenesCache.length - 1] || null;
      latestSceneSummary = latestScene;
      currentSceneId = latestScene?.sceneId || null;

      renderSceneSelectors();
      renderSatelliteGrid(gridData);
      renderNdviChart(scenesCache);
      updateSatelliteExecutiveBadges(latestScene);
    }

    function renderSceneSelectors() {
      const sceneSel = document.getElementById('sceneSelect');
      sceneSel.innerHTML = scenesCache.map((sc) =>
        \`<option value="\${sc.sceneId}" \${sc.sceneId === currentSceneId ? 'selected' : ''}>Pasada DDS \${sc.daysAfterPlanting} (\${sc.phenologicalStage}) — NDVI \${sc.meanNdvi}\${sc.hasStressPatch ? ' ⚠️' : ''}</option>\`
      ).join('');

      const pillsEl = document.getElementById('sceneTimelinePills');
      pillsEl.innerHTML = scenesCache.map((sc) => {
        const isActive = sc.sceneId === currentSceneId ? 'active' : '';
        const isStressed = sc.hasStressPatch ? 'stressed' : '';
        return \`<button type="button" class="scene-pill \${isActive} \${isStressed}" onclick="onSceneSelectChange('\${sc.sceneId}')">
          🛰️ DDS \${sc.daysAfterPlanting} • \${sc.phenologicalStage} • <b>NDVI \${sc.meanNdvi}</b>\${sc.hasStressPatch ? ' ⚠️' : ''}
        </button>\`;
      }).join('');
    }

    function updateSatelliteExecutiveBadges(scene) {
      if (!scene) return;
      document.getElementById('execNdviVal').textContent = \`NDVI \${scene.meanNdvi} • EVI \${scene.meanEvi}\`;
      document.getElementById('execNdviSub').textContent =
        \`DDS \${scene.daysAfterPlanting} (\${scene.phenologicalStage}) • Estrés: \${scene.stressedCellsPct}%\`;
      document.getElementById('ctxPillMs1').textContent =
        \`🛰️ MS1: NDVI \${scene.meanNdvi} (DDS \${scene.daysAfterPlanting} • \${scene.phenologicalStage})\`;
    }

    function renderSatelliteGrid(gridData) {
      gridLayerGroup.clearLayers();
      const geoJsonData = gridData?.featureCollection || gridData?.gridGeoJson || gridData;
      if (!geoJsonData || !geoJsonData.features) return;

      L.geoJSON(geoJsonData, {
        style: (feature) => ({
          color: feature.properties.isStressedCell ? '#f43f5e' : '#065f46',
          weight: feature.properties.isStressedCell ? 1.6 : 0.45,
          fillColor: feature.properties.fillColorHex || '#10b981',
          fillOpacity: gridOpacity
        }),
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          layer.bindPopup(\`
            <div style="font-size:12px; color:#091e16; line-height:1.45;">
              <strong>🛰️ Subcelda PostGIS (Fila \${p.row}, Col \${p.col})</strong><br/>
              • <b>NDVI:</b> \${p.ndvi} &nbsp;|&nbsp; <b>EVI:</b> \${p.evi}<br/>
              • <b>B02 (Azul):</b> \${p.bandB02Blue ?? '--'} &nbsp;|&nbsp; <b>B04 (Rojo):</b> \${p.bandB04Red} &nbsp;|&nbsp; <b>B08 (NIR):</b> \${p.bandB08Nir}<br/>
              • <b>Nivel Vigor:</b> \${p.vigorLevel}<br/>
              • <b>Estado:</b> \${p.isStressedCell ? '⚠️ Estrés Espectral Detectado' : '✅ Dosel Normal'}
            </div>
          \`);
          layer.on('click', () => {
            selectSubcellForInspection(p);
          });
        }
      }).addTo(gridLayerGroup);
    }

    function selectSubcellForInspection(p) {
      selectedSubcellProps = p;
      const infoEl = document.getElementById('subcellInfoText');
      const btnAi = document.getElementById('btnAskSubcellAi');
      const statusHtml = p.isStressedCell
        ? '<span style="color:var(--accent); font-weight:700;">⚠️ Celda con Estrés</span>'
        : '<span style="color:var(--brand); font-weight:700;">✅ Vigor Normal</span>';

      infoEl.innerHTML = \`
        <span>📍 <strong>Subcelda (\${p.row}, \${p.col})</strong></span>
        <span>NDVI: <strong class="mono-val">\${p.ndvi}</strong></span>
        <span>EVI: <strong class="mono-val">\${p.evi}</strong></span>
        <span>B04 Red: <span class="mono-val">\${p.bandB04Red}</span></span>
        <span>B08 NIR: <span class="mono-val">\${p.bandB08Nir}</span></span>
        <span>Vigor: <strong>\${p.vigorLevel}</strong> (\${statusHtml})</span>
      \`;
      btnAi.style.display = 'inline-flex';
    }

    function askAiAboutSelectedSubcell() {
      if (!selectedSubcellProps) return;
      const p = selectedSubcellProps;
      const q = \`En la subcelda PostGIS (fila \${p.row}, columna \${p.col}) de mi parcela de sandía observo un NDVI de \${p.ndvi}, EVI de \${p.evi}, reflectancia Roja B04 de \${p.bandB04Red} y NIR B08 de \${p.bandB08Nir} (vigor: \${p.vigorLevel}). ¿Qué diagnóstico y manejo focalizado me recomiendas para este sector?\`;
      scrollToSection('secChat');
      askPreset(q);
    }

    async function onSceneSelectChange(sceneId) {
      if (!sceneId) return;
      currentSceneId = sceneId;
      renderSceneSelectors();
      try {
        const res = await fetch(\`/api/v1/satellite/scenes/\${sceneId}/grid\`);
        if (!res.ok) throw new Error('Escena no disponible (' + res.status + ')');
        const data = await res.json();
        renderSatelliteGrid(data);
        if (data.scene) {
          updateSatelliteExecutiveBadges(data.scene);
          showToast(\`🛰️ Cargada pasada DDS \${data.scene.daysAfterPlanting} (\${data.scene.phenologicalStage}) — NDVI \${data.scene.meanNdvi}\`);
        }
      } catch (e) {
        showToast('❌ Error cargando escena satelital: ' + e.message, 'error');
      }
    }

    function updateGridOpacity(val) {
      gridOpacity = parseFloat(val);
      document.getElementById('opacityValLabel').textContent = Math.round(gridOpacity * 100) + '%';
      gridLayerGroup.eachLayer(l => {
        if (l.setStyle) l.setStyle({ fillOpacity: gridOpacity });
      });
    }

    function renderNdviChart(series) {
      const ctx = document.getElementById('ndviChart').getContext('2d');
      const colors = getChartThemeColors();
      if (ndviChartInstance) ndviChartInstance.destroy();
      ndviChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: series.map(s => \`DDS \${s.daysAfterPlanting} (\${s.phenologicalStage})\`),
          datasets: [
            {
              label: 'NDVI Medio del Lote',
              data: series.map(s => s.meanNdvi),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.16)',
              fill: true,
              tension: 0.32,
              pointRadius: 4
            },
            {
              label: 'NDVI Mínimo (Focos Estrés)',
              data: series.map(s => s.minNdvi),
              borderColor: '#f43f5e',
              borderDash: [5, 4],
              tension: 0.32,
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: colors.text, font: { size: 11, weight: '600' } } }
          },
          scales: {
            x: { grid: { color: colors.grid }, ticks: { color: colors.tick, font: { size: 10 } } },
            y: { min: 0, max: 1, grid: { color: colors.grid }, ticks: { color: colors.tick, font: { size: 10 } } }
          }
        }
      });
    }

    // =========================================================================
    // 6. TELEMETRÍA CLIMÁTICA (MS3) E HISTORIAL DE ALERTAS (MS5)
    // =========================================================================
    async function loadTelemetryAndAlerts() {
      const [telRes, alertRes] = await Promise.all([
        fetch(\`/api/v1/telemetry/parcels/\${currentParcelId}/history?limit=24\`),
        fetch(\`/api/v1/alerts/parcels/\${currentParcelId}?limit=12\`)
      ]);
      const telData = await telRes.json();
      const alertsData = await alertRes.json();

      if (telData && telData.summary) {
        const c = telData.summary.current;
        const s24 = telData.summary.stats24h;
        latestTelemetrySummary = telData.summary;

        document.getElementById('telemetryTimeBadge').textContent =
          '⏱️ Lectura: ' + new Date(c.recordedAt).toLocaleTimeString();

        const tempColor = c.ambientTempC < 4 ? 'var(--frost)' : c.ambientTempC > 38 ? 'var(--accent)' : 'var(--brand)';
        const moistColor = c.soilMoisture20cmPct < 25 ? 'var(--accent)' : 'var(--water)';

        document.getElementById('telemetryKpiGrid').innerHTML = \`
          <div class="kpi-box"><div class="kpi-label">Temp. Ambiente</div><div class="kpi-val" style="color:\${tempColor}">\${c.ambientTempC} °C</div><div class="kpi-sub">24h: \${s24.tempMin}° / \${s24.tempMax}°C</div></div>
          <div class="kpi-box"><div class="kpi-label">Humedad Suelo 20cm</div><div class="kpi-val" style="color:\${moistColor}">\${c.soilMoisture20cmPct}%</div><div class="kpi-sub">Raíz Activa (Mín 25%)</div></div>
          <div class="kpi-box"><div class="kpi-label">Humedad Suelo 40cm</div><div class="kpi-val" style="color:var(--water);">\${c.soilMoisture40cmPct}%</div><div class="kpi-sub">Reserva Profunda</div></div>
          <div class="kpi-box"><div class="kpi-label">Déficit VPD / Rad.</div><div class="kpi-val">\${c.vpdKpa} kPa</div><div class="kpi-sub">\${c.solarRadiationWm2} W/m² • HR \${c.relativeHumidityPct}%</div></div>
        \`;

        document.getElementById('execClimateVal').textContent = \`\${c.ambientTempC} °C • VPD \${c.vpdKpa} kPa\`;
        document.getElementById('execClimateSub').textContent = \`HR \${c.relativeHumidityPct}% • Rad \${c.solarRadiationWm2} W/m²\`;
        document.getElementById('execMoistureVal').textContent = \`20cm: \${c.soilMoisture20cmPct}% | 40cm: \${c.soilMoisture40cmPct}%\`;
        document.getElementById('execMoistureSub').textContent =
          c.soilMoisture20cmPct < 25 ? '⚠️ Déficit hídrico en raíz activa' : '✅ Bulbo húmedo en rango óptimo';
        document.getElementById('ctxPillMs3').textContent =
          \`🌡️ MS3: \${c.ambientTempC}°C • Hum 20cm: \${c.soilMoisture20cmPct}% • VPD \${c.vpdKpa} kPa\`;

        window._lastTelemetryReadings = (telData.readings || []).slice().reverse();
        renderTelemetryChart(window._lastTelemetryReadings);
      }

      const listEl = document.getElementById('alertList');
      const alerts = Array.isArray(alertsData) ? alertsData : (alertsData.alerts || []);
      document.getElementById('execAlertVal').textContent = \`\${alerts.length} alertas registradas\`;

      if (!alerts.length) {
        listEl.innerHTML = '<div style="font-size:12px; color:var(--text-muted); padding:10px;">✅ Sin alertas críticas activas en este lote.</div>';
      } else {
        listEl.innerHTML = alerts.map(a => {
          const isFrost = a.ruleCode === 'FROST_ALERT';
          const statusClass = a.n8nWebhookStatus === 'SENT_TO_N8N' ? 'webhook-ok' : '';
          return \`
            <div class="alert-item \${isFrost ? 'frost-alert' : ''}">
              <h4>
                <span>\${a.title}</span>
                <span style="font-size:10.5px; color:var(--text-secondary);">\${new Date(a.triggeredAt).toLocaleTimeString()}</span>
              </h4>
              <div style="color:var(--text-secondary); margin-bottom:5px;">\${a.recommendedAction}</div>
              <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; font-size:10.5px; color:var(--text-muted);">
                <span>Regla: <b>\${a.ruleCode}</b></span>
                <span>• Severidad: <b>\${a.severity}</b></span>
                <span class="webhook-badge \${statusClass}">📲 \${a.n8nWebhookStatus}</span>
              </div>
            </div>
          \`;
        }).join('');
      }
    }

    function renderTelemetryChart(readings) {
      const ctx = document.getElementById('telemetryChart').getContext('2d');
      const colors = getChartThemeColors();
      if (telemetryChartInstance) telemetryChartInstance.destroy();
      telemetryChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: readings.map(r => new Date(r.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
          datasets: [
            {
              label: 'Temp. Ambiente (°C)',
              data: readings.map(r => r.ambientTempC),
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              yAxisID: 'yTemp',
              tension: 0.3,
              pointRadius: 2.5
            },
            {
              label: 'Humedad 20cm (%)',
              data: readings.map(r => r.soilMoisture20cmPct),
              borderColor: '#06b6d4',
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              yAxisID: 'yMoist',
              tension: 0.3,
              pointRadius: 2.5
            },
            {
              label: 'Humedad 40cm (%)',
              data: readings.map(r => r.soilMoisture40cmPct),
              borderColor: '#10b981',
              borderDash: [4, 3],
              yAxisID: 'yMoist',
              tension: 0.3,
              pointRadius: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: colors.text, font: { size: 11, weight: '600' } } }
          },
          scales: {
            x: { grid: { color: colors.grid }, ticks: { color: colors.tick, font: { size: 10 } } },
            yTemp: {
              type: 'linear',
              position: 'left',
              grid: { color: colors.grid },
              ticks: { color: '#f59e0b', font: { size: 10 }, callback: v => v + '°C' }
            },
            yMoist: {
              type: 'linear',
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: { color: '#06b6d4', font: { size: 10 }, callback: v => v + '%' }
            }
          }
        }
      });
    }

    // =========================================================================
    // 7. AGRÓNOMO VIRTUAL RAG (MARKDOWN RICO, CITAS Y FUENTES PGVECTOR)
    // =========================================================================
    function formatAgronomistMarkdown(rawText) {
      if (!rawText) return '';
      let html = '';
      if (window.marked && typeof window.marked.parse === 'function') {
        html = window.marked.parse(rawText);
      } else {
        html = rawText
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
          .replace(/\\n/g, '<br/>');
      }
      if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
        html = window.DOMPurify.sanitize(html);
      }
      // Convertir citas [SANDIA-XXX-000] en insignias interactivas
      html = html.replace(
        /\\[(SANDIA-[A-Z0-9_-]+)\\]/g,
        '<span class="citation-inline" title="Manual técnico recuperado de pgvector">📚 $1</span>'
      );
      return html;
    }

    function buildAiMessageHtml(msgId, answerText, retrievedChunks, metrics) {
      aiAnswersStore[msgId] = answerText || '';
      const formattedHtml = formatAgronomistMarkdown(answerText);
      const chunks = retrievedChunks || [];

      const drawerHtml = chunks.length
        ? \`<details class="rag-sources-drawer">
            <summary>📚 Ver \${chunks.length} manuales técnicos recuperados en pgvector (Similitud Coseno HNSW)</summary>
            \${chunks.map(ch => {
              const pct = Math.round((ch.similarityScore || 0) * 100);
              return \`
                <div class="rag-chunk-card">
                  <div style="display:flex; justify-content:space-between; font-weight:700;">
                    <span>[\${ch.documentCode}] \${ch.title || ''}</span>
                    <span style="color:var(--brand);">\${pct}% similitud</span>
                  </div>
                  <div class="similarity-bar-track"><div class="similarity-bar-fill" style="width:\${pct}%"></div></div>
                  <div style="color:var(--text-secondary); font-size:11px;">\${ch.excerpt || ''}</div>
                </div>
              \`;
            }).join('')}
          </details>\`
        : '';

      const timingHtml = metrics
        ? \`<span>⚡ ONNX 384d: <b>\${metrics.embeddingTimeMs}ms</b> • LLM (<b>\${metrics.llmModel}</b>): <b>\${metrics.llmTimeMs}ms</b></span>\`
        : \`<span>🧠 Corpus Agronómico Sandía • VECTOR(384)</span>\`;

      return \`
        <div class="md-content">\${formattedHtml}</div>
        <div class="msg-footer">
          \${drawerHtml}
          <div class="msg-meta-row">
            \${timingHtml}
            <button type="button" class="btn-copy-msg" onclick="copyAiAnswer('\${msgId}')">📋 Copiar diagnóstico</button>
          </div>
        </div>
      \`;
    }

    async function copyAiAnswer(msgId) {
      const text = aiAnswersStore[msgId];
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast('📋 Diagnóstico agronómico copiado al portapapeles');
      } catch {
        showToast('No se pudo copiar automáticamente', 'error');
      }
    }

    function clearChatView() {
      const box = document.getElementById('chatBox');
      box.innerHTML = '<div class="msg msg-ai"><div class="md-content">👋 Vista de conversación limpia. Selecciona una pregunta rápida arriba o escribe tu consulta técnica sobre riego, nutrición o NDVI.</div></div>';
      showToast('🧹 Vista del chat limpiada');
    }

    async function loadChatHistory() {
      const box = document.getElementById('chatBox');
      try {
        const res = await fetch(\`/api/v1/agronomist/parcels/\${currentParcelId}/history?limit=6\`);
        const data = await res.json();
        const items = (data.consultations || []).slice().reverse();
        if (!items.length) {
          box.innerHTML = '<div class="msg msg-ai"><div class="md-content">👋 Hola, soy el <b>Agrónomo Virtual de AgroSat AI</b>. Analizo en tiempo real el <b>NDVI satelital (MS1)</b>, la <b>aptitud edáfica (MS2)</b>, la <b>humedad radicular a 20cm/40cm (MS3)</b> y los manuales técnicos indexados en <code>pgvector (VECTOR 384)</code>. ¿Qué deseas evaluar hoy?</div></div>';
          return;
        }
        box.innerHTML = items.map((c, idx) => {
          const msgId = 'hist-' + idx + '-' + Date.now();
          return \`
            <div class="msg msg-user">\${c.question}</div>
            <div class="msg msg-ai">\${buildAiMessageHtml(msgId, c.answer, c.retrievedChunks, null)}</div>
          \`;
        }).join('');
        box.scrollTop = box.scrollHeight;
      } catch {
        box.innerHTML = '<div class="msg msg-ai">Agrónomo Virtual listo para recibir consultas.</div>';
      }
    }

    function handleChatKeydown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatQuestion();
      }
    }

    function askPreset(text) {
      document.getElementById('chatInput').value = text;
      sendChatQuestion();
    }

    async function sendChatQuestion() {
      const input = document.getElementById('chatInput');
      const btn = document.getElementById('btnSendChat');
      const question = input.value.trim();
      if (!question || btn.disabled) return;
      input.value = '';
      btn.disabled = true;

      const box = document.getElementById('chatBox');
      box.innerHTML += \`<div class="msg msg-user">\${question}</div>\`;
      const loadingId = 'loading-' + Date.now();
      box.innerHTML += \`
        <div class="msg msg-ai" id="\${loadingId}">
          <div style="display:flex; flex-direction:column; gap:5px; color:var(--text-secondary);">
            <div>⏳ <b>Paso 1/3:</b> Vectorizando consulta en ONNX Runtime (all-MiniLM-L6-v2, 384 dimensiones)...</div>
            <div id="\${loadingId}-s2" style="opacity:0.55;">🔎 <b>Paso 2/3:</b> Recuperando manuales técnicos en pgvector HNSW + contexto MS1/MS2/MS3...</div>
            <div id="\${loadingId}-s3" style="opacity:0.55;">🧠 <b>Paso 3/3:</b> Sintetizando prescripción agronómica con DeepSeek...</div>
          </div>
        </div>
      \`;
      box.scrollTop = box.scrollHeight;

      const t1 = setTimeout(() => {
        const s2 = document.getElementById(loadingId + '-s2');
        if (s2) s2.style.opacity = '1';
      }, 450);
      const t2 = setTimeout(() => {
        const s3 = document.getElementById(loadingId + '-s3');
        if (s3) s3.style.opacity = '1';
      }, 1200);

      try {
        const res = await fetch('/api/v1/agronomist/consult', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parcelId: currentParcelId, question, topK: 3 })
        });
        clearTimeout(t1);
        clearTimeout(t2);
        const data = await res.json();
        const container = document.getElementById(loadingId);
        if (container) {
          container.innerHTML = buildAiMessageHtml(
            loadingId,
            data.answerMarkdown || data.answer,
            data.retrievedChunks,
            data.metrics
          );
        }
        if (data.metrics?.llmModel) {
          document.getElementById('ragModelBadge').textContent =
            \`ONNX 384d + \${data.metrics.llmModel}\`;
        }
        box.scrollTop = box.scrollHeight;
      } catch (e) {
        clearTimeout(t1);
        clearTimeout(t2);
        const container = document.getElementById(loadingId);
        if (container) {
          container.textContent = '❌ Error procesando la consulta RAG: ' + e.message;
        }
      } finally {
        btn.disabled = false;
      }
    }

    // =========================================================================
    // 8. SIMULADOR CHAOS END-TO-END CON STEPPER DE 4 ETAPAS
    // =========================================================================
    function setChaosStepState(activeStep) {
      const stepper = document.getElementById('chaosStepper');
      stepper.style.display = 'grid';
      for (let i = 1; i <= 4; i++) {
        const el = document.getElementById('cstep' + i);
        if (!el) continue;
        el.className = 'chaos-step' + (i < activeStep ? ' done' : i === activeStep ? ' active' : '');
      }
    }

    async function triggerChaos(scenario) {
      const statusEl = document.getElementById('chaosStatus');
      const btns = ['btnChaosFrost', 'btnChaosHeat', 'btnChaosNdvi'].map(id => document.getElementById(id));
      btns.forEach(b => { if (b) b.disabled = true; });

      statusEl.textContent = '⏳ Ejecutando ' + scenario + '...';
      setChaosStepState(1);
      setTimeout(() => setChaosStepState(2), 350);
      setTimeout(() => setChaosStepState(3), 750);

      try {
        const res = await fetch('/api/v1/simulation/trigger-chaos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parcelId: currentParcelId, scenario })
        });
        const data = await res.json();
        setChaosStepState(4);
        setTimeout(() => setChaosStepState(5), 500);
        statusEl.textContent = '✅ Alerta enviada a Telegram';
        showToast('✅ ' + (data.description || 'Escenario Chaos ejecutado y notificado a Telegram'));
        await refreshAll(false);
      } catch (e) {
        statusEl.textContent = '❌ Error en simulación';
        showToast('❌ Error ejecutando escenario Chaos: ' + e.message, 'error');
      } finally {
        btns.forEach(b => { if (b) b.disabled = false; });
      }
    }

    async function simulateNormalSatellitePass() {
      const btn = document.getElementById('btnSimulatePass');
      if (btn) btn.disabled = true;
      try {
        const nextDas = scenesCache.length ? (scenesCache[scenesCache.length - 1].daysAfterPlanting + 5) : 52;
        const res = await fetch(\`/api/v1/satellite/parcels/\${currentParcelId}/simulate-pass\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ daysAfterPlanting: nextDas, injectStressPatch: false })
        });
        const data = await res.json();
        await loadSatelliteData();
        showToast(\`🛰️ Nueva pasada Sentinel-2 generada (DDS \${data?.scene?.daysAfterPlanting || nextDas}) con 168 subceldas PostGIS\`);
      } catch (e) {
        showToast('❌ Error simulando pasada satelital: ' + e.message, 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    // =========================================================================
    // 9. TRAZADO DE NUEVAS PARCELAS EN POSTGIS (CON DESHACER Y VARIEDAD)
    // =========================================================================
    function toggleDrawParcelMode() {
      isDrawingMode = !isDrawingMode;
      drawnCoords = [];
      drawLayerGroup.clearLayers();
      document.getElementById('drawHelpBar').style.display = isDrawingMode ? 'block' : 'none';
      document.getElementById('btnDrawMode').textContent = isDrawingMode ? '🛑 Salir de Modo Trazado' : '✏️ Trazar Parcela';
      if (isDrawingMode) {
        showToast('✏️ Modo trazado activo: haz clic en al menos 3 puntos sobre el mapa satelital');
      }
    }

    function undoLastDrawVertex() {
      if (!drawnCoords.length) return;
      drawnCoords.pop();
      renderDrawPreview();
    }

    function clearDrawVertices() {
      drawnCoords = [];
      renderDrawPreview();
    }

    function cancelDrawParcel() {
      isDrawingMode = false;
      drawnCoords = [];
      drawLayerGroup.clearLayers();
      document.getElementById('drawHelpBar').style.display = 'none';
      document.getElementById('btnDrawMode').textContent = '✏️ Trazar Parcela';
    }

    function renderDrawPreview() {
      drawLayerGroup.clearLayers();
      document.getElementById('drawVerticesCount').textContent = drawnCoords.length + ' vértices';
      const latLngs = drawnCoords.map(c => [c[1], c[0]]);
      latLngs.forEach((ll, idx) =>
        L.circleMarker(ll, { radius: 6, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.9 })
          .bindTooltip('Vértice ' + (idx + 1))
          .addTo(drawLayerGroup)
      );
      if (latLngs.length >= 2) {
        L.polygon(latLngs, { color: '#10b981', weight: 2.5, dashArray: '5,5', fillOpacity: 0.15 }).addTo(drawLayerGroup);
      }
    }

    async function submitDrawnParcel() {
      if (drawnCoords.length < 3) {
        showToast('⚠️ Traza al menos 3 vértices en el mapa para cerrar el polígono PostGIS.', 'error');
        return;
      }
      const btn = document.getElementById('btnSaveParcel');
      btn.disabled = true;
      try {
        const ring = [...drawnCoords, drawnCoords[0]];
        const parcelName = document.getElementById('newParcelName').value.trim() || 'Nueva Parcela Sandía';
        const watermelonVariety = document.getElementById('newParcelVariety').value || 'Crimson Sweet';

        const res = await fetch('/api/v1/zoning/parcels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farmerId: '00000000-0000-0000-0000-000000000010',
            parcelName,
            watermelonVariety,
            boundaryGeoJson: { type: 'Polygon', coordinates: [ring] }
          })
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('❌ Error Topológico PostGIS: ' + (data.message || JSON.stringify(data)), 'error');
          return;
        }
        cancelDrawParcel();
        currentParcelId = data.parcelId;
        await fetch(\`/api/v1/satellite/parcels/\${currentParcelId}/simulate-pass\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ daysAfterPlanting: 35, injectStressPatch: false })
        });
        await refreshAll(true);
        showToast(\`✅ Parcela "\${parcelName}" (\${watermelonVariety}) registrada en PostGIS con malla satelital inicial\`);
      } finally {
        btn.disabled = false;
      }
    }

    // =========================================================================
    // 10. VINCULACIÓN DE TELEGRAM Y SINCRONIZACIÓN GENERAL
    // =========================================================================
    async function linkTelegramChat() {
      const chatId = document.getElementById('telegramChatIdInput').value.trim();
      const btn = document.getElementById('btnLinkTelegram');
      if (!chatId) {
        showToast('⚠️ Ingresa un Chat ID de Telegram válido.', 'error');
        return;
      }
      btn.disabled = true;
      try {
        const parcel = parcelsCache.find(p => p.parcelId === currentParcelId);
        const res = await fetch('/api/v1/alerts/farmers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: 'Juan Carlos Reyes',
            telegramChatId: chatId,
            telegramUsername: 'JamesFranco05',
            parcelId: currentParcelId,
            parcelAlias: parcel ? parcel.parcelName : 'Parcela Sandía Lote Norte',
            cooldownMinutes: 1
          })
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('❌ Error vinculando Telegram: ' + (data.message || res.status), 'error');
          return;
        }
        document.getElementById('execAlertSub').textContent = \`@AgrosatAi_bot • ID \${chatId}\`;
        showToast(\`📲 Chat ID de Telegram (\${chatId}) vinculado exitosamente a "\${data.parcelAlias}"\`);
      } catch (e) {
        showToast('❌ Error de red al vincular Telegram: ' + e.message, 'error');
      } finally {
        btn.disabled = false;
      }
    }

    async function onParcelChange() {
      currentParcelId = document.getElementById('parcelSelect').value;
      renderSelectedParcelInfo(true);
      await Promise.all([loadSatelliteData(), loadTelemetryAndAlerts(), loadChatHistory()]);
      showToast('🍉 Parcela activa actualizada');
    }

    async function refreshAll(forceFitBounds = false) {
      const btn = document.getElementById('btnRefresh');
      if (btn) btn.disabled = true;
      try {
        await loadHealth();
        await loadParcels(forceFitBounds);
        await Promise.all([loadSatelliteData(), loadTelemetryAndAlerts(), loadChatHistory()]);
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      initTheme();
      initMap();
      refreshAll(true);
    });
  </script>
</body>
</html>`;
  }
}
