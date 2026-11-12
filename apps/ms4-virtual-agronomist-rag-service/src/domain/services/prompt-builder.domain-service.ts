import { Injectable } from '@nestjs/common';
import { AssembledAgronomicContext } from '../entities/agronomic-consultation.aggregate';
import { KnowledgeChunkEntity } from '../entities/knowledge-chunk.entity';

@Injectable()
export class PromptBuilderDomainService {
  public buildSystemPrompt(): string {
    return [
      'Eres el "Agrónomo Virtual de AgroSat AI", un Ingeniero Agrónomo Senior especialista en el cultivo intensivo de Sandía (Citrullus lanatus), teledetección satelital multiespectral (NDVI/EVI Sentinel-2), edafología y fertirrigación de precisión por goteo.',
      'Tu misión es responder de forma técnica, clara, accionable y estructurada en español al productor agrícola.',
      'REGLAS ESTRICTAS:',
      '1. Basa siempre tu diagnóstico en las métricas reales de la parcela suministradas en el contexto (NDVI/EVI de MS1, suelo/pH/textura de MS2, y temperatura/humedad a 20cm y 40cm/VPD de MS3).',
      '2. Fundamenta tus prescripciones citando los códigos técnicos recuperados desde pgvector (ej. [SANDIA-RIEGO-001], [SANDIA-FERT-001], [SANDIA-PLAGAS-001]).',
      '3. Estructura tu respuesta en 3 bloques breves con formato Markdown:',
      '   - 📊 **Diagnóstico Actual del Lote** (cruzando NDVI, clima y humedad de suelo 20cm/40cm).',
      '   - 💧 **Prescripción Técnica de Manejo** (dosis/pulsos de riego, fertirriego Ca/B/NPK o control fitosanitario).',
      '   - 📚 **Sustento Técnico AgroSat** (referencia explícita a los manuales recuperados en pgvector).',
    ].join('\n');
  }

  public buildConsultationUserPrompt(params: {
    question: string;
    context: AssembledAgronomicContext;
    retrievedChunks: KnowledgeChunkEntity[];
  }): string {
    const { question, context, retrievedChunks } = params;
    const p = context.parcel;
    const s = context.satellite;
    const t = context.telemetry;

    const parcelBlock = p
      ? [
          `- Parcela: "${p.parcelName}" (Variedad: ${p.watermelonVariety}, Superficie: ${p.areaHectares} ha, Fecha siembra: ${p.plantingDate})`,
          `- Suelo y Aptitud (MS2): Textura ${p.soilEvaluation.soilTexture}, pH ${p.soilEvaluation.phLevel}, Drenaje ${p.soilEvaluation.drainageLevel}, Altitud ${p.soilEvaluation.altitudeMsnm} msnm, Radiación ${p.soilEvaluation.solarRadiationMjm2} MJ/m²/día, Pendiente ${p.soilEvaluation.slopePct}%, Score Viabilidad: ${p.soilEvaluation.viabilityScorePct}% (${p.soilEvaluation.suitabilityCategory}).`,
        ].join('\n')
      : '- Datos de zonificación MS2 no disponibles.';

    const satelliteBlock = s
      ? [
          `- Última pasada Sentinel-2 (MS1): Día ${s.daysAfterPlanting} DDS (Etapa: ${s.phenologicalStage}).`,
          `- Índices Espectrales: NDVI medio = ${s.meanNdvi} (mín = ${s.minNdvi}, máx = ${s.maxNdvi}, delta respecto a pasada previa = ${s.ndviDelta >= 0 ? '+' : ''}${s.ndviDelta}), EVI medio = ${s.meanEvi}.`,
          `- Celdas con estrés (<0.35 NDVI): ${s.stressedCellsPct}% de la parcela. Mancha crítica detectada: ${s.hasStressPatch ? `SÍ (Causa probable: ${s.stressPatchMetadata?.anomalyCause}, caída de -${s.stressPatchMetadata?.ndviDropMagnitude} puntos en radio de ${s.stressPatchMetadata?.radiusMeters}m)` : 'NO (dosel uniforme)'}.`,
        ].join('\n')
      : '- Datos satelitales MS1 no disponibles.';

    const telemetryBlock = t
      ? [
          `- Lectura IoT Actual (MS3): Temp Ambiente = ${t.current.ambientTempC} °C, Humedad Relativa = ${t.current.relativeHumidityPct}%, Humedad Suelo 20cm (raíz activa) = ${t.current.soilMoisture20cmPct}%, Humedad Suelo 40cm = ${t.current.soilMoisture40cmPct}%, Radiación = ${t.current.solarRadiationWm2} W/m², VPD = ${t.current.vpdKpa} kPa.`,
          `- Resumen Últimas 24h: Temp Promedio = ${t.stats24h.tempAvg} °C (Mín ${t.stats24h.tempMin} °C / Máx ${t.stats24h.tempMax} °C), Humedad 20cm Prom = ${t.stats24h.moisture20cmAvg}%, Eventos Helada (<4°C) = ${t.stats24h.frostEventsCount}, Eventos Golpe Calor (>38°C) = ${t.stats24h.heatShockEventsCount}.`,
        ].join('\n')
      : '- Datos de telemetría MS3 no disponibles.';

    const chunksBlock = retrievedChunks
      .map(
        (chunk, idx) =>
          `[Fragmento #${idx + 1} | Código: ${chunk.documentCode} | Similitud Coseno: ${(chunk.similarityScore ?? 0).toFixed(4)} | Etapa: ${chunk.phenologicalStage}]\nTítulo: ${chunk.title}\nContenido: ${chunk.content}`,
      )
      .join('\n\n');

    return [
      '=== 1. ESTADO EN TIEMPO REAL DE LA PARCELA DE SANDÍA ===',
      parcelBlock,
      satelliteBlock,
      telemetryBlock,
      '',
      '=== 2. CONOCIMIENTO AGRONÓMICO RECUPERADO DE PGVECTOR (TOP-K) ===',
      chunksBlock || 'Sin fragmentos recuperados.',
      '',
      '=== 3. CONSULTA DEL AGRICULTOR ===',
      question,
    ].join('\n');
  }

  public buildEmergencyBriefPrompt(params: {
    parcelId: string;
    ruleCode: string;
    metrics: Record<string, unknown>;
    defaultAction?: string;
    context: AssembledAgronomicContext;
    topChunk?: KnowledgeChunkEntity;
  }): { systemPrompt: string; userPrompt: string } {
    const systemPrompt =
      'Eres el sistema de respuesta rápida de emergencias agronómicas de AgroSat AI para cultivo de sandía (Citrullus lanatus). Redacta UN SOLO PÁRRAFO contundente (máximo 85 palabras), sin listas ni encabezados, indicando el diagnóstico fisiológico inmediato y la acción correctiva urgente que debe ejecutar el agricultor en las próximas 2 horas.';

    const userPrompt = [
      `Alerta activada: ${params.ruleCode} en parcela ${params.context.parcel?.parcelName ?? params.parcelId} (Variedad: ${params.context.parcel?.watermelonVariety ?? 'Crimson Sweet'}, Etapa: ${params.context.satellite?.phenologicalStage ?? 'FLOWERING'}).`,
      `Métricas críticas disparadas: ${JSON.stringify(params.metrics)}.`,
      params.topChunk
        ? `Referencia técnica manual [${params.topChunk.documentCode}]: ${params.topChunk.content}`
        : `Acción base sugerida: ${params.defaultAction ?? 'Aplicar protocolo de mitigación inmediata.'}`,
      'Genera el párrafo único de prescripción de emergencia para Telegram:',
    ].join('\n');

    return { systemPrompt, userPrompt };
  }

  /**
   * Sintetizador determinista de respaldo que utiliza las métricas reales de MS1/MS2/MS3
   * y los fragmentos reales recuperados de pgvector cuando DEEPSEEK_API_KEY no está configurada.
   */
  public buildLocalStructuredSynthesisFallback(params: {
    question: string;
    context: AssembledAgronomicContext;
    retrievedChunks: KnowledgeChunkEntity[];
  }): string {
    const p = params.context.parcel;
    const s = params.context.satellite;
    const t = params.context.telemetry;
    const primaryChunk = params.retrievedChunks[0];
    const secondaryChunk = params.retrievedChunks[1];

    const parcelName = p?.parcelName ?? 'Parcela Sandía Lote Norte';
    const variety = p?.watermelonVariety ?? 'Crimson Sweet';
    const stage = s?.phenologicalStage ?? 'FLOWERING';
    const das = s?.daysAfterPlanting ?? 48;
    const ndvi = s?.meanNdvi ?? 0.77;
    const temp = t?.current.ambientTempC ?? 28.5;
    const moist20 = t?.current.soilMoisture20cmPct ?? 29.0;
    const moist40 = t?.current.soilMoisture40cmPct ?? 32.5;
    const vpd = t?.current.vpdKpa ?? 1.85;

    const stressAlert = s?.hasStressPatch
      ? `⚠️ Se detecta una **mancha localizada de caída espectral** (NDVI mínimo **${s.minNdvi}**, caída de **-${s.stressPatchMetadata?.ndviDropMagnitude ?? 0.35}** puntos en un radio de **${s.stressPatchMetadata?.radiusMeters ?? 40} m**, asociada a \`${s.stressPatchMetadata?.anomalyCause ?? 'FUSARIUM_OR_DRIP_TAPE_FAILURE'}\`).`
      : `✅ El dosel vegetativo presenta buena cobertura con un **NDVI medio de ${ndvi}** y **EVI de ${s?.meanEvi ?? 0.71}** sin parches severos de marchitez.`;

    const climateAlert =
      temp < 4
        ? `❄️ **Riesgo activo de helada (${temp} °C)**: activar riego de protección térmica de inmediato.`
        : temp > 38 || moist20 < 25
          ? `🔥 **Alerta de estrés termo-hídrico (${temp} °C, humedad a 20 cm de ${moist20}%, VPD ${vpd} kPa)**: iniciar pulso de riego de enfriamiento y transpiración.`
          : `🌡️ Condición microclimática actual dentro de rango operativo (**${temp} °C**, humedad radicular a 20 cm en **${moist20}%** y a 40 cm en **${moist40}%**, VPD **${vpd} kPa**).`;

    const refs = params.retrievedChunks
      .map(
        (c) =>
          `- **[${c.documentCode}] ${c.title}** *(Similitud semántica pgvector: ${((c.similarityScore ?? 0) * 100).toFixed(1)}%)*`,
      )
      .join('\n');

    return [
      `### 📊 Diagnóstico Actual del Lote (${parcelName} — *${variety}*)`,
      `- **Estado Fenológico y Satelital (MS1):** Día **${das} DDS** (\`${stage}\`). ${stressAlert}`,
      `- **Aptitud Edáfica (MS2):** Suelo \`${p?.soilEvaluation.soilTexture ?? 'FRANCO_ARENOSA'}\` con **pH ${p?.soilEvaluation.phLevel ?? 6.4}** y viabilidad del **${p?.soilEvaluation.viabilityScorePct ?? 94}%** (\`${p?.soilEvaluation.suitabilityCategory ?? 'ALTAMENTE_APTO'}\`).`,
      `- **Telemetría Climática y Radicular (MS3):** ${climateAlert}`,
      '',
      `### 💧 Prescripción Técnica de Manejo`,
      primaryChunk
        ? `${primaryChunk.content}`
        : 'Mantener la humedad volumétrica a 20 cm por encima del 26% mediante pulsos fraccionados de riego por goteo y monitoreo de conductividad eléctrica.',
      secondaryChunk ? `\n**Complemento Técnico:** ${secondaryChunk.content}` : '',
      '',
      `### 📚 Sustento Técnico Recuperado en \`pgvector\` (\`VECTOR(384)\`)`,
      refs || '- Corpus técnico de sandía AgroSat AI.',
    ]
      .filter(Boolean)
      .join('\n');
  }
}
